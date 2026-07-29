# AGENTS.md

## The Project

### Overview
Stuff4Sale is a full-stack AI-powered inventory management, item valuation, and reselling platform designed for flips, side-hustles, and e-commerce reselling. It combines Google Gemini AI multimodal vision analysis, real-time Firebase database synchronization, Facebook Marketplace/Messenger lead automation, and financial profit analytics.

### Key Capabilities & Architecture

#### 1. Inventory & Asset Management
- **Full Lifecycle Tracking**: Categorize and manage items across four distinct status states: `inventory`, `listed`, `sold`, and `archived`.
- **Rich Media & Multimodal Intake**: Supports primary cover photos, multi-image galleries (base64 photo array), and video URLs/uploads via a custom built-in `CameraCapture` component.
- **Explicit Gemini Research Trigger**: Gemini AI identification is strictly triggered only when the user manually clicks the "✨ Gemini Find It!" button. No background or automatic research calls run on photo upload.
- **Stock Numbering & Internal SKUs**: Automatic sequential stock number generator (`stockUtils.ts`) starting at `1` and incrementing upward (`1`, `2`, `3`...). Each item's Firestore Document ID is set directly to its Stock Number (`1`, `2`, `3`...) for exact 1-to-1 database mapping.
- **Mobile Photo Compression & Payload Sanitization**: High-resolution smartphone camera photos are automatically scaled and compressed (canvas JPEG ~80KB) to prevent exceeding Firestore's 1MB document limit, ensuring item saves never get rejected or disappear.
- **Comprehensive Financial Tracking & Rapid Ad Defaults**: Track purchase price, sourcing date, purchase location, listed price, listed platform, sale price, sale date, and net profit / ROI. Automatically populates all new items with **$0 Purchase Cost**, **In Stock (`inventory`)** status, and **Facebook Marketplace** listing platform by default so ads can be posted rapidly without manual form friction.
- **Interactive Live Inventory Bundle Selector & Bundle Ad Generator**: Replaced plain text bundle inputs with an interactive multi-select checklist of your **entire live inventory**. Checking items automatically links them together (`bundle_id` and `bundled_item_ids` in Supabase), overlays high-visibility **Stock # Badges (`#1`, `#2`...) on all picture thumbnails**, and enables a 1-click **"✨ Generate Bundle Ad & Multi-Item Deal"** button that itemizes standalone prices, calculates total separate value, and outputs discounted bundle pricing for Facebook Marketplace and eBay.
- **Built-in Photo Studio & Image Editor (`PhotoEditorModal.tsx`)**: Full-featured interactive HTML5 Canvas photo editor integrated directly into intake camera capture and inventory item cards. Enables **4-Side Edge Crop Range Sliders** (Top ⬆️, Bottom ⬇️, Left ⬅️, Right ➡️ edge sliders with live visual dark overlay mask and 1-click aspect ratio presets 1:1, 4:3, 16:9), **Text Overlays & Watermark Banners** (e.g. "LOCAL PICKUP ONLY", "$50 FIRM"), **Blur / Anonymize Privacy Boxes** (draw pixelated blur rectangles over license plates, house numbers, or family photos), **90° Rotation**, and **Brightness / Contrast / Saturation Adjustments**.

#### 2. AI Research & Sourcing Intake Inspector (`@google/genai` & `server.ts`)
- **Multimodal Gemini AI Research**: Powered by Google Gemini (`@google/genai`) via Express server endpoint (`/api/research`). Accepts text queries and multi-image uploads with automatic model fallback (`gemini-3.6-flash` → `gemini-3.5-flash` → `gemini-2.5-flash` → `gemini-2.0-flash`). Evaluates true dynamic demand score across the full 1-10 spectrum based on 4 concrete factors: brand recognition, buyer pool density, sell-through velocity, and shipping/freight friction (never defaulting to generic 4/10 or 7/10).
- **Interactive 5-Tier Reselling Strategy & Platform Estimator Engine**: Interactive slider and 5-tier selector (`⚡ 100% Sell Immediately`, `🚀 75% Fast Flip`, `⚖️ 50% Fair Market`, `⏳ 25% Patient Sale`, `🛑 1% Top Dollar Collector`). For each tier, Gemini AI inspects the physical item attributes (size, weight, shipping costs vs item value, local buyer density vs national collector reach) to provide exact target price, **Where Should You Post / List It** (un-templated platform recommendations explaining local vs shipped realities), and **How to List & What You Need To Do** (step-by-step prep, photos, SEO keywords, local cash vs shipped, return policies). Includes dynamic fallback generation for legacy items.
- **Individualized Rarity AI Research**: Gemini conducts granular item analysis evaluating maker marks, model numbers, antique patina, salvage value, and collector oddities rather than treating items as generic commodities.
- **Comprehensive 5-Part Description Generator**: Gemini AI now structures every generated item description into 5 explicit section headings: (1) 📌 WHAT IT IS & ORIGINAL USE, (2) 💡 MODERN USES & STYLING / DECOR, (3) ⚠️ CONDITION & OBSERVED FACTS, (4) 📏 SPECS, MATERIALS & MEASUREMENTS, and (5) 🚀 WHY THIS IS A GREAT DEAL & SELLER NOTE.
- **Strict Factual Condition & Untested Question Generator**: Enforces zero guessing or predicting of unseen flaws. Gemini states 100% visible, observable facts directly seen in photos (patina, surface rust, paint wear) and explicitly frames unverified details (liquid tightness, internal mechanics, power state) as **Untested Questions** for the seller to answer.
- **Valuation Chat 2-Question Limit & Price Impact Rule**: Valuation chat is strictly capped at **maximum 2 questions**. Every question asked MUST state the exact dollar value impact of the answer (e.g. *If Working: Est. $150-$200 | If Non-Working: Est. $30-$50*). No idle small talk allowed.
- **AI Intake Inspector**: Modal interface (`AIIntakeInspector.tsx`) for rapid photo-first sourcing triage before adding items into active inventory.

#### 3. Personal Facebook Marketplace Assistant (`FBHubModal.tsx`)
- **Streamlined 1-Page Assistant**: Designed specifically for Personal Facebook Accounts without requiring complex Meta developer API tokens, App Secrets, or Webhooks.
- **1-to-1 Inventory Description Pulling**: Directly pulls the exact description, stock number, title, category, and list price saved in your inventory database—eliminating redundant AI calls or duplicate ad listings.
- **1-Click Photo Downloader**: One-click download of item photos to drag and drop into Facebook Marketplace.
- **1-Click Launch**: Copies exact inventory description to clipboard and launches Facebook Marketplace creation form in a new tab.

#### 4. Analytics & Financial Reporting (`StatsGrid.tsx`)
- **Real-Time Metrics**: Displays active inventory count, total inventory value, total sales, net profit, average ROI percentage, and active listing count.
- **Filter, Sort & View Controls**: Filter by category and status, search by keyword/SKU/notes, multi-criteria sorting (defaults to **Stock # Highest to Lowest** e.g. #27 down to #1, plus oldest, profit, ROI, cost), and toggle between Grid and List views.
- **CSV Data Export**: One-click data export functionality for accounting and tax reporting.

#### 5. Technical Architecture & Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Lucide React icons, Motion (Framer Motion).
- **Backend Server**: Node.js, Express (`server.ts`), `netlify/functions/api.ts`, `@google/genai` SDK v2, `dotenv`.
- **Database & Sync**: Firebase Firestore real-time database (`firebase.ts`), with offline fallback capabilities.

---

### Agent Rule for Modifications
> **Mandatory Rule for All Agents**: Each agent MUST update **The Project** section above after each modification made to the app to keep functionality, endpoints, components, and schema changes completely up to date.

> **Mandatory Single Supabase Table Rule**: Agents MUST NOT create new database tables or fetch, edit, or store data outside the single Supabase table `Stuff4Sale` (URL: `https://yvekxqeltflessrblfbq.supabase.co/rest/v1/Stuff4Sale`). All app state, inventory items, and asset details must live strictly inside this single table.

---

## Your Job

- Do what's asked.
- Take notes and update details under **The Project** section in `agent.md` / `AGENTS.md` after modifying the application.
