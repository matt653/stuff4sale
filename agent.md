# AGENTS.md / agent.md

## The Project

### Overview
Stuff4Sale is a full-stack AI-powered inventory management, item valuation, and reselling platform designed for flips, side-hustles, and e-commerce reselling. It combines Google Gemini AI multimodal vision analysis, real-time Firebase database synchronization, Facebook Marketplace/Messenger lead automation, and financial profit analytics.

### Key Capabilities & Architecture

#### 1. Inventory & Asset Management
- **Full Lifecycle Tracking**: Categorize and manage items across four distinct status states: `inventory`, `listed`, `sold`, and `archived`.
- **Rich Media & Multimodal Intake**: Supports primary cover photos, multi-image galleries (base64 photo array), and video URLs/uploads via a custom built-in `CameraCapture` component.
- **Stock Numbering & Internal SKUs**: Internal stock tracking system (e.g., `BIN-A4`, `#SKU-102`).
- **Reselling Bundles**: Link multiple individual inventory items into cohesive bundle groups (`bundleId`, `bundleTitle`, `bundledItemIds`).
- **Comprehensive Financial Tracking**: Track purchase price, sourcing date, purchase location, listed price, listed platform (eBay, Facebook Marketplace, Mercari, Poshmark, OfferUp, etc.), sale price, sale date, and net profit / ROI.

#### 2. AI Research & Sourcing Intake Inspector (`@google/genai` & `server.ts`)
- **Multimodal Gemini AI Research**: Powered by Google Gemini 2.4/3 (`@google/genai`) via Express server endpoint (`/api/research`). Accepts text queries and multi-image uploads.
- **Automated Reselling Valuation**: Estimates conservative to optimistic reselling list price ranges (`estimatedValueMin` and `estimatedValueMax` in USD).
- **Sourcing Triage Verdict**: Evaluates items with a clear sourcing verdict (`YES`, `MARGINAL`, `NO`) and provides an explicit `triageReason`.
- **Demand Score**: Computes sell-through rate demand score on a scale of 1–10.
- **SEO Title & Description Generator**: Generates click-worthy, SEO-optimized listing titles (max 80 chars) and structured listing descriptions ready for copy-paste.
- **Restoration & Prep Checklist**: Returns 2–3 step item cleaning/restoration instructions, prep checklists, targeted platforms, and hyper-practical reselling tips.
- **AI Intake Inspector**: Modal interface (`AIIntakeInspector.tsx`) for rapid photo-first sourcing triage before adding items into active inventory.

#### 3. Real-Time Facebook Marketplace & Messenger Integration (`services/fbRealtimeService.ts`)
- **Real-Time Webhooks & SSE**: Express backend receives Facebook webhooks and streams live updates via Server-Sent Events (SSE).
- **Lead Sync & Buyer Inquiry Tracking**: Monitors buyer inquiries (`buyerInquiriesCount`, `lastInquiryAt`) and Marketplace comments.
- **Notification Center & Toast System**: Displays real-time alerts with direct response actions (`FBNotificationCenter.tsx`).
- **Cross-Posting Assistant**: Interactive tool (`FBMarketplacePostingTool.tsx`) for generating formatted Facebook Marketplace copy, tags, and category mappings.

#### 5. Forward-Facing Public Buyer Catalog & In-Page Popup Showcase (`BuyerStorefront.tsx` & `BuyerItemModal.tsx`)
- **Forward-Facing Storefront URL Route (`/catalog`, `/shop`, `?view=catalog`)**: Clean, customer-facing public inventory catalog that sellers can directly share with prospective buyers via link (`https://stuff4sale.netlify.app/catalog`). Filters out private admin data (purchase price, profit, ROI, private sourcing notes) and presents all available inventory in a modern, mobile-friendly showcase.
- **Search, Category Filter & Sorting Toolbar**: Real-time search by keyword/brand/stock #, horizontal category pill scrolling, type filters ("Available", "📦 Bundles", "All Items"), and sorting options (Stock # high-to-low, price low-to-high, price high-to-low, newest).
- **Interactive In-Page Item Popup Modal (`BuyerItemModal.tsx`)**: Clicking any product card triggers an in-page popup modal displaying:
  - **Full Media Gallery & Remaining Photos**: High-resolution active photo viewer with photo counter pill (`1 / 8 Photos`), left/right arrow navigation, interactive thumbnail strip of all remaining photos, and video player support.
  - **Item Details & 5-Section Description**: Cleanly parsed 5-section breakdown (📌 What it is, 💡 Modern uses, ⚠️ Condition & observed facts, 📏 Specs/measurements, 🚀 Great deal / seller note) with Stock # badge and asking price.
  - **Interactive "Make an Offer / Message Seller" Tool**: 1-click quick preset offer chips (Full Asking, -10%, -20%), custom dollar amount input, buyer contact fields, and direct offer submission to Supabase (`buyer_inquiries_count` + real-time notification alert to seller).
  - **Direct Instant Contact & Fallback Actions**: 1-click links to message on live Facebook listing, text seller via SMS (`sms:?body=...`), copy formatted item summary to clipboard, and 1-click share direct item link (`/catalog?item=27`).
- **Deep-Linking Support (`?item=X`)**: Visiting or sharing `https://stuff4sale.netlify.app/catalog?item=27` automatically opens that specific item's popup modal upon page load.
- **Seamless Seller Admin Integration**: 1-click **"🌐 Buyer Catalog"** button with a **"📋 Copy Public Link"** action in the top navigation bar and sidebar, plus a **"🔗 Buyer Link"** button on every inventory item card for instant copy-pasting to buyers.

#### 6. Analytics & Financial Reporting (`StatsGrid.tsx`)
- **Real-Time Metrics**: Displays active inventory count, total inventory value, total sales, net profit, average ROI percentage, and active listing count.
- **Filter, Sort & View Controls**: Filter by category and status, search by keyword/SKU/notes, multi-criteria sorting (defaults to **Stock # Highest to Lowest** e.g. #27 down to #1, plus oldest, profit, ROI, cost), and toggle between Grid and List views.
- **CSV Data Export**: One-click data export functionality for accounting and tax reporting.

#### 7. Technical Architecture & Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Lucide React icons, Motion (Framer Motion).
- **Backend Server**: Node.js, Express (`server.ts`), `netlify/functions/api.ts`, `@google/genai` SDK v2, `dotenv`.
- **Database & Sync**: Supabase singleton client (`supabase.ts`) on single table `Stuff4Sale` with real-time WebSocket subscriptions and local proxy caching.

---

### Agent Rule for Modifications
> **Mandatory Rule for All Agents**: Each agent MUST update **The Project** section above after each modification made to the app to keep functionality, endpoints, components, and schema changes completely up to date.

---

## Your Job

- Do what's asked.
- Take notes and update details under **The Project** section in `agent.md` / `AGENTS.md` after modifying the application.
