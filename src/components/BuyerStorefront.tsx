import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, Filter, SlidersHorizontal, Tag, DollarSign, 
  Layers, ShoppingBag, Eye, Share2, Check, Sparkles, 
  ArrowRight, ShieldCheck, MapPin, X, ExternalLink, 
  Lock, RefreshCw, MessageSquare, Phone, Smartphone
} from "lucide-react";
import { InventoryItem } from "../types";
import BuyerItemModal from "./BuyerItemModal";

interface BuyerStorefrontProps {
  items: InventoryItem[];
  loading?: boolean;
  onOpenAdminView?: () => void;
  initialSelectedItemId?: string | null;
}

const BUYER_CATEGORIES = [
  "All",
  "Tools & Hardware",
  "Vintage & Antiques",
  "Clothing & Apparel",
  "Electronics & Gadgets",
  "Video Games & Consoles",
  "Toys & Collectibles",
  "Home, Kitchen & Decor",
  "Sports & Outdoors",
  "Jewelry & Accessories",
  "Books, Comics & Media",
  "Other / Miscellaneous"
];

export default function BuyerStorefront({
  items,
  loading = false,
  onOpenAdminView,
  initialSelectedItemId
}: BuyerStorefrontProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFilterType, setSelectedFilterType] = useState<"all" | "available" | "bundles">("available");
  const [sortBy, setSortBy] = useState<"stock-desc" | "price-asc" | "price-desc" | "newest">("stock-desc");
  const [selectedModalItem, setSelectedModalItem] = useState<InventoryItem | null>(null);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);

  // Filter items for forward-facing view (show inventory + listed items; hide archived; mark sold if present)
  const forwardFacingItems = useMemo(() => {
    return items.filter((item) => {
      // Hide archived from buyer view
      if (item.status === "archived") return false;

      // Filter by type
      if (selectedFilterType === "available" && item.status === "sold") return false;
      if (selectedFilterType === "bundles" && !item.bundleId && !item.bundleTitle && (!item.bundledItemIds || item.bundledItemIds.length === 0)) return false;

      // Filter by Category
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;

      // Filter by Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.name || "").toLowerCase().includes(q);
        const matchesStock = (item.stockNumber || item.id || "").toLowerCase().includes(q);
        const matchesCat = (item.category || "").toLowerCase().includes(q);
        const matchesNotes = (item.notes || "").toLowerCase().includes(q);
        const matchesBundle = (item.bundleTitle || "").toLowerCase().includes(q);
        if (!matchesName && !matchesStock && !matchesCat && !matchesNotes && !matchesBundle) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "stock-desc") {
        const numA = parseInt(a.stockNumber || a.id || "0", 10) || 0;
        const numB = parseInt(b.stockNumber || b.id || "0", 10) || 0;
        return numB - numA;
      }
      if (sortBy === "price-asc") {
        const pA = a.listedPrice || a.purchasePrice || 0;
        const pB = b.listedPrice || b.purchasePrice || 0;
        return pA - pB;
      }
      if (sortBy === "price-desc") {
        const pA = a.listedPrice || a.purchasePrice || 0;
        const pB = b.listedPrice || b.purchasePrice || 0;
        return pB - pA;
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [items, selectedCategory, selectedFilterType, searchQuery, sortBy]);

  // Handle deep-linked item selection on load or prop change
  useEffect(() => {
    if (initialSelectedItemId && items.length > 0) {
      const matched = items.find(
        (i) => String(i.stockNumber) === String(initialSelectedItemId) || String(i.id) === String(initialSelectedItemId)
      );
      if (matched) {
        setSelectedModalItem(matched);
      }
    }
  }, [initialSelectedItemId, items]);

  const handleCopyStorefrontLink = () => {
    const url = `${window.location.origin}/catalog`;
    navigator.clipboard.writeText(url);
    setCopiedStoreLink(true);
    setTimeout(() => setCopiedStoreLink(false), 2500);
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedModalItem(item);
    // Update URL query string without reloading page for instant shareability
    try {
      const stockParam = item.stockNumber || item.id;
      const newUrl = `${window.location.pathname}?item=${encodeURIComponent(stockParam)}`;
      window.history.pushState({ itemId: stockParam }, "", newUrl);
    } catch (e) {}
  };

  const handleCloseModal = () => {
    setSelectedModalItem(null);
    // Remove ?item= param from URL
    try {
      window.history.pushState({}, "", window.location.pathname);
    } catch (e) {}
  };

  // Get seller phone from localStorage or env
  const sellerPhone = localStorage.getItem("stuff4sale_seller_phone") || (import.meta as any).env?.VITE_SELLER_PHONE || "(309) 337-1049";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col" id="buyer-storefront-container">
      {/* Top Forward-Facing Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                Stuff4Sale<span className="text-indigo-600">.deals</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Direct Call/Text Header Pill */}
            {sellerPhone && (
              <a
                href={`sms:${sellerPhone.replace(/\D/g, "")}`}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-100 transition"
                title="Text seller directly"
              >
                <Smartphone size={14} className="text-emerald-600" />
                <span>Text Seller: {sellerPhone}</span>
              </a>
            )}

            {/* Share Storefront Link Button */}
            <button
              type="button"
              onClick={handleCopyStorefrontLink}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              title="Copy link to share this catalog with buyers"
              id="btn-copy-storefront-link"
            >
              {copiedStoreLink ? <Check size={14} className="text-emerald-300" /> : <Share2 size={14} />}
              <span>{copiedStoreLink ? "Catalog Link Copied!" : "Share Catalog"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-6 px-4 sm:px-6 lg:px-8 border-b border-indigo-900 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Local Inventory & Items For Sale
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl mt-1">
              Click any item below to view full picture galleries and submit an offer.
            </p>
          </div>

          {/* Prominent Seller Phone Call / Text Highlight Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 shadow-lg">
            <div>
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">
                Have questions or want to buy fast?
              </span>
              <span className="text-base font-black text-white font-mono">
                {sellerPhone ? `Call or Text: ${sellerPhone}` : "Direct Seller Line Active"}
              </span>
            </div>
            {sellerPhone ? (
              <div className="flex items-center gap-2">
                <a
                  href={`sms:${sellerPhone.replace(/\D/g, "")}`}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <MessageSquare size={14} />
                  <span>Text</span>
                </a>
                <a
                  href={`tel:${sellerPhone.replace(/\D/g, "")}`}
                  className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              </div>
            ) : (
              <span className="text-xs text-indigo-200 font-semibold italic">
                (Submit offer below to contact seller)
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Search, Category Filter & Sorting Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
          {/* Top Row: Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-slate-400 shrink-0" size={16} />
              <input
                type="text"
                placeholder="Search items by keyword, brand, stock #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                id="buyer-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Tabs & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter Buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedFilterType("available")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFilterType === "available"
                      ? "bg-white text-indigo-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilterType("bundles")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedFilterType === "bundles"
                      ? "bg-white text-purple-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers size={12} className="text-purple-600" />
                  Bundles
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilterType("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedFilterType === "all"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({items.length})
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <SlidersHorizontal size={13} className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs text-slate-700 bg-transparent focus:outline-none font-bold cursor-pointer py-1"
                  id="buyer-sort-select"
                >
                  <option value="stock-desc">Stock # (High to Low)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Recently Listed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (Horizontal Scrolling) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Category:
            </span>
            {BUYER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full font-bold transition shrink-0 border cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>
            Showing <strong className="text-slate-900 font-bold">{forwardFacingItems.length}</strong> items for sale
          </span>
          <span className="text-[11px] text-slate-400">
            Click any picture for remaining photos & offer form
          </span>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <RefreshCw className="animate-spin text-indigo-600 mb-3" size={32} />
            <p className="text-sm font-bold text-slate-600">Loading catalog items...</p>
          </div>
        ) : forwardFacingItems.length === 0 ? (
          /* Empty Search State */
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">No matching items found</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Try clearing your search query or selecting "All Categories" to see the full collection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedFilterType("available");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* RESPONSIVE BUYER PRODUCT CARD GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" id="buyer-product-grid">
            {forwardFacingItems.map((item) => {
              const price = item.listedPrice || item.purchasePrice || 0;
              const photoCount = Array.isArray(item.photos) && item.photos.length > 0
                ? item.photos.length
                : item.photoUrl ? 1 : 0;
              const coverImg = (item.photos && item.photos[0]) || item.photoUrl || null;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col group cursor-pointer transform hover:-translate-y-1"
                  id={`buyer-card-item-${item.stockNumber || item.id}`}
                >
                  {/* Card Cover Photo Viewer */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag size={36} />
                      </div>
                    )}

                    {/* Stock # Badge (High Visibility Overlay) */}
                    <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white text-xs font-black px-2.5 py-1 rounded-xl border border-white/20 shadow-md">
                      #{item.stockNumber || item.id}
                    </div>

                    {/* Photo Count Pill */}
                    {photoCount > 1 && (
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/15">
                        📷 {photoCount} Photos
                      </div>
                    )}

                    {/* Status Badge */}
                    {item.status === "sold" ? (
                      <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                        SOLD
                      </div>
                    ) : (item.bundleId || item.bundleTitle) ? (
                      <div className="absolute top-3 right-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                        📦 BUNDLE DEAL
                      </div>
                    ) : null}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1">
                        <span>{item.category}</span>
                        <span>Stock #{item.stockNumber || item.id}</span>
                      </div>

                      <h3 
                        className="font-extrabold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors"
                        title={item.name}
                      >
                        {item.name}
                      </h3>

                      {item.notes && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.notes.replace(/[📌💡⚠️📏🚀]/g, "").trim()}
                        </p>
                      )}
                    </div>

                    {/* Price & CTA Button Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Asking:</span>
                        <span className="text-lg font-black text-emerald-600">
                          {price > 0 ? `$${price}` : "Make Offer"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>View Details</span>
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <ShoppingBag size={16} className="text-indigo-600" />
          <span>Stuff4Sale Curated Inventory Showcase</span>
        </div>
        <p className="text-slate-400 max-w-lg mx-auto">
          All items are inspected and described factually. Local cash pickup or safe porch meetup available. Contact the seller by clicking any item to make an offer.
        </p>
      </footer>

      {/* In-Page Interactive Popup Modal */}
      {selectedModalItem && (
        <BuyerItemModal
          item={selectedModalItem}
          allItems={items}
          onClose={handleCloseModal}
          onSelectAnotherItem={(newItem) => setSelectedModalItem(newItem)}
        />
      )}
    </div>
  );
}
