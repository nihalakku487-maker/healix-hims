// ============================================================
// MediQ — WhatsApp Notification Edge Function
// Triggered by Supabase Database Webhook on bookings UPDATE
//
// Handles:
//   1. status → 'ready'    : "Your turn has arrived"
//   2. status → 'no-show'  : "You missed your turn"
//   3. Queue advance event  : Reminder to 2nd patient in queue
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Environment Variables ────────────────────────────────────
const TWILIO_ACCOUNT_SID    = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN     = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_WHATSAPP_FROM  = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886";
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEFAULT_COUNTRY_CODE  = "+91"; // India

// ── Phone number formatter → E.164 ──────────────────────────
function formatPhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `${DEFAULT_COUNTRY_CODE}${cleaned}`;
  return `${DEFAULT_COUNTRY_CODE}${cleaned}`;
}

function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const p = phone.trim().toLowerCase();
  return p !== "" && p !== "walk-in" && p !== "n/a";
}

// ── Message templates ────────────────────────────────────────
function buildMessage(type: string, name: string, token: number | null): string {
  const tokenPart = token != null ? ` (Token #${token})` : "";
  switch (type) {
    case "ready":
      return `Hello ${name}, your turn has arrived${tokenPart}. Please proceed to consultation. 🏥`;
    case "reminder":
      return `Hello ${name}, you are 2 patients away from your turn${tokenPart}. Please be ready! 🔔`;
    case "no_show":
      return `Hello ${name}, you missed your turn${tokenPart}. Please contact the front desk to reschedule. 📋`;
    default:
      return `Hello ${name}, your appointment status has been updated${tokenPart}.`;
  }
}

// ── Twilio WhatsApp sender ───────────────────────────────────
async function sendWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const formattedTo = `whatsapp:${formatPhone(to)}`;
  const credentials  = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_WHATSAPP_FROM,
        To:   formattedTo,
        Body: message,
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.error("[Twilio Error]", data);
    return { success: false, error: data.message ?? "Twilio API error" };
  }
  console.log("[Twilio] Sent:", data.sid, "→", formattedTo);
  return { success: true, sid: data.sid };
}

// ── Helper: check + send notification with dedup guard ───────
async function sendNotification(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  phone: string,
  messageType: "ready" | "reminder" | "no_show",
  name: string,
  token: number | null
): Promise<void> {
  // Dedup check
  const { data: existing } = await supabase
    .from("notification_log")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("message_type", messageType)
    .maybeSingle();

  if (existing) {
    console.log(`[Dedup] Skipping '${messageType}' for booking ${bookingId} — already sent`);
    return;
  }

  const message = buildMessage(messageType, name, token);
  const result  = await sendWhatsApp(phone, message);

  await supabase.from("notification_log").insert({
    booking_id:    bookingId,
    phone:         phone,
    message_type:  messageType,
    status:        result.success ? "sent" : "failed",
    twilio_sid:    result.sid    ?? null,
    error_message: result.error  ?? null,
  });

  console.log(`[Notify] '${messageType}' for ${name}: ${result.success ? "✅ sent" : "❌ failed"}`);
}

// ── Helper: send 2-position reminder to 2nd waiting patient ──
async function sendReminderToSecondInQueue(
  supabase: ReturnType<typeof createClient>,
  doctorId: string,
  bookingDate: string
): Promise<void> {
  // Get ordered waiting queue for this doctor today
  const { data: waitingQueue, error } = await supabase
    .from("bookings")
    .select("id, patient_name, phone, token_number")
    .eq("doctor_id", doctorId)
    .eq("booking_date", bookingDate)
    .eq("status", "waiting")
    .order("token_number", { ascending: true });

  if (error || !waitingQueue) {
    console.error("[Reminder] Failed to fetch queue:", error?.message);
    return;
  }

  // The patient at index 1 is 2nd in line → 2 positions away (1 ahead of them)
  if (waitingQueue.length < 2) {
    console.log("[Reminder] Not enough patients in queue for reminder");
    return;
  }

  const secondPatient = waitingQueue[1]; // 0-indexed: index 1 = 2nd in line

  if (!isValidPhone(secondPatient.phone)) {
    console.log("[Reminder] 2nd patient has no valid phone, skipping");
    return;
  }

  await sendNotification(
    supabase,
    secondPatient.id,
    secondPatient.phone,
    "reminder",
    secondPatient.patient_name,
    secondPatient.token_number
  );
}

// ── Main handler ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload   = await req.json();
    const record    = payload.record;
    const oldRecord = payload.old_record;

    if (!record) {
      return json({ error: "No record in payload" }, 400);
    }

    const { id: bookingId, patient_name, phone, status, doctor_id, booking_date } = record;
    const token_number: number | null = record.token_number ?? null;
    const oldStatus = oldRecord?.status;

    console.log(`[Webhook] booking ${bookingId} | ${patient_name} | ${oldStatus} → ${status}`);

    // ── Skip if status didn't actually change ─────────────────
    if (status === oldStatus) {
      return json({ skipped: true, reason: "Status unchanged" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 1. Status → 'ready': notify this patient ──────────────
    if (status === "ready" && oldStatus !== "ready") {
      if (isValidPhone(phone)) {
        await sendNotification(supabase, bookingId, phone, "ready", patient_name, token_number);
      }

      // Also trigger 2-position reminder for 2nd patient in queue
      if (doctor_id && booking_date) {
        await sendReminderToSecondInQueue(supabase, doctor_id, booking_date);
      }

      return json({ success: true, event: "ready_notification_sent" });
    }

    // ── 2. Status → 'no-show': notify this patient ────────────
    if (status === "no-show" && oldStatus !== "no-show") {
      if (isValidPhone(phone)) {
        await sendNotification(supabase, bookingId, phone, "no_show", patient_name, token_number);
      } else {
        console.log("[No-show] No valid phone, skipping notification");
      }

      return json({ success: true, event: "no_show_notification_sent" });
    }

    // ── 3. Status → 'done' or 'in-progress': reminder check ──
    // When a patient moves out of waiting (advances queue), check who is now 2nd
    if (
      (status === "done" || status === "in-progress") &&
      doctor_id && booking_date
    ) {
      await sendReminderToSecondInQueue(supabase, doctor_id, booking_date);
      return json({ success: true, event: "reminder_check_done" });
    }

    return json({ skipped: true, reason: `No action for transition ${oldStatus} → ${status}` });

  } catch (err) {
    console.error("[Edge Function Error]", err);
    return json({ error: String(err) }, 500);
  }
});

// ── Helper ───────────────────────────────────────────────────
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
