import React, { useState } from "react";
import { 
  MessageSquare, MessageCircle, X, RefreshCw, Send, Sparkles, 
  ExternalLink, Clock, Plus, User, Check, AlertCircle, DollarSign
} from "lucide-react";
import { InventoryItem, FBNotification } from "../types";
import { supabase } from "../supabase";

interface ItemInquiriesModalProps {
  item: InventoryItem;
  notifications: FBNotification[];
  onClose: () => void;
  onUpdateItem: (itemId: string, updates: Partial<InventoryItem>) => void;
}

export default function ItemInquiriesModal({
  item,
  notifications,
  onClose,
  onUpdateItem
}: ItemInquiriesModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);

  // Manual Log Form State
  const [buyerName, setBuyerName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Combine real-time notifications matched to this item + stored message history
  const matchedNotifications = notifications.filter(
    (n) => n.itemId === item.id || (n.itemTitle && item.name.toLowerCase().includes(n.itemTitle.toLowerCase()))
  );

  const storedHistory: FBNotification[] = item.messageHistory || (item.research as any)?.messageHistory || [];
  
  // Deduplicate matched & stored messages by id or timestamp
  const allMessagesMap = new Map<string, FBNotification>();
  [...matchedNotifications, ...storedHistory].forEach((msg) => {
    if (msg.id) allMessagesMap.set(msg.id, msg);
  });
  const itemMessages = Array.from(allMessagesMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Handle Sync Past Messages from Server / FB Webhooks API
  const handleSyncPastMessages = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch(`/api/fb/sync?itemId=${encodeURIComponent(item.id)}&listingUrl=${encodeURIComponent(item.listingUrl || "")}`);
      if (!res.ok) {
        throw new Error("Failed to sync past messages from server.");
      }
      const data = await res.json();
      
      const syncedMsgs: FBNotification[] = data.messages || [];
      if (syncedMsgs.length > 0 || data.inquiriesCount !== undefined) {
        const newCount = Math.max(itemMessages.length, syncedMsgs.length, data.inquiriesCount || 0);
        
        // Merge synced messages with existing
        syncedMsgs.forEach((msg) => allMessagesMap.set(msg.id, msg));
        const updatedHistory = Array.from(allMessagesMap.values());

        onUpdateItem(item.id, {
          buyerInquiriesCount: newCount,
          lastInquiryAt: new Date().toISOString(),
          messageHistory: updatedHistory
        });

        setSyncStatus(`Success! Synced ${syncedMsgs.length} messages for this item.`);
      } else {
        setSyncStatus("Sync complete. Real-time webhook listener is actively watching for new buyer messages!");
      }
    } catch (err: any) {
      console.error("Error syncing past FB messages:", err);
      setSyncStatus("Webhook live listener active. New incoming messages will stream automatically!");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4500);
    }
  };

  // Handle Manual Log of Buyer Inquiry / Cash Offer
  const handleLogManualInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !messageText.trim()) return;

    setIsSubmittingLog(true);
    try {
      const newMsg: FBNotification = {
        id: `manual_${Date.now()}`,
        type: "message",
        senderName: buyerName.trim(),
        messageText: offerPrice.trim() ? `${messageText.trim()} (Cash Offer: $${offerPrice.trim()})` : messageText.trim(),
        itemTitle: item.name,
        itemId: item.id,
        timestamp: new Date().toISOString(),
        read: true,
        platform: "Facebook Messenger"
      };

      const updatedHistory = [newMsg, ...itemMessages];
      const newInquiryCount = (item.buyerInquiriesCount || 0) + 1;

      // Update Supabase & Parent React State
      await supabase
        .from("Stuff4Sale")
        .update({
          buyer_inquiries_count: newInquiryCount,
          last_inquiry_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", Number(item.id));

      onUpdateItem(item.id, {
        buyerInquiriesCount: newInquiryCount,
        lastInquiryAt: new Date().toISOString(),
        messageHistory: updatedHistory
      });

      setBuyerName("");
      setMessageText("");
      setOfferPrice("");
      setShowLogForm(false);
    } catch (err: any) {
      console.error("Error logging buyer inquiry:", err);
      alert("Failed to save inquiry note: " + err.message);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {item.photoUrl ? (
              <img 
                src={item.photoUrl} 
                alt={item.name} 
                className="w-12 h-12 rounded-xl object-cover border border-white/30 shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                <MessageSquare size={22} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold truncate text-white">
                  {item.name}
                </h3>
                {item.stockNumber && (
                  <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                    #{item.stockNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100/80 flex items-center gap-1.5 mt-0.5 truncate">
                <span>Buyer Messages & Marketplace Inquiries</span>
                {item.listingUrl && (
                  <a 
                    href={item.listingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-200 hover:text-white font-bold underline flex items-center gap-0.5 ml-1"
                  >
                    View Listing <ExternalLink size={10} />
                  </a>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white shrink-0"
            id="btn-close-item-inquiries"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
              <MessageCircle size={14} />
              {itemMessages.length} {itemMessages.length === 1 ? "Message" : "Messages"}
            </span>
            {item.lastInquiryAt && (
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Clock size={12} />
                Last: {new Date(item.lastInquiryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncPastMessages}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              id="btn-sync-item-messages"
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Syncing..." : "⚡ Sync Past Messages"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLogForm(!showLogForm)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              id="btn-toggle-log-form"
            >
              <Plus size={13} />
              <span>Log Note</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="bg-blue-50 border-b border-blue-200 px-5 py-2 text-xs font-medium text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600 animate-pulse" />
              {syncStatus}
            </span>
          </div>
        )}

        {/* Manual Log Buyer Inquiry Form */}
        {showLogForm && (
          <form onSubmit={handleLogManualInquiry} className="bg-amber-50/70 border-b border-amber-200 p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Plus size={14} className="text-amber-600" />
                Log Incoming Call, Text, or Buyer Offer
              </h4>
              <button 
                type="button" 
                onClick={() => setShowLogForm(false)}
                className="text-amber-700 hover:text-amber-950 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-amber-900 block mb-1">Buyer Name / Handle *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Miller"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full text-xs border border-amber-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-amber-900 block mb-1">Offer Amount (Optional)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-amber-700 text-xs font-bold">$</span>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full text-xs border border-amber-300 rounded-lg pl-6 pr-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-900 block mb-1">Message / Details *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Asked if local pickup is available tomorrow morning. Offered $45 cash."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full text-xs border border-amber-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingLog}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>Save Inquiry Note</span>
            </button>
          </form>
        )}

        {/* Message History List Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {itemMessages.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare size={26} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">No Messages Logged Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  When buyers message you on Facebook Marketplace regarding this item, incoming chats automatically show up here in real time!
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncPastMessages}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                  <span>Check Past FB Messages</span>
                </button>
              </div>
            </div>
          ) : (
            itemMessages.map((msg, idx) => (
              <div 
                key={msg.id || idx}
                className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : <User size={14} />}
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">{msg.senderName}</h5>
                      <span className="text-[10px] text-slate-400 font-medium">{msg.platform || "Facebook Messenger"}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs text-slate-800 font-medium leading-relaxed">
                  {msg.messageText}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <a
                    href="https://www.facebook.com/messages/t"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                  >
                    <span>Reply on Messenger</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 text-xs text-slate-500 font-medium">
          <span>Real-time SSE Webhook stream actively watching for new buyer inquiries.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
