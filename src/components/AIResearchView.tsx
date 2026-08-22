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
}

function SingleValuationColumn({
  title,
  engine,
  report,
  priceSliderPos,
  setPriceSliderPos,
  onApplyField
}: {
  title: string;
  engine: "grok" | "gemini";
  report: AIResearchResult;
  priceSliderPos: number;
  setPriceSliderPos: (val: number) => void;
  onApplyField?: (fieldName: "name" | "notes" | "listedPrice" | "category", value: any) => void;
}) {
  const minVal = Number(report.estimatedValueMin) || 0;
  const maxVal = Number(report.estimatedValueMax) || 0;
  const verdict = report.worthSelling || (minVal >= 20 && report.demandScore >= 5 ? "YES" : minVal >= 10 ? "MARGINAL" : "NO");

  return (
    <div className={`p-4 rounded-2xl border space-y-4 shadow-sm ${
      engine === "grok" ? "bg-slate-900 text-slate-100 border-slate-700" : "bg-white text-slate-800 border-indigo-200"
    }`}>
      {/* Engine Header */}
      <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
          {engine === "grok" ? "⚡ xAI Grok Evaluation (Primary)" : "✨ Google Gemini Evaluation (2nd Opinion)"}
        </span>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
          engine === "grok" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-indigo-100 text-indigo-700"
        }`}>
          {engine === "grok" ? "xAI Grok" : "Google Gemini"}
        </span>
      </div>

      {/* Priority Banner */}
      {report.sellOnNationalLevel || report.recommendedSellLevel === "NATIONAL_EBAY" ? (
        <div className="p-3 bg-red-600 text-white rounded-xl text-xs font-extrabold">
          🚨 NATIONAL SALE RECOMMENDED — DO NOT SELL LOCALLY!
          <p className="text-[10px] font-normal mt-0.5">{report.nationalSaleReason || "High national collector demand."}</p>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-between">
          <span>🟢 SELL LOCALLY ON FB MARKETPLACE</span>
          <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full">FB Local Priority</span>
        </div>
      )}

      {/* Sourcing Verdict & Demand Score */}
      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
        engine === "grok" ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
      }`}>
        <div>
          <span className="text-[9px] font-extrabold uppercase opacity-75 block">Sourcing Verdict</span>
          <span className="font-extrabold block">
            {verdict === "YES" ? "🚀 WORTH SELLING!" : verdict === "MARGINAL" ? "⚠️ MARGINAL FIND" : "🛑 SCRAP / PASS IT"}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold uppercase opacity-75 block">Demand Score</span>
          <span className="text-base font-black text-amber-400">{report.demandScore}/10</span>
        </div>
      </div>

      {/* Local & eBay Comps */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-950 text-blue-100 p-2.5 rounded-xl border border-blue-800 space-y-1">
          <span className="font-black text-[10px] block text-blue-300">🔵 Local FB Comps</span>
          <span className="font-black text-emerald-400 block">${report.localComps?.estimatedLocalMin || minVal} – ${report.localComps?.estimatedLocalMax || maxVal}</span>
          <span className="text-[9px] block text-blue-200">{report.localComps?.sellThroughVelocity || "Fast (3-7 days)"}</span>
        </div>
        <div className="bg-purple-950 text-purple-100 p-2.5 rounded-xl border border-purple-800 space-y-1">
          <span className="font-black text-[10px] block text-purple-300">📦 eBay Comps</span>
          <span className="font-black text-amber-300 block">${report.ebayComps?.estimatedEbayMin || minVal} – ${report.ebayComps?.estimatedEbayMax || maxVal}</span>
          <span className="text-[9px] block text-purple-200">{report.ebayComps?.shippingFeasibility || "Standard Shipping"}</span>
        </div>
      </div>

      {/* Resell Price Valuation Range */}
      <div className={`p-3 rounded-xl border text-center ${
        engine === "grok" ? "bg-slate-950 border-slate-800" : "bg-indigo-50/50 border-indigo-100"
      }`}>
        <span className="text-[10px] font-bold uppercase opacity-70 block">Resell Price Valuation Range</span>
        <div className="text-xl font-black text-indigo-400">
          ${minVal} <span className="text-xs font-normal text-slate-400">TO</span> ${maxVal}
        </div>
      </div>

      {/* Pricing Button */}
      {onApplyField && (
        <button
          type="button"
          onClick={() => onApplyField("listedPrice", minVal > 0 ? Math.round((minVal + maxVal) / 2) : 35)}
          className={`w-full py-2 font-black text-xs rounded-xl transition ${
            engine === "grok" ? "bg-amber-500 hover:bg-amber-400 text-slate-950" : "bg-indigo-600 hover:bg-indigo-700 text-white"
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
  onRunResearch
}: AIResearchViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeEngineTab, setActiveEngineTab] = useState<"dual" | "grok" | "gemini">("dual");
  const [priceSliderPosGrok, setPriceSliderPosGrok] = useState(50);
  const [priceSliderPosGemini, setPriceSliderPosGemini] = useState(50);
  const [finalReport, setFinalReport] = useState<any>(research);
  const [flawResponses, setFlawResponses] = useState<Record<number, string>>({});

  // Resolve dual vs single research reports
  const grokReport: AIResearchResult | null = finalReport?.grok || (finalReport?.provider === "grok" ? finalReport : null) || research?.grok || research;
  const geminiReport: AIResearchResult | null = finalReport?.gemini || (finalReport?.provider === "gemini" ? finalReport : null) || research?.gemini || research;

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

      {/* Top Action Buttons: Grok Find It vs Gemini Find It */}
      <div className="grid grid-cols-2 gap-2 pb-2">
        <button
          type="button"
          disabled={isChatLoading || externalLoading}
          onClick={() => onRunResearch ? onRunResearch("grok") : handleSendChatMessage("Run Grok AI Valuation", true, "grok")}
          className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500/30"
          id="btn-grok-find-it"
        >
          <Zap size={15} className="text-amber-400 fill-amber-400" />
          <span>✨ Grok Find It! (Auto-Fill Form)</span>
        </button>

        <button
          type="button"
          disabled={isChatLoading || externalLoading}
          onClick={() => onRunResearch ? onRunResearch("gemini") : handleSendChatMessage("Run Gemini AI Valuation", true, "gemini")}
          className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-400/40"
          id="btn-gemini-find-it"
        >
          <Sparkles size={15} className="text-indigo-200" />
          <span>✨ Gemini Find It! (Auto-Fill Form)</span>
        </button>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin" id="valuation-chat-stream">
        {messages.length === 0 ? (
          <div className="bg-white/80 border border-indigo-100 rounded-2xl p-4 text-center space-y-3">
            <MessageSquare size={24} className="mx-auto text-indigo-500 animate-pulse" />
            <h5 className="text-xs font-bold text-slate-800">Start AI Valuation Chat & Condition Inspector</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
              Choose your valuation inspector below. The AI will examine your photos and ask condition questions before building your report!
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={isChatLoading || externalLoading}
                onClick={() => handleSendChatMessage("Analyze this item and ask any condition questions needed before valuation.", false, "grok")}
                className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                id="btn-start-grok-chat"
              >
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                <span>💬 Start Grok Valuation Chat</span>
              </button>

              <button
                type="button"
                disabled={isChatLoading || externalLoading}
                onClick={() => handleSendChatMessage("Analyze this item and ask any condition questions needed before valuation.", false, "gemini")}
                className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                id="btn-start-gemini-chat"
              >
                <Sparkles size={14} />
                <span>💬 Start Gemini Valuation Chat</span>
              </button>
            </div>
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

      {/* FINAL VALUATION REPORT CARD (Side-by-Side Dual AI Comparison: Grok vs Gemini) */}
      {(grokReport || geminiReport) && (
        <div className="space-y-4 pt-2 border-t border-indigo-100/60 animate-fade-in" id="final-valuation-report">
          
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

          <div className={`grid gap-4 ${activeEngineTab === "dual" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {/* COLUMN 1: xAI Grok Evaluation (Left Column / Primary) */}
            {(activeEngineTab === "dual" || activeEngineTab === "grok") && grokReport && (
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
            {(activeEngineTab === "dual" || activeEngineTab === "gemini") && geminiReport && (
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
            const activeReport = grokReport || geminiReport || research;
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
