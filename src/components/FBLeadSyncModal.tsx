import React, { useState } from "react";
import { MessageSquare, Bell, Check, Zap, ExternalLink, X, Shield, ArrowRight } from "lucide-react";
import { InventoryItem } from "../types";

interface FBLeadSyncModalProps {
  items: InventoryItem[];
  onStatusChange: (id: string, updates: Partial<InventoryItem>) => void;
  onClose: () => void;
}

export default function FBLeadSyncModal({ items, onStatusChange, onClose }: FBLeadSyncModalProps) {
  const listedItems = items.filter(i => i.status === "listed");
  const [loggedItemId, setLoggedItemId] = useState<string | null>(null);

  const handleSimulateLead = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    onStatusChange(itemId, {
      buyerInquiriesCount: (item.buyerInquiriesCount || 0) + 1,
      lastInquiryAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setLoggedItemId(itemId);
    setTimeout(() => setLoggedItemId(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="fb-lead-sync-modal">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                FB Messenger Buyer Lead Notifications
              </h3>
              <p className="text-xs text-blue-100/80">
                Track buyer inquiries specifically for items listed from your app!
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

        {/* Content Body */}
        <div className="p-6 space-y-5 text-slate-700">
          
          {/* How It Works Explanation */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
              <Zap size={14} className="text-blue-600" />
              How App-Specific Facebook Messenger Alerts Work
            </h4>
            <p className="text-xs text-blue-900 leading-relaxed">
              When a buyer messages you on Facebook Marketplace about a specific item listed from this app:
            </p>
            <ul className="text-xs text-blue-900 space-y-1.5 pl-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Facebook sends an instant notification email: <i>"New message regarding [Item Name]"</i> to your email inbox.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Our AI matching engine scans the item title in the notification email and links it <b>strictly to the item in your app inventory</b>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Your app card displays a glowing <b>💬 FB Buyer Inquiry Badge</b> so you know which listed item has active interested buyers!</span>
              </li>
            </ul>
          </div>

          {/* Active Listed Items Lead Tracker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Active Listed Items ({listedItems.length})
              </h4>
              <span className="text-[10px] font-bold text-slate-400">Log incoming Messenger leads below</span>
            </div>

            {listedItems.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 text-center text-xs text-slate-400">
                No active items listed on FB Marketplace yet. Click <b>Mark Posted on FB</b> on any item to enable lead tracking!
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {listedItems.map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt={item.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <MessageSquare size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 truncate">{item.name}</h5>
                        <p className="text-[10px] text-slate-500">
                          {item.buyerInquiriesCount ? `💬 ${item.buyerInquiriesCount} buyer leads logged` : "No buyer messages yet"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulateLead(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 shrink-0 ${
                        loggedItemId === item.id
                          ? "bg-emerald-600 text-white animate-bounce"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                      }`}
                    >
                      {loggedItemId === item.id ? <Check size={13} /> : <MessageSquare size={13} />}
                      {loggedItemId === item.id ? "Logged Lead!" : "+ Log Buyer Msg"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
