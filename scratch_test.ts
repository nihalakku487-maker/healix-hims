import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tvapicdrldeegamttdaf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YXBpY2RybGRlZWdhbXR0ZGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTA2OTMsImV4cCI6MjA5MTI4NjY5M30.rGvgZsACPne537uwOtb7l2JKETWfPmdwT-5w6BKvG9U"
);

async function checkSchema() {
  const { data, error } = await supabase.from('doctor_settings').select('*').limit(1);
    
  if (error) {
    console.error("Error fetching admin view:", error);
  } else {
    console.log("doctor_settings sample:", JSON.stringify(data, null, 2));
  }
}

checkSchema();
