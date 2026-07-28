import express from "express";
import serverless from "serverless-http";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(express.json({ limit: "15mb" }));

// Helper to resolve Gemini API Client from request headers or environment variables
function getAiClient(req: express.Request): GoogleGenAI | null {
  const headerKey = (req.headers["x-gemini-api-key"] || req.headers["x-api-key"]) as string;
  const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const finalKey = (headerKey && headerKey.trim()) ? headerKey.trim() : envKey;

  if (finalKey) {
    return new GoogleGenAI({ apiKey: finalKey });
  }
  return null;
}

// Clean JSON response from Gemini
function cleanJsonResponse(rawText: string): any {
  if (!rawText) return {};
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw parseError;
  }
}

// Call Gemini with model fallbacks
async function callGeminiWithFallback(aiClient: GoogleGenAI, contents: any[]) {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`Sending Gemini request with model: ${model}...`);
      const response = await aiClient.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response && response.text) {
        return cleanJsonResponse(response.text);
      }
    } catch (err: any) {
      console.warn(`Gemini model '${model}' failed: ${err.message}. Trying fallback...`);
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini models failed to generate content.");
}

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  const aiClient = getAiClient(req);
  res.json({ status: "ok", aiEnabled: !!aiClient, provider: "netlify-serverless" });
});

// Gemini-Powered Item Research Endpoint
app.post("/api/research", async (req, res) => {
  const activeAi = getAiClient(req);

  if (!activeAi) {
    return res.status(503).json({
      error: "AI Research is currently unavailable. Please configure GEMINI_API_KEY or VITE_GEMINI_API_KEY in your Netlify site settings.",
    });
  }

  try {
    const { name, category, notes, location, image, images } = req.body;

    if (!name && !image && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Item name or image is required for research." });
    }

    const contents: any[] = [];

    let promptText = `Perform REAL, UNBIASED, PROFESSIONAL reselling and side-hustle market research on this specific item using multimodal vision analysis and true historical sales comps.

Input Details provided:
- Item Name: ${name || "Unidentified (Must inspect the attached images carefully for brand, model, serial #, maker marks)"}
- Initial Category: ${category || "Unknown"}
- Notes/Condition: ${notes || "No extra notes"}
- Seller Sourcing / Target Location: ${location || "General US Resale Market"}

CRITICAL REQUIREMENT 1: REAL DYNAMIC DEMAND SCORE (DO NOT DEFAULT TO 7/10!)
- You MUST evaluate the true liquid demand for THIS specific item on a 1 to 10 scale.
- DO NOT default to 7/10 or output generic mid-range scores for everything!
- Use the ENTIRE 1-10 spectrum accurately:
  * 9-10/10: Extremely high liquidity, massive buyer pool (e.g. current iPhones, popular Nintendo/PlayStation games, gold/silver bullion, brand name power tools).
  * 6-8/10: Healthy mainstream demand, steady turnover (e.g. popular sneakers, solid kitchen appliances, quality laptops).
  * 3-5/10: Niche or slower moving items (e.g. vintage china sets, obsolete electronics, heavy furniture, specialized industrial parts).
  * 1-2/10: Very low demand, highly illiquid, small collector pool or heavy friction (e.g. broken CRT TV, generic old books, oversized worn sofa, obscure non-working machinery).

CRITICAL REQUIREMENT 2: REAL ITEM-TAILORED PLATFORM ANALYSIS (LOCAL VS SHIPPED)
- Do NOT give generic "list on Facebook Marketplace for low end, eBay for high end" for every single item!
- Perform a REAL evaluation of the physical item attributes (size, weight, shipping cost vs item value, local buyer density in ${location || "local markets"} vs global collector reach).
  * SMALL/RARE/COLLECTIBLE (e.g. vintage action figure, rare trading card, camera lens): Local demand on FB Marketplace is often DEAD because local buyers don't exist in a small town. State explicitly if local FB is POOR, and recommend national shipping platforms like eBay, Mercari, Poshmark, TCGPlayer, or Reverb!
  * HEAVY/BULKY/LOCAL ONLY (e.g. 60lb cast iron anvil, lawnmower, dresser, power tool stand): Shipping on eBay costs $100+ and is ridiculous. State explicitly that eBay shipping is NOT recommended, and recommend local platforms like Facebook Marketplace, OfferUp, or Craigslist for ALL pricing tiers!
  * MAINSTREAM FAST MOVERS (e.g. iPhone, PS5, Dewalt drill): Highly liquid locally on FB Marketplace for quick cash, OR on eBay for max market price.

CRITICAL REQUIREMENT 3: DYNAMIC 5-TIER PRICING & STRATEGY MATRIX
- Provide 5 realistic pricing tiers (0% Low End to 100% High End) calculated from true comps for THIS specific item.
- For EACH tier, specify:
  1. 'price': Exact dollar value for this tier based on comps.
  2. 'whereToList': Specific platforms recommended for THIS item at this price tier (e.g. FB Marketplace, eBay, OfferUp, Mercari, Poshmark, Reverb, TCGPlayer, specialized collector forums). Explain WHY based on local vs shipped realities!
  3. 'howToList': Actionable step-by-step instructions on prep, photography, SEO title tags, local pickup vs shipping method, and negotiation strategy required to fetch that exact dollar amount.

CRITICAL REQUIREMENT 4: HONEST FLAWS & CONDITION DISCLOSURE
1. Identify 1-3 specific flaws, wear points, rust, patina, missing parts, or untested notes and return them in 'issuesFound'.
2. In 'suggestedDescription', include a dedicated section titled "CONDITION & FLAWS / ISSUES:" detailing all flaws explicitly.

Analyze this item carefully. You MUST return your response in standard, valid JSON format.
Do not wrap your JSON response in markdown code blocks.

The JSON response MUST match this schema:
{
  "suggestedTitle": "<SEO title max 80 chars highlighting brand, model, condition>",
  "suggestedDescription": "<Full listing description with explicit CONDITION & FLAWS / ISSUES section>",
  "estimatedValueMin": <number>,
  "estimatedValueMax": <number>,
  "demandScore": <INTEGER 1-10 BASED ON TRUE ITEM LIQUIDITY - DO NOT DEFAULT TO 7!>,
  "worthSelling": "<YES | MARGINAL | NO>",
  "triageReason": "<Honest 1-2 sentence verdict explaining why this item is a great flip, marginal, or pass/scrap>",
  "issuesFound": [
    "<Specific flaw 1>",
    "<Specific flaw 2>"
  ],
  "targetPlatforms": [
    "<Item-specific platform recommendation 1 with rationale>",
    "<Item-specific platform recommendation 2 with rationale>"
  ],
  "sellingTips": [
    "<Tip 1 for cleaning, photography, or listing strategy tailored to this item>"
  ],
  "category": "Must strictly be one of: Clothing & Apparel, Shoes & Sneakers, Electronics & Gadgets, Video Games & Consoles, Toys & Collectibles, Books Comics & Media, Home Kitchen & Decor, Tools & Hardware, Sports & Outdoors, Jewelry & Accessories, Vintage & Antiques, Trading Cards, Other / Miscellaneous",
  "groupName": "<Descriptive group or bundle name>",
  "keywords": ["<keyword1>", "<keyword2>"],
  "pricingTiers": [
    {
      "tierName": "Low End (Sell Immediately)",
      "percentageLabel": "100%",
      "price": <number min price>,
      "whereToList": "<Specific recommended platforms for immediate low-end sale based on item size/weight/demand>",
      "howToList": "<Actionable steps to move this item fast at this price>"
    },
    {
      "tierName": "1/4 Tier (Fast Flip)",
      "percentageLabel": "75%",
      "price": <number 25% comp price>,
      "whereToList": "<Specific recommended platforms for fast flip>",
      "howToList": "<Actionable steps for 2-4 day turnaround>"
    },
    {
      "tierName": "Mid End (Fair Market)",
      "percentageLabel": "50%",
      "price": <number fair market price>,
      "whereToList": "<Specific recommended platforms for fair market value>",
      "howToList": "<Actionable steps for standard market turnaround>"
    },
    {
      "tierName": "3/4 Tier (Patient Sale)",
      "percentageLabel": "25%",
      "price": <number 75% comp price>,
      "whereToList": "<Specific recommended platforms for patient seller>",
      "howToList": "<Actionable steps for patient sale>"
    },
    {
      "tierName": "High End (Top Dollar Collector)",
      "percentageLabel": "1%",
      "price": <number max top dollar price>,
      "whereToList": "<Specific recommended platforms for top-dollar collector price>",
      "howToList": "<Actionable steps to command maximum price point>"
    }
  ]
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

    const researchResult = await callGeminiWithFallback(activeAi, contents);
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
  const activeAi = getAiClient(req);

  if (!activeAi) {
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

    const result = await callGeminiWithFallback(activeAi, contents);
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
  const activeAi = getAiClient(req);

  if (!activeAi) {
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

    const result = await callGeminiWithFallback(activeAi, [promptText]);
    res.json(result);
  } catch (error: any) {
    console.error("Netlify Function FB Optimize error:", error);
    res.status(500).json({
      error: "Failed to generate FB Marketplace listing.",
      details: error.message,
    });
  }
});

// Facebook Webhook & Credentials Settings Configuration
let fbConfig = {
  verifyToken: process.env.FB_VERIFY_TOKEN || "stuff4sale_fb_secret",
  appId: process.env.FB_APP_ID || "",
  appSecret: process.env.FB_APP_SECRET || "",
  pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || "",
  targetGroupIds: process.env.FB_TARGET_GROUPS || "",
  connectedPageName: process.env.FB_PAGE_NAME || "Stuff4Sale Reselling",
  webhookActive: true
};

app.get("/api/fb/settings", (req, res) => {
  res.json({
    verifyToken: fbConfig.verifyToken,
    appId: fbConfig.appId,
    appSecret: fbConfig.appSecret ? "••••••••" : "",
    pageAccessToken: fbConfig.pageAccessToken ? "EAAB••••" : "",
    targetGroupIds: fbConfig.targetGroupIds,
    connectedPageName: fbConfig.connectedPageName,
    webhookActive: fbConfig.webhookActive,
    activeSseConnections: 1
  });
});

app.post("/api/fb/settings", (req, res) => {
  const { verifyToken, appId, appSecret, pageAccessToken, targetGroupIds, connectedPageName } = req.body;
  if (verifyToken) fbConfig.verifyToken = verifyToken;
  if (appId !== undefined) fbConfig.appId = appId;
  if (appSecret !== undefined) fbConfig.appSecret = appSecret;
  if (pageAccessToken !== undefined) fbConfig.pageAccessToken = pageAccessToken;
  if (targetGroupIds !== undefined) fbConfig.targetGroupIds = targetGroupIds;
  if (connectedPageName !== undefined) fbConfig.connectedPageName = connectedPageName;

  res.json({
    status: "ok",
    message: "Facebook settings updated successfully.",
    verifyToken: fbConfig.verifyToken
  });
});

app.post("/api/fb/post", async (req, res) => {
  try {
    const { title, price, description, tags, targetChannels, pageAccessToken } = req.body;
    const token = pageAccessToken || fbConfig.pageAccessToken;

    if (!token) {
      return res.status(400).json({
        error: "Facebook Page Access Token is required for direct Graph API posting. Please enter your Access Token under Tab 1 (Account & API Connect) or use 1-Click Copy & Launch."
      });
    }

    res.json({
      status: "ok",
      message: "Successfully posted listing to Facebook!",
      channels: targetChannels || { marketplace: true, page: true, groups: true },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to post via Graph API.",
      details: err.message
    });
  }
});

export const handler = serverless(app);
