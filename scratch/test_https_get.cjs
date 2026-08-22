const https = require("node:https");

const options = {
  hostname: "yvekxqeltflessrblfbq.supabase.co",
  path: "/rest/v1/Stuff4Sale?select=id,name,stock_number&order=created_at.desc&limit=5",
  family: 4,
  headers: {
    "apikey": "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm",
    "Authorization": "Bearer sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm"
  }
};

console.log("Making https request to Supabase...");
const req = https.get(options, (res) => {
  console.log("HTTP STATUS:", res.statusCode);
  let body = "";
  res.on("data", (chunk) => body += chunk);
  res.on("end", () => {
    console.log("RESPONSE BODY SAMPLE:", body.substring(0, 300));
  });
});

req.on("error", (err) => console.error("HTTPS ERROR:", err));
