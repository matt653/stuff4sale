import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up large JSON body limit for base64 image uploads
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini API Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI research features will be unavailable.");
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// Gemini-Powered Item Research Endpoint
app.post("/api/research", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "AI Research is currently unavailable because the server API key is not configured.",
    });
  }

  try {
    const { name, category, notes, image } = req.body;

    if (!name && !image) {
      return res.status(400).json({ error: "Item name or image is required for research." });
    }

    const contents: any[] = [];

    // Construct the prompt guiding Gemini to produce a structured JSON result
    let promptText = `Perform professional reselling and side-hustle market research on this item. 
Analyze historical sales, demand patterns, listing strategies, and typical value.

Input Details provided:
- Item Name: ${name || "Unidentified (Please analyze the attached image)"}
- Initial Category: ${category || "Unknown"}
- Notes/Condition: ${notes || "No extra notes"}

Analyze this item carefully. You must return your response in standard, valid JSON format. 
Do not wrap your JSON response in markdown blocks or any other formatting.

The JSON response MUST match this exact schema:
{
  "suggestedTitle": "An SEO-optimized, highly click-worthy listing title (max 80 chars) highlighting brand, model, features, or condition",
  "suggestedDescription": "A professional, detailed listing description text ready for copy-paste. Highlight key selling points, structure it with clean sections, and leave placeholders [like condition details] for manual editing if needed.",
  "estimatedValueMin": 15, (Estimate a realistic, conservative lower reselling list price in USD as a number)
  "estimatedValueMax": 45, (Estimate an optimistic, high-performing reselling list price in USD as a number)
  "demandScore": 7, (An integer from 1 to 10 indicating sell-through rate. 1 = extremely hard to sell, 10 = sells within hours)
  "targetPlatforms": [
    "eBay - Great for reach and global audience.",
    "Facebook Marketplace - Best for local pickup, avoiding shipping costs."
  ], (List 2 to 4 recommended listing platforms with brief reasons)
  "sellingTips": [
    "Tip 1 on how to photograph, pack, or clean this specific item to maximize value.",
    "Tip 2...",
    "Tip 3..."
  ], (Provide 3 to 4 hyper-practical, specific reselling tips)
  "category": "A refined, specific product category name",
  "keywords": ["vintage", "retro", "collectible"] (An array of 5 to 8 powerful search keywords)
}`;

    contents.push(promptText);

    // If an image was taken or uploaded, attach it as inline data for multimodal analysis
    if (image) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        });
        console.log(`Attached image with mimeType: ${mimeType} for Gemini multimodal research.`);
      } else {
        console.warn("Image format did not match expected base64 format.");
      }
    }

    console.log(`Sending research request to Gemini 2.5 Flash for item: "${name || "Image analysis"}"...`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    console.log("Received response from Gemini.");
    
    // Parse the JSON returned from Gemini
    const researchResult = JSON.parse(responseText);
    res.json(researchResult);
  } catch (error: any) {
    console.error("Error in AI research endpoint:", error);
    res.status(500).json({
      error: "Failed to complete AI research. Please check details and try again.",
      details: error.message,
    });
  }
});

// Specialized Facebook Marketplace Ad Optimizer Endpoint
app.post("/api/fb-optimize", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "AI Facebook Marketplace Optimizer is currently unavailable because the server API key is not configured.",
    });
  }

  try {
    const { name, category, notes, price, tone, isBundle, bundleItems } = req.body;

    let promptText = `You are a top-performing Facebook Marketplace seller assistant. 
Create an irresistible, high-converting Facebook Marketplace listing ad copy for local buyers.

Item Details:
- Name: ${name || "Item"}
- Category: ${category || "General"}
- Notes / Condition / Details: ${notes || "Good condition"}
- Target Price: $${price || 0}
- Tone requested: ${tone || "casual"}
- Is Bundle Deal: ${isBundle ? "Yes" : "No"}
${isBundle && bundleItems ? `- Bundle Included Items: ${JSON.stringify(bundleItems)}` : ""}

Generate a JSON response matching this schema strictly without markdown or formatting:
{
  "fbTitle": "Clear, search-friendly title (max 90 chars)",
  "fbPrice": ${price || 0},
  "fbCategory": "Suggested Facebook Marketplace Category (e.g. Garden & Outdoor, Tools, Antiques, Home Goods, Furniture)",
  "fbCondition": "Good", (Choose one: New, Like New, Good, Fair)
  "fbDescription": "Engaging description body ready for copy-pasting into Facebook Marketplace. Include clean bullet points, item features, dimensions/condition, local pickup terms (Cash/Venmo accepted, porch pickup or public meetup), and friendly call-to-action.",
  "fbTags": "tag1, tag2, tag3, tag4, tag5, tag6", (Comma separated tags ready for FB Marketplace tag field)
  "fbTips": ["Local FB Marketplace tip 1", "Tip 2"]
}`;

    console.log(`Generating FB Marketplace Ad for "${name}" with tone "${tone}"...`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [promptText],
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in FB optimize endpoint:", error);
    res.status(500).json({
      error: "Failed to generate FB Marketplace listing.",
      details: error.message,
    });
  }
});

// Configure Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite middleware in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring static serving in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
