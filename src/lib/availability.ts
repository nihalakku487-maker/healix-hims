import { getNowIST } from "./ist";

/**
 * Checks if the doctor's real-time settings indicate they are available right now.
 * 
 * @param isAvailable Boolean indicating if the doctor has toggled themselves absent.
 * @param startTime String in 'HH:mm' format (24-hour).
 * @param endTime String in 'HH:mm' format (24-hour).
 * @returns boolean True if available and within working hours.
 */
export function isDoctorAvailableNow(
  isAvailable: boolean,
  startTime?: string,
  endTime?: string
): boolean {
  // We now use doctor_schedules for specific time slots.
  // The global 'isAvailable' toggle acts as a master switch (e.g., doctor is on leave/paused).
  return isAvailable;
}
