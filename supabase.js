const SUPABASE_URL =
  "https://vlnnfhrbqkajsvwxyxql.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_jcIE1cafyQMO_ZfgHl125A_mn7Qe4Wy";

/*
  Seller client.

  This remains the normal authenticated
  Supabase client used by seller.js.

  Its existing session behavior is
  preserved so current seller access
  is not disturbed.
*/
window.supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

/*
  Public buyer storefront client.

  This client deliberately does not
  persist or reuse an authenticated
  seller or buyer session.

  buyer.js uses this client so the
  public storefront continues to be
  evaluated by Supabase as an
  anonymous buyer.
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

/*
  Authenticated buyer account client.

  This client is separate from the
  anonymous storefront client and
  uses its own browser storage key.

  A buyer login therefore does not
  replace the existing seller session
  on the same browser/device.

  This client will support buyer
  login, account creation, password
  recovery, buyer profiles, store
  relationships, and later
  authenticated buyer functions.
*/
window.supabaseBuyerAuthClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey:
          "resale-mob-buyer-auth"
      }
    }
  );