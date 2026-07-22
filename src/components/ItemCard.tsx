import React, { useState } from "react";
import { 
  Edit, Trash2, Tag, TrendingUp, Clock, MapPin, 
  ExternalLink, Sparkles, CheckCircle, Archive, DollarSign, Calendar, ShoppingBag, Share2
} from "lucide-react";
import { InventoryItem, ItemStatus } from "../types";

interface ItemCardProps {
  key?: string;
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, updates: Partial<InventoryItem>) => void;
  onFBPost?: (item: InventoryItem) => void;
}

export default function ItemCard({ item, onEdit, onDelete, onStatusChange, onFBPost }: ItemCardProps) {
  const [showStatusModal, setShowStatusModal] = useState<"list" | "sell" | null>(null);
  
  // Status form states
  const [listedPrice, setListedPrice] = useState(item.listedPrice || item.purchasePrice * 2 || 0);
  const [listedPlatform, setListedPlatform] = useState(item.listedPlatform || "eBay");
  const [salePrice, setSalePrice] = useState(item.salePrice || item.listedPrice || item.purchasePrice * 2 || 0);
  const [salePlatform, setSalePlatform] = useState(item.salePlatform || item.listedPlatform || "eBay");
  const [saleDate, setSaleDate] = useState(item.saleDate || new Date().toISOString().split("T")[0]);

  const formatCurrency = (val: number | null) => {
    if (val === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const isFBListed = item.status === "listed" || (item.listedPlatform && item.listedPlatform.toLowerCase().includes("facebook"));

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case "inventory":
        return (
          <span className="text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-md text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md" id={`badge-inventory-${item.id}`}>
            <Clock size={10} /> NOT POSTED YET
          </span>
        );
      case "listed":
        return (
          <span className="text-[10px] font-extrabold bg-blue-600 text-white border border-blue-400/40 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md" id={`badge-listed-${item.id}`}>
            <Share2 size={10} /> {item.listedPlatform ? `POSTED ON ${item.listedPlatform.toUpperCase()}` : "POSTED ON FB MARKETPLACE"}
          </span>
        );
      case "sold":
        return (
          <span className="text-[10px] font-extrabold bg-emerald-600 text-white border border-emerald-400/40 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md" id={`badge-sold-${item.id}`}>
            <CheckCircle size={10} /> SOLD
          </span>
        );
      case "archived":
        return (
          <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1" id={`badge-archived-${item.id}`}>
            <Archive size={10} /> Archived
          </span>
        );
    }
  };

  const handleListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStatusChange(item.id, {
      status: "listed",
      listedPrice: Number(listedPrice),
      listedPlatform,
      updatedAt: new Date().toISOString(),
    });
    setShowStatusModal(null);
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStatusChange(item.id, {
      status: "sold",
      salePrice: Number(salePrice),
      salePlatform,
      saleDate,
      updatedAt: new Date().toISOString(),
    });
    setShowStatusModal(null);
  };

  // Profit calculations
  const isProfit = item.status === "sold" && item.salePrice !== null;
  const netProfit = isProfit ? (item.salePrice || 0) - (item.purchasePrice || 0) : 0;
  const roi = isProfit && item.purchasePrice > 0 ? (netProfit / item.purchasePrice) * 100 : 0;

  // Multi-photo state support
  const itemPhotos = item.photos && item.photos.length > 0 ? item.photos : item.photoUrl ? [item.photoUrl] : [];
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemPhotos.length === 0) return;
    setCurrentPhotoIdx((prev) => (prev + 1) % itemPhotos.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemPhotos.length === 0) return;
    setCurrentPhotoIdx((prev) => (prev - 1 + itemPhotos.length) % itemPhotos.length);
  };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group" id={`item-card-${item.id}`}>
      
      {/* Top Media & Badge Block */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center group/media">
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        ) : itemPhotos.length > 0 ? (
          <>
            <img
              src={itemPhotos[currentPhotoIdx] || itemPhotos[0]}
              alt={item.name}
              referrerPolicy="no-referrer"
              className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
            />
            {/* Multi-Photo Carousel Controls */}
            {itemPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity shadow-md z-10"
                  title="Previous Photo"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity shadow-md z-10"
                  title="Next Photo"
                >
                  ›
                </button>
                {/* Photo counter indicator badge */}
                <div className="absolute bottom-7 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow-sm">
                  <span>📷 {currentPhotoIdx + 1}/{itemPhotos.length}</span>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 p-4">
            <ShoppingBag size={38} className="stroke-[1.25] text-slate-300 mb-1" />
            <span className="text-[11px] font-semibold bg-slate-200/50 px-2 py-0.5 rounded text-slate-500">
              {item.category || "No Category"}
            </span>
          </div>
        )}

        {/* Absolute Status Badge overlay */}
        <div className="absolute top-2.5 left-2.5">
          {getStatusBadge(item.status)}
        </div>

        {/* Demand Indicator (if researched) */}
        {item.research && (
          <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-md">
            <Sparkles size={11} className="text-amber-400 fill-amber-400" />
            <span>Demand: {item.research.demandScore}/10</span>
          </div>
        )}

        {/* FB Buyer Inquiry Notification Badge */}
        {item.buyerInquiriesCount && item.buyerInquiriesCount > 0 ? (
          <div className="absolute top-10 left-2.5 bg-blue-600 text-white rounded-full px-2.5 py-0.5 text-[10px] font-extrabold flex items-center gap-1 shadow-lg border border-blue-400/50 animate-bounce">
            💬 {item.buyerInquiriesCount} FB {item.buyerInquiriesCount === 1 ? "Inquiry" : "Inquiries"}
          </div>
        ) : null}

        {/* Quick listing banner */}
        {item.status === "listed" && item.listedPlatform && (
          <div className="absolute bottom-0 inset-x-0 bg-indigo-600/90 backdrop-blur-sm text-white py-1 px-3 text-[10px] font-bold tracking-wide flex items-center justify-between">
            <span>LISTED ON {item.listedPlatform.toUpperCase()}</span>
            <span>{formatCurrency(item.listedPrice)}</span>
          </div>
        )}

        {/* Quick sold banner */}
        {item.status === "sold" && item.salePlatform && (
          <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 backdrop-blur-sm text-white py-1 px-3 text-[10px] font-bold tracking-wide flex items-center justify-between">
            <span>SOLD ON {item.salePlatform.toUpperCase()}</span>
            <span>{formatCurrency(item.salePrice)}</span>
          </div>
        )}
      </div>

      {/* Main Metadata Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Stock # */}
          <div className="flex items-center justify-between gap-1.5 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">{item.category || "General Item"}</span>
              {item.purchaseLocation && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-slate-500 truncate">
                    <MapPin size={10} className="text-slate-400 shrink-0" />
                    {item.purchaseLocation}
                  </span>
                </>
              )}
            </div>

            {item.stockNumber && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[9px] font-extrabold shrink-0">
                #{item.stockNumber}
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-sm text-slate-800 leading-tight tracking-tight mb-2 line-clamp-2">
            {item.name}
          </h3>

          {/* Core financial numbers */}
          <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Bought for</span>
              <span className="font-bold text-slate-700">{formatCurrency(item.purchasePrice)}</span>
            </div>
            {item.status === "sold" ? (
              <div>
                <span className="text-[10px] text-emerald-600 block font-semibold uppercase tracking-wider">Sold for</span>
                <span className="font-extrabold text-emerald-700">{formatCurrency(item.salePrice)}</span>
              </div>
            ) : item.status === "listed" ? (
              <div>
                <span className="text-[10px] text-indigo-600 block font-semibold uppercase tracking-wider">Listed for</span>
                <span className="font-bold text-indigo-700">{formatCurrency(item.listedPrice)}</span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-amber-600 block font-semibold uppercase tracking-wider">Est. Value</span>
                <span className="font-semibold text-amber-700 italic">
                  {item.research ? `$${item.research.estimatedValueMin}-${item.research.estimatedValueMax}` : "Unresearched"}
                </span>
              </div>
            )}
          </div>

          {/* Condition or item note summary */}
          {item.notes && (
            <p className="text-xs text-slate-500 line-clamp-2 italic mb-3 leading-snug">
              "{item.notes}"
            </p>
          )}

          {/* Sold metrics summary (Profit & ROI) */}
          {item.status === "sold" && (
            <div className="flex items-center gap-2 mb-3 bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5 text-xs text-emerald-800 font-medium">
              <TrendingUp size={14} className="text-emerald-600 shrink-0" />
              <div>
                <span className="block font-bold">Net Profit: {formatCurrency(netProfit)}</span>
                <span className="text-[10px] text-emerald-700 font-semibold">{roi.toFixed(1)}% ROI return on capital</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-1.5" id="item-card-toolbar">
          
          {/* Status Quick Actions */}
          <div className="flex items-center gap-1">
            {item.status === "inventory" && (
              <button
                type="button"
                onClick={() => onStatusChange(item.id, { 
                  status: "listed", 
                  listedPlatform: "Facebook Marketplace",
                  listedPrice: item.listedPrice || item.purchasePrice * 2 || 35,
                  updatedAt: new Date().toISOString()
                })}
                className="text-[11px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                id={`btn-quick-list-fb-${item.id}`}
              >
                <Share2 size={11} /> Mark Posted on FB
              </button>
            )}

            {item.status === "listed" && (
              <>
                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, { 
                    buyerInquiriesCount: (item.buyerInquiriesCount || 0) + 1,
                    lastInquiryAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })}
                  className="text-[10px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1.5 rounded-lg transition flex items-center gap-0.5 cursor-pointer"
                  id={`btn-log-lead-${item.id}`}
                  title="Log incoming Facebook Messenger inquiry for this item"
                >
                  💬 +1 FB Lead
                </button>

                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, { 
                    status: "inventory", 
                    listedPlatform: null,
                    updatedAt: new Date().toISOString()
                  })}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded-lg transition"
                  id={`btn-quick-unlist-${item.id}`}
                  title="Mark as Not Posted Yet"
                >
                  Unlist
                </button>
              </>
            )}

            {(item.status === "inventory" || item.status === "listed") && (
              <button
                type="button"
                onClick={() => setShowStatusModal("sell")}
                className="text-[11px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                id={`btn-quick-sell-${item.id}`}
              >
                Mark Sold ($)
              </button>
            )}

            {item.status === "sold" && (
              <button
                type="button"
                onClick={() => onStatusChange(item.id, { status: "inventory", salePrice: null, saleDate: null, salePlatform: null })}
                className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg transition"
                id={`btn-quick-re-stock-${item.id}`}
              >
                Put Back in Stock
              </button>
            )}
          </div>

          {/* Edit/Delete/FB Tools */}
          <div className="flex items-center gap-1.5">
            {onFBPost && (
              <button
                type="button"
                onClick={() => onFBPost(item)}
                className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                title="Create FB Marketplace Post"
                id={`btn-fb-post-${item.id}`}
              >
                <Share2 size={12} className="text-blue-600" /> FB Ad
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 bg-slate-50 hover:bg-slate-150 text-slate-500 rounded-lg border border-slate-200/50 transition hover:text-slate-800"
              title="Edit Item details"
              id={`btn-edit-item-${item.id}`}
            >
              <Edit size={13} />
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to delete this inventory item? This cannot be undone.")) {
                  onDelete(item.id);
                }
              }}
              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 rounded-lg border border-slate-200/50 transition hover:text-rose-600"
              title="Delete item"
              id={`btn-delete-item-${item.id}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Inline Popovers for Status Progression */}
      {showStatusModal === "list" && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 z-10 flex flex-col justify-between animate-fade-in">
          <form onSubmit={handleListSubmit} className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">List Item to Market</h4>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">List Price ($)</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={listedPrice}
                    onChange={(e) => setListedPrice(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-6 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Listing Platform</label>
                <select
                  value={listedPlatform}
                  onChange={(e) => setListedPlatform(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="eBay">eBay</option>
                  <option value="Facebook Marketplace">Facebook Marketplace</option>
                  <option value="Mercari">Mercari</option>
                  <option value="Poshmark">Poshmark</option>
                  <option value="Craigslist">Craigslist</option>
                  <option value="OfferUp">OfferUp</option>
                  <option value="Other">Other Platform</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(null)}
                className="flex-1 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
              >
                Confirm List
              </button>
            </div>
          </form>
        </div>
      )}

      {showStatusModal === "sell" && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 z-10 flex flex-col justify-between animate-fade-in">
          <form onSubmit={handleSellSubmit} className="space-y-2 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Record Sales details</h4>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Final Sale Price ($)</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-2.5 top-1.5 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-6 pr-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Selling Platform</label>
                <select
                  value={salePlatform}
                  onChange={(e) => setSalePlatform(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="eBay">eBay</option>
                  <option value="Facebook Marketplace">Facebook Marketplace</option>
                  <option value="Mercari">Mercari</option>
                  <option value="Poshmark">Poshmark</option>
                  <option value="Craigslist">Craigslist</option>
                  <option value="OfferUp">OfferUp</option>
                  <option value="Other">Other Platform</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Sale Date</label>
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(null)}
                className="flex-1 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm"
              >
                Confirm Sale
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
