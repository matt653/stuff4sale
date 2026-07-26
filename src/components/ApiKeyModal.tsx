import React, { useState } from "react";
import { Key, ExternalLink, Check, X, ShieldAlert } from "lucide-react";

interface ApiKeyModalProps {
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export default function ApiKeyModal({ onClose, onKeySaved }: ApiKeyModalProps) {
  const [keyInput, setKeyInput] = useState(() => localStorage.getItem("user_gemini_api_key") || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    localStorage.setItem("user_gemini_api_key", cleanKey);
    setSavedSuccess(true);
    onKeySaved(cleanKey);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const isKeyFormatValid = keyInput.trim().startsWith("AIza");

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Google Gemini API Key</h3>
              <p className="text-xs text-slate-500">Configure key for AI research & valuations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-2 text-xs text-blue-900">
          <p className="font-bold flex items-center gap-1.5 text-blue-950">
            <ShieldAlert size={15} className="text-blue-600 shrink-0" />
            Where to get your free Gemini API Key:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-[11px]">
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="font-bold underline text-blue-900 hover:text-blue-950 inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={10} /></a></li>
            <li>Click <b>"Create API Key"</b></li>
            <li>Copy the key (starts with <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold text-blue-900">AIzaSy...</code>) and paste it below!</li>
          </ol>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
            {keyInput && !isKeyFormatValid && (
              <p className="text-[11px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                ⚠️ Google API keys typically start with "AIzaSy...". Double check if you copied the right key.
              </p>
            )}
          </div>

          {savedSuccess && (
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <Check size={16} /> API Key Saved Successfully!
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              Save API Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
