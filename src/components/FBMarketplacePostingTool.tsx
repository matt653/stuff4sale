import React, { useState, useEffect } from "react";
import { 
  Share2, Copy, Check, ExternalLink, Sparkles, RefreshCw, 
  ShoppingBag, DollarSign, Tag, Layers, AlertCircle, Info, ChevronRight, X,
  Download, Image as ImageIcon, Video
} from "lucide-react";
import { InventoryItem } from "../types";

interface FBMarketplacePostingToolProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  onStatusChange: (id: string, updates: Partial<InventoryItem>) => void;
  onClose?: () => void;
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

export default function FBMarketplacePostingTool({
  items,
  selectedItem,
  onStatusChange,
  onClose
}: FBMarketplacePostingToolProps) {
  // Active selected item for single listing
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(selectedItem || items[0] || null);
  
  // Multi-item bundle mode
  const [isBundleMode, setIsBundleMode] = useState(false);
  const [selectedBundleItemIds, setSelectedBundleItemIds] = useState<string[]>([]);
  
  // Tone & Customization
  const [tone, setTone] = useState<"casual" | "urgent" | "detailed" | "bundle">("casual");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  
  // Loading & State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adData, setAdData] = useState<FBAdData | null>(null);
  
  // Copy state feedback trackers
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isListedSuccess, setIsListedSuccess] = useState(false);

  // When active item changes, generate initial fallback ad template or set custom price
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

  // Generate a fallback instantaneous template if AI is off/loading
  const generateDefaultAd = (item: InventoryItem, priceVal: number) => {
    const research = item.research;
    const title = research?.suggestedTitle || item.name;
    const category = research?.category || item.category || "Home & Garden";
    const desc = research?.suggestedDescription || 
      `Up for sale: ${item.name}.\n\nCondition/Details:\n${item.notes || "In good vintage/pre-owned condition. See photos for exact details."}\n\nPrice: $${priceVal}\nLocation: Local pickup available. Cash or Venmo accepted.\n\nMessage me if interested or if you have any questions!`;
    const keywords = research?.keywords ? research.keywords.join(", ") : "yard art, vintage, garden decor, farm salvage";

    setAdData({
      fbTitle: title.length > 90 ? title.substring(0, 90) : title,
      fbPrice: priceVal,
      fbCategory: category.includes("Yard") || category.includes("Garden") ? "Garden & Outdoor" : "Antiques & Collectibles",
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

  // Auto-calculate bundle prices when bundle selection changes
  const selectedBundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
  const totalBundleIndividualSum = selectedBundleItems.reduce(
    (sum, i) => sum + (i.listedPrice || i.research?.estimatedValueMax || i.purchasePrice * 2 || 30),
    0
  );
  const recommendedBundleDiscountPrice = Math.round(totalBundleIndividualSum * 0.85); // 15% bundle discount
  const currentBundlePrice = customPrice ? Number(customPrice) : recommendedBundleDiscountPrice;
  const currentBundleSavings = Math.max(0, totalBundleIndividualSum - currentBundlePrice);

  useEffect(() => {
    if (isBundleMode && selectedBundleItemIds.length > 0) {
      setCustomPrice(recommendedBundleDiscountPrice.toString());
    }
  }, [isBundleMode, selectedBundleItemIds.length]);

  // Trigger Gemini AI FB Ad Optimizer Endpoint
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
          category: selectedBundleItems[0]?.category || "Home & Garden",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate AI Facebook Marketplace ad.");
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

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Copy All Text Formatted for FB Marketplace
  const copyAllListing = () => {
    if (!adData) return;
    const fullText = `TITLE:\n${adData.fbTitle}\n\nPRICE:\n$${adData.fbPrice}\n\nCATEGORY:\n${adData.fbCategory}\n\nCONDITION:\n${adData.fbCondition}\n\nDESCRIPTION:\n${adData.fbDescription}\n\nTAGS:\n${adData.fbTags}`;
    copyToClipboard(fullText, "all");
  };

  // Mark as Listed in database
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
      setIsListedSuccess(true);
      setTimeout(() => setIsListedSuccess(false), 3000);
    } else if (activeItem) {
      onStatusChange(activeItem.id, {
        status: "listed",
        listedPlatform: "Facebook Marketplace",
        listedPrice: adData ? adData.fbPrice : activeItem.listedPrice || 35,
        updatedAt: new Date().toISOString()
      });
      setIsListedSuccess(true);
      setTimeout(() => setIsListedSuccess(false), 3000);
    }
  };

  // Open Facebook Marketplace in new tab
  const handleLaunchFBMarketplace = () => {
    window.open("https://www.facebook.com/marketplace/create/item", "_blank");
  };

  // Helper to trigger direct browser download of image/video
  const downloadMedia = (dataUrl: string, filename: string) => {
    try {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to trigger download:", err);
      window.open(dataUrl, "_blank");
    }
  };

  const handleDownloadActiveItemPhoto = () => {
    if (!activeItem || !activeItem.photoUrl) return;
    const safeName = activeItem.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    downloadMedia(activeItem.photoUrl, `${safeName}_photo.jpg`);
  };

  const handleDownloadActiveItemVideo = () => {
    if (!activeItem || !activeItem.videoUrl) return;
    const safeName = activeItem.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    downloadMedia(activeItem.videoUrl, `${safeName}_video.mp4`);
  };

  const handleDownloadAllBundleMedia = () => {
    const bundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
    let count = 0;
    bundleItems.forEach((item) => {
      const safeName = item.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      if (item.photoUrl) {
        setTimeout(() => {
          downloadMedia(item.photoUrl!, `${safeName}_photo_${count + 1}.jpg`);
        }, count * 350);
        count++;
      }
      if (item.videoUrl) {
        setTimeout(() => {
          downloadMedia(item.videoUrl!, `${safeName}_video_${count + 1}.mp4`);
        }, count * 350);
        count++;
      }
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-w-4xl w-full mx-auto my-4" id="fb-marketplace-posting-tool">
      
      {/* Tool Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 sm:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
            <Share2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold tracking-tight">FB Marketplace Listing Generator</h2>
              <span className="bg-blue-400/30 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-300/30">
                1-Click Poster
              </span>
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Generate high-conversion Facebook Marketplace post copy, copy-paste in seconds, & mark as listed.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
            id="btn-close-fb-tool"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main Container Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
        
        {/* Left Control Column: Item selection & AI Customizer */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Mode Switcher: Single Item vs Bundle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setIsBundleMode(false)}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                !isBundleMode ? "bg-white text-indigo-700 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              <ShoppingBag size={14} /> Single Item
            </button>
            <button
              type="button"
              onClick={() => setIsBundleMode(true)}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                isBundleMode ? "bg-white text-indigo-700 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              <Layers size={14} /> Multi-Item Bundle
            </button>
          </div>

          {!isBundleMode ? (
            /* Single Item Selector */
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Select Item to Post
              </label>
              <select
                value={activeItem?.id || ""}
                onChange={(e) => {
                  const found = items.find(i => i.id === e.target.value);
                  if (found) setActiveItem(found);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                id="select-item-for-fb"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (${item.listedPrice || item.research?.estimatedValueMax || item.purchasePrice * 2 || 35}) - [{item.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Bundle Selection Checklist */
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Check Items to Group into FB Bundle
              </label>
              <div className="max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl p-2 space-y-1.5">
                {items.map((item) => {
                  const isChecked = selectedBundleItemIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-medium transition ${
                        isChecked ? "bg-indigo-50 text-indigo-900 border border-indigo-200" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBundleItemIds([...selectedBundleItemIds, item.id]);
                            } else {
                              setSelectedBundleItemIds(selectedBundleItemIds.filter(id => id !== item.id));
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="font-bold shrink-0 text-slate-500">
                        ${item.listedPrice || item.research?.estimatedValueMax || item.purchasePrice * 2 || 30}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Bundle Pricing Summary Badge */}
              {selectedBundleItemIds.length > 0 && (
                <div className="mt-2.5 bg-indigo-50/70 border border-indigo-200 p-3 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-indigo-950">
                    <span>Bundle Discount Summary:</span>
                    <span className="text-[10px] uppercase font-extrabold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                      {selectedBundleItems.length} Items Included
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-bold">
                    <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-xs">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Individual Total</span>
                      <span className="text-xs text-slate-700 font-extrabold line-through">${totalBundleIndividualSum}</span>
                    </div>
                    <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-xs">
                      <span className="text-[9px] text-emerald-100 block uppercase font-bold">Bundle Price</span>
                      <span className="text-xs font-black">${currentBundlePrice}</span>
                    </div>
                    <div className="bg-amber-500 text-white p-2 rounded-xl shadow-xs">
                      <span className="text-[9px] text-amber-100 block uppercase font-bold">Buyer Savings</span>
                      <span className="text-xs font-extrabold">Save ${currentBundleSavings}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Listing Customizations */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" /> AI Ad Style & Settings
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Asking Price ($)</label>
                <div className="relative">
                  <DollarSign size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="35"
                    className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ad Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="casual">Friendly Local</option>
                  <option value="urgent">Quick Sale / Must Go</option>
                  <option value="detailed">Collector / Spec Sheet</option>
                  <option value="bundle">Package Deal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Extra Notes for FB Copy</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Porch pickup near downtown, cash or Venmo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={handleOptimizeWithAI}
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer"
              id="btn-generate-fb-ai"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{loading ? "Generating FB Ad..." : "Generate AI FB Marketplace Ad"}</span>
            </button>
          </div>

          {/* Quick Launch & Status Update buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleLaunchFBMarketplace}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition shadow-md shadow-blue-200 active:scale-98 cursor-pointer"
              id="btn-launch-facebook-marketplace"
            >
              <ExternalLink size={15} />
              <span>Launch Facebook Marketplace (New Tab)</span>
            </button>

            {activeItem && (
              <button
                type="button"
                onClick={handleMarkAsListed}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                  isListedSuccess
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                }`}
                id="btn-mark-listed-fb"
              >
                {isListedSuccess ? <Check size={14} className="text-emerald-600" /> : <Check size={14} />}
                <span>{isListedSuccess ? "Status Updated to Listed!" : "Mark Listed on FB Marketplace"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Output Column: Ready-to-Copy Listing Card */}
        <div className="lg:col-span-7 space-y-4">
          
          {error && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {adData ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    FB Marketplace Post Preview
                  </span>
                </div>

                <button
                  type="button"
                  onClick={copyAllListing}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
                  id="btn-copy-all-fb"
                >
                  {copiedField === "all" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedField === "all" ? "Copied All!" : "Copy Everything"}</span>
                </button>
              </div>

              {/* Title Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FB Title</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adData.fbTitle, "title")}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedField === "title" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedField === "title" ? "Copied" : "Copy Title"}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 select-all">
                  {adData.fbTitle}
                </div>
              </div>

              {/* Price & Category Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(adData.fbPrice.toString(), "price")}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      {copiedField === "price" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl text-xs font-extrabold text-emerald-800 select-all">
                    ${adData.fbPrice}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 truncate">
                    {adData.fbCategory}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Condition</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                    {adData.fbCondition}
                  </div>
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FB Description Text</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adData.fbDescription, "description")}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedField === "description" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedField === "description" ? "Copied Description" : "Copy Description"}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={adData.fbDescription}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none select-all font-sans leading-relaxed"
                />
              </div>

              {/* Tags Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FB Search Tags</label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(adData.fbTags, "tags")}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedField === "tags" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedField === "tags" ? "Copied" : "Copy Tags"}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 select-all truncate">
                  {adData.fbTags}
                </div>
              </div>

              {/* Media Preview & Download Section */}
              {!isBundleMode && activeItem && (activeItem.photoUrl || activeItem.videoUrl) && (
                <div className="pt-3 border-t border-slate-100 space-y-2.5" id="single-item-media-downloader">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon size={13} className="text-indigo-600" /> Database Pictures & Media
                    </span>
                    <span className="text-[10px] text-slate-400">Ready to re-upload to Facebook</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {activeItem.photoUrl ? (
                        <img 
                          src={activeItem.photoUrl} 
                          alt={activeItem.name} 
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon size={20} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h5 className="font-extrabold text-xs text-slate-800 truncate">{activeItem.name}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {activeItem.photoUrl && activeItem.videoUrl 
                            ? "Photo & Video clip available" 
                            : activeItem.photoUrl 
                            ? "High-resolution photo saved" 
                            : "Video clip saved"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {activeItem.photoUrl && (
                        <button
                          type="button"
                          onClick={handleDownloadActiveItemPhoto}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                          id="btn-download-photo"
                        >
                          <Download size={14} /> Download Photo
                        </button>
                      )}

                      {activeItem.videoUrl && (
                        <button
                          type="button"
                          onClick={handleDownloadActiveItemVideo}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95 cursor-pointer"
                          id="btn-download-video"
                        >
                          <Video size={14} /> Download Video
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bundle Media Downloader */}
              {isBundleMode && selectedBundleItemIds.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2.5" id="bundle-media-downloader">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers size={13} className="text-indigo-600" /> Bundle Media Photos ({selectedBundleItemIds.length} items)
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadAllBundleMedia}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                      id="btn-download-all-bundle-media"
                    >
                      <Download size={13} /> Download All Bundle Photos
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.filter(i => selectedBundleItemIds.includes(i.id)).map(bundleItem => (
                      <div key={bundleItem.id} className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          {bundleItem.photoUrl ? (
                            <img 
                              src={bundleItem.photoUrl} 
                              alt={bundleItem.name} 
                              className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                              <ImageIcon size={14} />
                            </div>
                          )}
                          <span className="text-[11px] font-bold text-slate-700 truncate">{bundleItem.name}</span>
                        </div>
                        {bundleItem.photoUrl && (
                          <button
                            type="button"
                            onClick={() => downloadMedia(bundleItem.photoUrl!, `${bundleItem.name.replace(/[^a-z0-9]/gi, "_")}.jpg`)}
                            className="p-1.5 bg-white hover:bg-slate-100 text-indigo-600 rounded-lg border border-slate-200 transition"
                            title="Download Photo"
                          >
                            <Download size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selling Tips */}
              {adData.fbTips && adData.fbTips.length > 0 && (
                <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">
                    Local FB Seller Tips
                  </span>
                  <ul className="text-xs text-blue-900 space-y-1 list-disc pl-4">
                    {adData.fbTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <ShoppingBag size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Select an item and click "Generate AI FB Marketplace Ad" to build copy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
