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
  photoUrl: string | null; // base64 string
  videoUrl?: string | null; // base64 video string or link
  research: AIResearchResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalItems: number;
  activeInventoryValue: number;
  totalSales: number;
  totalProfit: number;
  averageRoi: number;
  listedCount: number;
}
