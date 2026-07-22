export type ItemStatus = 'inventory' | 'listed' | 'sold' | 'archived';

export interface AIResearchResult {
  estimatedValueMin: number;
  estimatedValueMax: number;
  suggestedTitle: string;
  suggestedDescription: string;
  demandScore: number; // 1-10
  targetPlatforms: string[];
  sellingTips: string[];
  category: string;
  keywords: string[];
  worthSelling?: 'YES' | 'MARGINAL' | 'NO';
  triageReason?: string;
  cleaningInstructions?: string[];
  prepChecklist?: string[];
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
  videoUrl?: string | null; // base64 video string or link
  research: AIResearchResult | null;
  createdAt: string;
  updatedAt: string;
  buyerInquiriesCount?: number; // Tracks FB Messenger buyer inquiries
  lastInquiryAt?: string;
}

export interface DashboardStats {
  totalItems: number;
  activeInventoryValue: number;
  totalSales: number;
  totalProfit: number;
  averageRoi: number;
  listedCount: number;
}
