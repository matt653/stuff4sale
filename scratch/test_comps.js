async function testComps() {
  try {
    console.log("Calling POST /api/comps...");
    const res = await fetch("http://localhost:3000/api/comps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Vintage Metal Wagon Wheel" })
    });
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testComps();
