import React, { useState } from "react";
import { Sparkles, Copy, Check, FileText, DollarSign, RefreshCw, Star, Tag, ThumbsUp, Send, MessageSquare, AlertCircle, Zap, MapPin, ListChecks, Store, ShoppingBag, Sliders, ChevronDown, ChevronUp, Search, ExternalLink } from "lucide-react";
import { AIResearchResult, AIChatMessage } from "../types";

interface AIResearchViewProps {
  research: any;
  photos?: string[];
  itemName?: string;
  itemNotes?: string;
  onApplyAll?: (research: AIResearchResult) => void;
  onApplyField?: (fieldName: "name" | "notes" | "listedPrice" | "category", value: any) => void;
  isLoading: boolean;
  error: string | null;
  onRunResearch?: (provider: "grok" | "gemini" | "dual") => void;
  engineFilter?: "grok" | "gemini";
}

function SingleValuationColumn({
  title,
  engine,
  report,
  priceSliderPos,
  setPriceSliderPos,
  onApplyField,
  photos = [],
  itemName = ""
}: {
  title: string;
  engine: "grok" | "gemini";
  report: AIResearchResult;
  priceSliderPos: number;
  setPriceSliderPos: (val: number) => void;
  onApplyField?: (fieldName: "name" | "notes" | "listedPrice" | "category", value: any) => void;
  photos?: string[];
  itemName?: string;
}) {
  const minVal = Number(report.estimatedValueMin) || 0;
  const maxVal = Number(report.estimatedValueMax) || 0;
  const verdict = report.worthSelling || (minVal >= 20 && report.demandScore >= 5 ? "YES" : minVal >= 10 ? "MARGINAL" : "NO");

  return (
    <div className="h-full flex flex-col p-4 rounded-2xl border space-y-4 shadow-sm bg-white text-slate-800 border-indigo-200">
      {/* Engine Header */}
      <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
          {engine === "grok" ? "⚡ xAI Grok Evaluation (Primary)" : "✨ Google Gemini Evaluation (2nd Opinion)"}
        </span>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
          engine === "grok" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
        }`}>
          {engine === "grok" ? "xAI Grok" : "Google Gemini"}
        </span>
      </div>

      {/* Priority Banner */}
      {report.sellOnNationalLevel || report.recommendedSellLevel === "NATIONAL_EBAY" ? (
        <div className="bg-rose-600 text-white rounded-xl p-3 flex gap-3 shadow-md">
          <AlertCircle className="shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <h4 className="font-black text-xs uppercase tracking-widest">🚨 NATIONAL SALE RECOMMENDED — DO NOT SELL LOCALLY!</h4>
            <p className="text-[10px] font-medium leading-relaxed opacity-90">{report.nationalSaleReason || "Selling nationally expands the buyer pool to include serious collectors and specific decor enthusiasts willing to pay for shipping, maximizing potential profit."}</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500 text-white rounded-xl p-3 flex gap-3 shadow-md items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
            </div>
            <h4 className="font-black text-xs uppercase tracking-widest">SELL LOCALLY ON FB MARKETPLACE</h4>
          </div>
          <span className="text-[9px] font-black bg-emerald-700/50 px-2 py-1 rounded-lg">FB Local Priority</span>
        </div>
      )}

      {/* Sourcing Verdict & Demand Score */}
      <div className="p-3 rounded-xl flex items-center justify-between border bg-slate-50 border-slate-200 text-slate-900">
        <div>
          <span className="text-[9px] font-extrabold uppercase opacity-75 block">Sourcing Verdict</span>
          <span className="font-extrabold block">
            {verdict === "YES" ? "🚀 WORTH SELLING!" : verdict === "MARGINAL" ? "⚖️ MARGINAL FIND" : "🛑 SCRAP / PASS IT"}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold uppercase opacity-75 block">Demand Score</span>
          <span className="text-base font-black text-amber-500">{report.demandScore}/10</span>
        </div>
      </div>

      {/* Local & eBay Comps */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-950 text-blue-100 p-2.5 rounded-xl border border-blue-800 space-y-1 flex flex-col justify-center">
          <span className="font-black text-[10px] block text-blue-300">📍 Local FB Comps</span>
          <span className="font-black text-emerald-400 block">${report.localComps?.estimatedLocalMin || minVal} – ${report.localComps?.estimatedLocalMax || maxVal}</span>
          <span className="text-[9px] block text-blue-200 leading-tight">{report.localComps?.sellThroughVelocity || "Fast (3-7 days)"}</span>
        </div>
        <div className="bg-purple-950 text-purple-100 p-2.5 rounded-xl border border-purple-800 space-y-1 flex flex-col justify-center">
          <span className="font-black text-[10px] block text-purple-300">📦 eBay Comps</span>
          <span className="font-black text-amber-300 block">${report.ebayComps?.estimatedEbayMin || minVal} – ${report.ebayComps?.estimatedEbayMax || maxVal}</span>
          <span className="text-[9px] block text-purple-200 leading-tight">{report.ebayComps?.shippingFeasibility || "Standard Shipping"}</span>
        </div>
      </div>

      {/* Resell Price Valuation Range */}
      <div className="p-3 rounded-xl border text-center bg-indigo-50/50 border-indigo-100">
        <span className="text-[10px] font-bold uppercase opacity-70 block text-slate-600">Resell Price Valuation Range</span>
        <div className="text-xl font-black text-indigo-500">
          ${minVal} <span className="text-xs font-normal text-slate-400">TO</span> ${maxVal}
        </div>
      </div>

      {/* Spacer to push button to bottom if the cards have different content heights */}
      <div className="flex-1"></div>

      {/* Pricing Button */}
      {onApplyField && (
        <button
          type="button"
          onClick={() => onApplyField("listedPrice", minVal > 0 ? Math.round((minVal + maxVal) / 2) : 35)}
          className={`w-full py-2.5 font-black text-xs rounded-xl transition shadow-md mt-auto ${
            engine === "grok" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          Use ${minVal > 0 ? Math.round((minVal + maxVal) / 2) : 35} ({engine === "grok" ? "Grok" : "Gemini"} Target Price)
        </button>
      )}
    </div>
  );
}

export default function AIResearchView({
  research,
  photos = [],
  itemName = "",
  itemNotes = "",
  onApplyAll,
  onApplyField,
  isLoading: externalLoading,
  error: externalError,
  onRunResearch,
  engineFilter
}: AIResearchViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeEngineTab, setActiveEngineTab] = useState<"dual" | "grok" | "gemini">("dual");
  const [priceSliderPosGrok, setPriceSliderPosGrok] = useState(50);
  const [priceSliderPosGemini, setPriceSliderPosGemini] = useState(50);
  const [finalReport, setFinalReport] = useState<any>(research);
  const [flawResponses, setFlawResponses] = useState<Record<number, string>>({});

  // Safely resolve the correct report for each engine
    const resolveReport = (engine: "grok" | "gemini") => {
      if (finalReport?.[engine]) return finalReport[engine];
      if (finalReport?.provider === engine) return finalReport;
      if (research?.[engine]) return research[engine];
      if (research?.provider === engine) return research;
      // If no explicit provider is set anywhere, assume it's for this engine if the filter matches, otherwise it's ambiguous
      if (research && !research.provider && (!engineFilter || engineFilter === engine)) return research;
      return null;
    };
  
    const grokReport = resolveReport("grok");
    const geminiReport = resolveReport("gemini");

  const handleGenerateDetails = () => {
    const report = grokReport || geminiReport || research;
    if (!report || !onApplyAll) return;

    const flaws = report.issuesFound || report.cleaningInstructions || [];
    let compiledDesc = report.suggestedDescription || "";

    if (flaws.length > 0) {
      const conditionBlockLines = flaws.map((issue: string, idx: number) => {
        const userResp = flawResponses[idx]?.trim();
        return userResp ? `• ${issue}\n  👉 Seller Clarification: ${userResp}` : `• ${issue}`;
      });

      if (!compiledDesc.toLowerCase().includes("flaw") && !compiledDesc.toLowerCase().includes("issue")) {
        compiledDesc += "\n\n⚠️ Condition & Seller Clarifications:\n" + conditionBlockLines.join("\n");
      }
    }

    onApplyAll({
      ...report,
      suggestedDescription: compiledDesc
    });
  };

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendChatMessage = async (userText?: string | React.MouseEvent, isFinal = false, targetEngine: "grok" | "gemini" = "grok") => {
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
          "x-xai-key": (import.meta as any).env?.VITE_XAI_KEY || (import.meta as any).env?.XAI_KEY || localStorage.getItem("stuff4sale_xai_key") || "",
        },
        body: JSON.stringify({
          name: itemName,
          notes: itemNotes,
          images: photos,
          history: updatedHistory,
          generateFinalReport: isFinal,
          provider: targetEngine
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to communicate with AI.");
      }

      const data = await res.json();

      if (data.responseType === "REPORT" && data.report) {
        const reportResult: AIResearchResult = data.report;
        setFinalReport(reportResult);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: data.aiMessage || `Final Sourcing & Valuation Report generated by ${targetEngine.toUpperCase()}!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            report: reportResult
          }
        ]);

        if (onApplyAll) {
          onApplyAll(reportResult);
        }
      } else {
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
    <div className="flex flex-col h-full space-y-4" id="ai-research-view">
      {/* FINAL VALUATION REPORT CARD */}
      {(grokReport || geminiReport) && (
        <div className="flex flex-col h-full space-y-4 animate-fade-in" id="final-valuation-report">
          {!engineFilter && (
            <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wide">Dual AI Valuation Comparison (Side-by-Side)</h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveEngineTab("dual")}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                    activeEngineTab === "dual" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Split Both (Side-by-Side)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEngineTab("grok")}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                    activeEngineTab === "grok" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Grok Only
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEngineTab("gemini")}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition ${
                    activeEngineTab === "gemini" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  Gemini Only
                </button>
              </div>
            </div>
          )}

          <div className={`flex-1 grid gap-4 ${(!engineFilter && activeEngineTab === "dual") ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {/* COLUMN 1: xAI Grok Evaluation (Left Column / Primary) */}
            {(engineFilter === "grok" || (!engineFilter && (activeEngineTab === "dual" || activeEngineTab === "grok"))) && grokReport && (
              <SingleValuationColumn
                title="xAI Grok Valuation Engine"
                engine="grok"
                report={grokReport}
                priceSliderPos={priceSliderPosGrok}
                setPriceSliderPos={setPriceSliderPosGrok}
                onApplyField={onApplyField}
              />
            )}

            {/* COLUMN 2: Google Gemini Evaluation (Right Column / 2nd Opinion) */}
            {(engineFilter === "gemini" || (!engineFilter && (activeEngineTab === "dual" || activeEngineTab === "gemini"))) && geminiReport && (
              <SingleValuationColumn
                title="Google Gemini Valuation Engine"
                engine="gemini"
                report={geminiReport}
                priceSliderPos={priceSliderPosGemini}
                setPriceSliderPos={setPriceSliderPosGemini}
                onApplyField={onApplyField}
              />
            )}
          </div>
        </div>
      )}

          {/* Identified SEO Title & Flaw Clarifications */}
          {(() => {
            const activeReport = engineFilter === "grok" ? grokReport : engineFilter === "gemini" ? geminiReport : (grokReport || geminiReport || research);
            if (!activeReport) return null;

            return (
              <div className="space-y-4 pt-2">
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
                      {(activeReport.issuesFound || activeReport.cleaningInstructions || []).map((issue: string, idx: number) => (
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
            );
          })()}
    </div>
  );
}
