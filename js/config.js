// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
// You can find these in your Supabase Dashboard under Settings > API
const SUPABASE_URL = 'https://lfcnwonjnedctpvwgrze.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uakfhrUcAWEti7EZYRSFbg_TDQlhE-E';

// Initialize the Supabase client (named supabaseClient to avoid conflict with the library)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
