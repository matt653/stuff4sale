import express from "express";
import serverless from "serverless-http";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(express.json({ limit: "15mb" }));

// Initialize Gemini API Client from Netlify environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({ apiKey: geminiApiKey });
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai, provider: "netlify-serverless" });
});

// Gemini-Powered Item Research Endpoint
app.post("/api/research", async (req, res) => {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key) ai = new GoogleGenAI({ apiKey: key });
  }

  if (!ai) {
    return res.status(503).json({
      error: "AI Research is currently unavailable. Please configure GEMINI_API_KEY in your Netlify site settings.",
    });
  }

  try {
    const { name, category, notes, image, images } = req.body;

    if (!name && !image && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Item name or image is required for research." });
    }

    const contents: any[] = [];

    let promptText = `Perform professional reselling and side-hustle market research on this item. 
Analyze historical sales, demand patterns, listing strategies, and typical value.

Input Details provided:
- Item Name: ${name || "Unidentified (Please analyze the attached images)"}
- Initial Category: ${category || "Unknown"}
- Notes/Condition: ${notes || "No extra notes"}

Analyze this item carefully. You must return your response in standard, valid JSON format. 
Do not wrap your JSON response in markdown blocks or any other formatting.

The JSON response MUST match this exact schema:
{
  "suggestedTitle": "An SEO-optimized listing title (max 80 chars) highlighting brand, model, features, or condition",
  "suggestedDescription": "A detailed listing description text ready for copy-paste.",
  "estimatedValueMin": 15,
  "estimatedValueMax": 45,
  "demandScore": 7,
  "targetPlatforms": [
    "eBay - Great for reach.",
    "Facebook Marketplace - Best for local pickup."
  ],
  "sellingTips": [
    "Tip 1...",
    "Tip 2..."
  ],
  "category": "A refined product category name",
  "keywords": ["vintage", "retro", "collectible"]
}`;

    contents.push(promptText);

    const imageList: string[] = images && Array.isArray(images) && images.length > 0 ? images : image ? [image] : [];
    
    imageList.forEach((imgStr: string) => {
      const match = imgStr.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            data: match[2],
            mimeType: match[1],
          },
        });
      }
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const researchResult = JSON.parse(response.text || "{}");
    res.json(researchResult);
  } catch (error: any) {
    console.error("Netlify Function AI Research error:", error);
    res.status(500).json({
      error: "Failed to complete AI research.",
      details: error.message,
    });
  }
});

// Specialized Facebook Marketplace Ad Optimizer Endpoint
app.post("/api/fb-optimize", async (req, res) => {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key) ai = new GoogleGenAI({ apiKey: key });
  }

  if (!ai) {
    return res.status(503).json({
      error: "AI Facebook Marketplace Optimizer is currently unavailable. Please configure GEMINI_API_KEY in your Netlify settings.",
    });
  }

  try {
    const { name, category, notes, price, tone, isBundle, bundleItems } = req.body;

    let promptText = `You are a top-performing Facebook Marketplace seller assistant. 
Create an irresistible Facebook Marketplace listing ad copy for local buyers.

Item Details:
- Name: ${name || "Item"}
- Category: ${category || "General"}
- Notes / Condition / Details: ${notes || "Good condition"}
- Target Price: $${price || 0}
- Tone requested: ${tone || "casual"}
- Is Bundle Deal: ${isBundle ? "Yes" : "No"}
${isBundle && bundleItems ? `- Bundle Included Items: ${JSON.stringify(bundleItems)}` : ""}

Generate a JSON response matching this schema strictly:
{
  "fbTitle": "Clear title (max 90 chars)",
  "fbPrice": ${price || 0},
  "fbCategory": "Suggested FB Category",
  "fbCondition": "Good",
  "fbDescription": "Engaging description body ready for copy-pasting.",
  "fbTags": "tag1, tag2, tag3",
  "fbTips": ["Tip 1", "Tip 2"]
}`;

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
    console.error("Netlify Function FB Optimize error:", error);
    res.status(500).json({
      error: "Failed to generate FB Marketplace listing.",
      details: error.message,
    });
  }
});

export const handler = serverless(app);
