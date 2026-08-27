const SUPABASE_URL =
  "https://vlnnfhrbqkajsvwxyxql.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_jcIE1cafyQMO_ZfgHl125A_mn7Qe4Wy";

/*
  Seller client.

  This remains the normal authenticated
  Supabase client used by seller.js.
*/
window.supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

/*
  Buyer client.

  This client deliberately does not
  persist or reuse an authenticated
  seller session.

  buyer.js will use this client so the
  buyer page is always evaluated by
  Supabase as a public/anonymous buyer.
*/
window.supabaseBuyerClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );