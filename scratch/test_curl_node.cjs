const { exec } = require("child_process");

const cmd = `curl.exe -s -k "https://yvekxqeltflessrblfbq.supabase.co/rest/v1/Stuff4Sale?select=*&order=created_at.desc&limit=100" -H "apikey: sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm" -H "Authorization: Bearer sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm"`;

console.log("Executing full select=* curl command...");
exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
  if (err) {
    console.error("CURL EXEC ERROR:", err);
    return;
  }
  console.log("STDOUT LENGTH:", stdout.length);
  try {
    const data = JSON.parse(stdout);
    console.log("IS ARRAY:", Array.isArray(data), "LENGTH:", Array.isArray(data) ? data.length : "NOT ARRAY");
    if (Array.isArray(data) && data.length > 0) {
      console.log("FIRST ITEM:", data[0].id, data[0].name, "stock_number:", data[0].stock_number);
    } else {
      console.log("RAW PARSED DATA:", JSON.stringify(data).substring(0, 300));
    }
  } catch (parseErr) {
    console.error("PARSE ERROR:", parseErr.message, "STDOUT PREFIX:", stdout.substring(0, 300));
  }
});
