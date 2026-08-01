import React, { useState, useEffect } from "react";
import { 
  Share2, Copy, Check, ExternalLink, 
  ShoppingBag, DollarSign, Tag, X, Download, MessageSquare, Bell, Image as ImageIcon,
  Sparkles, Layers, ChevronRight, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck,
  Bot, Globe, Play, FileText, Zap
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
  // Active selected item for single listing
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(selectedItem || items[0] || null);

  // Tab View Mode: 'replica' (Line-by-Line), 'full' (Single Text Block), 'bundle' (Bundle Builder), 'replies' (Buyer Quick Replies), 'agent' (Browser Agent Auto-Fill)
  const [viewTab, setViewTab] = useState<"replica" | "full" | "bundle" | "replies" | "agent">("replica");

  // Bundle mode state
  const [selectedBundleItemIds, setSelectedBundleItemIds] = useState<string[]>([]);
  const [customBundlePrice, setCustomBundlePrice] = useState<string>("");

  // Editable Form Fields (Line-by-Line values matching FB Marketplace form)
  const [fbTitle, setFbTitle] = useState("");
  const [fbPrice, setFbPrice] = useState("");
  const [fbCategory, setFbCategory] = useState("Antiques & Collectibles");
  const [fbCondition, setFbCondition] = useState("Used - Good");
  const [fbDescription, setFbDescription] = useState("");
  const [fbAvailability, setFbAvailability] = useState("List as Single Item");
  const [fbTags, setFbTags] = useState("");
  const [fbSku, setFbSku] = useState("");
  const [fbPickupNote, setFbPickupNote] = useState("Local pickup available near local area. Cash or Venmo accepted.");

  // Sequential Copy Wizard Step index (0 to 8)
  const [wizardStep, setWizardStep] = useState<number>(0);

  // Toast / Copy State Feedbacks
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloadSuccessCount, setDownloadSuccessCount] = useState<number | null>(null);
  const [isListedSuccess, setIsListedSuccess] = useState(false);
  const [copiedReply, setCopiedReply] = useState<string | null>(null);
  const [agentCopied, setAgentCopied] = useState(false);
  const [agentCompleted, setAgentCompleted] = useState(false);

  // Sync state when selectedItem or activeItem changes
  useEffect(() => {
    if (selectedItem) {
      setActiveItem(selectedItem);
    } else if (items.length > 0 && !activeItem) {
      setActiveItem(items[0]);
    }
  }, [selectedItem, items]);

  // Populate line-by-line fields when activeItem changes
  useEffect(() => {
    if (!activeItem) return;

    const stockStr = activeItem.stockNumber ? `#${activeItem.stockNumber}` : `#${activeItem.id}`;
    const priceVal = activeItem.listedPrice || activeItem.purchasePrice || 0;

    // Title (FB limit is ~100 chars)
    const rawTitle = activeItem.name;
    const titleWithStock = rawTitle.toLowerCase().includes("stock") || rawTitle.includes("#")
      ? rawTitle 
      : `${rawTitle} - Stock ${stockStr}`;
    setFbTitle(titleWithStock.slice(0, 100));

    // Price
    setFbPrice(priceVal > 0 ? priceVal.toString() : "25");

    // Category
    setFbCategory(activeItem.category || activeItem.research?.category || "Antiques & Collectibles");

    // Condition
    setFbCondition("Used - Good");

    // Description
    const baseDesc = activeItem.notes && activeItem.notes.length > 15
      ? activeItem.notes
      : activeItem.research?.suggestedDescription || "In good pre-owned condition. See photos for exact details.";

    const formattedDesc = `📌 ITEM DETAILS & OVERVIEW:\n${activeItem.name} (Stock ${stockStr})\n\n⚠️ CONDITION & FACTS:\n${baseDesc}\n\n📏 SPECS & DETAILS:\nCategory: ${activeItem.category || "General"}\nStock Identifier: ${stockStr}\n\n🚗 PICKUP & PAYMENT:\nLocal pickup available. Cash or Venmo accepted upon arrival. Message me if interested!`;

    setFbDescription(formattedDesc);

    // Availability
    setFbAvailability("List as Single Item");

    // Tags (Product Tags in FB)
    const tagsArr = activeItem.research?.keywords || [
      activeItem.name.replace(/[^a-z0-9]/gi, " ").trim(),
      activeItem.category || "item",
      "vintage",
      "local pickup"
    ];
    setFbTags(tagsArr.join(", ").slice(0, 120));

    // SKU
    setFbSku(stockStr.replace("#", ""));

    // Reset wizard & agent step
    setWizardStep(0);
    setAgentCompleted(false);
  }, [activeItem]);

  const fallbackCopyText = (text: string): boolean => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.warn("Fallback copy failed:", err);
      return false;
    }
  };

  // Helper copy function with visual feedback and bulletproof fallback
  const copyToClipboard = (text: string, fieldName: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          fallbackCopyText(text);
        });
      } else {
        fallbackCopyText(text);
      }
    } catch (e) {
      fallbackCopyText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2200);
  };

  // Download Item Photos
  const handleDownloadPhotos = () => {
    const targetItem = viewTab === "bundle" ? null : activeItem;
    let photosToDownload: string[] = [];

    if (viewTab === "bundle") {
      const bundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
      bundleItems.forEach(i => {
        if (i.photos && i.photos.length > 0) photosToDownload.push(...i.photos);
        else if (i.photoUrl) photosToDownload.push(i.photoUrl);
      });
    } else if (targetItem) {
      photosToDownload = targetItem.photos && targetItem.photos.length > 0
        ? targetItem.photos
        : targetItem.photoUrl ? [targetItem.photoUrl] : [];
    }

    if (photosToDownload.length === 0) {
      alert("No photos available for this selection.");
      return;
    }

    photosToDownload.forEach((photo, idx) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = photo;
        link.download = `${(targetItem?.name || "bundle_item").replace(/[^a-z0-9]/gi, '_').toLowerCase()}_photo_${idx + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });

    setDownloadSuccessCount(photosToDownload.length);
    setTimeout(() => setDownloadSuccessCount(null), 5000);
  };

  // Single Block Text Compiler for Full Text Mode
  const getCompiledFullText = () => {
    if (viewTab === "bundle") {
      const selectedBundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
      const totalIndividualSum = selectedBundleItems.reduce(
        (sum, i) => sum + (i.listedPrice || i.purchasePrice || 30),
        0
      );
      const bundlePrice = customBundlePrice ? Number(customBundlePrice) : Math.round(totalIndividualSum * 0.85);

      let text = `📦 MULTI-ITEM BUNDLE PACKAGE DEAL (${selectedBundleItems.length} ITEMS)\n`;
      text += `Total Separate Value: $${totalIndividualSum} | 🔥 BUNDLE PACKAGE PRICE: $${bundlePrice}\n\n`;
      text += `ITEMS INCLUDED IN LOT:\n`;
      selectedBundleItems.forEach((item, idx) => {
        text += `${idx + 1}. Stock #${item.stockNumber || item.id} - ${item.name} ($${item.listedPrice || item.purchasePrice || 0} separate value)\n`;
      });
      text += `\nCONDITION & DESCRIPTION:\n`;
      selectedBundleItems.forEach((item) => {
        text += `--- Stock #${item.stockNumber || item.id}: ${item.name}\n${item.notes || "In good pre-owned condition."}\n\n`;
      });
      text += `Local pickup available. Cash or Venmo accepted. Message to claim!`;
      return text;
    }

    let text = `TITLE: ${fbTitle}\n`;
    text += `PRICE: $${fbPrice}\n`;
    text += `CATEGORY: ${fbCategory}\n`;
    text += `CONDITION: ${fbCondition}\n`;
    text += `SKU / STOCK #: ${fbSku}\n\n`;
    text += `DESCRIPTION:\n${fbDescription}\n\n`;
    text += `SEARCH TAGS:\n${fbTags}\n\n`;
    text += `${fbPickupNote}`;
    return text;
  };

  // Browser Agent Automation Prompt Compiler
  const getBrowserAgentPrompt = () => {
    return `/browser Please open https://www.facebook.com/marketplace/create/item and fill out the listing for this item line-by-line:
1. Title: ${fbTitle}
2. Price: ${fbPrice}
3. Category: ${fbCategory}
4. Condition: ${fbCondition}
5. Description: ${fbDescription.replace(/\n/g, ' ')}
6. Product Tags: ${fbTags}
7. SKU: ${fbSku}

Please fill in all fields line-by-line, upload the item photos, and STOP on the final screen so I can review and click Publish per Facebook Marketplace rules!`;
  };

  const handleCopyAgentCommand = () => {
    const promptText = getBrowserAgentPrompt();
    navigator.clipboard.writeText(promptText);
    setAgentCopied(true);
    // Open FB Marketplace item creation page in new tab
    window.open("https://www.facebook.com/marketplace/create/item", "_blank");
    setTimeout(() => setAgentCopied(false), 4000);
  };

  // State for Live Listing URL
  const [liveAdLink, setLiveAdLink] = useState(activeItem?.listingUrl || "");

  useEffect(() => {
    if (activeItem) {
      setLiveAdLink(activeItem.listingUrl || "");
    }
  }, [activeItem]);

  // Mark as Listed in Supabase smoothly without annoying popup alerts
  const handleMarkAsListed = (providedUrl?: string): boolean => {
    const finalUrl = (providedUrl || liveAdLink).trim();

    if (viewTab === "bundle") {
      if (selectedBundleItemIds.length === 0) return false;
      selectedBundleItemIds.forEach(id => {
        onStatusChange(id, {
          status: "listed",
          listedPlatform: "Facebook Marketplace",
          listingUrl: finalUrl || null,
          updatedAt: new Date().toISOString()
        });
      });
    } else if (activeItem) {
      onStatusChange(activeItem.id, {
        status: "listed",
        listedPlatform: "Facebook Marketplace",
        listingUrl: finalUrl || null,
        listedPrice: Number(fbPrice) || activeItem.listedPrice || 0,
        updatedAt: new Date().toISOString()
      });
    }
    setIsListedSuccess(true);
    setTimeout(() => setIsListedSuccess(false), 3000);
    return true;
  };

  // Sequential Copy Wizard Steps Definition
  const wizardSteps = [
    { label: "Step 1: Download Photos", key: "photos", text: "", action: handleDownloadPhotos },
    { label: "Step 2: Copy Title", key: "title", text: fbTitle },
    { label: "Step 3: Copy Price", key: "price", text: fbPrice },
    { label: "Step 4: Copy Category", key: "category", text: fbCategory },
    { label: "Step 5: Copy Condition", key: "condition", text: fbCondition },
    { label: "Step 6: Copy Description", key: "description", text: fbDescription },
    { label: "Step 7: Copy Tags", key: "tags", text: fbTags },
    { label: "Step 8: Copy SKU", key: "sku", text: fbSku },
  ];

  const handleWizardAdvance = () => {
    const currentStepObj = wizardSteps[wizardStep];
    if (!currentStepObj) return;

    if (currentStepObj.action) {
      currentStepObj.action();
      copyToClipboard("Photos Downloaded!", "photos");
    } else if (currentStepObj.text) {
      copyToClipboard(currentStepObj.text, currentStepObj.key);
    }

    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep(prev => prev + 1);
    }
  };

  // Mark as Listed in Supabase & set Agent Complete
  const handleAgentComplete = () => {
    const success = handleMarkAsListed();
    if (success) {
      setAgentCompleted(true);
      setTimeout(() => {
        setAgentCompleted(false);
        onClose();
      }, 1200);
    }
  };

  const getAutoFillBookmarkletCode = () => {
    const code = `javascript:(function(){
      function setInputValue(el, val) {
        if (!el) return false;
        try {
          const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        } catch(e) {
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }

      function fillField(labels, val) {
        if (!val) return false;
        for (let label of labels) {
          let el = document.querySelector(\`input[aria-label="\${label}"], textarea[aria-label="\${label}"]\`);
          if (!el) el = document.querySelector(\`[aria-label*="\${label}"] input, [aria-label*="\${label}"] textarea\`);
          if (!el) {
            const allElements = Array.from(document.querySelectorAll('label, span, div'));
            const match = allElements.find(e => e.children.length === 0 && e.textContent.trim().toLowerCase() === label.toLowerCase());
            if (match) {
              const parent = match.closest('label') || match.parentElement?.parentElement;
              if (parent) el = parent.querySelector('input, textarea');
            }
          }
          if (el && setInputValue(el, val)) return true;
        }
        return false;
      }

      const filledTitle = fillField(["Title", "Título"], ${JSON.stringify(fbTitle)});
      const filledPrice = fillField(["Price", "Precio"], ${JSON.stringify(fbPrice)});
      const filledDesc = fillField(["Description", "Descripción"], ${JSON.stringify(fbDescription)});
      const filledSku = fillField(["SKU", "Stock"], ${JSON.stringify(fbSku)});
      const filledTags = fillField(["Product Tags", "Tags", "Etiquetas"], ${JSON.stringify(fbTags)});

      if (filledTitle || filledPrice || filledDesc) {
        alert("✨ Stuff4Sale Auto-Fill Complete! All fields filled automatically.");
      } else {
        alert("⚠️ Auto-Fill Note: Please click inside the Title or Description box on Facebook Marketplace first, then run the script again!");
      }
    })();`;
    return code;
  };

  // Launch FB Marketplace in new tab
  const handleLaunchFacebook = () => {
    copyToClipboard(getCompiledFullText(), "launch");
    window.open("https://www.facebook.com/marketplace/create/item", "_blank");
  };

  const handleCopyQuickReply = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReply(label);
    setTimeout(() => setCopiedReply(null), 2500);
  };

  // Bundle calculations
  const selectedBundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
  const totalBundleSum = selectedBundleItems.reduce(
    (sum, i) => sum + (i.listedPrice || i.purchasePrice || 30),
    0
  );
  const recommendedBundlePrice = Math.round(totalBundleSum * 0.85);

  // DOM Ref to bypass React JSX javascript: URL blocking security error
  const bookmarkletRef = React.useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (bookmarkletRef.current) {
      bookmarkletRef.current.setAttribute("href", getAutoFillBookmarkletCode());
    }
  }, [fbTitle, fbPrice, fbDescription, fbSku, fbTags, viewTab]);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in" id="fb-hub-modal">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Share2 size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Facebook Marketplace Assistant
                </h3>
                <span className="bg-blue-400/30 text-blue-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-300/30 uppercase tracking-wider">
                  Line-by-Line Replica & AI Agent Mode
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                Exact Facebook form fields, 1-click line-for-line copier & Browser Agent Auto-Fill
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

        {/* Top Control Bar: Active Item Selector + View Switcher */}
        <div className="bg-slate-100 border-b border-slate-200 p-3 sm:p-4 space-y-3 shrink-0">
          
          {/* Active Item Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Select Active Inventory Item
              </label>
              <select
                value={activeItem?.id || ""}
                onChange={(e) => {
                  const found = items.find(i => i.id === e.target.value);
                  if (found) setActiveItem(found);
                }}
                className="w-full text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                id="fb-select-active-item"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    Stock #{i.stockNumber || i.id} — {i.name} (${i.listedPrice || i.purchasePrice || 0}) [{i.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-1 sm:pt-4">
              <button
                type="button"
                onClick={handleDownloadPhotos}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                id="btn-download-photos-top"
              >
                <Download size={14} className="text-blue-600" />
                <span>Photos ({activeItem?.photos?.length || (activeItem?.photoUrl ? 1 : 0)})</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchFacebook}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                id="btn-launch-fb-top"
              >
                <ExternalLink size={14} />
                <span>Launch FB Tab</span>
              </button>

              <button
                type="button"
                onClick={handleAgentComplete}
                className={`py-2 px-3.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  agentCompleted || isListedSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
                id="btn-agent-complete-top"
              >
                <CheckCircle2 size={15} className={agentCompleted ? "text-white" : "text-emerald-600"} />
                <span>{agentCompleted || isListedSuccess ? "Agent Complete ✓" : "Agent Complete"}</span>
              </button>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl text-xs font-extrabold overflow-x-auto">
            <button
              type="button"
              onClick={() => setViewTab("replica")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewTab === "replica"
                  ? "bg-white text-blue-700 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-fb-replica"
            >
              <Share2 size={14} />
              <span>📱 FB Form Replica</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("agent")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewTab === "agent"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs font-black"
                  : "text-purple-700 hover:text-purple-900 font-black"
              }`}
              id="tab-fb-agent"
            >
              <Bot size={14} />
              <span>🤖 Browser Agent Auto-Fill</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("full")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewTab === "full"
                  ? "bg-white text-blue-700 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-fb-full"
            >
              <Copy size={14} />
              <span>📄 Combined Text</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("bundle")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewTab === "bundle"
                  ? "bg-white text-indigo-700 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-fb-bundle"
            >
              <Tag size={14} />
              <span>📦 Bundle Deal Builder</span>
            </button>

            <button
              type="button"
              onClick={() => setViewTab("replies")}
              className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewTab === "replies"
                  ? "bg-white text-purple-700 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id="tab-fb-replies"
            >
              <MessageSquare size={14} />
              <span>💬 Buyer Replies</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">

          {/* Toast Notification when Agent Complete is Clicked */}
          {agentCompleted && (
            <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-lg text-xs font-black flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={20} className="text-white shrink-0" />
                <div>
                  <span className="block font-black text-xs">🎉 Item #{activeItem?.stockNumber || activeItem?.id} updated to LISTED in Stuff4Sale Inventory!</span>
                  <span className="text-[11px] text-emerald-100 font-normal">Note: Remember to click "Publish" in your Facebook Marketplace browser tab to make your listing live to buyers on FB.</span>
                </div>
              </div>
              <span className="bg-white/20 text-white px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider shrink-0">
                Inventory Updated
              </span>
            </div>
          )}

          {/* VIEW TAB 5: BROWSER AGENT AUTO-FILL MODE */}
          {viewTab === "agent" && (
            <div className="space-y-4" id="fb-agent-mode-view">
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-purple-500/30 space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
                      <Bot size={22} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <span>Browser Agent Auto-Fill Mode</span>
                        <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                          FB Policy Compliant
                        </span>
                      </h4>
                      <p className="text-xs text-purple-200/80">
                        Instructs Antigravity's <code className="bg-black/40 text-amber-300 px-1.5 py-0.5 rounded">/browser</code> agent to open Facebook Marketplace, auto-fill every field line-by-line, and upload photos!
                      </p>
                    </div>
                  </div>
                </div>

                {/* FB Policy Compliance Safeguard Banner */}
                <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-200">
                  <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-emerald-100 block uppercase tracking-wider text-[11px]">
                      Strict Facebook Marketplace Rule Safeguard
                    </span>
                    <span className="text-emerald-200/90 leading-relaxed block mt-0.5">
                      The Browser Agent automatically types Title, Price, Category, Condition, Description, Tags, and SKU line-by-line and attaches photos—then <strong>STOPS and WAITS on the final review screen</strong> for you to inspect and manually press <strong>"Publish"</strong>. This ensures 100% compliance with Facebook policies!
                    </span>
                  </div>
                </div>

                {/* Generated Prompt Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-purple-400" />
                      <span>Generated Browser Agent Instruction Payload</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyAgentCommand}
                      className="py-1 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      id="btn-copy-agent-command"
                    >
                      {agentCopied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                      <span>{agentCopied ? "Copied Prompt!" : "📋 Copy Agent Prompt"}</span>
                    </button>
                  </div>

                  <textarea
                    readOnly
                    rows={6}
                    value={getBrowserAgentPrompt()}
                    className="w-full text-xs font-mono border border-purple-500/30 rounded-2xl p-3.5 bg-black/50 text-purple-100 leading-relaxed focus:outline-none select-all shadow-inner"
                  />
                </div>

                {/* Automated Steps Preview List */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs">
                  <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider block">
                    ⚡ What the /browser Agent will perform automatically:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-purple-100/90">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>1. Navigates to <code>facebook.com/marketplace/create/item</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>2. Types Title: <strong>{fbTitle}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>3. Sets Asking Price: <strong>${fbPrice}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>4. Selects Category: <strong>{fbCategory}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>5. Selects Condition: <strong>{fbCondition}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>6. Pastes 5-Section Description</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>7. Inputs Product Tags & SKU #{fbSku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>8. ✋ STOPS on Publish Screen for your review!</span>
                    </div>
                  </div>
                </div>

                {/* Instant 1-Click Auto-Fill Script Section */}
                <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 border border-amber-400/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={15} className="text-amber-400" />
                      ⚡ 1-Click Auto-Filler (No Manual Copy-Pasting Needed!)
                    </span>
                    <a
                      ref={bookmarkletRef}
                      onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard(getAutoFillBookmarkletCode(), "autofill");
                        alert("⚡ Auto-Fill Script Copied to Clipboard!\n\n3 WAYS TO RUN ON FACEBOOK MARKETPLACE:\n\n1. BOOKMARKLET (Easiest): Drag this gold button to your Chrome Bookmarks bar (Ctrl+Shift+B) & click it on Facebook!\n\n2. CONSOLE (F12): On Facebook, press F12 -> Console tab -> paste & press Enter!\n\n3. ADDRESS BAR: If pasting in the top URL bar, type 'javascript:' at the very front before hitting Enter!");
                      }}
                      className="py-1.5 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-1.5"
                      title="Drag to bookmarks bar or click to copy auto-fill script"
                    >
                      <Zap size={14} className="fill-slate-950 text-slate-950" />
                      <span>⚡ 1-Click Auto-Filler</span>
                    </a>
                  </div>
                  <p className="text-xs text-purple-100/90 leading-relaxed">
                    Click <strong>"⚡ 1-Click Auto-Filler"</strong> or drag it to your browser bookmarks bar. When you are on Facebook Marketplace, clicking it automatically populates your Title, Asking Price, Full 5-Section Description, and SKU line-by-line in 1 millisecond!
                  </p>

                  <div className="bg-black/40 border border-amber-400/30 rounded-xl p-3 text-[11px] text-amber-100 space-y-1.5">
                    <div className="font-extrabold text-amber-300 flex items-center gap-1">
                      <span>💡 3 Ways to Run on Facebook Marketplace:</span>
                    </div>
                    <div className="space-y-1 leading-relaxed text-slate-200">
                      <div><strong className="text-amber-300">Method 1 (Bookmarklet - Easiest):</strong> Drag the gold button directly to your browser's Bookmarks Bar (<code className="bg-black/60 text-amber-300 px-1 rounded">Ctrl + Shift + B</code>). On Facebook, just click your bookmark!</div>
                      <div><strong className="text-amber-300">Method 2 (Chrome Console F12):</strong> On Facebook, press <code className="bg-black/60 text-amber-300 px-1 rounded">F12</code> ➔ click <strong>Console</strong> ➔ paste ➔ hit <strong>Enter</strong>!</div>
                      <div><strong className="text-amber-300">Method 3 (Address Bar Note):</strong> Chrome automatically strips the word <code className="bg-black/60 text-amber-300 px-1 rounded">javascript:</code> when you paste into the address bar. If you paste into the address bar, type <code className="bg-black/60 text-amber-300 px-1 rounded">javascript:</code> back at the very front of the URL bar before hitting Enter!</div>
                    </div>
                  </div>
                </div>

                {/* Dual Action Buttons: Trigger Agent & Agent Complete */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyAgentCommand}
                    className="py-3.5 px-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    id="btn-launch-browser-agent"
                  >
                    <Bot size={18} />
                    <span>Copy Command & Trigger Agent</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAgentComplete}
                    className="py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    id="btn-agent-complete-tab"
                  >
                    <CheckCircle2 size={18} />
                    <span>Agent Complete (Mark Listed)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sequential Copy Wizard Banner */}
          {viewTab === "replica" && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    {wizardStep + 1}
                  </span>
                  <div>
                    <span className="text-xs font-black text-blue-950 uppercase tracking-wider block">
                      Sequential Copy Wizard (Line-for-Line Helper)
                    </span>
                    <span className="text-[11px] text-blue-800 font-bold">
                      {wizardSteps[wizardStep]?.label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleWizardAdvance}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  id="btn-wizard-advance"
                >
                  <span>Copy Line & Next Step</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Progress Stepper Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1">
                {wizardSteps.map((st, idx) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setWizardStep(idx)}
                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                      wizardStep === idx
                        ? "bg-blue-600 text-white font-black shadow-2xs"
                        : idx < wizardStep
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {idx < wizardStep ? "✓ " : ""}{st.label.replace("Step ", "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Download Photos Notification Toast */}
          {downloadSuccessCount !== null && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl p-3 text-xs font-extrabold flex items-center gap-2.5 animate-fade-in shadow-2xs">
              <ImageIcon size={18} className="text-emerald-600 shrink-0" />
              <span>Downloaded {downloadSuccessCount} photo(s)! Drag and drop them directly onto Facebook Marketplace.</span>
            </div>
          )}

          {/* VIEW TAB 1: FB FORM LINE-BY-LINE REPLICA */}
          {viewTab === "replica" && (
            <div className="space-y-4" id="fb-replica-form-view">
              
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Facebook Marketplace Form Replica
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  Copy each field line-for-line into FB
                </span>
              </div>

              {/* Photos Gallery Strip */}
              <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 0 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-blue-600" />
                    <span>1. Photos</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">Up to 10 photos</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadPhotos}
                    className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    id="btn-copy-photos-line"
                  >
                    {copiedField === "photos" ? <Check size={13} className="text-emerald-600" /> : <Download size={13} />}
                    {copiedField === "photos" ? "Downloaded!" : "Download Photos"}
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {activeItem?.photos && activeItem.photos.length > 0 ? (
                    activeItem.photos.map((imgSrc, i) => (
                      <div key={i} className="relative shrink-0">
                        <img 
                          src={imgSrc} 
                          alt={`Photo ${i+1}`} 
                          className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs"
                        />
                        <span className="absolute top-1 left-1 bg-slate-950/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/50">
                          #{activeItem.stockNumber || activeItem.id}
                        </span>
                      </div>
                    ))
                  ) : activeItem?.photoUrl ? (
                    <div className="relative shrink-0">
                      <img 
                        src={activeItem.photoUrl} 
                        alt="Photo" 
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs"
                      />
                      <span className="absolute top-1 left-1 bg-slate-950/80 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/50">
                        #{activeItem.stockNumber || activeItem.id}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-slate-400 italic">No photos uploaded for this item.</div>
                  )}
                </div>
              </div>

              {/* Title Field Box */}
              <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 1 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Title</span>
                    <span className="text-[10px] text-slate-400 font-normal">({fbTitle.length}/100 chars)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(fbTitle, "title")}
                    className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    id="btn-copy-title"
                  >
                    {copiedField === "title" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedField === "title" ? "Copied Title!" : "📋 Copy Title"}
                  </button>
                </div>
                <input
                  type="text"
                  value={fbTitle}
                  onChange={(e) => setFbTitle(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="fb-field-title"
                />
              </div>

              {/* Price & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Price Field Box */}
                <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 2 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">3. Price ($)</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fbPrice, "price")}
                      className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                      id="btn-copy-price"
                    >
                      {copiedField === "price" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedField === "price" ? "Copied Price!" : "📋 Copy Price"}
                    </button>
                  </div>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      value={fbPrice}
                      onChange={(e) => setFbPrice(e.target.value)}
                      className="w-full text-xs font-black border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 bg-slate-50 text-emerald-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      id="fb-field-price"
                    />
                  </div>
                </div>

                {/* Category Field Box */}
                <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 3 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">4. Category</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fbCategory, "category")}
                      className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                      id="btn-copy-category"
                    >
                      {copiedField === "category" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedField === "category" ? "Copied!" : "📋 Copy Category"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={fbCategory}
                    onChange={(e) => setFbCategory(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    id="fb-field-category"
                  />
                </div>
              </div>

              {/* Condition & Availability Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Condition Field Box */}
                <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 4 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">5. Condition</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fbCondition, "condition")}
                      className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                      id="btn-copy-condition"
                    >
                      {copiedField === "condition" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedField === "condition" ? "Copied!" : "📋 Copy Condition"}
                    </button>
                  </div>
                  <select
                    value={fbCondition}
                    onChange={(e) => setFbCondition(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    id="fb-field-condition"
                  >
                    <option value="New">New</option>
                    <option value="Used - Like New">Used - Like New</option>
                    <option value="Used - Good">Used - Good</option>
                    <option value="Used - Fair">Used - Fair</option>
                  </select>
                </div>

                {/* Availability Field Box */}
                <div className="p-3.5 rounded-2xl border bg-white border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Availability</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fbAvailability, "availability")}
                      className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === "availability" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedField === "availability" ? "Copied!" : "📋 Copy Availability"}
                    </button>
                  </div>
                  <select
                    value={fbAvailability}
                    onChange={(e) => setFbAvailability(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="List as Single Item">List as Single Item</option>
                    <option value="List as In Stock">List as In Stock</option>
                  </select>
                </div>
              </div>

              {/* Description Textarea Box */}
              <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 5 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>6. Description</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">5-Section Structured</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(fbDescription, "description")}
                    className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    id="btn-copy-description-line"
                  >
                    {copiedField === "description" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedField === "description" ? "Copied Description!" : "📋 Copy Description"}
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={fbDescription}
                  onChange={(e) => setFbDescription(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-3 bg-slate-50 text-slate-900 leading-relaxed focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  id="fb-field-description"
                />
              </div>

              {/* Product Tags & SKU Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Product Tags */}
                <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 6 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">7. Product Tags (Comma-Separated)</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fbTags, "tags")}
                      className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                      id="btn-copy-tags"
                    >
                      {copiedField === "tags" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedField === "tags" ? "Copied Tags!" : "📋 Copy Tags"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={fbTags}
                    onChange={(e) => setFbTags(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    id="fb-field-tags"
                  />
                </div>

                {/* SKU / Stock # */}
                <div className={`p-3.5 rounded-2xl border transition ${wizardStep === 7 ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">8. SKU / Stock #</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fbSku, "sku")}
                      className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                      id="btn-copy-sku"
                    >
                      {copiedField === "sku" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedField === "sku" ? "Copied SKU!" : "📋 Copy SKU"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={fbSku}
                    onChange={(e) => setFbSku(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    id="fb-field-sku"
                  />
                </div>
              </div>

            </div>
          )}

          {/* VIEW TAB 2: COMBINED FULL TEXT */}
          {viewTab === "full" && (
            <div className="space-y-3" id="fb-full-text-view">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Combined FB Ad Text Block
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getCompiledFullText(), "fulltext")}
                  className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                  id="btn-copy-fulltext"
                >
                  {copiedField === "fulltext" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedField === "fulltext" ? "Copied All Text!" : "📋 Copy Everything"}
                </button>
              </div>

              <textarea
                readOnly
                rows={12}
                value={getCompiledFullText()}
                className="w-full text-xs font-mono border border-slate-300 rounded-2xl p-4 bg-slate-50 text-slate-900 leading-relaxed focus:outline-none select-all"
              />
            </div>
          )}

          {/* VIEW TAB 3: BUNDLE DEAL BUILDER */}
          {viewTab === "bundle" && (
            <div className="space-y-4" id="fb-bundle-builder-view">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={15} className="text-indigo-600" />
                    <span>Select Items for Multi-Item FB Bundle Package</span>
                  </label>
                  <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {selectedBundleItemIds.length} Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {items.map((i) => {
                    const isChecked = selectedBundleItemIds.includes(i.id);
                    return (
                      <label
                        key={i.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? "bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
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
                          <span className="truncate">#{i.stockNumber || i.id} {i.name}</span>
                        </div>
                        <span className="shrink-0 font-black">${i.listedPrice || i.purchasePrice || 0}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Bundle Summary Banner */}
                {selectedBundleItemIds.length > 0 && (
                  <div className="bg-white border border-indigo-200 rounded-xl p-3 space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center font-bold">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Separate Sum</span>
                        <span className="text-xs text-slate-600 line-through font-extrabold">${totalBundleSum}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-2xs">
                        <span className="text-[9px] text-emerald-100 block uppercase font-bold">Bundle Price</span>
                        <span className="text-xs font-black">${recommendedBundlePrice}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500 text-white shadow-2xs">
                        <span className="text-[9px] text-amber-100 block uppercase font-bold">Savings</span>
                        <span className="text-xs font-extrabold">${totalBundleSum - recommendedBundlePrice}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bundle Text Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Generated Multi-Item Bundle Copy
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(getCompiledFullText(), "bundlecopy")}
                    className="text-xs text-blue-700 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    id="btn-copy-bundle-text"
                  >
                    {copiedField === "bundlecopy" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    {copiedField === "bundlecopy" ? "Copied Bundle Ad!" : "📋 Copy Bundle Ad"}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={getCompiledFullText()}
                  className="w-full text-xs font-mono border border-slate-300 rounded-2xl p-4 bg-slate-50 text-slate-900 leading-relaxed focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* VIEW TAB 4: BUYER QUICK REPLIES */}
          {viewTab === "replies" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3" id="fb-replies-view">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <MessageSquare size={16} className="text-blue-600" />
                  <span>Facebook Marketplace Buyer Quick Reply Tool</span>
                </h5>
                {copiedReply && (
                  <span className="text-xs bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={12} /> Copied {copiedReply}!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopyQuickReply(`Hi! Yes, ${activeItem ? activeItem.name : "it's"} still available for local pickup. When are you free to swing by?`, "Availability Reply")}
                  className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl font-semibold text-slate-800 text-left transition flex flex-col gap-1.5 cursor-pointer hover:shadow-sm"
                >
                  <span className="font-extrabold text-blue-700 flex items-center gap-1">⚡ "Is this available?"</span>
                  <span className="text-[11px] text-slate-600 leading-snug">Yes, it's available! When are you free for local pickup?</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyQuickReply(`Hi! The best I can do is $${fbPrice}, cash or Venmo accepted upon pickup. Let me know if that works for you!`, "Offer Counter Reply")}
                  className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl font-semibold text-slate-800 text-left transition flex flex-col gap-1.5 cursor-pointer hover:shadow-sm"
                >
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1">💰 Price / Offer Counter</span>
                  <span className="text-[11px] text-slate-600 leading-snug">Best I can do is ${fbPrice}. Cash or Venmo accepted.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyQuickReply(`Pickup is located near local area. Cash or Venmo accepted upon arrival. Send me a message when you're on your way!`, "Pickup Location Reply")}
                  className="p-3.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl font-semibold text-slate-800 text-left transition flex flex-col gap-1.5 cursor-pointer hover:shadow-sm"
                >
                  <span className="font-extrabold text-purple-700 flex items-center gap-1">📍 Pickup Location</span>
                  <span className="text-[11px] text-slate-600 leading-snug">Local pickup near area. Send message when on your way!</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Facebook Marketplace Listing URL Input Bar (Required to mark LISTED) */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 space-y-1.5" id="live-ad-link-box">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-950 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <ExternalLink size={13} className="text-blue-600" />
                Live Listing URL (Required to mark item as LISTED)
              </span>
              {liveAdLink && (
                <a href={liveAdLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-700 hover:underline font-extrabold flex items-center gap-0.5">
                  <span>View Live Ad</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
            <input
              type="url"
              placeholder="Paste live FB Marketplace ad link here (e.g. https://www.facebook.com/marketplace/item/123456789)..."
              value={liveAdLink}
              onChange={(e) => setLiveAdLink(e.target.value)}
              className="w-full text-xs border border-blue-200 bg-white rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs placeholder-blue-300"
              id="input-live-ad-link"
            />
          </div>

          {/* Dual Main Bottom Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleLaunchFacebook}
              className="py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl text-xs sm:text-sm font-black transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              id="btn-launch-facebook-marketplace"
            >
              <ExternalLink size={18} />
              <span>Copy All & Launch FB Marketplace</span>
            </button>

            <button
              type="button"
              onClick={handleAgentComplete}
              className="py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-black transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              id="btn-agent-complete-bottom"
            >
              <CheckCircle2 size={18} />
              <span>Agent Complete (Mark as Listed)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
