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

#### 4. Analytics & Financial Reporting (`StatsGrid.tsx`)
- **Real-Time Metrics**: Displays active inventory count, total inventory value, total sales, net profit, average ROI percentage, and active listing count.
- **Filter, Sort & View Controls**: Filter by category and status, search by keyword/SKU/notes, multi-criteria sorting (newest, oldest, profit, ROI, cost), and toggle between Grid and List views.
- **CSV Data Export**: One-click data export functionality for accounting and tax reporting.

#### 5. Technical Architecture & Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Lucide React icons, Motion (Framer Motion).
- **Backend Server**: Node.js, Express (`server.ts`), `tsx`, `@google/genai` SDK v2, `dotenv`.
- **Database & Sync**: Firebase Firestore real-time database (`firebase.ts`), with offline fallback capabilities.

---

### Agent Rule for Modifications
> **Mandatory Rule for All Agents**: Each agent MUST update **The Project** section above after each modification made to the app to keep functionality, endpoints, components, and schema changes completely up to date.

---

## Your Job

- Do what's asked.
- Take notes and update details under **The Project** section in `agent.md` / `AGENTS.md` after modifying the application.
