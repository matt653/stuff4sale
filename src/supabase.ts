import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://yvekxqeltflessrblfbq.supabase.co";
export const SUPABASE_KEY = "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm";

// Initialize Supabase singleton client for single table Stuff4Sale
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
