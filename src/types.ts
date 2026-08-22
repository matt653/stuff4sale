export type ItemStatus = 'inventory' | 'listed' | 'sold' | 'archived';

export interface PricingTierDetail {
  tierName: string; // e.g. "Low End (Sell Immediately)", "1/4 Tier (Fast Flip)", "Mid End (Fair Market)", "3/4 Tier (Patient Sale)", "High End (Top Dollar Collector)"
  percentageLabel: string; // "100%", "75%", "50%", "25%", "1%"
  price: number;
  whereToList: string; // Recommended marketplaces/platforms
  howToList: string; // Instructions on prep, photos, shipping vs local pickup to earn this tier
}

export interface LocalCompsData {
  estimatedLocalMin: number;
  estimatedLocalMax: number;
  localDemandScore: number;
  sellThroughVelocity: string;
  localPlatforms?: string[];
  searchQueries?: string[];
  localTips?: string[];
  comparableListings?: Array<{
    title: string;
    price: number;
    platform: string;
    notes?: string;
  }>;
}

export interface EbayCompsData {
  estimatedEbayMin: number;
  estimatedEbayMax: number;
  ebayDemandScore: number;
  shippingFeasibility: string;
  ebayTips?: string[];
}

export interface AIResearchResult {
  estimatedValueMin: number;
  estimatedValueMax: number;
  suggestedTitle: string;
  suggestedDescription: string;
  demandScore: number; // 1-10 (Unified demand score combining FB Local & eBay)
  targetPlatforms: string[];
  sellingTips: string[];
  category: string;
  keywords: string[];
  worthSelling?: 'YES' | 'MARGINAL' | 'NO';
  triageReason?: string;
  sellOnNationalLevel?: boolean; // True IF item must be sold nationally (e.g. rare collectible with 0 local demand)
  recommendedSellLevel?: 'LOCAL_FB' | 'NATIONAL_EBAY';
  nationalSaleReason?: string; // Big bold reason explaining national shipping requirement
  cleaningInstructions?: string[];
  prepChecklist?: string[];
  issuesFound?: string[];
  pricingStrategy?: 'quick' | 'retail';
  stockNumber?: string;
  groupName?: string;
  pricingTiers?: PricingTierDetail[];
  localComps?: LocalCompsData;
  ebayComps?: EbayCompsData;
  listingUrl?: string | null;
  provider?: 'grok' | 'gemini';
}

export interface DualAIResearchResult {
  grok: AIResearchResult | null;
  gemini: AIResearchResult | null;
  activeProvider?: 'grok' | 'gemini' | 'dual';
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  report?: AIResearchResult;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: ItemStatus;
  purchasePrice: number;
  purchaseDate: string; // YYYY-MM-DD
  purchaseLocation: string;
  salePrice: number | null;
  saleDate: string | null; // YYYY-MM-DD
  salePlatform: string | null;
  listedPrice: number | null;
  listedPlatform: string | null;
  notes: string;
  photoUrl: string | null; // base64 string (primary/cover photo)
  photos?: string[]; // array of base64 photo strings for multiple picture support
  stockNumber?: string; // Internal SKU / Stock # (e.g. BIN-A4, #SKU-102)
  videoUrl?: string | null; // base64 video string or link
  research: AIResearchResult | null;
  createdAt: string;
  updatedAt: string;
  buyerInquiriesCount?: number; // Tracks FB Messenger buyer inquiries
  lastInquiryAt?: string;
  listingUrl?: string | null; // Live Ad URL (e.g. FB Marketplace / eBay live listing link)
  messageHistory?: FBNotification[]; // Array of buyer messages & inquiries linked to this item
  bundleId?: string; // ID of the bundle group (e.g. BUNDLE-101)
  bundleTitle?: string; // Name of the bundle (e.g. "Vintage Stereo Setup Bundle")
  bundledItemIds?: string[]; // Array of item IDs linked in this bundle
}

export interface DashboardStats {
  totalItems: number;
  activeInventoryValue: number;
  totalSales: number;
  totalProfit: number;
  averageRoi: number;
  listedCount: number;
}

export type FBNotificationType = 'message' | 'comment' | 'lead' | 'system';

export interface FBNotification {
  id: string;
  type: FBNotificationType;
  senderName: string;
  senderAvatar?: string;
  messageText: string;
  itemTitle?: string;
  itemId?: string;
  timestamp: string;
  read: boolean;
  platform: 'Facebook Messenger' | 'FB Marketplace Comment' | 'FB Page';
  metaEventId?: string;
}

