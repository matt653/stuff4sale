import React, { useState } from "react";
import { Sparkles, Copy, Check, FileText, DollarSign, RefreshCw, Star, Tag, ThumbsUp, Send, MessageSquare, AlertCircle } from "lucide-react";
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
  const [finalReport, setFinalReport] = useState<AIResearchResult | null>(research);
  const [flawResponses, setFlawResponses] = useState<Record<number, string>>({});
  const [hasInitializedPrice, setHasInitializedPrice] = useState(false);

  // Sync slider price to Step 2 form ONCE on intake
  React.useEffect(() => {
    const report = finalReport || research;
    if (report && !hasInitializedPrice && onApplyField) {
      const minVal = Number(report.estimatedValueMin) || 0;
      const maxVal = Number(report.estimatedValueMax) || 0;
      const initialPrice = minVal > 0 && maxVal > 0
        ? Math.round(minVal + (priceSliderPos / 100) * (maxVal - minVal))
        : (maxVal || minVal || 35);
      onApplyField("listedPrice", initialPrice);
      setHasInitializedPrice(true);
    }
  }, [research, finalReport, hasInitializedPrice]);

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
      suggestedDescription: compiledDesc
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
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Demand</span>
              <span className="text-base font-extrabold">{activeReport.demandScore}/10</span>
            </div>
          </div>

          {/* Merged Resell Valuation & Demand Score Card with Interactive Strategy Slider */}
          {(() => {
            const minVal = Number(activeReport.estimatedValueMin) || 0;
            const maxVal = Number(activeReport.estimatedValueMax) || 0;
            const currentPriceFromSlider = minVal > 0 && maxVal > 0 
              ? Math.round(minVal + (priceSliderPos / 100) * (maxVal - minVal))
              : (maxVal || minVal || 35);

            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                {/* Header: Resell Valuation & Demand */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-0.5">
                      <DollarSign size={14} className="text-indigo-600" />
                      Resell Price Valuation
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

                {/* Interactive Pricing Strategy Slider */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-700 flex items-center gap-1">
                      ⚡ Quick Sale (${minVal})
                    </span>
                    <span className="bg-indigo-600 text-white px-3 py-0.5 rounded-full font-black text-[11px] shadow-xs">
                      Target Price: ${currentPriceFromSlider}
                    </span>
                    <span className="text-emerald-700 flex items-center gap-1">
                      💎 Full Retail (${maxVal})
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={priceSliderPos}
                    onChange={(e) => {
                      const newPos = Number(e.target.value);
                      setPriceSliderPos(newPos);
                      if (onApplyField) {
                        const calculated = minVal > 0 && maxVal > 0
                          ? Math.round(minVal + (newPos / 100) * (maxVal - minVal))
                          : (maxVal || minVal || 35);
                        onApplyField("listedPrice", calculated);
                      }
                    }}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    id="pricing-strategy-slider"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                    <span>Fast Cash Turnaround</span>
                    <span>Balanced Comp</span>
                    <span>Max Retail Profit</span>
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
                Identified SEO Title ({activeReport.suggestedTitle.length} chars)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(activeReport.suggestedTitle, "title")}
                className="text-slate-400 hover:text-slate-600 transition flex items-center gap-0.5 text-[10px]"
              >
                {copiedField === "title" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                {copiedField === "title" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="bg-white border border-slate-150 rounded-xl p-3 text-xs text-slate-700 font-medium tracking-tight">
              {activeReport.suggestedTitle}
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
            </div>
          )}

          {onApplyAll && (
            <button
              type="button"
              onClick={handleGenerateDetails}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              id="btn-generate-details"
            >
              <Sparkles size={16} />
              ✨ Generate Details (Compile Description & Flaws to Form)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
