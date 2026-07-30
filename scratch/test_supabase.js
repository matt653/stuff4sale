import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yvekxqeltflessrblfbq.supabase.co";
const SUPABASE_KEY = "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testFetch() {
  console.log("Fetching from Supabase Stuff4Sale table...");
  const { data, error } = await supabase
    .from("Stuff4Sale")
    .select("id, name, status, stock_number")
    .limit(5);

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success! Items count:", data.length);
    console.log("Sample Data:", data);
  }
}

testFetch();
