const http = require("http");

http.get("http://127.0.0.1:3000/api/items", (res) => {
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => {
    console.log("HTTP STATUS:", res.statusCode);
    console.log("RESPONSE BODY SAMPLE:", body.substring(0, 300));
  });
}).on("error", console.error);
