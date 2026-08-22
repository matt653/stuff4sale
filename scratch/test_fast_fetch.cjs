const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");

const selectFields = "id,name,category,status,purchase_price,purchase_date,purchase_location,sale_price,sale_date,sale_platform,listed_price,listed_platform,listing_url,stock_number,photo_url,notes,created_at,updated_at,buyer_inquiries_count,last_inquiry_at,bundle_id,bundle_title,bundled_item_ids,research,video_url";
const url = `https://yvekxqeltflessrblfbq.supabase.co/rest/v1/Stuff4Sale?select=${selectFields}&order=created_at.desc&limit=100`;
const key = "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm";

console.log("Fetching from Supabase...");
const start = Date.now();
fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": `Bearer ${key}`
  }
})
  .then(r => r.json())
  .then(data => console.log(`SUCCESS IN ${Date.now() - start}ms! Item count: ${data.length}, First item: ${data[0]?.name}`))
  .catch(console.error);
