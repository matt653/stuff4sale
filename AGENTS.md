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
- **Reselling Bundles**: Link multiple individual inventory items into cohesive bundle groups (`bundleId`, `bundleTitle`, `bundledItemIds`).
- **Comprehensive Financial Tracking**: Track purchase price, sourcing date, purchase location, listed price, listed platform (eBay, Facebook Marketplace, Mercari, Poshmark, OfferUp, etc.), sale price, sale date, and net profit / ROI.

#### 2. AI Research & Sourcing Intake Inspector (`@google/genai` & `server.ts`)
- **Multimodal Gemini AI Research**: Powered by Google Gemini (`@google/genai`) via Express server endpoint (`/api/research`). Accepts text queries and multi-image uploads with automatic model fallback (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`).
- **Internal Sell Velocity & Turnaround Estimator Tool**: Interactive slider tool evaluating sell speed probability from `⚡ 100% - Sell Immediately` down to `🛑 1% - Takes Forever to Sell`, acting purely as an internal pricing strategy guide without mutating Step 2.
- **Individualized Rarity AI Research**: Gemini conducts granular item analysis evaluating maker marks, model numbers, antique patina, salvage value, and collector oddities rather than treating items as generic commodities.
- **Issues & Flaws Found Generator**: Identifies 1–3 specific item flaws or condition issues (rust, wear, missing parts, untested condition) and incorporates them transparently into the generated ad copy alongside upsell features.
- **AI Intake Inspector**: Modal interface (`AIIntakeInspector.tsx`) for rapid photo-first sourcing triage before adding items into active inventory.

#### 3. Personal Facebook Marketplace Assistant (`FBHubModal.tsx`)
- **Streamlined 1-Page Assistant**: Designed specifically for Personal Facebook Accounts without requiring complex Meta developer API tokens, App Secrets, or Webhooks.
- **1-to-1 Inventory Description Pulling**: Directly pulls the exact description, stock number, title, category, and list price saved in your inventory database—eliminating redundant AI calls or duplicate ad listings.
- **1-Click Photo Downloader**: One-click download of item photos to drag and drop into Facebook Marketplace.
- **1-Click Launch**: Copies exact inventory description to clipboard and launches Facebook Marketplace creation form in a new tab.

#### 4. Analytics & Financial Reporting (`StatsGrid.tsx`)
- **Real-Time Metrics**: Displays active inventory count, total inventory value, total sales, net profit, average ROI percentage, and active listing count.
- **Filter, Sort & View Controls**: Filter by category and status, search by keyword/SKU/notes, multi-criteria sorting (newest, oldest, profit, ROI, cost), and toggle between Grid and List views.
- **CSV Data Export**: One-click data export functionality for accounting and tax reporting.

#### 5. Technical Architecture & Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Lucide React icons, Motion (Framer Motion).
- **Backend Server**: Node.js, Express (`server.ts`), `netlify/functions/api.ts`, `@google/genai` SDK v2, `dotenv`.
- **Database & Sync**: Firebase Firestore real-time database (`firebase.ts`), with offline fallback capabilities.

---

### Agent Rule for Modifications
> **Mandatory Rule for All Agents**: Each agent MUST update **The Project** section above after each modification made to the app to keep functionality, endpoints, components, and schema changes completely up to date.

---

## Your Job

- Do what's asked.
- Take notes and update details under **The Project** section in `agent.md` / `AGENTS.md` after modifying the application.
