import React, { useState } from "react";
import { Sparkles, Copy, Check, FileText, DollarSign, RefreshCw, Star, Tag, ThumbsUp, Send, MessageSquare, AlertCircle, Zap, MapPin, ListChecks, Store, ShoppingBag, Sliders, ChevronDown, ChevronUp, Search, ExternalLink } from "lucide-react";
import { AIResearchResult, AIChatMessage } from "../types";

interface AIResearchViewProps {
  research: AIResearchResult | null;
  photos?: string[];
  itemName?: string;
  itemNotes?: string;
  onApplyAll?: (research: AIResearchResult) => void;
  onApplyField?: (fieldName: "name" | "notes" | "listedPrice" | "category", value: any) => void;
  isLoading: boolean;
  error: string | null;
}

export default function AIResearchView({
  research,
  photos = [],
  itemName = "",
  itemNotes = "",
  onApplyAll,
  onApplyField,
  isLoading: externalLoading,
  error: externalError
}: AIResearchViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [priceSliderPos, setPriceSliderPos] = useState(50);
  const [showAllTiers, setShowAllTiers] = useState(false);
  const [finalReport, setFinalReport] = useState<AIResearchResult | null>(research);
  const [flawResponses, setFlawResponses] = useState<Record<number, string>>({});

  // Step 3 Local Comps State (Initializes from saved research.localComps if available)
  const [localComps, setLocalComps] = useState<any | null>(
    research?.localComps || null
  );
  const [isCompsLoading, setIsCompsLoading] = useState(false);
  const [compsError, setCompsError] = useState<string | null>(null);

  const handleFetchLocalComps = async () => {
    setIsCompsLoading(true);
    setCompsError(null);
    try {
      const report = finalReport || research;
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "";
      const res = await fetch("/api/comps", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(apiKey ? { "x-gemini-api-key": apiKey } : {})
        },
        body: JSON.stringify({
          name: report?.suggestedTitle || itemName,
          category: report?.category || "General",
          notes: itemNotes,
          image: photos[0] || null,
          images: photos
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || "Failed to fetch local comps analysis.");
      }
      const data = await res.json();
      setLocalComps(data);

      // Auto-save localComps into report and sync to item state
      if (report) {
        const updatedReport: AIResearchResult = {
          ...report,
          localComps: data
        };
        setFinalReport(updatedReport);
        if (onApplyAll) {
          onApplyAll(updatedReport);
        }
      }
    } catch (err: any) {
      console.error(err);
      setCompsError(err.message || "Could not fetch local comps.");
    } finally {
      setIsCompsLoading(false);
    }
  };

  const handleGenerateDetails = () => {
    const report = finalReport || research;
    if (!report || !onApplyAll) return;

    const flaws = report.issuesFound || report.cleaningInstructions || [];
    let compiledDesc = report.suggestedDescription || "";

    if (flaws.length > 0) {
      const conditionBlockLines = flaws.map((issue, idx) => {
        const userResp = flawResponses[idx]?.trim();
        return userResp ? `• ${issue}\n  👉 Seller Clarification: ${userResp}` : `• ${issue}`;
      });

      if (!compiledDesc.toLowerCase().includes("flaw") && !compiledDesc.toLowerCase().includes("issue")) {
        compiledDesc += "\n\n⚠️ Condition & Seller Clarifications:\n" + conditionBlockLines.join("\n");
      } else {
        const respondedLines = conditionBlockLines.filter((_, idx) => Boolean(flawResponses[idx]?.trim()));
        if (respondedLines.length > 0) {
          compiledDesc += "\n\n📌 Additional Seller Condition Clarifications:\n" + respondedLines.join("\n");
        }
      }
    }

    onApplyAll({
      ...report,
      suggestedDescription: compiledDesc,
      localComps: localComps || report.localComps
    });
  };
  
  // Conversational Chat State
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Start or Continue AI Valuation Chat
  const handleSendChatMessage = async (userText?: string | React.MouseEvent, isFinal = false) => {
    const textToSend = (typeof userText === "string" ? userText : chatInput);
    if (!textToSend && photos.length === 0 && !itemName && !isFinal) {
      setChatError("Please take a photo or enter a quick item name to start valuation chat.");
      return;
    }

    setIsChatLoading(true);
    setChatError(null);

    const updatedHistory: AIChatMessage[] = textToSend ? [
      ...messages,
      {
        id: Date.now().toString(),
        sender: "user",
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ] : messages;

    if (textToSend) setMessages(updatedHistory);
    setChatInput("");

    try {
      const res = await fetch("/api/valuation-chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "",
        },
        body: JSON.stringify({
          name: itemName,
          notes: itemNotes,
          images: photos,
          history: updatedHistory,
          generateFinalReport: isFinal
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to communicate with Gemini AI.");
      }

      const data = await res.json();

      if (data.responseType === "REPORT" && data.report) {
        const reportResult: AIResearchResult = data.report;
        setFinalReport(reportResult);

        // Append final AI report message
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: data.aiMessage || "Final Sourcing & Valuation Report generated!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            report: reportResult
          }
        ]);

        if (onApplyAll) {
          onApplyAll(reportResult);
        }
      } else {
        // Question response with quick replies
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: data.aiMessage || "Can you provide a quick condition update?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickReplies: data.suggestedQuickReplies || []
          }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setChatError(err.message || "Failed to connect to AI valuation chat.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const activeReport = finalReport || research;

  const getDemandColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500";
    if (score >= 5) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getDemandLabel = (score: number) => {
    if (score >= 8) return "High Demand (Flips Fast)";
    if (score >= 5) return "Medium Demand (Consistent Sales)";
    return "Low Demand (Patience Needed)";
  };

  const verdict = activeReport?.worthSelling || (activeReport && activeReport.estimatedValueMin >= 20 && activeReport.demandScore >= 5 ? "YES" : activeReport && activeReport.estimatedValueMin >= 10 ? "MARGINAL" : "NO");

  return (
    <div className="bg-gradient-to-br from-indigo-50/40 via-purple-50/10 to-white border border-indigo-100 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4" id="ai-research-view">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Gemini Valuation Chat & Inspector</h4>
            <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase">Interactive Condition Check</span>
          </div>
        </div>

        {activeReport && onApplyAll && (
          <button
            type="button"
            onClick={() => onApplyAll(activeReport)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
            id="btn-apply-all-research"
          >
            Apply All to Form
          </button>
        )}
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin" id="valuation-chat-stream">
        {messages.length === 0 ? (
          <div className="bg-white/80 border border-indigo-100 rounded-2xl p-4 text-center space-y-2">
            <MessageSquare size={24} className="mx-auto text-indigo-500 animate-pulse" />
            <h5 className="text-xs font-bold text-slate-800">Start AI Valuation Chat</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
              Click <b>"💬 Start AI Valuation Chat"</b> below. Gemini will examine your photos and ask 1-2 condition questions before generating your final valuation report!
            </p>
            <button
              type="button"
              disabled={isChatLoading || externalLoading}
              onClick={() => handleSendChatMessage("Analyze this item and ask any condition questions needed before valuation.")}
              className="mt-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
              id="btn-start-ai-chat"
            >
              {isChatLoading ? <RefreshCw size={14} className="animate-spin inline mr-1" /> : <Sparkles size={14} className="inline mr-1" />}
              💬 Start AI Valuation Chat
            </button>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1.5`}
            >
              <div
                className={`max-w-[88%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-br-none shadow-xs"
                    : "bg-white border border-indigo-100 text-slate-800 rounded-bl-none shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] opacity-75 mb-1 font-bold">
                  <span>{msg.sender === "user" ? "You" : "Gemini AI Inspector"}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Quick Reply Chips */}
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-2 pt-0.5">
                  {msg.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isChatLoading}
                      onClick={() => handleSendChatMessage(reply)}
                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-[11px] font-bold px-2.5 py-1 rounded-full transition active:scale-95 shadow-2xs cursor-pointer"
                    >
                      💬 {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {isChatLoading && (
          <div className="flex items-center gap-2 p-3 bg-white border border-indigo-100 rounded-2xl text-xs text-indigo-700 animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            <span>Gemini is inspecting item & thinking...</span>
          </div>
        )}

        {(chatError || externalError) && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{chatError || externalError}</span>
          </div>
        )}
      </div>

      {/* CHAT INPUT BAR & FINAL REPORT TRIGGER */}
      {messages.length > 0 && !activeReport && (
        <div className="space-y-2 pt-2 border-t border-indigo-100/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Answer condition question (e.g. Works great, no battery corrosion)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>

          <button
            type="button"
            disabled={isChatLoading}
            onClick={() => handleSendChatMessage(undefined, true)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Sparkles size={14} />
            Generate Final Valuation Report
          </button>
        </div>
      )}

      {/* FINAL VALUATION REPORT CARD */}
      {activeReport && (
        <div className="space-y-4 pt-2 border-t border-indigo-100/60 animate-fade-in" id="final-valuation-report">
          
          {/* NATIONAL VS LOCAL STRATEGY BANNER */}
          {activeReport.sellOnNationalLevel || activeReport.recommendedSellLevel === "NATIONAL_EBAY" ? (
            <div className="p-4 bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white rounded-2xl shadow-lg border-2 border-rose-300 space-y-2 animate-bounce-subtle" id="banner-national-sale">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">🚨</span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-200">
                    NATIONAL SALE RECOMMENDED — DO NOT SELL LOCALLY!
                  </h3>
                  <p className="text-xs font-bold text-rose-100 mt-1 leading-relaxed">
                    {activeReport.nationalSaleReason || "This item has high nationwide collector demand on eBay, but virtually zero local interest. Ship this item nationally on eBay to command top dollar!"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-2xl shadow-md border border-emerald-400/40 flex items-center justify-between" id="banner-local-sale">
              <div className="flex items-center gap-2.5">
                <span className="text-xl shrink-0">🟢</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-emerald-100">
                    SELL LOCALLY ON FACEBOOK MARKETPLACE
                  </h4>
                  <p className="text-[11px] font-semibold text-emerald-200">
                    Local cash deal recommended. Fast cash turnaround without shipping friction!
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ml-2">
                FB Local Priority
              </span>
            </div>
          )}

          {/* Sourcing Verdict Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
            verdict === "YES"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : verdict === "MARGINAL"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                Sourcing Verdict
              </span>
              <h4 className="font-extrabold text-sm">
                {verdict === "YES"
                  ? "🚀 WORTH SELLING! (Great Flip Opportunity)"
                  : verdict === "MARGINAL"
                  ? "⚠️ MARGINAL FIND - Low Margin / Slower Sale"
                  : "🛑 SCRAP / PASS IT - Low Value / Bulky to Ship"}
              </h4>
              {activeReport.triageReason && (
                <p className="text-xs font-medium opacity-90 mt-1">
                  {activeReport.triageReason}
                </p>
              )}
            </div>

            <div className="text-right shrink-0 ml-2">
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Demand Score</span>
              <span className="text-base font-extrabold">{activeReport.demandScore}/10</span>
            </div>
          </div>

          {/* INTEGRATED FB MARKETPLACE LOCAL COMPS & EBAY COMPS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="comps-breakdown-grid">
            {/* FB Marketplace Local Comps Card */}
            <div className="bg-gradient-to-br from-blue-900/90 to-indigo-950 text-white p-3.5 rounded-2xl border border-blue-400/30 space-y-2 shadow-md">
              <div className="flex items-center justify-between border-b border-blue-400/20 pb-1.5">
                <span className="text-xs font-black text-blue-200 flex items-center gap-1">
                  <span>🔵</span> FB Marketplace Local Comps
                </span>
                <span className="text-xs font-black text-emerald-400">
                  ${activeReport.localComps?.estimatedLocalMin || activeReport.estimatedValueMin} – ${activeReport.localComps?.estimatedLocalMax || activeReport.estimatedValueMax}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-200 font-bold">Local Cash Demand: <b className="text-white font-black">{activeReport.localComps?.localDemandScore || activeReport.demandScore}/10</b></span>
                <span className="text-emerald-300 font-bold">{activeReport.localComps?.sellThroughVelocity || "Fast (3-7 days)"}</span>
              </div>
              {activeReport.localComps?.localTips && activeReport.localComps.localTips.length > 0 && (
                <p className="text-[10px] text-blue-100/90 leading-tight pt-1 border-t border-blue-400/20">
                  💡 {activeReport.localComps.localTips[0]}
                </p>
              )}
            </div>

            {/* eBay National Comps Card */}
            <div className="bg-gradient-to-br from-purple-900/90 to-slate-950 text-white p-3.5 rounded-2xl border border-purple-400/30 space-y-2 shadow-md">
              <div className="flex items-center justify-between border-b border-purple-400/20 pb-1.5">
                <span className="text-xs font-black text-purple-200 flex items-center gap-1">
                  <span>📦</span> eBay National Comps
                </span>
                <span className="text-xs font-black text-amber-300">
                  ${activeReport.ebayComps?.estimatedEbayMin || activeReport.estimatedValueMin} – ${activeReport.ebayComps?.estimatedEbayMax || activeReport.estimatedValueMax}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-purple-200 font-bold">eBay Demand: <b className="text-white font-black">{activeReport.ebayComps?.ebayDemandScore || activeReport.demandScore}/10</b></span>
                <span className="text-purple-200 font-bold truncate max-w-[130px]">{activeReport.ebayComps?.shippingFeasibility || "Standard Shipping"}</span>
              </div>
              {activeReport.ebayComps?.ebayTips && activeReport.ebayComps.ebayTips.length > 0 && (
                <p className="text-[10px] text-purple-100/90 leading-tight pt-1 border-t border-purple-400/20">
                  💡 {activeReport.ebayComps.ebayTips[0]}
                </p>
              )}
            </div>
          </div>

          {/* Merged Resell Valuation & Demand Score Card with 5-Tier Reselling Strategy Engine */}
          {(() => {
            const minVal = Number(activeReport.estimatedValueMin) || 0;
            const maxVal = Number(activeReport.estimatedValueMax) || 0;
            const currentPriceFromSlider = minVal > 0 && maxVal > 0 
              ? Math.round(minVal + (priceSliderPos / 100) * (maxVal - minVal))
              : (maxVal || minVal || 35);

            // Determine active tier index (0..4)
            const activeTierIndex = 
              priceSliderPos <= 20 ? 0 :
              priceSliderPos <= 40 ? 1 :
              priceSliderPos <= 60 ? 2 :
              priceSliderPos <= 80 ? 3 : 4;

            // Category & attribute-aware dynamic fallback generator
            const catLower = (activeReport.category || "").toLowerCase();
            const titleLower = (activeReport.suggestedTitle || "").toLowerCase();

            const isHeavyOrBulky = catLower.includes("tool") || catLower.includes("decor") || catLower.includes("furniture") || titleLower.includes("table") || titleLower.includes("saw") || titleLower.includes("mower") || titleLower.includes("bench") || titleLower.includes("stand");
            const isCollectibleOrSmall = catLower.includes("toy") || catLower.includes("card") || catLower.includes("apparel") || catLower.includes("shoe") || catLower.includes("vintage") || catLower.includes("game") || catLower.includes("media") || catLower.includes("jewelry");

            const getDynamicFallbackWhere = (tierIdx: number) => {
              if (isHeavyOrBulky) {
                return tierIdx === 0
                  ? "Facebook Marketplace local pickup or OfferUp (Priced low for fast local cash pick up within 24h; shipping NOT recommended due to heavy weight)"
                  : tierIdx === 4
                  ? "Facebook Marketplace & Craigslist local pickup (Highlight condition & brand; local pickup only due to heavy freight costs)"
                  : "Facebook Marketplace local pickup & OfferUp (Local buyer pool)";
              }
              if (isCollectibleOrSmall) {
                return tierIdx === 0
                  ? "eBay 3-day Auction starting low, Mercari, or Poshmark (Local demand may be dead, national shipping gets instant collector eyes)"
                  : tierIdx === 4
                  ? "eBay Buy-It-Now with Best Offer, specialized collector forums, Mercari, or Poshmark (National shipping reaches true collectors)"
                  : "Cross-list on eBay, Mercari / Poshmark, and Facebook Marketplace";
              }
              return tierIdx === 0
                ? "Facebook Marketplace local pickup, OfferUp, or quick eBay auction"
                : tierIdx === 4
                ? "eBay Buy-It-Now with Best Offer, Mercari, or specialized resale sites"
                : "Cross-list on eBay & Facebook Marketplace";
            };

            // Tier Metadata definitions for 5 tiers
            const tierMeta = [
              {
                id: 0,
                pct: "100%",
                name: "Low End (Sell Immediately)",
                sliderVal: 0,
                bgBadge: "bg-emerald-600 text-white",
                borderActive: "border-emerald-500 bg-emerald-50/40",
                icon: "⚡",
                defaultPrice: minVal,
                defaultWhere: getDynamicFallbackWhere(0),
                defaultHow: "List as-is with quick basic photos. Price low for instant turnaround. Minimal prep or cleaning required."
              },
              {
                id: 1,
                pct: "75%",
                name: "1/4 Tier (Fast Flip)",
                sliderVal: 25,
                bgBadge: "bg-blue-600 text-white",
                borderActive: "border-blue-500 bg-blue-50/40",
                icon: "🚀",
                defaultPrice: Math.round(minVal + 0.25 * (maxVal - minVal)),
                defaultWhere: getDynamicFallbackWhere(1),
                defaultHow: "Wipe down item, take 3-4 clear photos, list at competitive price for a 2-4 day turnaround."
              },
              {
                id: 2,
                pct: "50%",
                name: "Mid End (Fair Market)",
                sliderVal: 50,
                bgBadge: "bg-indigo-600 text-white",
                borderActive: "border-indigo-500 bg-indigo-50/40",
                icon: "⚖️",
                defaultPrice: Math.round(minVal + 0.50 * (maxVal - minVal)),
                defaultWhere: getDynamicFallbackWhere(2),
                defaultHow: "Clean thoroughly, detail model & condition flaws in description, offer standard shipping or local pickup."
              },
              {
                id: 3,
                pct: "25%",
                name: "3/4 Tier (Patient Sale)",
                sliderVal: 75,
                bgBadge: "bg-amber-600 text-white",
                borderActive: "border-amber-500 bg-amber-50/40",
                icon: "⏳",
                defaultPrice: Math.round(minVal + 0.75 * (maxVal - minVal)),
                defaultWhere: getDynamicFallbackWhere(3),
                defaultHow: "Take studio quality photos with plain backdrop, use exact SEO keywords in title, list at patient ask price for a 2-4 week hold."
              },
              {
                id: 4,
                pct: "1%",
                name: "High End (Top Dollar Collector)",
                sliderVal: 100,
                bgBadge: "bg-rose-600 text-white",
                borderActive: "border-rose-500 bg-rose-50/40",
                icon: "🛑",
                defaultPrice: maxVal,
                defaultWhere: getDynamicFallbackWhere(4),
                defaultHow: "Deep clean/restore, document all serial numbers & maker marks, provide detailed testing proof/video, offer free shipping/returns, and hold out for a top-dollar collector."
              }
            ];

            const explicitTiers = activeReport.pricingTiers || [];

            // Compile resolved details for all 5 tiers
            const resolvedTiers = tierMeta.map((t, idx) => {
              const explicit = explicitTiers[idx];
              return {
                ...t,
                tierName: explicit?.tierName || t.name,
                percentageLabel: explicit?.percentageLabel || t.pct,
                price: explicit?.price || t.defaultPrice || currentPriceFromSlider,
                whereToList: explicit?.whereToList || t.defaultWhere,
                howToList: explicit?.howToList || t.defaultHow,
              };
            });

            const activeTier = resolvedTiers[activeTierIndex];

            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                {/* Header: Resell Valuation & Demand */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-0.5">
                      <DollarSign size={14} className="text-indigo-600" />
                      Resell Price Valuation Range
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">${minVal}</span>
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">to</span>
                      <span className="text-2xl font-black text-slate-900">${maxVal}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 justify-end mb-0.5">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      Demand Score
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-base font-extrabold text-slate-800">{activeReport.demandScore}/10</span>
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getDemandColor(activeReport.demandScore)}`}
                          style={{ width: `${activeReport.demandScore * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5-Tier Reselling Strategy Engine Container */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-4">
                  {/* Slider Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Zap size={15} className="text-amber-500 fill-amber-500" />
                      5-Tier Pricing Strategy Estimator:
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow-xs ${activeTier.bgBadge}`}>
                      {activeTier.icon} {activeTier.percentageLabel} - {activeTier.tierName} (${activeTier.price})
                    </span>
                  </div>

                  {/* 5 Quick Selector Buttons */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {resolvedTiers.map((t, idx) => {
                      const isActive = idx === activeTierIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPriceSliderPos(t.sliderVal)}
                          className={`py-1.5 px-1 rounded-xl text-center transition flex flex-col items-center justify-center gap-0.5 border ${
                            isActive
                              ? `${t.borderActive} shadow-xs font-extrabold ring-2 ring-indigo-500/20`
                              : "bg-white border-slate-200 hover:bg-slate-100/80 text-slate-600 font-semibold"
                          }`}
                        >
                          <span className="text-[11px] font-black">{t.icon} {t.percentageLabel}</span>
                          <span className="text-[10px] text-slate-900 font-bold">${t.price}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Slider Input */}
                  <div className="space-y-1 pt-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={priceSliderPos}
                      onChange={(e) => setPriceSliderPos(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      id="pricing-strategy-slider"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 px-0.5">
                      <span className="text-emerald-700">100% Sell Immediately (${minVal})</span>
                      <span className="text-indigo-600">50% Mid Fair Comp</span>
                      <span className="text-rose-600">1% Top Dollar (${maxVal})</span>
                    </div>
                  </div>

                  {/* ACTIVE TIER DETAILED STRATEGY CARDS */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs">
                    {/* Active Tier Header Banner */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{activeTier.icon}</span>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                            {activeTier.tierName}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Sell Speed Probability: {activeTier.percentageLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Price</span>
                        <span className="text-lg font-black text-indigo-600">${activeTier.price}</span>
                      </div>
                    </div>

                    {/* WHERE TO LIST IT */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                        <MapPin size={13} className="text-rose-500" />
                        Where Should You Post / List It?
                      </span>
                      <div className="bg-rose-50/60 border border-rose-150 rounded-lg p-2.5 text-xs text-rose-950 font-semibold leading-relaxed">
                        {activeTier.whereToList}
                      </div>
                    </div>

                    {/* HOW TO LIST IT / WHAT YOU NEED TO DO */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                        <ListChecks size={13} className="text-indigo-600" />
                        How to List & What You Need To Do for ${activeTier.price}:
                      </span>
                      <div className="bg-indigo-50/60 border border-indigo-150 rounded-lg p-2.5 text-xs text-indigo-950 font-medium leading-relaxed">
                        {activeTier.howToList}
                      </div>
                    </div>

                    {/* Button to Apply This Tier's Price to Item */}
                    {onApplyField && (
                      <button
                        type="button"
                        onClick={() => onApplyField("listedPrice", activeTier.price)}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition active:scale-98"
                      >
                        <Tag size={13} className="text-amber-400" />
                        Use ${activeTier.price} as My Target Listing Price
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Identified SEO Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 flex items-center gap-1">
                <Tag size={13} className="text-indigo-600" />
                Identified SEO Title ({(activeReport.suggestedTitle || "").length} chars)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(activeReport.suggestedTitle || "", "title")}
                className="text-slate-400 hover:text-slate-600 transition flex items-center gap-0.5 text-[10px]"
              >
                {copiedField === "title" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                {copiedField === "title" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="bg-white border border-slate-150 rounded-xl p-3 text-xs text-slate-700 font-medium tracking-tight">
              {activeReport.suggestedTitle || itemName || "Identified Item"}
            </p>
          </div>

          {/* Issues & Flaws Found Section with Interactive Seller Response Boxes */}
          {((activeReport.issuesFound && activeReport.issuesFound.length > 0) || (activeReport.cleaningInstructions && activeReport.cleaningInstructions.length > 0)) && (
            <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  ⚠️ Issues & Flaws Found
                </h5>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded-full">
                  Type your seller notes below
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {(activeReport.issuesFound || activeReport.cleaningInstructions || []).map((issue, idx) => (
                  <div key={idx} className="bg-white border border-amber-200/70 rounded-xl p-3 space-y-2 shadow-xs">
                    <div className="flex items-start gap-1.5 text-xs text-amber-950 font-bold">
                      <span className="shrink-0 text-amber-500">🔸</span>
                      <span>{issue}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Type your response/clarification (e.g. 'Solid iron, no rust-through', 'Spins smoothly', 'Local pickup only')..."
                      value={flawResponses[idx] || ""}
                      onChange={(e) => setFlawResponses({ ...flawResponses, [idx]: e.target.value })}
                      className="w-full text-xs border border-amber-200 bg-amber-50/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 font-medium"
                      id={`flaw-response-input-${idx}`}
                    />
                  </div>
                ))}
              </div>

              {/* Generate Description Button with Seller Notes & Clarifications */}
              <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="text-[11px] text-amber-900 font-medium leading-tight">
                  <span className="font-bold block text-amber-950">Finished typing seller notes above?</span>
                  <span>Click to compile your notes & flaws directly into the 5-section description!</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateDetails}
                  className="py-2.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                  id="btn-generate-desc-flaws"
                >
                  <Sparkles size={15} className="text-yellow-200 animate-pulse" />
                  <span>✨ Generate Description</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
