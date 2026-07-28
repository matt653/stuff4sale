import React, { useState, useEffect } from "react";
import { 
  Share2, Copy, Check, ExternalLink, 
  ShoppingBag, DollarSign, Tag, X, Download, MessageSquare, Bell, Image as ImageIcon
} from "lucide-react";
import { InventoryItem } from "../types";

interface FBHubModalProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  onStatusChange: (id: string, updates: Partial<InventoryItem>) => void;
  onClose: () => void;
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

  // State
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloadSuccessCount, setDownloadSuccessCount] = useState<number | null>(null);
  const [isListedSuccess, setIsListedSuccess] = useState(false);
  const [copiedReply, setCopiedReply] = useState<string | null>(null);

  // When active item changes
  useEffect(() => {
    if (selectedItem) {
      setActiveItem(selectedItem);
    } else if (items.length > 0 && !activeItem) {
      setActiveItem(items[0]);
    }
  }, [selectedItem, items]);

  // Compiled listing description directly from Inventory Data
  const getCompiledDescription = () => {
    if (isBundleMode) {
      const selectedBundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
      const totalIndividualSum = selectedBundleItems.reduce(
        (sum, i) => sum + (i.listedPrice || i.purchasePrice || 30),
        0
      );
      const bundlePrice = Math.round(totalIndividualSum * 0.85);

      let text = `📦 BUNDLE PACKAGE DEAL (${selectedBundleItems.length} Items)\n`;
      text += `Total Value: $${totalIndividualSum} | Package Price: $${bundlePrice}\n\n`;
      text += `Included Items:\n`;
      selectedBundleItems.forEach((item, idx) => {
        text += `${idx + 1}. ${item.name} - Stock #${item.stockNumber || item.id}\n`;
      });
      text += `\nItem Descriptions:\n`;
      selectedBundleItems.forEach((item) => {
        text += `• ${item.name}:\n${item.notes || "In good pre-owned condition."}\n\n`;
      });
      text += `Local pickup available. Cash or Venmo accepted. Message me to arrange pickup!`;
      return text;
    }

    if (!activeItem) return "";

    const price = activeItem.listedPrice || activeItem.purchasePrice || 0;
    let text = `${activeItem.name}\n`;
    text += `Price: $${price}\n`;
    if (activeItem.stockNumber) {
      text += `Stock #: ${activeItem.stockNumber}\n`;
    }
    text += `Category: ${activeItem.category}\n\n`;
    text += `DESCRIPTION:\n${activeItem.notes || activeItem.research?.suggestedDescription || "In good pre-owned condition. See photos for exact details."}\n\n`;
    text += `Local pickup available. Cash or Venmo accepted. Message if interested!`;
    return text;
  };

  const currentDescription = getCompiledDescription();

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
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

    setDownloadSuccessCount(photosToDownload.length);
    setTimeout(() => setDownloadSuccessCount(null), 5000);
  };

  const handleMarkAsListed = () => {
    if (isBundleMode) {
      if (selectedBundleItemIds.length === 0) return;
      selectedBundleItemIds.forEach(id => {
        onStatusChange(id, {
          status: "listed",
          listedPlatform: "Facebook Marketplace",
          updatedAt: new Date().toISOString()
        });
      });
    } else if (activeItem) {
      onStatusChange(activeItem.id, {
        status: "listed",
        listedPlatform: "Facebook Marketplace",
        updatedAt: new Date().toISOString()
      });
    }
    setIsListedSuccess(true);
    setTimeout(() => setIsListedSuccess(false), 3000);
  };

  const handleLaunchFacebook = () => {
    copyToClipboard(currentDescription, "launch");
    window.open("https://www.facebook.com/marketplace/create/item", "_blank");
  };

  const handleCopyQuickReply = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReply(label);
    setTimeout(() => setCopiedReply(null), 2500);
  };

  const currentPrice = activeItem?.listedPrice || activeItem?.purchasePrice || 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="fb-hub-modal">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Share2 size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Facebook Marketplace Assistant
              </h3>
              <p className="text-xs text-blue-100/80">
                Direct inventory copy-paste, 1-click photo downloader & quick reply tools
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white cursor-pointer"
            id="btn-close-fb-hub"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">

          {/* Mode Switcher: Single Item vs Bundle Deal */}
          <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsBundleMode(false)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                !isBundleMode ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              id="btn-fb-mode-single"
            >
              <ShoppingBag size={14} />
              Single Item Posting
            </button>
            <button
              type="button"
              onClick={() => setIsBundleMode(true)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                isBundleMode ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
              id="btn-fb-mode-bundle"
            >
              <Tag size={14} />
              📦 Multi-Item Bundle Deal
            </button>
          </div>

          {/* Item Selector */}
          {!isBundleMode ? (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Select Inventory Item</label>
              <select
                value={activeItem?.id || ""}
                onChange={(e) => {
                  const found = items.find(i => i.id === e.target.value);
                  if (found) setActiveItem(found);
                }}
                className="w-full text-xs font-bold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                id="fb-select-active-item"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    Stock #{i.stockNumber || i.id} - {i.name} (${i.listedPrice || i.purchasePrice || 0})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-indigo-950 uppercase tracking-wide block">Select Items for Bundle Package</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {items.map((i) => {
                  const isChecked = selectedBundleItemIds.includes(i.id);
                  return (
                    <label
                      key={i.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked ? "bg-indigo-600 text-white border-indigo-600 font-bold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedBundleItemIds(selectedBundleItemIds.filter(id => id !== i.id));
                          } else {
                            setSelectedBundleItemIds([...selectedBundleItemIds, i.id]);
                          }
                        }}
                        className="hidden"
                      />
                      <span className="truncate">#{i.stockNumber || i.id} {i.name} (${i.listedPrice || i.purchasePrice || 0})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description Preview Box (Pulling directly from inventory description) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>Inventory Ad Description</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-extrabold">Pulled from Inventory</span>
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(currentDescription, "desc")}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                id="btn-copy-description"
              >
                {copiedField === "desc" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copiedField === "desc" ? "Copied!" : "Copy Description"}
              </button>
            </div>

            <textarea
              readOnly
              rows={7}
              value={currentDescription}
              className="w-full text-xs font-mono border border-slate-200 rounded-2xl p-4 bg-slate-50 text-slate-800 leading-relaxed focus:outline-none"
              id="fb-ad-description-text"
            />
          </div>

          {/* Download Photos Notification Toast */}
          {downloadSuccessCount !== null && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <ImageIcon size={16} className="text-emerald-600 shrink-0" />
              <span>Downloaded {downloadSuccessCount} photo(s)! Simply drag and drop them directly onto your Facebook Marketplace listing form.</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadPhotos}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              id="btn-download-item-photos"
            >
              <Download size={15} />
              Download Item Photos
            </button>

            <button
              type="button"
              onClick={handleMarkAsListed}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                isListedSuccess ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
              id="btn-mark-posted-fb"
            >
              <Check size={15} />
              {isListedSuccess ? "Marked as Listed on FB!" : "Mark Listed on FB"}
            </button>
          </div>

          {/* 1-Click Launch Facebook Marketplace */}
          <button
            type="button"
            onClick={handleLaunchFacebook}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-black transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            id="btn-launch-facebook-marketplace"
          >
            <ExternalLink size={18} />
            Copy Description & Launch FB Marketplace
          </button>

          {/* Buyer Inquiry Quick Reply Helper */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <MessageSquare size={14} className="text-blue-600" />
                <span>Marketplace Buyer Quick Reply Tool</span>
              </h5>
              {copiedReply && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check size={11} /> Copied {copiedReply}!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleCopyQuickReply(`Hi! Yes, it's still available for local pickup. When are you free to swing by?`, "Availability Reply")}
                className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl font-semibold text-slate-700 text-left transition flex flex-col gap-1 cursor-pointer hover:shadow-xs"
              >
                <span className="font-extrabold text-blue-700">⚡ "Is this available?"</span>
                <span className="text-[11px] text-slate-500 truncate">Yes, it's available! When are you free for local pickup?</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyQuickReply(`Hi! The best I can do is $${currentPrice}, cash or Venmo accepted. Let me know if that works for you!`, "Offer Counter Reply")}
                className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl font-semibold text-slate-700 text-left transition flex flex-col gap-1 cursor-pointer hover:shadow-xs"
              >
                <span className="font-extrabold text-emerald-700">💰 Price / Offer Counter</span>
                <span className="text-[11px] text-slate-500 truncate">Best I can do is ${currentPrice}. Cash or Venmo accepted.</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyQuickReply(`Pickup is located near local area. Cash or Venmo accepted upon arrival. Send me a message when you're on your way!`, "Pickup Location Reply")}
                className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl font-semibold text-slate-700 text-left transition flex flex-col gap-1 cursor-pointer hover:shadow-xs"
              >
                <span className="font-extrabold text-purple-700">📍 Pickup & Location</span>
                <span className="text-[11px] text-slate-500 truncate">Local pickup near area. Send message when on your way!</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
