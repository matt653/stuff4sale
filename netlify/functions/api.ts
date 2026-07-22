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
  "worthSelling": "YES",
  "triageReason": "Clear 1-sentence verdict on whether to flip this find or pass/scrap it.",
  "cleaningInstructions": [
    "Step 1: Specific cleaning/testing tip for this item."
  ],
  "prepChecklist": [
    "Step 1: Specific prep/photo tip."
  ],
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

// Interactive Conversational AI Valuation Chat Endpoint
app.post("/api/valuation-chat", async (req, res) => {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key) ai = new GoogleGenAI({ apiKey: key });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Gemini AI is currently unavailable. Please configure GEMINI_API_KEY in your Netlify settings.",
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
    "worthSelling": "YES",
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

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Netlify Function AI Valuation Chat error:", error);
    res.status(500).json({
      error: "Failed to process AI valuation chat.",
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
    const { name, category, notes, price, tone, isBundle, bundleItems, totalIndividualPrice, discountSavings } = req.body;

    let promptText = `You are a top-performing Facebook Marketplace seller assistant. 
Create an irresistible Facebook Marketplace listing ad copy for local buyers.

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

Generate a JSON response matching this schema strictly without markdown or formatting: {
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
