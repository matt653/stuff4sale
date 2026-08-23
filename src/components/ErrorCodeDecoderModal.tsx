import React, { useState } from "react";
import { AlertTriangle, X, Search, Wrench, DollarSign, BrainCircuit, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ErrorCodeDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ErrorCodeDecoderModal({ isOpen, onClose }: ErrorCodeDecoderModalProps) {
  const [make, setMake] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDecode = async () => {
    if (!make.trim() || !code.trim()) {
      setError("Please enter both a Brand/Make and the Error Code.");
      return;
    }
    setError(null);
    setLoading(true);
    setReport(null);
    try {
      const response = await fetch("/api/decode-error", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "",
        },
        body: JSON.stringify({ make, code })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to decode.");
      setReport(data.report?.text || data.report || "No data returned.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
              <AlertTriangle size={16} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">AI Error Code Decoder</h3>
              <p className="text-[10px] text-slate-500">Scan faults & estimate repair cost before buying</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 mb-5 flex gap-3">
            <BrainCircuit className="text-indigo-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-indigo-900 leading-relaxed">
              Found a broken appliance, car, or electronic device for dirt cheap? Enter the manufacturer and the fault code shown on the screen to instantly learn what's wrong and how much it costs to fix it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Brand / Make</label>
              <input
                type="text"
                placeholder="e.g. Whirlpool, Honda..."
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5 uppercase tracking-wide">Error Code</label>
              <input
                type="text"
                placeholder="e.g. F01, P0420, E2..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-sm font-mono border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleDecode}
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-70 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 mb-5 cursor-pointer active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Decoding Fault...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>Decode Error Code & Cost</span>
              </>
            )}
          </button>

          {report && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Wrench size={14} className="text-rose-500" />
                  Diagnostic Report
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Analyzed by AI
                </span>
              </div>
              <div className="p-4 prose prose-sm prose-slate max-w-none text-[13px] leading-relaxed 
                prose-headings:text-slate-800 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                prose-p:text-slate-600 prose-p:my-2
                prose-ul:my-2 prose-li:my-0.5 prose-strong:text-slate-700
                [&>*:first-child]:mt-0"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
