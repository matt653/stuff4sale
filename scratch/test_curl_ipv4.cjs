const { exec } = require("child_process");

const selectFields = "id,name,category,status,purchase_price,purchase_date,purchase_location,sale_price,sale_date,sale_platform,listed_price,listed_platform,listing_url,stock_number,photo_url,notes,created_at,updated_at,buyer_inquiries_count,last_inquiry_at,bundle_id,bundle_title,bundled_item_ids,research,video_url";
const cmd = `curl.exe -4 -s -k --max-time 15 "https://yvekxqeltflessrblfbq.supabase.co/rest/v1/Stuff4Sale?select=${selectFields}&order=created_at.desc&limit=100" -H "apikey: sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm" -H "Authorization: Bearer sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm"`;

console.log("Executing curl.exe -4 command...");
exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
  if (err) {
    console.error("CURL EXEC ERROR:", err);
    return;
  }
  console.log("CURL SUCCESS! LENGTH:", stdout.length);
  try {
    const data = JSON.parse(stdout);
    console.log("IS ARRAY:", Array.isArray(data), "COUNT:", data.length);
    if (data.length > 0) {
      console.log("TOP ITEM:", data[0].id, data[0].name, "STOCK #:", data[0].stock_number);
    }
  } catch (e) {
    console.error("PARSE ERROR:", e.message, stdout.substring(0, 300));
  }
});
