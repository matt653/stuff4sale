import React, { useState } from "react";
import { Sparkles, Check, X, AlertTriangle, ShieldCheck, Trash2, DollarSign, Camera, Tag, ArrowRight, RefreshCw } from "lucide-react";
import CameraCapture from "./CameraCapture";
import { AIResearchResult, InventoryItem } from "../types";

interface AIIntakeInspectorProps {
  onAddToInventory: (itemData: Omit<InventoryItem, "id">) => Promise<void>;
  onClose?: () => void;
}

export default function AIIntakeInspector({ onAddToInventory, onClose }: AIIntakeInspectorProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [itemName, setItemName] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("Garage Sale");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<AIResearchResult | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleEvaluateFind = async () => {
    if (photos.length === 0 && !itemName) {
      setError("Please take/upload at least 1 picture or enter a quick item name so Gemini can evaluate the find.");
      return;
    }

    setLoading(true);
    setError(null);
    setResearchResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: itemName || "Unidentified item find",
          category: "General Find",
          notes: `Purchase price estimate: $${purchaseCost || 0} at ${purchaseLocation}`,
          image: photos[0] || null,
          images: photos,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "AI valuation failed.");
      }

      const result: AIResearchResult = await response.json();
      setResearchResult(result);
    } catch (err: any) {
      console.error("AI Evaluation error:", err);
      setError(err.message || "Failed to contact Gemini AI research center.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!researchResult) return;

    try {
      const pCost = Number(purchaseCost) || 0;
      const midpointValue = Math.round((researchResult.estimatedValueMin + researchResult.estimatedValueMax) / 2);

      const newItem: Omit<InventoryItem, "id"> = {
        name: researchResult.suggestedTitle || itemName || "Sourced Item",
        category: researchResult.category || "General",
        status: "inventory",
        purchasePrice: pCost,
        purchaseDate: new Date().toISOString().split("T")[0],
        purchaseLocation: purchaseLocation || "Sourced Find",
        notes: researchResult.suggestedDescription || "",
        photoUrl: photos[0] || null,
        photos: photos,
        listedPrice: midpointValue,
        listedPlatform: researchResult.targetPlatforms[0] ? researchResult.targetPlatforms[0].split("-")[0].trim() : "eBay",
        salePrice: null,
        salePlatform: null,
        saleDate: null,
        research: researchResult,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onAddToInventory(newItem);
      setAddedSuccess(true);

      setTimeout(() => {
        // Reset state for next item evaluation
        setPhotos([]);
        setItemName("");
        setPurchaseCost("");
        setResearchResult(null);
        setAddedSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Failed adding item to inventory:", err);
      alert("Failed to save to inventory: " + err.message);
    }
  };

  const handleScrapIt = () => {
    // Dismiss current evaluation and clear for next item
    setPhotos([]);
    setItemName("");
    setPurchaseCost("");
    setResearchResult(null);
    setError(null);
  };

  const cost = Number(purchaseCost) || 0;
  const estimatedMin = researchResult?.estimatedValueMin || 0;
  const estimatedMax = researchResult?.estimatedValueMax || 0;
  const avgEstValue = Math.round((estimatedMin + estimatedMax) / 2);
  const estimatedProfit = Math.max(0, avgEstValue - cost);

  const verdict = researchResult?.worthSelling || (estimatedProfit > 20 && (researchResult?.demandScore || 0) >= 5 ? "YES" : estimatedProfit > 5 ? "MARGINAL" : "NO");

  return (
    <div className="bg-white border border-indigo-150 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in" id="ai-intake-inspector-container">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              Sourcing Inspector & Valuation
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                AI Check-In
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Snap photos of what you found → Gemini AI evaluates if it's worth selling, predicts profit, then you choose to <b>Add</b> or <b>Scrap</b> it!
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Photo Capture & Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <CameraCapture 
            onPhotosCaptured={(photoList) => setPhotos(photoList)}
            initialPhotos={photos}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Item Title / Brand (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vintage Nike jacket, PS4..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Asking Cost ($)
              </label>
              <div className="relative">
                <DollarSign size={13} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={loading || (photos.length === 0 && !itemName)}
            onClick={handleEvaluateFind}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer"
            id="btn-evaluate-find"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Analyzing find with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Evaluate Find with Gemini AI
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: AI Valuation Verdict & Decision Card */}
        <div className="lg:col-span-6">
          {!researchResult && !loading ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 border border-indigo-100">
                <Camera size={26} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Ready for Sourcing Evaluation</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Take a picture of what you found at your garage sale or estate sale, enter the asking price, and click <b>Evaluate Find</b>!
              </p>
            </div>
          ) : loading ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
              <RefreshCw size={36} className="animate-spin text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-800 text-sm mb-1">Gemini AI is researching market comps...</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Scanning historical sales, demand patterns, and estimated resale pricing...
              </p>
            </div>
          ) : (
            /* VERDICT RESULTS CARD */
            <div className="space-y-4 animate-fade-in" id="evaluation-verdict-card">
              {/* Verdict Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${
                verdict === "YES"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : verdict === "MARGINAL"
                  ? "bg-amber-50 border-amber-200 text-amber-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    verdict === "YES" ? "bg-emerald-600" : verdict === "MARGINAL" ? "bg-amber-600" : "bg-rose-600"
                  }`}>
                    {verdict === "YES" ? <ShieldCheck size={20} /> : verdict === "MARGINAL" ? <AlertTriangle size={20} /> : <X size={20} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                      AI Sourcing Recommendation
                    </span>
                    <h4 className="font-extrabold text-sm">
                      {verdict === "YES"
                        ? "🚀 GREAT FIND! Highly Recommended to Buy"
                        : verdict === "MARGINAL"
                        ? "⚠️ MARGINAL FIND - Low Profit Margin"
                        : "🛑 SCRAP / PASS IT - Not Worth Reselling"}
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">Demand Score</span>
                  <span className="text-base font-extrabold">{researchResult.demandScore}/10</span>
                </div>
              </div>

              {/* Rationale / Verdict Summary */}
              {researchResult.triageReason && (
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-medium leading-relaxed shadow">
                  💡 <b>Gemini Verdict:</b> {researchResult.triageReason}
                </div>
              )}

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Est. Market Value</span>
                  <span className="font-extrabold text-xs text-slate-800">
                    ${estimatedMin} – ${estimatedMax}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Purchase Cost</span>
                  <span className="font-extrabold text-xs text-slate-800">${cost.toFixed(2)}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">Est. Net Profit</span>
                  <span className="font-extrabold text-xs text-emerald-700">+${estimatedProfit.toFixed(2)}</span>
                </div>
              </div>

              {/* Identified Title & Category */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Identified Item Title</span>
                  <span className="text-indigo-600">{researchResult.category}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug">
                  {researchResult.suggestedTitle}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                  "{researchResult.suggestedDescription}"
                </p>
              </div>

              {/* ACTION CHOICES: Add to Inventory OR Scrap It */}
              {addedSuccess ? (
                <div className="p-3.5 bg-emerald-600 text-white rounded-2xl text-center text-xs font-extrabold flex items-center justify-center gap-2 animate-bounce">
                  <Check size={16} /> Added to Live Inventory Sheet!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleScrapIt}
                    className="py-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200"
                    id="btn-scrap-item"
                  >
                    <Trash2 size={15} />
                    Scrap / Pass on Find
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAdd}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition active:scale-95 cursor-pointer"
                    id="btn-confirm-add-inventory"
                  >
                    <Check size={16} />
                    Add to Inventory ($)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
