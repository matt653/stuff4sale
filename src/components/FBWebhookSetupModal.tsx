import React, { useState } from "react";
import { 
  Zap, Copy, Check, Shield, Server, RefreshCw, Send, 
  MessageSquare, MessageCircle, AlertCircle, ExternalLink, X, Info
} from "lucide-react";
import { fbRealtimeService } from "../services/fbRealtimeService";
import { InventoryItem } from "../types";

interface FBWebhookSetupModalProps {
  items: InventoryItem[];
  onClose: () => void;
}

export default function FBWebhookSetupModal({ items, onClose }: FBWebhookSetupModalProps) {
  const [verifyToken, setVerifyToken] = useState("stuff4sale_fb_secret");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Simulation Form state
  const [simType, setSimType] = useState<"message" | "comment" | "lead">("message");
  const [simSender, setSimSender] = useState("Alex Rivera (FB Buyer)");
  const [simText, setSimText] = useState("Hi! Is this item still available? Can I pick it up today?");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [simulating, setSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  const callbackUrl = `${window.location.origin}/api/fb/webhook`;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch("/api/fb/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyToken }),
      });
      alert("Facebook Webhook verification token saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimSuccessMsg(null);

    const matchedItem = items.find((i) => i.id === selectedItemId);

    try {
      await fbRealtimeService.simulateEvent({
        type: simType,
        senderName: simSender,
        messageText: simText,
        itemTitle: matchedItem ? matchedItem.name : undefined,
        itemId: matchedItem ? matchedItem.id : undefined,
      });

      setSimSuccessMsg("⚡ Live Real-Time Webhook Notification Triggered & Pushed via SSE!");
      setTimeout(() => setSimSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleQuickPreset = (preset: "available" | "offer" | "comment" | "pickup") => {
    const listedItems = items.filter((i) => i.status === "listed");
    const sampleItem = listedItems[0] || items[0];
    if (sampleItem) {
      setSelectedItemId(sampleItem.id);
    }

    if (preset === "available") {
      setSimType("message");
      setSimSender("Marcus Vance");
      setSimText(`Hi! Is "${sampleItem?.name || "this item"}" still available for pickup?`);
    } else if (preset === "offer") {
      setSimType("message");
      setSimSender("Jessica Taylor");
      setSimText(`Hello! Would you take $${Math.max(5, (sampleItem?.listedPrice || 40) - 10)} for the ${sampleItem?.name || "item"}? I have cash ready.`);
    } else if (preset === "comment") {
      setSimType("comment");
      setSimSender("David Miller");
      setSimText(`What are the dimensions on this? Very interested!`);
    } else if (preset === "pickup") {
      setSimType("lead");
      setSimSender("Rachel Green");
      setSimText(`Can we meet up at Target parking lot around 4 PM today?`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Zap size={22} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Meta Real-Time Webhook Engine
              </h3>
              <p className="text-xs text-blue-100/80">
                Connect Facebook Graph API Webhooks & test live notifications
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Section 1: Production Webhook Config */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Server size={15} className="text-blue-600" />
                1. Facebook Webhook Setup Details
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                GET/POST Endpoints Active
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To receive live production messages & comments from Facebook, copy these details into your <b>Meta Developer App</b> under <i>Webhooks → Messenger / Page Feed</i>:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Callback URL (Webhook Receiver)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={callbackUrl}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(callbackUrl, setCopiedUrl)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUrl ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Verify Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(verifyToken, setCopiedToken)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    {copiedToken ? <Check size={14} /> : <Copy size={14} />}
                    {copiedToken ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shrink-0"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Webhook Simulator */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={15} className="text-blue-600" />
                2. Live Real-Time Webhook Simulator & Tester
              </h4>
              <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                Interactive SSE Pipeline
              </span>
            </div>

            <p className="text-xs text-blue-900 leading-relaxed">
              Test how live Facebook buyer messages and comments instantly trigger real-time toasts and notification center alerts in this app:
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase text-blue-900 tracking-wider">
                Quick Test Presets
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset("available")}
                  className="px-2.5 py-1.5 bg-white border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-bold text-blue-900 shadow-2xs transition flex items-center gap-1"
                >
                  <MessageSquare size={13} className="text-blue-600" />
                  "Is this available?"
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset("offer")}
                  className="px-2.5 py-1.5 bg-white border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-bold text-blue-900 shadow-2xs transition flex items-center gap-1"
                >
                  <MessageSquare size={13} className="text-emerald-600" />
                  Price Offer Inquiry
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset("comment")}
                  className="px-2.5 py-1.5 bg-white border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-bold text-blue-900 shadow-2xs transition flex items-center gap-1"
                >
                  <MessageCircle size={13} className="text-indigo-600" />
                  Listing Comment
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleTriggerSimulation} className="space-y-3 pt-2 border-t border-blue-200/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">
                    Event Type
                  </label>
                  <select
                    value={simType}
                    onChange={(e: any) => setSimType(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                  >
                    <option value="message">Messenger Buyer Message</option>
                    <option value="comment">Marketplace Listing Comment</option>
                    <option value="lead">FB Page Buyer Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">
                    Buyer Name
                  </label>
                  <input
                    type="text"
                    value={simSender}
                    onChange={(e) => setSimSender(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden"
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-950 mb-1">
                  Match to Inventory Item (Optional)
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden"
                >
                  <option value="">-- Select an item to test auto-matching --</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (${item.listedPrice || item.purchasePrice}) [{item.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-blue-950 mb-1">
                  Message / Comment Text
                </label>
                <textarea
                  rows={2}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden resize-none"
                  placeholder="Enter message text..."
                />
              </div>

              {simSuccessMsg && (
                <div className="bg-emerald-600 text-white text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
                  <Zap size={16} />
                  <span>{simSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {simulating ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  Trigger Live Real-Time Webhook Alert
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Info size={15} className="text-blue-600" />
            <span>SSE Stream: <b className="text-emerald-700">Connected</b></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
