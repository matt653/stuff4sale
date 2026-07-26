import React from "react";
import { 
  MessageSquare, MessageCircle, Bell, Check, CheckCheck, X, Zap, 
  ExternalLink, ArrowRight, ShieldCheck, Sparkles, Filter, Trash2
} from "lucide-react";
import { FBNotification, InventoryItem } from "../types";

interface FBNotificationCenterProps {
  notifications: FBNotification[];
  items: InventoryItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
  onOpenSetupModal: () => void;
}

export default function FBNotificationCenter({
  notifications,
  items,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onClose,
  onOpenSetupModal,
}: FBNotificationCenterProps) {
  const [filter, setFilter] = React.useState<"all" | "message" | "comment">("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "message") return n.type === "message" || n.type === "lead";
    if (filter === "comment") return n.type === "comment";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Bell size={22} className="text-white" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-blue-600 shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Facebook Live Activity Center
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live SSE Connected
                </span>
              </h3>
              <p className="text-xs text-blue-100/80">
                Real-time buyer messages, comments, and Marketplace inquiries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSetupModal}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Zap size={14} className="text-yellow-300" />
              Webhook Setup
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                filter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("message")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                filter === "message" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Messages ({notifications.filter((n) => n.type === "message" || n.type === "lead").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("comment")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                filter === "comment" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Comments ({notifications.filter((n) => n.type === "comment").length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition ml-2"
              >
                <Trash2 size={13} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto space-y-3 grow">
          {filteredNotifications.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <MessageSquare size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800">No Facebook notices yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                When buyers send messages or comment on your Facebook Marketplace listings, live alerts will appear here instantly!
              </p>
              <button
                type="button"
                onClick={onOpenSetupModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              >
                <Zap size={14} />
                Open Webhook Tester & Simulator
              </button>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const matchedItem = items.find(
                (i) =>
                  i.id === notif.itemId ||
                  (notif.itemTitle && i.name.toLowerCase().includes(notif.itemTitle.toLowerCase())) ||
                  (notif.messageText && i.name.toLowerCase().split(" ").some((w) => w.length > 4 && notif.messageText.toLowerCase().includes(w)))
              );

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && onMarkAsRead(notif.id)}
                  className={`border rounded-2xl p-4 transition-all duration-200 cursor-pointer ${
                    !notif.read
                      ? "bg-blue-50/60 border-blue-200 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                          notif.type === "message"
                            ? "bg-blue-600 text-white border-blue-500"
                            : notif.type === "comment"
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-emerald-600 text-white border-emerald-500"
                        }`}
                      >
                        {notif.type === "message" ? (
                          <MessageSquare size={18} />
                        ) : notif.type === "comment" ? (
                          <MessageCircle size={18} />
                        ) : (
                          <Zap size={18} />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900">{notif.senderName}</span>
                          <span className="bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 px-2 py-0.5 rounded-md">
                            {notif.platform}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/60 p-2 rounded-xl border border-slate-200/60">
                          "{notif.messageText}"
                        </p>

                        {/* Item match details */}
                        {matchedItem ? (
                          <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-900 px-2.5 py-1.5 rounded-xl text-xs">
                            <Sparkles size={13} className="text-emerald-600 shrink-0" />
                            <span className="truncate font-semibold">Matched Item: <b>{matchedItem.name}</b></span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md ml-auto shrink-0">
                              Listed ${matchedItem.listedPrice || matchedItem.purchasePrice}
                            </span>
                          </div>
                        ) : notif.itemTitle ? (
                          <div className="mt-2 text-[11px] font-medium text-slate-500">
                            Listing: <b>{notif.itemTitle}</b>
                          </div>
                        ) : null}

                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open("https://facebook.com/messages", "_blank");
                        }}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition"
                        title="Open Facebook Messenger"
                      >
                        <ExternalLink size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Meta Graph API Webhooks Active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Close Activity Center
          </button>
        </div>
      </div>
    </div>
  );
}
