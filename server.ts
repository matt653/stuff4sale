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
    const { name, category, notes, image, images } = req.body;

    if (!name && !image && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Item name or image is required for research." });
    }

    const contents: any[] = [];

    // Construct the prompt guiding Gemini to produce a structured JSON result
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
  "suggestedTitle": "An SEO-optimized, highly click-worthy listing title (max 80 chars) highlighting brand, model, features, or condition",
  "suggestedDescription": "A professional, detailed listing description text ready for copy-paste. Highlight key selling points, structure it with clean sections, and leave placeholders [like condition details] for manual editing if needed.",
  "estimatedValueMin": 15, (Estimate a realistic, conservative lower reselling list price in USD as a number)
  "estimatedValueMax": 45, (Estimate an optimistic, high-performing reselling list price in USD as a number)
  "demandScore": 7, (An integer from 1 to 10 indicating sell-through rate. 1 = extremely hard to sell, 10 = sells within hours)
  "worthSelling": "YES", (Choose one strictly: "YES" if estimated profit/value is good and item sells easily, "MARGINAL" if low profit margin $5-$15 or slow seller, "NO" if item has low value under $10 or is not worth flipping)
  "triageReason": "A clear, punchy 1-sentence sourcing verdict advising the user why this item is worth reselling or why they should pass/scrap it",
  "cleaningInstructions": [
    "Cleaning step 1: Specific advice on how to clean, restore, or test this exact item to maximize selling price.",
    "Cleaning step 2..."
  ], (Provide 2 to 3 specific item cleaning and restoration instructions)
  "prepChecklist": [
    "Prep step 1: What to test or photograph before listing.",
    "Prep step 2..."
  ], (Provide 2 to 3 practical steps to prepare this item for listing)
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

    // Attach all provided images as inline data for multimodal analysis
    const imageList: string[] = images && Array.isArray(images) && images.length > 0 ? images : image ? [image] : [];
    
    imageList.forEach((imgStr: string, idx: number) => {
      const match = imgStr.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            data: match[2],
            mimeType: match[1],
          },
        });
        console.log(`Attached image #${idx + 1} (${match[1]}) for Gemini multimodal research.`);
      }
    });

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

// Interactive Conversational AI Valuation Chat Endpoint
app.post("/api/valuation-chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "Gemini AI is currently unavailable because the server API key is not configured.",
    });
  }

  try {
    const { name, notes, image, images, history, generateFinalReport } = req.body;
    const contents: any[] = [];

    const conversationContext = history && Array.isArray(history) && history.length > 0
      ? history.map((m: any) => `${m.sender === 'user' ? 'User' : 'Gemini'}: ${m.text}`).join('\n')
      : '';

    let promptText = "";

    if (generateFinalReport) {
      promptText = `You are Gemini AI Sourcing & Valuation Expert. 
Synthesize all item details, photos, and conversation history below to generate the FINAL SOURCING & VALUATION REPORT.

Conversation History:
${conversationContext}
Current Notes: ${notes || "None"}
Item Hint/Title: ${name || "Unknown"}

Return a strictly valid JSON object matching this schema:
{
  "responseType": "REPORT",
  "aiMessage": "Here is your complete sourcing & valuation report!",
  "report": {
    "suggestedTitle": "SEO Listing Title (max 80 chars)",
    "suggestedDescription": "Detailed listing description ready for copy-paste",
    "estimatedValueMin": 20,
    "estimatedValueMax": 60,
    "demandScore": 8,
    "worthSelling": "YES", (Choose one strictly: "YES", "MARGINAL", "NO")
    "triageReason": "1-sentence sourcing verdict advising why it is worth selling or scrap",
    "cleaningInstructions": ["Step 1...", "Step 2..."],
    "prepChecklist": ["Prep tip 1...", "Prep tip 2..."],
    "targetPlatforms": ["eBay - Great reach", "Facebook Marketplace - Local pickup"],
    "sellingTips": ["Tip 1...", "Tip 2..."],
    "category": "Product Category",
    "keywords": ["tag1", "tag2", "tag3"]
  }
}`;
    } else {
      promptText = `You are Gemini AI Sourcing Assistant. 
Analyze the uploaded item photo(s), name/notes, and conversation history below. 
If this is the start of the chat or if critical condition details are unknown, ask 1 to 2 sharp, friendly follow-up questions about the item's condition, working order, accessories, or flaws before generating the final report. Also provide 3 quick-reply choices for the user!

Conversation History:
${conversationContext}
Initial Notes: ${notes || "None"}
Item Name/Hint: ${name || "Image uploaded"}

Return a strictly valid JSON object matching this schema:
{
  "responseType": "QUESTION",
  "aiMessage": "Your friendly, conversational response identifying what the item appears to be and asking 1 to 2 quick questions about condition/accessories/testing to determine exact value.",
  "suggestedQuickReplies": [
    "Choice 1: e.g. Powers on & works great!",
    "Choice 2: e.g. Untested / Needs power cord",
    "Choice 3: e.g. Has minor scratches / cosmetic flaws"
  ]
}`;
    }

    contents.push(promptText);

    // Attach images as inline data
    const imageList: string[] = images && Array.isArray(images) && images.length > 0 ? images : image ? [image] : [];
    imageList.forEach((imgStr: string, idx: number) => {
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

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in AI valuation chat endpoint:", error);
    res.status(500).json({
      error: "Failed to process AI valuation chat.",
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
    const { name, category, notes, price, tone, isBundle, bundleItems, totalIndividualPrice, discountSavings } = req.body;

    let promptText = `You are a top-performing Facebook Marketplace seller assistant. 
Create an irresistible, high-converting Facebook Marketplace listing ad copy for local buyers.

Item Details:
- Name: ${name || "Item"}
- Category: ${category || "General"}
- Notes / Condition / Details: ${notes || "Good condition"}
- Target Price: $${price || 0}
- Tone requested: ${tone || "casual"}
- Is Bundle Deal: ${isBundle ? "Yes" : "No"}
${isBundle ? `
CRITICAL BUNDLE PRICING INSTRUCTIONS:
- Total Individual Price Sum: $${totalIndividualPrice || price}
- Discounted Bundle Package Price: $${price}
- Customer Bundle Savings: $${discountSavings || 0}
- Included Bundle Items: ${JSON.stringify(bundleItems)}

Your fbDescription MUST BE STRUCTURED EXACTLY AS FOLLOWS FOR BUNDLES:
1. Start with a bold package headline stating the DISCOUNTED BUNDLE PACKAGE PRICE ($${price} for everything!).
2. List the INDIVIDUAL PRICE BREAKDOWN for each item separately (e.g., "• [Item Name] - $[Price] if bought individually").
3. Include an explicit BUNDLE SAVINGS line (e.g., "🔥 Save $${discountSavings} when you take the whole bundle today!").
4. List item condition notes, local pickup terms (Cash/Venmo accepted), and call to action.
` : ""}

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
