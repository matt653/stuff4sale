import React, { useState, useEffect } from "react";
import { 
  Share2, Copy, Check, ExternalLink, Sparkles, RefreshCw, 
  ShoppingBag, DollarSign, Tag, X, Download
} from "lucide-react";
import { InventoryItem } from "../types";

interface FBHubModalProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  onStatusChange: (id: string, updates: Partial<InventoryItem>) => void;
  onClose: () => void;
}

interface FBAdData {
  fbTitle: string;
  fbPrice: number;
  fbCategory: string;
  fbCondition: string;
  fbDescription: string;
  fbTags: string;
  fbTips: string[];
}

export default function FBHubModal({
  items,
  selectedItem,
  onStatusChange,
  onClose,
}: FBHubModalProps) {
  // Active selected item
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(selectedItem || items[0] || null);

  // Bundle mode
  const [isBundleMode, setIsBundleMode] = useState(false);
  const [selectedBundleItemIds, setSelectedBundleItemIds] = useState<string[]>([]);

  // Customization
  const [tone, setTone] = useState<"casual" | "urgent" | "detailed" | "bundle">("casual");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");

  // Loading & State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adData, setAdData] = useState<FBAdData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isListedSuccess, setIsListedSuccess] = useState(false);

  // When active item changes, generate default template and set price
  useEffect(() => {
    if (selectedItem) {
      setActiveItem(selectedItem);
    } else if (items.length > 0 && !activeItem) {
      setActiveItem(items[0]);
    }
  }, [selectedItem, items]);

  useEffect(() => {
    if (activeItem) {
      const defaultPrice = activeItem.listedPrice || 
        (activeItem.research ? activeItem.research.estimatedValueMax : activeItem.purchasePrice * 2 || 35);
      setCustomPrice(defaultPrice.toString());
      generateDefaultAd(activeItem, defaultPrice);
    }
  }, [activeItem]);

  const generateDefaultAd = (item: InventoryItem, priceVal: number) => {
    const research = item.research;
    const title = research?.suggestedTitle || item.name;
    const category = research?.category || item.category || "Home Goods";
    const desc = research?.suggestedDescription || 
      `Up for sale: ${item.name}.\n\nCondition/Details:\n${item.notes || "In good pre-owned condition. See photos for exact details."}\n\nPrice: $${priceVal}\nLocation: Local pickup available. Cash or Venmo accepted.\n\nMessage me if interested!`;
    const keywords = research?.keywords ? research.keywords.join(", ") : "yard sale, vintage, home decor, local pickup";

    setAdData({
      fbTitle: title.length > 90 ? title.substring(0, 90) : title,
      fbPrice: priceVal,
      fbCategory: category,
      fbCondition: "Good",
      fbDescription: desc,
      fbTags: keywords,
      fbTips: [
        "Include 3-5 clear photos taken in bright natural daylight.",
        "List your city/neighborhood so local buyers know you are nearby.",
        "Mention Cash and Venmo accepted for quick local pickup."
      ]
    });
  };

  // Bundle calculations
  const selectedBundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
  const totalBundleIndividualSum = selectedBundleItems.reduce(
    (sum, i) => sum + (i.listedPrice || i.research?.estimatedValueMax || i.purchasePrice * 2 || 30),
    0
  );
  const recommendedBundleDiscountPrice = Math.round(totalBundleIndividualSum * 0.85);
  const currentBundlePrice = customPrice ? Number(customPrice) : recommendedBundleDiscountPrice;
  const currentBundleSavings = Math.max(0, totalBundleIndividualSum - currentBundlePrice);

  useEffect(() => {
    if (isBundleMode && selectedBundleItemIds.length > 0) {
      setCustomPrice(recommendedBundleDiscountPrice.toString());
    }
  }, [isBundleMode, selectedBundleItemIds.length]);

  // AI Optimizer
  const handleOptimizeWithAI = async () => {
    if (!activeItem && !isBundleMode) return;
    setLoading(true);
    setError(null);

    try {
      let payload: any = {};

      if (isBundleMode) {
        const bundleItemsPayload = selectedBundleItems.map(i => ({
          name: i.name,
          price: i.listedPrice || i.research?.estimatedValueMax || i.purchasePrice * 2 || 30,
          notes: i.notes || ""
        }));

        payload = {
          name: `Bundle Deal (${selectedBundleItems.length} Items): ${selectedBundleItems.map(i => i.name).join(" + ")}`,
          category: selectedBundleItems[0]?.category || "General",
          notes: `Bundle of ${selectedBundleItems.length} items. Total value $${totalBundleIndividualSum}. Package deal price $${currentBundlePrice}. Save $${currentBundleSavings}! ${customNote || ""}`,
          price: currentBundlePrice,
          totalIndividualPrice: totalBundleIndividualSum,
          discountSavings: currentBundleSavings,
          tone: "bundle",
          isBundle: true,
          bundleItems: bundleItemsPayload
        };
      } else if (activeItem) {
        payload = {
          name: activeItem.name,
          category: activeItem.category,
          notes: `${activeItem.notes || ""}. ${customNote || ""}`,
          price: customPrice ? Number(customPrice) : (activeItem.listedPrice || 35),
          tone,
          isBundle: false
        };
      }

      const res = await fetch("/api/fb-optimize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "",
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate AI ad copy.");
      }

      const data: FBAdData = await res.json();
      setAdData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not connect to AI optimizer. Used instant template instead.");
      if (activeItem) generateDefaultAd(activeItem, Number(customPrice) || 35);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllListing = () => {
    if (!adData) return;
    const fullText = `TITLE:\n${adData.fbTitle}\n\nPRICE:\n$${adData.fbPrice}\n\nCATEGORY:\n${adData.fbCategory}\n\nCONDITION:\n${adData.fbCondition}\n\nDESCRIPTION:\n${adData.fbDescription}\n\nTAGS:\n${adData.fbTags}`;
    copyToClipboard(fullText, "all");
  };

  const handleDownloadPhotos = () => {
    const photosToDownload = activeItem?.photos && activeItem.photos.length > 0
      ? activeItem.photos
      : activeItem?.photoUrl ? [activeItem.photoUrl] : [];

    if (photosToDownload.length === 0) {
      alert("No photos available for this item.");
      return;
    }

    photosToDownload.forEach((photo, idx) => {
      const link = document.createElement("a");
      link.href = photo;
      link.download = `${(activeItem?.name || "item").replace(/[^a-z0-9]/gi, '_').toLowerCase()}_photo_${idx + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleMarkAsListed = () => {
    if (isBundleMode) {
      if (selectedBundleItemIds.length === 0) return;
      selectedBundleItemIds.forEach(id => {
        const item = items.find(i => i.id === id);
        onStatusChange(id, {
          status: "listed",
          listedPlatform: "Facebook Marketplace",
          listedPrice: item?.listedPrice || (adData ? Math.round(adData.fbPrice / selectedBundleItemIds.length) : 35),
          updatedAt: new Date().toISOString()
        });
      });
    } else if (activeItem) {
      onStatusChange(activeItem.id, {
        status: "listed",
        listedPlatform: "Facebook Marketplace",
        listedPrice: adData ? adData.fbPrice : Number(customPrice) || activeItem.listedPrice || 35,
        updatedAt: new Date().toISOString()
      });
    }
    setIsListedSuccess(true);
    setTimeout(() => setIsListedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="fb-hub-modal">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Share2 size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Facebook Marketplace & Group Posting Assistant
              </h3>
              <p className="text-xs text-blue-100/80">
                Generate AI ad copy, download photos, and post to Marketplace from your personal account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
            id="btn-close-fb-hub"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grow">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Item Selector & Ad Customizer */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Select Item to Post
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsBundleMode(!isBundleMode)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                      isBundleMode ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {isBundleMode ? "✓ Bundle Mode Active" : "+ Create Bundle Deal"}
                  </button>
                </div>

                {!isBundleMode ? (
                  <select
                    value={activeItem?.id || ""}
                    onChange={(e) => {
                      const item = items.find((i) => i.id === e.target.value);
                      if (item) setActiveItem(item);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (${item.listedPrice || item.purchasePrice}) [{item.status.toUpperCase()}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-600 font-medium">
                      Select multiple items to combine into a discounted bundle:
                    </p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 bg-white border border-slate-200 p-2 rounded-xl">
                      {items.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-xs text-slate-800 p-1 hover:bg-slate-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBundleItemIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBundleItemIds((prev) => [...prev, item.id]);
                              } else {
                                setSelectedBundleItemIds((prev) => prev.filter((id) => id !== item.id));
                              }
                            }}
                            className="rounded text-blue-600"
                          />
                          <span className="truncate">{item.name}</span>
                          <span className="ml-auto font-bold text-slate-500">${item.listedPrice || item.purchasePrice}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Item Preview */}
                {activeItem && !isBundleMode && (
                  <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                    {activeItem.photoUrl ? (
                      <img src={activeItem.photoUrl} alt={activeItem.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs text-slate-900 truncate">{activeItem.name}</h5>
                      <p className="text-[10px] text-slate-500">{activeItem.category}</p>
                      <p className="text-xs font-black text-indigo-600 mt-0.5">${customPrice || activeItem.listedPrice || activeItem.purchasePrice}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tone & Pricing Controls */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Copywriter Tone & Pricing
                </h5>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Listing Tone
                    </label>
                    <select
                      value={tone}
                      onChange={(e: any) => setTone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    >
                      <option value="casual">Casual & Friendly</option>
                      <option value="urgent">Urgent Deal / Move Out</option>
                      <option value="detailed">Professional & Detailed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Target List Price ($)
                    </label>
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleOptimizeWithAI}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {loading ? "Generating FB Ad..." : "✨ Optimize Ad Copy with Gemini AI"}
                </button>
              </div>
            </div>

            {/* Right Column: Generated Ad Result Preview & 1-Click Launch */}
            <div className="lg:col-span-7 space-y-4">
              {adData ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="font-extrabold text-sm text-slate-900">Facebook Ad Listing Copy</h4>
                    </div>

                    <button
                      type="button"
                      onClick={copyAllListing}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-blue-200"
                    >
                      {copiedField === "all" ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === "all" ? "Copied All!" : "Copy Full Listing"}
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Title</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(adData.fbTitle, "title")}
                          className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1"
                        >
                          {copiedField === "title" ? <Check size={12} /> : <Copy size={12} />} Copy
                        </button>
                      </div>
                      <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800">
                        {adData.fbTitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Price</span>
                        <span className="font-black text-emerald-600 text-sm">${adData.fbPrice}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Category</span>
                        <span className="font-bold text-slate-800 truncate block">{adData.fbCategory}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Condition</span>
                        <span className="font-bold text-slate-800">{adData.fbCondition}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Description</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(adData.fbDescription, "desc")}
                          className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1"
                        >
                          {copiedField === "desc" ? <Check size={12} /> : <Copy size={12} />} Copy
                        </button>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                        {adData.fbDescription}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Tags</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(adData.fbTags, "tags")}
                          className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1"
                        >
                          {copiedField === "tags" ? <Check size={12} /> : <Copy size={12} />} Copy
                        </button>
                      </div>
                      <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium">
                        {adData.fbTags}
                      </p>
                    </div>
                  </div>

                  {isListedSuccess && (
                    <div className="bg-emerald-600 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Check size={16} /> Marked item as Listed in Inventory!
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPhotos}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
                      title="Download item photo files to drag & drop into Facebook Marketplace"
                    >
                      <Download size={14} />
                      Download Item Photos
                    </button>

                    <a
                      href="https://www.facebook.com/marketplace/create/item"
                      target="_blank"
                      rel="noreferrer"
                      onClick={handleMarkAsListed}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} />
                      1-Click Copy & Launch FB Marketplace
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center space-y-2">
                  <Share2 size={32} className="text-slate-300 mx-auto" />
                  <h5 className="font-extrabold text-sm text-slate-700">Ready to generate Facebook Ad</h5>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Select an item on the left and click "Optimize Ad Copy with Gemini AI" to create listing copy for your personal account!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Personal Facebook Account Ready
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Close Posting Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
