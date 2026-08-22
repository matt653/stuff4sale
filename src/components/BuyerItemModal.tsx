import React, { useState, useEffect } from "react";
import { 
  X, ChevronLeft, ChevronRight, DollarSign, Tag, CheckCircle2, 
  MapPin, Share2, MessageCircle, Send, Phone, Mail, 
  ExternalLink, Copy, Check, Sparkles, Layers, ShieldCheck, 
  Eye, ShoppingBag, ArrowRight, AlertCircle, Play, Smartphone, MessageSquare
} from "lucide-react";
import { InventoryItem } from "../types";
import { supabase } from "../supabase";

interface BuyerItemModalProps {
  item: InventoryItem;
  allItems?: InventoryItem[];
  onClose: () => void;
  onSelectAnotherItem?: (item: InventoryItem) => void;
}

export default function BuyerItemModal({ item, allItems = [], onClose, onSelectAnotherItem }: BuyerItemModalProps) {
  // Photo gallery state
  const photosList: string[] = Array.isArray(item.photos) && item.photos.length > 0
    ? item.photos
    : item.photoUrl
    ? [item.photoUrl]
    : [];

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  // Offer / Inquiry form state
  const askingPrice = item.listedPrice || item.purchasePrice || 0;
  const [offerAmount, setOfferAmount] = useState<string>(askingPrice > 0 ? String(askingPrice) : "");
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [pickupPreference, setPickupPreference] = useState<"pickup" | "shipping">("pickup");
  const [buyerNote, setBuyerNote] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerSubmitted, setOfferSubmitted] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Reset active photo index if item changes
  useEffect(() => {
    setActivePhotoIdx(0);
    setOfferSubmitted(false);
    setOfferError(null);
    setOfferAmount(askingPrice > 0 ? String(askingPrice) : "");
    setBuyerNote(`Hi! I'm interested in Stock #${item.stockNumber || item.id} (${item.name}). Is it still available for local pickup?`);
  }, [item]);

  // Handle keyboard navigation for photos & escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && photosList.length > 1) {
        setActivePhotoIdx((prev) => (prev + 1) % photosList.length);
      }
      if (e.key === "ArrowLeft" && photosList.length > 1) {
        setActivePhotoIdx((prev) => (prev - 1 + photosList.length) % photosList.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photosList.length, onClose]);

  // Generate shareable direct link to this specific item
  const getItemDirectUrl = () => {
    const origin = window.location.origin;
    const stockParam = item.stockNumber || item.id;
    return `${origin}/catalog?item=${encodeURIComponent(stockParam)}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getItemDirectUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyDetails = () => {
    const text = `📦 Stock #${item.stockNumber || item.id}: ${item.name}
💰 Price: $${askingPrice}
📂 Category: ${item.category}
📝 Description:
${item.notes || "Available for local pickup."}

🔗 View full photo gallery: ${getItemDirectUrl()}`;
    navigator.clipboard.writeText(text);
    setCopiedDetails(true);
    setTimeout(() => setCopiedDetails(false), 2500);
  };

  // Get configured seller phone from localStorage or env
  const sellerPhone = localStorage.getItem("stuff4sale_seller_phone") || (import.meta as any).env?.VITE_SELLER_PHONE || "";

  // Submit Offer / Buyer Inquiry to Supabase
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOffer(true);
    setOfferError(null);

    try {
      const currentInquiries = item.buyerInquiriesCount || 0;
      const timeStr = new Date().toLocaleString();

      const offerSummary = `\n\n--- 📥 NEW BUYER OFFER RECEIVED (${timeStr}) ---\n👤 Buyer Name: ${buyerName}\n📱 Phone/Contact: ${buyerContact}\n💰 Offer Amount: $${offerAmount} (Asking Price: $${askingPrice})\n📝 Question/Note: ${buyerNote || "None"}\n---`;

      const updatedNotes = (item.notes || "") + offerSummary;
      const updatedSourcingLoc = `OFFER: $${offerAmount} from ${buyerName} (${buyerContact})`;

      // Update Supabase Stuff4Sale record with full offer details
      const { error } = await supabase
        .from("Stuff4Sale")
        .update({
          buyer_inquiries_count: currentInquiries + 1,
          last_inquiry_at: new Date().toISOString(),
          notes: updatedNotes,
          sourcing_location: updatedSourcingLoc,
          updated_at: new Date().toISOString(),
        })
        .eq("id", Number(item.id));

      if (error) {
        console.warn("Supabase inquiry update error:", error);
      }

      setOfferSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting offer:", err);
      setOfferError(err.message || "Failed to submit offer. Please contact seller directly.");
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Check if item is bundled with other inventory items
  const bundledItems = allItems.filter(
    (i) => item.bundledItemIds && item.bundledItemIds.includes(i.id) && i.id !== item.id
  );

  // Parse structured description sections if available
  const parsedSections = React.useMemo(() => {
    const text = item.notes || "";
    if (!text) return null;

    const sections: { title: string; icon: string; content: string }[] = [];

    // Check for standard 5-part section markers
    const parts = text.split(/(?=📌|💡|⚠️|📏|🚀|---)/g);
    if (parts.length > 1) {
      parts.forEach((p) => {
        const trimmed = p.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("📌") || trimmed.toLowerCase().includes("what it is")) {
          sections.push({ title: "What It Is & Original Use", icon: "📌", content: trimmed.replace(/^📌[^\n]*\n?/, "").trim() });
        } else if (trimmed.startsWith("💡") || trimmed.toLowerCase().includes("modern use")) {
          sections.push({ title: "Modern Uses & Styling / Decor", icon: "💡", content: trimmed.replace(/^💡[^\n]*\n?/, "").trim() });
        } else if (trimmed.startsWith("⚠️") || trimmed.toLowerCase().includes("condition")) {
          sections.push({ title: "Condition & Observed Facts", icon: "⚠️", content: trimmed.replace(/^⚠️[^\n]*\n?/, "").trim() });
        } else if (trimmed.startsWith("📏") || trimmed.toLowerCase().includes("specs") || trimmed.toLowerCase().includes("measurement")) {
          sections.push({ title: "Specs, Materials & Measurements", icon: "📏", content: trimmed.replace(/^📏[^\n]*\n?/, "").trim() });
        } else if (trimmed.startsWith("🚀") || trimmed.toLowerCase().includes("seller note") || trimmed.toLowerCase().includes("great deal")) {
          sections.push({ title: "Why This Is A Great Deal & Seller Note", icon: "🚀", content: trimmed.replace(/^🚀[^\n]*\n?/, "").trim() });
        } else {
          sections.push({ title: "Item Notes", icon: "📝", content: trimmed });
        }
      });
      return sections.length > 0 ? sections : null;
    }
    return null;
  }, [item.notes]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
      id="buyer-item-popup-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] transition-all relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
              #{item.stockNumber || item.id}
            </span>
            <div className="truncate">
              <h2 className="font-extrabold text-slate-900 text-sm sm:text-base truncate" title={item.name}>
                {item.name}
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">
                {item.category} • In Stock & Available
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Share Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              title="Copy direct share link to this item"
              id="btn-copy-item-share-link"
            >
              {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
              <span className="hidden sm:inline">{copiedLink ? "Link Copied!" : "Share"}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Close modal (Esc)"
              id="btn-close-buyer-modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Grid: Left Column = Photos & Gallery / Right Column = Details & Make Offer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Photo Gallery & Remaining Pictures */}
            <div className="lg:col-span-7 space-y-3">
              {/* Primary Active Photo Viewer */}
              <div className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl bg-slate-900 overflow-hidden border border-slate-200 flex items-center justify-center group shadow-inner">
                {photosList.length > 0 ? (
                  <img
                    src={photosList[activePhotoIdx]}
                    alt={`${item.name} - photo ${activePhotoIdx + 1}`}
                    className="w-full h-full object-contain select-none transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-8 text-slate-400">
                    <ShoppingBag size={48} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs">No photos uploaded for this item yet.</p>
                  </div>
                )}

                {/* Stock # Overlay Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white text-xs font-black px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
                  Stock #{item.stockNumber || item.id}
                </div>

                {/* Photo Counter Pill */}
                {photosList.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/15">
                    {activePhotoIdx + 1} / {photosList.length} Photos
                  </div>
                )}

                {/* Left / Right Arrow Navigation Overlays */}
                {photosList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIdx((prev) => (prev - 1 + photosList.length) % photosList.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition opacity-80 hover:opacity-100 shadow-md cursor-pointer"
                      title="Previous photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIdx((prev) => (prev + 1) % photosList.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition opacity-80 hover:opacity-100 shadow-md cursor-pointer"
                      title="Next photo"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Remaining Photos Thumbnail Strip */}
              {photosList.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                    <span>All Photos ({photosList.length}):</span>
                    <span className="text-slate-400">Click any thumbnail to preview</span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 overflow-x-auto pb-1" id="buyer-remaining-photos-thumbnails">
                    {photosList.map((photoUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          activePhotoIdx === idx
                            ? "border-indigo-600 ring-2 ring-indigo-500/30 scale-95 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={photoUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {activePhotoIdx === idx && (
                          <div className="absolute inset-0 bg-indigo-600/10" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Clip Player (if present) */}
              {item.videoUrl && (
                <div className="bg-slate-900 rounded-2xl p-3 text-white space-y-2 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <Play size={14} className="fill-indigo-400" />
                    <span>Watch Video Walkthrough</span>
                  </div>
                  <video
                    src={item.videoUrl}
                    controls
                    className="w-full rounded-xl max-h-64 bg-black"
                  />
                </div>
              )}

              {/* Trust & Local Hand-Off Guarantee Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Buyer Satisfaction & Safe Pickup Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>100% Real Pictures of Actual Item</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Cash, Venmo & Zelle Accepted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Local Porch / Safe Public Pickup</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Inspect In Person Before Paying</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Pricing, Description & Make Offer Form */}
            <div className="lg:col-span-5 space-y-4">
              {/* Pricing & Availability Banner */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 p-4.5 rounded-2xl space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2.5 py-0.5 rounded-full">
                    {item.status === "listed" ? "Listed & Available" : "In Stock Now"}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    Stock #{item.stockNumber || item.id}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block">Asking Price:</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      ${askingPrice > 0 ? askingPrice : "Make Offer"}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-800 font-bold bg-white/80 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs">
                    💵 Cash / Local Deal
                  </span>
                </div>

                {item.bundleTitle && (
                  <div className="pt-2 border-t border-emerald-200/80 flex items-center gap-1.5 text-xs text-purple-900 font-bold">
                    <Layers size={14} className="text-purple-600" />
                    <span>Part of: {item.bundleTitle}</span>
                  </div>
                )}
              </div>

              {/* Bundled Items Breakdown (if this item is a bundle deal) */}
              {bundledItems.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                      <Layers size={14} className="text-purple-600" />
                      Includes {bundledItems.length + 1} Bundled Items:
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
                    {bundledItems.map((bItem) => (
                      <div 
                        key={bItem.id} 
                        onClick={() => onSelectAnotherItem && onSelectAnotherItem(bItem)}
                        className="p-2 rounded-xl bg-white border border-purple-100 hover:border-purple-300 flex items-center justify-between text-xs cursor-pointer transition shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            #{bItem.stockNumber || bItem.id}
                          </span>
                          <span className="font-bold text-slate-800 truncate">{bItem.name}</span>
                        </div>
                        <span className="font-extrabold text-purple-700 shrink-0 ml-2">
                          ${bItem.listedPrice || bItem.purchasePrice || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAKE OFFER / MESSAGE SELLER INTERACTIVE TOOL */}
              <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4.5 space-y-3.5 shadow-md" id="buyer-make-offer-box">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Make an Offer / Message Seller</h3>
                      <p className="text-[11px] text-slate-400">Direct response from local seller</p>
                    </div>
                  </div>
                </div>

                {offerSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3 text-center animate-fade-in">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Check size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-emerald-950">Offer & Message Sent!</h4>
                      <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                        Your inquiry for **Stock #{item.stockNumber || item.id}** (${offerAmount || askingPrice}) has been sent directly to the seller!
                      </p>
                    </div>

                    {/* Instant Fallback Contact Buttons */}
                    <div className="pt-2 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Want an instant response? Contact now:
                      </p>
                      
                      {item.listingUrl && (
                        <a
                          href={item.listingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                        >
                          <MessageCircle size={15} />
                          <span>Message on Facebook Listing</span>
                          <ExternalLink size={12} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyDetails}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <Copy size={13} />
                        <span>{copiedDetails ? "Copied to Clipboard!" : "Copy Details to Send via Text / Chat"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOfferSubmitted(false)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 underline pt-1 block mx-auto"
                      >
                        Submit another question / offer
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitOffer} className="space-y-3">
                    {/* Direct Seller Call / Text Line */}
                    {sellerPhone && (
                      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <Smartphone size={13} className="text-indigo-600" />
                            <span>Direct Seller Line</span>
                          </span>
                          <span className="text-xs font-black text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs font-mono">
                            {sellerPhone}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <a
                            href={`sms:${sellerPhone.replace(/\D/g, "")}?body=${encodeURIComponent(`Hi! I am interested in Stock #${item.stockNumber || item.id}: ${item.name}`)}`}
                            className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 text-center"
                          >
                            <MessageSquare size={13} />
                            <span>Text Seller</span>
                          </a>
                          <a
                            href={`tel:${sellerPhone.replace(/\D/g, "")}`}
                            className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 text-center"
                          >
                            <Phone size={13} />
                            <span>Call Seller</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Offer Price Input */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Your Offer Amount ($)
                      </label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-3 text-indigo-600 font-bold" />
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          placeholder="Enter offer amount..."
                          className="w-full text-xs font-black border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                          id="input-buyer-offer-amount"
                        />
                      </div>
                    </div>

                    {/* Name & Contact Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="e.g. Mike S."
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-white"
                          id="input-buyer-name"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={buyerContact}
                          onChange={(e) => setBuyerContact(e.target.value)}
                          placeholder="Your phone number..."
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-white"
                          id="input-buyer-contact"
                        />
                      </div>
                    </div>

                    {/* Message Textarea */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Note / Pickup Question for Seller
                      </label>
                      <textarea
                        rows={2}
                        value={buyerNote}
                        onChange={(e) => setBuyerNote(e.target.value)}
                        placeholder="Ask about pickup time, condition, or bundle deals..."
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-white"
                        id="input-buyer-note"
                      />
                    </div>

                    {offerError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{offerError}</span>
                      </div>
                    )}

                    {/* Submit Offer Button */}
                    <button
                      type="submit"
                      disabled={submittingOffer}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      id="btn-submit-buyer-offer"
                    >
                      <Send size={14} />
                      <span>{submittingOffer ? "Sending Inquiry..." : `Send Offer ($${offerAmount || askingPrice}) to Seller`}</span>
                    </button>

                    {/* Direct Facebook Marketplace Link if available */}
                    {item.listingUrl && (
                      <a
                        href={item.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-blue-200 transition text-center"
                      >
                        <MessageCircle size={14} className="text-blue-600" />
                        <span>View & Message on Live Facebook Listing</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </form>
                )}
              </div>

              {/* Copy Details Shortcut */}
              <button
                type="button"
                onClick={handleCopyDetails}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedDetails ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedDetails ? "Copied Details to Clipboard!" : "Copy Item Summary to Clipboard"}</span>
              </button>
            </div>
          </div>

          {/* FULL DESCRIPTION & SPECS SECTION (Customer-Facing Breakdown) */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Tag size={18} className="text-indigo-600" />
              <span>Full Item Details & Description</span>
            </h3>

            {parsedSections ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedSections.map((sec, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-2xl border space-y-1.5 ${
                      sec.title.includes("Condition") 
                        ? "bg-amber-50/60 border-amber-200/80 md:col-span-2" 
                        : sec.title.includes("Great Deal")
                        ? "bg-emerald-50/60 border-emerald-200/80 md:col-span-2"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                      <span>{sec.icon}</span>
                      <span>{sec.title}</span>
                    </h4>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {item.notes || "High quality pre-owned item available for local pickup. In clean, good condition."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-500">
            Stock #{item.stockNumber || item.id} • {item.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
