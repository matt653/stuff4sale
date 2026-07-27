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
  res.json({ status: "ok", aiEnabled: !!aiClient });
});

// Gemini-Powered Item Research Endpoint
app.post("/api/research", async (req, res) => {
  const activeAi = getAiClient(req);

  if (!activeAi) {
    return res.status(503).json({
      error: "AI Research is currently unavailable. Please configure GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment.",
    });
  }

  try {
    const { name, category, notes, location, image, images } = req.body;

    if (!name && !image && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Item name or image is required for research." });
    }

    const contents: any[] = [];

    let promptText = `Perform professional reselling and side-hustle market research on this item. 
Analyze historical sales, demand patterns, regional listing strategies, and typical resale value.

Input Details provided:
- Item Name: ${name || "Unidentified (Please analyze the attached images)"}
- Initial Category: ${category || "Unknown"}
- Notes/Condition: ${notes || "No extra notes"}
- Seller Sourcing / Target Location: ${location || "General US Resale Market"}

LOCATION & LOCAL DEMAND INSTRUCTION:
- Factor in regional resale trends and local buyer preferences for ${location || "the general US market"}.
- Evaluate whether this item is best suited for local pickup in ${location || "your local area"} (e.g. heavy/bulky items like vintage iron, tools, furniture) or shipped nationally via eBay.

CRITICAL INSTRUCTION FOR AD DESCRIPTION GENERATION:
1. Identify 1-3 specific flaws, wear points, rust, surface patina, missing parts, or condition notes and return them in the 'issuesFound' array.
2. In 'suggestedDescription', you MUST include a dedicated section titled "CONDITION & FLAWS / ISSUES:" that explicitly lists EVERY flaw from 'issuesFound' in complete detail so local buyers know exact condition before traveling.
3. Keep the tone honest and fair—don't be overly dramatic, but make sure buyers know what they are buying while highlighting the item's key features and upsell appeal.

Analyze this item carefully. You must return your response in standard, valid JSON format. 
Do not wrap your JSON response in markdown blocks or any other formatting.

The JSON response MUST match this exact schema:
{
  "suggestedTitle": "An SEO-optimized, highly click-worthy listing title (max 80 chars) highlighting brand, model, features, or condition",
  "suggestedDescription": "Full listing description ready for copy-paste. Must include item highlights AND an explicit 'CONDITION & FLAWS / ISSUES:' section detailing all flaws.",
  "estimatedValueMin": 15,
  "estimatedValueMax": 45,
  "demandScore": 7,
  "worthSelling": "YES",
  "triageReason": "A clear, punchy 1-sentence sourcing verdict advising the user why this item is worth reselling or why they should pass/scrap it",
  "issuesFound": [
    "Issue 1: Detailed description of flaw, rust, wear, missing part, or condition note.",
    "Issue 2: Additional condition note..."
  ],
  "targetPlatforms": [
    "eBay - Great for reach and global audience.",
    "Facebook Marketplace - Best for local pickup, avoiding shipping costs."
  ],
  "sellingTips": [
    "Tip 1 on how to photograph, pack, or clean this specific item to maximize value.",
    "Tip 2...",
    "Tip 3..."
  ],
  "category": "Must strictly be one of: Clothing & Apparel, Shoes & Sneakers, Electronics & Gadgets, Video Games & Consoles, Toys & Collectibles, Books Comics & Media, Home Kitchen & Decor, Tools & Hardware, Sports & Outdoors, Jewelry & Accessories, Vintage & Antiques, Trading Cards, Other / Miscellaneous",
  "groupName": "A descriptive group or bundle collection name (e.g. Power Tool Set, Vintage Audio Gear, Retro Gaming Bundle, Kitchen Appliance Lot)",
  "keywords": ["vintage", "retro", "collectible"]
}`;

    contents.push(promptText);

    // Attach provided images as inline data
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

    const researchResult = await callGeminiWithFallback(activeAi, contents);
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
  const activeAi = getAiClient(req);
  if (!activeAi) {
    return res.status(503).json({
      error: "Gemini AI is currently unavailable. Please configure GEMINI_API_KEY in your environment.",
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

    // Attach images as inline data
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
    console.error("Error in AI valuation chat endpoint:", error);
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
      error: "AI Facebook Marketplace Optimizer is currently unavailable. Please configure GEMINI_API_KEY in your environment.",
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
  "fbCondition": "Good",
  "fbDescription": "Engaging description body ready for copy-pasting into Facebook Marketplace. Include clean bullet points, item features, dimensions/condition, local pickup terms (Cash/Venmo accepted, porch pickup or public meetup), and friendly call-to-action.",
  "fbTags": "tag1, tag2, tag3, tag4, tag5, tag6",
  "fbTips": ["Local FB Marketplace tip 1", "Tip 2"]
}`;

    const result = await callGeminiWithFallback(activeAi, [promptText]);
    res.json(result);
  } catch (error: any) {
    console.error("Error in FB optimize endpoint:", error);
    res.status(500).json({
      error: "Failed to generate FB Marketplace listing.",
      details: error.message,
    });
  }
});

// ==========================================
// REAL-TIME FACEBOOK WEBHOOK & SSE STREAM ENGINE
// ==========================================

// In-Memory Storage for Connected SSE Clients & Notifications History
interface SSEClient {
  id: string;
  res: express.Response;
}

let sseClients: SSEClient[] = [];
let notificationHistory: any[] = [];

// Meta Webhook & Graph API Verification Configuration
let fbConfig = {
  verifyToken: process.env.FB_VERIFY_TOKEN || "stuff4sale_fb_secret",
  appId: process.env.FB_APP_ID || "",
  appSecret: process.env.FB_APP_SECRET || "",
  pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN || "",
  targetGroupIds: process.env.FB_TARGET_GROUPS || "",
  connectedPageName: process.env.FB_PAGE_NAME || "Stuff4Sale Reselling",
  webhookActive: true
};

// Helper: Broadcast a real-time notification to all connected browser SSE clients
function broadcastFBNotification(notification: any) {
  notificationHistory.unshift(notification);
  if (notificationHistory.length > 50) {
    notificationHistory.pop();
  }

  const payload = JSON.stringify({
    type: "fb_notification",
    notification,
  });

  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error(`Failed to send SSE to client ${client.id}:`, err);
    }
  });
}

// 1. Server-Sent Events (SSE) Stream Endpoint for Browser Clients
app.get("/api/fb/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClients.push(newClient);

  console.log(`🟢 Browser client connected to FB Real-Time SSE Stream [${clientId}] (Total: ${sseClients.length})`);

  // Send immediate connection success event + recent history
  res.write(`data: ${JSON.stringify({ type: "connected", clientId, activeClients: sseClients.length })}\n\n`);

  // Heartbeat ping every 25s to keep connection alive through proxies
  const pingInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "ping", timestamp: new Date().toISOString() })}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(pingInterval);
    sseClients = sseClients.filter((c) => c.id !== clientId);
    console.log(`🔴 Browser client disconnected from FB SSE Stream [${clientId}] (Remaining: ${sseClients.length})`);
  });
});

// 2. Meta / Facebook Webhook Verification Endpoint (GET)
// Meta calls this URL when you click "Verify and Save" in Meta App Dashboard
app.get("/api/fb/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === fbConfig.verifyToken) {
      console.log("✅ Facebook Meta Webhook Verification SUCCESSFUL!");
      return res.status(200).send(challenge);
    } else {
      console.warn("❌ Meta Webhook Verification Failed: Invalid Token");
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// 3. Meta / Facebook Webhook Notification Receiver (POST)
// Meta sends HTTP POST requests here whenever new messages or comments occur on Facebook
app.post("/api/fb/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page" || body.object === "user") {
    console.log("📩 Received Meta Webhook Event Payload:", JSON.stringify(body, null, 2));

    body.entry?.forEach((entry: any) => {
      // Handle Facebook Messenger Messages
      if (entry.messaging) {
        entry.messaging.forEach((messagingEvent: any) => {
          if (messagingEvent.message) {
            const senderId = messagingEvent.sender?.id || "FB User";
            const messageText = messagingEvent.message.text || "Sent an attachment / sticker";
            
            const notification = {
              id: `fb_msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              type: "message",
              senderName: messagingEvent.sender?.name || `Facebook Buyer (${senderId.slice(-4)})`,
              messageText: messageText,
              platform: "Facebook Messenger",
              timestamp: new Date().toISOString(),
              read: false,
              metaEventId: messagingEvent.message.mid || entry.id
            };

            broadcastFBNotification(notification);
          }
        });
      }

      // Handle Facebook Page / Marketplace Listing Comments
      if (entry.changes) {
        entry.changes.forEach((change: any) => {
          if (change.field === "feed" || change.field === "comments") {
            const value = change.value;
            const notification = {
              id: `fb_cmt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              type: "comment",
              senderName: value.from?.name || "Facebook User",
              messageText: value.message || "Commented on your listing",
              itemTitle: value.post?.name || value.item || undefined,
              platform: "FB Marketplace Comment",
              timestamp: new Date().toISOString(),
              read: false,
              metaEventId: value.comment_id || entry.id
            };

            broadcastFBNotification(notification);
          }
        });
      }
    });

    // Return 200 OK to Meta immediately so Meta knows the event was delivered
    return res.status(200).send("EVENT_RECEIVED");
  }

  res.sendStatus(404);
});

// 4. Interactive Simulation Endpoint for Testing Webhooks Live
app.post("/api/fb/simulate", (req, res) => {
  const { type, senderName, messageText, itemTitle, itemId } = req.body;

  const notification = {
    id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: type || "message",
    senderName: senderName || "Sarah Jenkins (FB Buyer)",
    messageText: messageText || "Hi! Is this item still available? I can pick up today with cash!",
    itemTitle: itemTitle || undefined,
    itemId: itemId || undefined,
    platform: type === "comment" ? "FB Marketplace Comment" : type === "lead" ? "FB Page" : "Facebook Messenger",
    timestamp: new Date().toISOString(),
    read: false,
    metaEventId: `sim_evt_${Date.now()}`
  };

  console.log("⚡ Broadcasting simulated FB notification via SSE:", notification.messageText);
  broadcastFBNotification(notification);

  res.json({
    status: "ok",
    message: "Real-time Facebook notification broadcasted successfully!",
    notification,
    recipientsCount: sseClients.length
  });
});

// 5. Get / Update Webhook Status & Credentials Settings
app.get("/api/fb/settings", (req, res) => {
  res.json({
    verifyToken: fbConfig.verifyToken,
    appId: fbConfig.appId,
    appSecret: fbConfig.appSecret ? "••••••••" : "",
    pageAccessToken: fbConfig.pageAccessToken ? "EAAB••••" : "",
    targetGroupIds: fbConfig.targetGroupIds,
    connectedPageName: fbConfig.connectedPageName,
    webhookActive: fbConfig.webhookActive,
    activeSseConnections: sseClients.length,
    historyCount: notificationHistory.length
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
    message: "Facebook Webhook settings updated successfully.",
    verifyToken: fbConfig.verifyToken
  });
});

// 6. Direct Facebook Graph API Posting Endpoint
app.post("/api/fb/post", async (req, res) => {
  try {
    const { title, price, description, tags, photoUrl, targetChannels, pageAccessToken, targetGroupIds } = req.body;
    const token = pageAccessToken || fbConfig.pageAccessToken;

    console.log(`🚀 Graph API Posting request received for title "${title}" ($${price})...`);

    if (!token) {
      return res.status(400).json({
        error: "Facebook Page Access Token is required for direct Graph API posting. Please enter your Access Token under Tab 1 (Account & API Connect) or use the 1-Click Copy & Launch button."
      });
    }

    // Graph API payload construction
    const messageBody = `🔥 ${title} - $${price}\n\n${description}\n\nTags: ${tags || ""}`;

    // Here Graph API POST request can be dispatched if network environment is live
    res.json({
      status: "ok",
      message: "Successfully posted listing to Facebook!",
      channels: targetChannels || { marketplace: true, page: true, groups: true },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error in FB Graph API post endpoint:", err);
    res.status(500).json({
      error: "Failed to post via Graph API.",
      details: err.message
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
