import React, { useState } from "react";
import { Sparkles, Copy, Check, FileText, DollarSign, RefreshCw, Star, Tag, ThumbsUp } from "lucide-react";
import { AIResearchResult } from "../types";

interface AIResearchViewProps {
  research: AIResearchResult | null;
  onApplyAll?: (research: AIResearchResult) => void;
  onApplyField?: (fieldName: "name" | "notes" | "listedPrice" | "category", value: any) => void;
  isLoading: boolean;
  error: string | null;
}

export default function AIResearchView({ research, onApplyAll, onApplyField, isLoading, error }: AIResearchViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-6 text-center shadow-inner flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <Sparkles className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={16} />
        </div>
        <h4 className="text-sm font-semibold text-indigo-950 mb-1">Analyzing and Researching Market...</h4>
        <p className="text-xs text-indigo-600/80 max-w-sm">
          Gemini is analyzing historical pricing, checking sell-through rates, optimizing keywords, and crafting a listing title & description...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-rose-700">
          <Sparkles size={18} className="shrink-0" />
          <h4 className="font-semibold text-sm">Research Failed</h4>
        </div>
        <p className="text-xs text-rose-600 mb-4">{error}</p>
        <p className="text-xs text-slate-500">
          Make sure your item has a name or photo so the AI can look up information.
        </p>
      </div>
    );
  }

  if (!research) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 text-center text-slate-500 flex flex-col items-center justify-center min-h-[220px]">
        <Sparkles size={28} className="text-slate-400 mb-2.5 animate-pulse" />
        <h4 className="text-xs font-semibold text-slate-700 mb-1">AI Market Research Assistant</h4>
        <p className="text-xs text-slate-400 max-w-xs mb-3">
          Need list prices, SEO titles, or optimized descriptions? Tap the AI Research button on the form.
        </p>
      </div>
    );
  }

  // Determine demand score color
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

  // Determine verdict badge
  const verdict = research.worthSelling || (research.estimatedValueMin >= 20 && research.demandScore >= 5 ? "YES" : research.estimatedValueMin >= 10 ? "MARGINAL" : "NO");

  return (
    <div className="bg-gradient-to-br from-indigo-50/40 via-purple-50/10 to-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4" id="ai-research-view">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Gemini Sourcing & Market Valuation</h4>
            <span className="text-[10px] text-indigo-600 font-semibold tracking-wider uppercase">Live Reseller Intelligence</span>
          </div>
        </div>

        {onApplyAll && (
          <button
            type="button"
            onClick={() => onApplyAll(research)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
            id="btn-apply-all-research"
          >
            Apply All AI Suggestions
          </button>
        )}
      </div>

      {/* Sourcing Verdict Card: SCRAP OR SELL */}
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
          {research.triageReason && (
            <p className="text-xs font-medium opacity-90 mt-1">
              {research.triageReason}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 ml-2">
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Demand</span>
          <span className="text-base font-extrabold">{research.demandScore}/10</span>
        </div>
      </div>

      {/* Price Range & Demand Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Estimated Pricing Card */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <DollarSign size={13} className="text-indigo-600" />
              Resell Price Estimate
            </span>
            {onApplyField && (
              <button
                type="button"
                onClick={() => onApplyField("listedPrice", Math.round((research.estimatedValueMin + research.estimatedValueMax) / 2))}
                className="text-[10px] text-indigo-600 hover:underline font-semibold"
                id="btn-apply-ai-price"
              >
                Apply Midpoint (${Math.round((research.estimatedValueMin + research.estimatedValueMax) / 2)})
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-800">${research.estimatedValueMin}</span>
            <span className="text-slate-400 font-semibold text-sm">to</span>
            <span className="text-2xl font-extrabold text-slate-800">${research.estimatedValueMax}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Based on recent completed sales historical patterns</p>
        </div>

        {/* Demand Indicator Card */}
        <div className="bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              Resell Demand Score
            </span>
            <span className="text-xs font-bold text-slate-700">{research.demandScore}/10</span>
          </div>
          
          {/* Custom progress bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1 flex">
            <div
              className={`h-full ${getDemandColor(research.demandScore)} transition-all duration-1000`}
              style={{ width: `${research.demandScore * 10}%` }}
            />
          </div>
          
          <p className="text-[10px] text-slate-500 mt-2 font-medium">{getDemandLabel(research.demandScore)}</p>
        </div>
      </div>

      {/* Suggested Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Tag size={13} className="text-indigo-600" />
            SEO Listing Title ({research.suggestedTitle.length} chars)
          </span>
          <div className="flex items-center gap-2">
            {onApplyField && (
              <button
                type="button"
                onClick={() => onApplyField("name", research.suggestedTitle)}
                className="text-[10px] text-indigo-600 hover:underline font-semibold"
                id="btn-apply-ai-title"
              >
                Apply
              </button>
            )}
            <button
              type="button"
              onClick={() => copyToClipboard(research.suggestedTitle, "title")}
              className="text-slate-400 hover:text-slate-600 transition flex items-center gap-0.5 text-[10px]"
              id="btn-copy-ai-title"
            >
              {copiedField === "title" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
              {copiedField === "title" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <p className="bg-white border border-slate-150 rounded-xl p-3 text-xs text-slate-700 font-medium tracking-tight">
          {research.suggestedTitle}
        </p>
      </div>

      {/* Suggested Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <FileText size={13} className="text-indigo-600" />
            SEO Listing Description
          </span>
          <div className="flex items-center gap-2">
            {onApplyField && (
              <button
                type="button"
                onClick={() => onApplyField("notes", research.suggestedDescription)}
                className="text-[10px] text-indigo-600 hover:underline font-semibold"
                id="btn-apply-ai-description"
              >
                Apply to Notes
              </button>
            )}
            <button
              type="button"
              onClick={() => copyToClipboard(research.suggestedDescription, "description")}
              className="text-slate-400 hover:text-slate-600 transition flex items-center gap-0.5 text-[10px]"
              id="btn-copy-ai-description"
            >
              {copiedField === "description" ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
              {copiedField === "description" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div className="bg-white border border-slate-150 rounded-xl p-3 text-xs text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans scrollbar-thin">
          {research.suggestedDescription}
        </div>
      </div>

      {/* Target Platforms & Category Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Platforms */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <ThumbsUp size={13} className="text-indigo-600" />
            Recommended Outlets
          </span>
          <ul className="space-y-1">
            {research.targetPlatforms.map((platform, idx) => (
              <li key={idx} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 list-none leading-normal">
                {platform}
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles size={13} className="text-indigo-600" />
            Reselling & Shipping Tips
          </span>
          <ul className="space-y-1">
            {research.sellingTips.map((tip, idx) => (
              <li key={idx} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 list-none leading-normal">
                💡 {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Item Cleaning & Preparation Checklist Section */}
      {((research.cleaningInstructions && research.cleaningInstructions.length > 0) || (research.prepChecklist && research.prepChecklist.length > 0)) && (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-3">
          <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            🧼 Cleaning, Maintenance & Listing Prep Guide
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {research.cleaningInstructions && research.cleaningInstructions.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cleaning & Restoration</span>
                <ul className="space-y-1">
                  {research.cleaningInstructions.map((step, idx) => (
                    <li key={idx} className="bg-white border border-indigo-100/60 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 font-medium">
                      🧽 {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {research.prepChecklist && research.prepChecklist.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Listing Prep Checklist</span>
                <ul className="space-y-1">
                  {research.prepChecklist.map((step, idx) => (
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

      {/* Keywords / Search Tags */}
      {research.keywords && research.keywords.length > 0 && (
        <div className="space-y-1.5 pt-1.5 border-t border-indigo-100/50">
          <span className="text-[11px] font-semibold text-slate-500 block">High-Volume Listing Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {research.keywords.map((kw, idx) => (
              <span key={idx} className="text-[10px] font-semibold bg-indigo-50/80 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
