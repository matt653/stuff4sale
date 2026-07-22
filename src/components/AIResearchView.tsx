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
  
  // Conversational Chat State
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [finalReport, setFinalReport] = useState<AIResearchResult | null>(research);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Start or Continue AI Valuation Chat
  const handleSendChatMessage = async (userText?: string, isFinal = false) => {
    const textToSend = userText !== undefined ? userText : chatInput;
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
        headers: { "Content-Type": "application/json" },
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

          {/* Price Range & Demand Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <DollarSign size={13} className="text-indigo-600" />
                  Resell Price Estimate
                </span>
                {onApplyField && (
                  <button
                    type="button"
                    onClick={() => onApplyField("listedPrice", Math.round((activeReport.estimatedValueMin + activeReport.estimatedValueMax) / 2))}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold"
                  >
                    Apply Midpoint (${Math.round((activeReport.estimatedValueMin + activeReport.estimatedValueMax) / 2)})
                  </button>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-800">${activeReport.estimatedValueMin}</span>
                <span className="text-slate-400 font-semibold text-sm">to</span>
                <span className="text-2xl font-extrabold text-slate-800">${activeReport.estimatedValueMax}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  Resell Demand Score
                </span>
                <span className="text-xs font-bold text-slate-700">{activeReport.demandScore}/10</span>
              </div>
              
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1 flex">
                <div
                  className={`h-full ${getDemandColor(activeReport.demandScore)} transition-all duration-1000`}
                  style={{ width: `${activeReport.demandScore * 10}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">{getDemandLabel(activeReport.demandScore)}</p>
            </div>
          </div>

          {/* Suggested Title */}
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

          {/* Item Cleaning & Preparation Guide */}
          {((activeReport.cleaningInstructions && activeReport.cleaningInstructions.length > 0) || (activeReport.prepChecklist && activeReport.prepChecklist.length > 0)) && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-3">
              <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                🧼 Cleaning & Preparation Guide
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {activeReport.cleaningInstructions && activeReport.cleaningInstructions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cleaning & Restoration</span>
                    <ul className="space-y-1">
                      {activeReport.cleaningInstructions.map((step, idx) => (
                        <li key={idx} className="bg-white border border-indigo-100/60 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 font-medium">
                          🧽 {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeReport.prepChecklist && activeReport.prepChecklist.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Listing Prep Checklist</span>
                    <ul className="space-y-1">
                      {activeReport.prepChecklist.map((step, idx) => (
                        <li key={idx} className="bg-white border border-indigo-100/60 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 font-medium">
                          📋 {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {onApplyAll && (
            <button
              type="button"
              onClick={() => onApplyAll(activeReport)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              ✨ Apply All AI Suggestions to Item Form (Box 2)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
