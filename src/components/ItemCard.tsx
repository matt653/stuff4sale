import React, { useState } from "react";
import { 
  Edit, Trash2, Tag, TrendingUp, Clock, MapPin, 
  ExternalLink, Sparkles, CheckCircle, Archive, DollarSign, Calendar, ShoppingBag, Share2, Crop, Search, X, RefreshCw, AlertCircle
} from "lucide-react";
import { InventoryItem, ItemStatus } from "../types";
import PhotoEditorModal from "./PhotoEditorModal";

interface ItemCardProps {
  key?: string;
  item: InventoryItem;
  allItems?: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, updates: Partial<InventoryItem>) => void;
  onFBPost?: (item: InventoryItem) => void;
  onOpenItemInquiries?: (item: InventoryItem) => void;
}

export default function ItemCard({ item, allItems = [], onEdit, onDelete, onStatusChange, onFBPost, onOpenItemInquiries }: ItemCardProps) {
  const [showStatusModal, setShowStatusModal] = useState<"list" | "sell" | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showCompsModal, setShowCompsModal] = useState(false);
  const [localComps, setLocalComps] = useState<any | null>(item.research?.localComps || null);
  const [isCompsLoading, setIsCompsLoading] = useState(false);
  const [compsError, setCompsError] = useState<string | null>(null);

  const handleFetchLocalComps = async () => {
    setIsCompsLoading(true);
    setCompsError(null);
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "";
      const res = await fetch("/api/comps", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
        },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          notes: item.notes,
          image: item.photoUrl || (item.photos && item.photos[0]) || null,
          images: item.photos || (item.photoUrl ? [item.photoUrl] : [])
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || "Failed to fetch local comps analysis.");
      }
      const data = await res.json();
      setLocalComps(data);

      // Auto-save localComps to item.research in Supabase!
      if (onStatusChange && item) {
        const existingResearch = item.research || {
          estimatedValueMin: data.estimatedLocalMin || 0,
          estimatedValueMax: data.estimatedLocalMax || 0,
          suggestedTitle: item.name,
          suggestedDescription: item.notes || "",
          demandScore: data.localDemandScore || 5,
          targetPlatforms: data.localPlatforms || ["Facebook Marketplace"],
          sellingTips: data.localTips || [],
          category: item.category || "General",
          keywords: []
        };
        onStatusChange(item.id, {
          research: {
            ...existingResearch,
            localComps: data
          }
        });
      }
    } catch (err: any) {
      console.error(err);
      setCompsError(err.message || "Could not fetch local comps.");
    } finally {
      setIsCompsLoading(false);
    }
  };
  
  const handleSaveEditedPhotoCard = (editedUrl: string) => {
    const updatedPhotos = item.photos && item.photos.length > 0 ? [...item.photos] : [editedUrl];
    if (updatedPhotos.length > 0 && currentPhotoIdx < updatedPhotos.length) {
      updatedPhotos[currentPhotoIdx] = editedUrl;
    } else {
      updatedPhotos.push(editedUrl);
    }
    const newCover = updatedPhotos[0] || editedUrl;

    onStatusChange(item.id, {
      photoUrl: newCover,
      photos: updatedPhotos,
      updatedAt: new Date().toISOString()
    });
    setShowPhotoEditor(false);
  };
  
  // Status form states
  const [listedPrice, setListedPrice] = useState(item.listedPrice || item.purchasePrice || 0);
  const [listedPlatform, setListedPlatform] = useState(item.listedPlatform || "Facebook Marketplace");
  const [listingUrl, setListingUrl] = useState(item.listingUrl || "");
  const [salePrice, setSalePrice] = useState(item.salePrice || item.listedPrice || item.purchasePrice || 0);
  const [salePlatform, setSalePlatform] = useState(item.salePlatform || item.listedPlatform || "Facebook Marketplace");
  const [saleDate, setSaleDate] = useState(item.saleDate || new Date().toISOString().split("T")[0]);

  // Find other items in the same bundle
  const otherBundleItems = allItems.filter(
    (other) =>
      other.id !== item.id &&
      ((item.bundleId && other.bundleId === item.bundleId) ||
        (item.bundledItemIds && item.bundledItemIds.includes(other.id)) ||
        (other.bundledItemIds && other.bundledItemIds.includes(item.id)))
  );

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
            <Clock size={10} /> NOT POSTED YET {item.listedPlatform ? `(${item.listedPlatform.toUpperCase()})` : ""}
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
      listingUrl: listingUrl.trim() || null,
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
      
      {/* Top Media & Badge Block (Clickable to Edit) */}
      <div 
        onClick={() => onEdit(item)}
        className="relative aspect-[4/3] w-full bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center group/media cursor-pointer" 
        title="Click photo to edit item details"
        id={`item-card-media-${item.id}`}
      >
        {/* Click to edit overlay hint on hover */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/media:opacity-100 transition-opacity z-1 flex items-center justify-center pointer-events-none">
          <span className="bg-slate-900/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-md flex items-center gap-1">
            <Edit size={11} /> Click photo to edit
          </span>
        </div>
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
          <button
            type="button"
            onClick={() => onOpenItemInquiries && onOpenItemInquiries(item)}
            className="absolute top-10 left-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-2.5 py-0.5 text-[10px] font-extrabold flex items-center gap-1 shadow-lg border border-blue-400/50 animate-bounce cursor-pointer"
            title="Click to view & sync buyer messages for this item"
          >
            💬 {item.buyerInquiriesCount} FB {item.buyerInquiriesCount === 1 ? "Inquiry" : "Inquiries"}
          </button>
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

          {/* Bundled Item Indicator & Linked Sibling Items List */}
          {((otherBundleItems && otherBundleItems.length > 0) || (item.bundleId && item.bundleId.trim() !== "")) && (
            <div className="mb-3 bg-purple-50/80 border border-purple-200/80 rounded-xl p-2.5 space-y-1.5" id={`bundle-info-${item.id}`}>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                    📦 BUNDLED ITEM
                  </span>
                  {item.bundleTitle && (
                    <span className="text-[10px] text-purple-900 font-extrabold truncate max-w-[120px]">
                      {item.bundleTitle}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, {
                    bundleId: undefined,
                    bundleTitle: undefined,
                    bundledItemIds: undefined,
                    updatedAt: new Date().toISOString()
                  })}
                  className="text-[10px] font-extrabold text-purple-700 hover:text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-0.5 border border-purple-200 shrink-0"
                  title="Click to remove this item from bundle"
                  id={`btn-unlink-bundle-${item.id}`}
                >
                  ✕ Unlink
                </button>
              </div>

              {otherBundleItems.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-purple-100">
                  <span className="text-[9px] font-extrabold text-purple-800 uppercase tracking-wider block">
                    Bundled With ({otherBundleItems.length} items):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {otherBundleItems.map((bItem) => (
                      <span
                        key={bItem.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          const el = document.getElementById(`item-card-${bItem.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="bg-white hover:bg-purple-100 border border-purple-200 text-purple-950 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
                        title="Click to locate this bundled item"
                      >
                        {bItem.photoUrl && (
                          <img src={bItem.photoUrl} alt="" className="w-3.5 h-3.5 rounded object-cover" />
                        )}
                        <span className="truncate max-w-[110px]">{bItem.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core financial numbers */}
          <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Selling for</span>
              <span className="font-bold text-slate-700">{formatCurrency(item.listedPrice || item.purchasePrice)}</span>
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
                  listedPlatform: item.listedPlatform || "Facebook Marketplace",
                  listedPrice: item.listedPrice || item.purchasePrice || 0,
                  updatedAt: new Date().toISOString()
                })}
                className="text-[11px] font-extrabold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                id={`btn-quick-list-fb-${item.id}`}
              >
                <Share2 size={11} /> Mark Posted on {item.listedPlatform || "FB"}
              </button>
            )}

            {item.status === "listed" && (
              <>
            {/* Persistent Buyer Messages & Inquiry History Button */}
            <button
              type="button"
              onClick={() => onOpenItemInquiries && onOpenItemInquiries(item)}
              className="text-[10px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1.5 rounded-lg transition flex items-center gap-0.5 cursor-pointer"
              id={`btn-item-inquiries-${item.id}`}
              title="View, sync, & log buyer messages for this item"
            >
              💬 Messages ({item.buyerInquiriesCount || 0})
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
              onClick={(e) => {
                e.stopPropagation();
                setShowCompsModal(true);
              }}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition font-black text-[11px] flex items-center gap-1 cursor-pointer"
              title="Search Local Market Comps (FB Marketplace, Groups, OfferUp, Craigslist)"
              id={`btn-find-comps-${item.id}`}
            >
              <Search size={12} className="text-emerald-600" /> Comps
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPhotoEditor(true);
              }}
              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Crop, Add Text Overlays & Blur Photo"
              id={`btn-photo-editor-${item.id}`}
            >
              <Crop size={12} className="text-indigo-600" /> Photo Studio
            </button>

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
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) {
                  onDelete(item.id);
                }
              }}
              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200/50 transition cursor-pointer"
              title="Delete item"
              id={`btn-delete-item-${item.id}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Step 3: Local Comps Finder Modal */}
        {showCompsModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id={`modal-comps-${item.id}`}>
            <div className="bg-slate-900 border border-indigo-500/30 text-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-auto p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-black">
                    🔍
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Step 3: Find Local Comps</span>
                      <span className="bg-emerald-500/30 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Local Only
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200/80 mt-0.5 truncate max-w-xs sm:max-w-sm">
                      {item.name} (Stock #{item.stockNumber || item.id})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCompsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Action: Run AI Local Comps Analysis */}
              <button
                type="button"
                onClick={handleFetchLocalComps}
                disabled={isCompsLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                id={`btn-run-comps-modal-${item.id}`}
              >
                {isCompsLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-300" />}
                <span>{isCompsLoading ? "Analyzing Local Comps..." : "⚡ Run AI Local Market Comps Analysis"}</span>
              </button>

              {compsError && (
                <div className="bg-amber-500/20 border border-amber-400/40 p-3 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <span>{compsError}</span>
                </div>
              )}

              {/* Local Comps AI Output (Saved or Live) */}
              {(() => {
                const displayComps = localComps || item.research?.localComps;
                if (!displayComps) return null;
                return (
                  <div className="bg-white/10 border border-white/15 rounded-2xl p-4 space-y-3 text-xs animate-fade-in">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-extrabold text-indigo-200">Saved Local Market Cash Range</span>
                      <span className="font-black text-emerald-400 text-base">
                        ${displayComps.estimatedLocalMin} – ${displayComps.estimatedLocalMax}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-indigo-300 font-bold block">Local Buyer Demand:</span>
                        <span className="font-black text-white">{displayComps.localDemandScore}/10</span>
                      </div>
                      <div>
                        <span className="text-indigo-300 font-bold block">Local Sell-Through Speed:</span>
                        <span className="font-black text-emerald-300">{displayComps.sellThroughVelocity}</span>
                      </div>
                    </div>

                    {displayComps.localTips && (
                      <div className="space-y-1 pt-1 border-t border-white/10 text-[11px]">
                        <span className="font-bold text-amber-300 uppercase tracking-wider block">💡 Local Resale Tips:</span>
                        {displayComps.localTips.map((tip: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-1 text-indigo-100">
                            <span className="text-amber-400 shrink-0">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 1-Click Direct Local Search Launchers */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-black text-indigo-200 uppercase tracking-wider block">
                  ⚡ 1-Click Direct Local Search Launchers:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <a
                    href={`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl flex items-center justify-between gap-2 transition shadow-sm cursor-pointer"
                  >
                    <span className="truncate">🔵 FB Marketplace Local Search</span>
                    <ExternalLink size={14} className="shrink-0" />
                  </a>

                  <a
                    href={`https://www.facebook.com/search/groups/?q=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl flex items-center justify-between gap-2 transition shadow-sm cursor-pointer"
                  >
                    <span className="truncate">👥 FB Buy/Sell Groups Search</span>
                    <ExternalLink size={14} className="shrink-0" />
                  </a>

                  <a
                    href={`https://offerup.com/search?q=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl flex items-center justify-between gap-2 transition shadow-sm cursor-pointer"
                  >
                    <span className="truncate">🏷️ OfferUp Local Search</span>
                    <ExternalLink size={14} className="shrink-0" />
                  </a>

                  <a
                    href={`https://craigslist.org/search/sss?query=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl flex items-center justify-between gap-2 transition shadow-sm cursor-pointer"
                  >
                    <span className="truncate">📌 Craigslist Local Search</span>
                    <ExternalLink size={14} className="shrink-0" />
                  </a>

                  <a
                    href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(item.name)}&LH_PrefLoc=99`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl flex items-center justify-between gap-2 transition shadow-sm cursor-pointer sm:col-span-2"
                  >
                    <span className="truncate">📦 eBay Local Pickup Comps Search</span>
                    <ExternalLink size={14} className="shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Studio Editor Modal */}
        {showPhotoEditor && (itemPhotos[currentPhotoIdx] || item.photoUrl) && (
          <PhotoEditorModal
            photoUrl={itemPhotos[currentPhotoIdx] || item.photoUrl!}
            onSave={handleSaveEditedPhotoCard}
            onClose={() => setShowPhotoEditor(false)}
          />
        )}
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
                  <option value="Facebook Marketplace">Facebook Marketplace</option>
                  <option value="eBay">eBay</option>
                  <option value="Mercari">Mercari</option>
                  <option value="Poshmark">Poshmark</option>
                  <option value="Craigslist">Craigslist</option>
                  <option value="OfferUp">OfferUp</option>
                  <option value="Other">Other Platform</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-blue-600 uppercase block mb-1">Live Ad URL (Required to List)</label>
                <input
                  type="url"
                  required
                  placeholder="Paste live ad link (https://facebook.com/marketplace/item/...)"
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  className="w-full text-xs border border-blue-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-mono"
                />
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
