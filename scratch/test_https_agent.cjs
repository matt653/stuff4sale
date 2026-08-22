const https = require("node:https");
const zlib = require("node:zlib");

const agent = new https.Agent({ keepAlive: false, family: 4 });

const options = {
  hostname: "yvekxqeltflessrblfbq.supabase.co",
  port: 443,
  path: "/rest/v1/Stuff4Sale?select=id,name,stock_number&order=created_at.desc&limit=5",
  method: "GET",
  agent: agent,
  headers: {
    "apikey": "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm",
    "Authorization": "Bearer sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm",
    "Accept-Encoding": "gzip, deflate"
  }
};

console.log("Making https.request with custom IPv4 agent...");
const req = https.request(options, (res) => {
  console.log("HTTP STATUS:", res.statusCode, res.headers["content-encoding"]);
  
  let stream = res;
  if (res.headers["content-encoding"] === "gzip") {
    stream = res.pipe(zlib.createGunzip());
  } else if (res.headers["content-encoding"] === "deflate") {
    stream = res.pipe(zlib.createInflate());
  }

  let body = "";
  stream.on("data", (chunk) => body += chunk);
  stream.on("end", () => {
    console.log("SUCCESS! BODY SAMPLE:", body.substring(0, 300));
  });
});

req.on("error", (err) => console.error("HTTPS REQUEST ERROR:", err));
req.end();
