import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wjzcugrtwkmvgkotfmdz.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqemN1Z3J0d2ttdmdrb3RmbWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTEzMTMsImV4cCI6MjA3NjAyNzMxM30.4E7ZCsq-c-6MFK3SeBWFZ4T_ssTu0PCp_W5Rf2C7FkU"; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
