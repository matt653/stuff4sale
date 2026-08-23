import { DollarSign, Percent, TrendingUp, Package, Tag, ShoppingBag } from "lucide-react";
import { InventoryItem } from "../types";

interface StatsGridProps {
  items: InventoryItem[];
}

export default function StatsGrid({ items }: StatsGridProps) {
  // Financial Calculations
  const totalItemsCount = items.length;
  
  // Total Invested (Capital): Purchase price of all items
  const totalCapitalInvested = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

  // Sold Items calculations
  const soldItems = items.filter((item) => item.status === "sold");
  const totalSalesRevenue = soldItems.reduce((sum, item) => sum + (item.salePrice || 0), 0);
  const costOfSoldItems = soldItems.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
  const realizedNetProfit = totalSalesRevenue - costOfSoldItems;


  // Commission Calculations
  const commissionMap: Record<string, number> = {};
  soldItems.forEach(item => {
    const profit = (item.salePrice || 0) - (item.purchasePrice || 0);
    if (profit > 0 && item.research?.commission?.splits) {
      item.research.commission.splits.forEach(split => {
        if (split.name) {
          const amt = profit * ((split.percentage || 0) / 100);
          commissionMap[split.name] = (commissionMap[split.name] || 0) + amt;
        }
      });
    }
  });
  
  let commissionLeaderName = "None";
  let commissionLeaderAmount = 0;
  for (const [name, amount] of Object.entries(commissionMap)) {
    if (amount > commissionLeaderAmount) {
      commissionLeaderAmount = amount;
      commissionLeaderName = name;
    }
  }

  // Active items calculations
  const activeItems = items.filter((item) => item.status === "inventory" || item.status === "listed");
  const activeInventoryCostValue = activeItems.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

  // Gemini AI's estimated market value for active stock
  const geminiEstimatedStockValue = activeItems.reduce((sum, item) => {
    if (item.research && item.research.estimatedValueMax) {
      const midpoint = Math.round((item.research.estimatedValueMin + item.research.estimatedValueMax) / 2);
      return sum + midpoint;
    }
    if (item.listedPrice && item.listedPrice > 0) return sum + item.listedPrice;
    return sum + (item.purchasePrice || 0);
  }, 0);

  // Total actual asking / listed price you are selling for
  const totalSellingForValue = activeItems.reduce((sum, item) => {
    if (item.listedPrice && item.listedPrice > 0) return sum + item.listedPrice;
    if (item.research && item.research.estimatedValueMax) {
      const midpoint = Math.round((item.research.estimatedValueMin + item.research.estimatedValueMax) / 2);
      return sum + midpoint;
    }
    return sum + (item.purchasePrice || 0);
  }, 0);

  // Price variance between your asking price vs Gemini's market estimate
  const priceVariance = totalSellingForValue - geminiEstimatedStockValue;

  // Return on Investment: (Realized Net Profit / Cost of Sold Items) * 100
  const roi = costOfSoldItems > 0 ? (realizedNetProfit / costOfSoldItems) * 100 : 0;

  const listedCount = items.filter((item) => item.status === "listed").length;

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-6" id="stats-grid-dashboard">
      {/* Realized Profit Card */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-4 text-white shadow-md flex flex-col justify-between" id="stat-net-profit">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">Realized Profit</span>
          <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-300">
            <TrendingUp size={16} />
          </div>
        </div>
        <div>
          <span className="text-xl lg:text-2xl font-bold tracking-tight text-emerald-100">
            {formatCurrency(realizedNetProfit)}
          </span>
          <p className="text-[10px] text-emerald-300/70 mt-1">From {soldItems.length} sales</p>
        </div>
      </div>

      {/* ROI Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between" id="stat-roi">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Net ROI</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Percent size={16} />
          </div>
        </div>
        <div>
          <span className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            {roi.toFixed(1)}%
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Avg return on sold</p>
        </div>
      </div>

      {/* Total Sales Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between" id="stat-total-sales">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Total Sales</span>
          <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
            <ShoppingBag size={16} />
          </div>
        </div>
        <div>
          <span className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            {formatCurrency(totalSalesRevenue)}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Total turnover</p>
        </div>
      </div>

      {/* Stock Est. Value (Gemini AI Market Valuation) Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between" id="stat-stock-est-value">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase">Stock Est. Value</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Tag size={16} />
          </div>
        </div>
        <div>
          <span className="text-xl lg:text-2xl font-extrabold text-indigo-950 tracking-tight">
            {formatCurrency(geminiEstimatedStockValue)}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Gemini AI Valuation</p>
        </div>
      </div>

      {/* Selling For (Your Active Asking Price & Variance) Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between" id="stat-total-selling">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold text-emerald-900 tracking-wide uppercase">Selling For</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign size={16} />
          </div>
        </div>
        <div>
          <span className="text-xl lg:text-2xl font-extrabold text-emerald-950 tracking-tight">
            {formatCurrency(totalSellingForValue)}
          </span>
          <p className={`text-[10px] font-bold mt-1 ${priceVariance > 0 ? "text-emerald-600" : priceVariance < 0 ? "text-amber-600" : "text-slate-400"}`}>
            {priceVariance > 0 
              ? `+${formatCurrency(priceVariance)} vs Gemini` 
              : priceVariance < 0 
              ? `-${formatCurrency(Math.abs(priceVariance))} vs Gemini` 
              : "100% matched to Gemini"}
          </p>
        </div>
      </div>

      {/* Capital Invested Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between" id="stat-total-invested">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Capital Invested</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <Package size={16} />
          </div>
        </div>
        <div>
          <span className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            {formatCurrency(activeInventoryCostValue)}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Total purchase cost</p>
        </div>
      </div>
    </div>
  );
}
