const SUPABASE_URL = "https://vlnnfhrbqkajsvwxyxql.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jcIE1cafyQMO_ZfgHl125A_mn7Qe4Wy";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);