import React, { useState, useEffect } from "react";
import { 
  Share2, Copy, Check, ExternalLink, Sparkles, RefreshCw, 
  ShoppingBag, DollarSign, Tag, Layers, AlertCircle, Info, ChevronRight, X,
  Download, Image as ImageIcon, Video, Bell, MessageSquare, MessageCircle,
  Zap, Shield, Server, Send, Users, Globe, CheckCheck, Trash2, ShieldCheck, Link2
} from "lucide-react";
import { InventoryItem, FBNotification } from "../types";
import { fbRealtimeService } from "../services/fbRealtimeService";

interface FBHubModalProps {
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
  initialTab?: "connect" | "post" | "inbox" | "webhook";
  notifications: FBNotification[];
  connected: boolean;
  onStatusChange: (id: string, updates: Partial<InventoryItem>) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

interface FBAdData {
  fbTitle: string;
  fbPrice: number;
  fbCategory: string;
  fbCondition: string;
  fbDescription: string;
  fbTags: string;
  fbTips: string[];
}

export default function FBHubModal({
  items,
  selectedItem,
  initialTab = "post",
  notifications,
  connected,
  onStatusChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onClose,
}: FBHubModalProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<"connect" | "post" | "inbox" | "webhook">(initialTab);

  // Tab 1: Account Connection State
  const [verifyToken, setVerifyToken] = useState("stuff4sale_fb_secret");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [targetGroupIds, setTargetGroupIds] = useState("");
  const [connectedPageName, setConnectedPageName] = useState("Stuff4Sale Reselling");
  const [savingSettings, setSavingSettings] = useState(false);

  // Tab 2: Posting State
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(selectedItem || items[0] || null);
  const [isBundleMode, setIsBundleMode] = useState(false);
  const [selectedBundleItemIds, setSelectedBundleItemIds] = useState<string[]>([]);
  const [tone, setTone] = useState<"casual" | "urgent" | "detailed" | "bundle">("casual");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  const [targetChannels, setTargetChannels] = useState<{ marketplace: boolean; page: boolean; groups: boolean }>({
    marketplace: true,
    page: true,
    groups: true,
  });
  const [postingGraphApi, setPostingGraphApi] = useState(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState<string | null>(null);

  // AI & Ad Data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adData, setAdData] = useState<FBAdData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isListedSuccess, setIsListedSuccess] = useState(false);

  // Tab 3: Inbox Filter
  const [inboxFilter, setInboxFilter] = useState<"all" | "message" | "comment">("all");

  // Tab 4: Webhook Simulation State
  const [simType, setSimType] = useState<"message" | "comment" | "lead">("message");
  const [simSender, setSimSender] = useState("Alex Rivera (FB Buyer)");
  const [simText, setSimText] = useState("Hi! Is this item still available? Can I pick it up today?");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [simulating, setSimulating] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  const callbackUrl = `${window.location.origin}/api/fb/webhook`;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load saved settings from server on mount
  useEffect(() => {
    fetch("/api/fb/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.verifyToken) setVerifyToken(data.verifyToken);
        if (data.appId) setAppId(data.appId);
        if (data.appSecret) setAppSecret(data.appSecret);
        if (data.pageAccessToken) setPageAccessToken(data.pageAccessToken);
        if (data.targetGroupIds) setTargetGroupIds(data.targetGroupIds);
        if (data.connectedPageName) setConnectedPageName(data.connectedPageName);
      })
      .catch((err) => console.log("FB Settings load fallback:", err));
  }, []);

  // Update active item if selectedItem prop changes
  useEffect(() => {
    if (selectedItem) {
      setActiveItem(selectedItem);
      setActiveTab("post");
    } else if (items.length > 0 && !activeItem) {
      setActiveItem(items[0]);
    }
  }, [selectedItem, items]);

  useEffect(() => {
    if (activeItem) {
      const defaultPrice = activeItem.listedPrice || 
        (activeItem.research ? activeItem.research.estimatedValueMax : activeItem.purchasePrice * 2 || 35);
      setCustomPrice(defaultPrice.toString());
      generateDefaultAd(activeItem, defaultPrice);
    }
  }, [activeItem]);

  const generateDefaultAd = (item: InventoryItem, priceVal: number) => {
    const research = item.research;
    const title = research?.suggestedTitle || item.name;
    const category = research?.category || item.category || "Home & Garden";
    const desc = research?.suggestedDescription || 
      `Up for sale: ${item.name}.\n\nCondition/Details:\n${item.notes || "In good vintage/pre-owned condition. See photos for exact details."}\n\nPrice: $${priceVal}\nLocation: Local pickup available. Cash or Venmo accepted.\n\nMessage me if interested or if you have any questions!`;
    const keywords = research?.keywords ? research.keywords.join(", ") : "yard art, vintage, garden decor, farm salvage";

    setAdData({
      fbTitle: title.length > 90 ? title.substring(0, 90) : title,
      fbPrice: priceVal,
      fbCategory: category.includes("Yard") || category.includes("Garden") ? "Garden & Outdoor" : "Antiques & Collectibles",
      fbCondition: "Good",
      fbDescription: desc,
      fbTags: keywords,
      fbTips: [
        "Include 3-5 clear photos taken in bright natural daylight.",
        "List your city/neighborhood so local buyers know you are nearby.",
        "Mention Cash and Venmo accepted for quick local pickup."
      ]
    });
  };

  // Bundle pricing logic
  const selectedBundleItems = items.filter(i => selectedBundleItemIds.includes(i.id));
  const totalBundleIndividualSum = selectedBundleItems.reduce(
    (sum, i) => sum + (i.listedPrice || i.research?.estimatedValueMax || i.purchasePrice * 2 || 30),
    0
  );
  const recommendedBundleDiscountPrice = Math.round(totalBundleIndividualSum * 0.85);
  const currentBundlePrice = customPrice ? Number(customPrice) : recommendedBundleDiscountPrice;
  const currentBundleSavings = Math.max(0, totalBundleIndividualSum - currentBundlePrice);

  useEffect(() => {
    if (isBundleMode && selectedBundleItemIds.length > 0) {
      setCustomPrice(recommendedBundleDiscountPrice.toString());
    }
  }, [isBundleMode, selectedBundleItemIds.length]);

  // AI Optimizer
  const handleOptimizeWithAI = async () => {
    if (!activeItem && !isBundleMode) return;
    setLoading(true);
    setError(null);

    try {
      let payload: any = {};

      if (isBundleMode) {
        const bundleItemsPayload = selectedBundleItems.map(i => ({
          name: i.name,
          price: i.listedPrice || i.research?.estimatedValueMax || i.purchasePrice * 2 || 30,
          notes: i.notes || ""
        }));

        payload = {
          name: `Bundle Deal (${selectedBundleItems.length} Items): ${selectedBundleItems.map(i => i.name).join(" + ")}`,
          category: selectedBundleItems[0]?.category || "Home & Garden",
          notes: `Bundle of ${selectedBundleItems.length} items. Total value $${totalBundleIndividualSum}. Package deal price $${currentBundlePrice}. Save $${currentBundleSavings}! ${customNote || ""}`,
          price: currentBundlePrice,
          totalIndividualPrice: totalBundleIndividualSum,
          discountSavings: currentBundleSavings,
          tone: "bundle",
          isBundle: true,
          bundleItems: bundleItemsPayload
        };
      } else if (activeItem) {
        payload = {
          name: activeItem.name,
          category: activeItem.category,
          notes: `${activeItem.notes || ""}. ${customNote || ""}`,
          price: customPrice ? Number(customPrice) : (activeItem.listedPrice || 35),
          tone,
          isBundle: false
        };
      }

      const res = await fetch("/api/fb-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to generate AI Facebook Marketplace ad.");
      }

      const data: FBAdData = await res.json();
      setAdData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not connect to AI optimizer. Used instant template instead.");
      if (activeItem) generateDefaultAd(activeItem, Number(customPrice) || 35);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllListing = () => {
    if (!adData) return;
    const fullText = `TITLE:\n${adData.fbTitle}\n\nPRICE:\n$${adData.fbPrice}\n\nCATEGORY:\n${adData.fbCategory}\n\nCONDITION:\n${adData.fbCondition}\n\nDESCRIPTION:\n${adData.fbDescription}\n\nTAGS:\n${adData.fbTags}`;
    copyToClipboard(fullText, "all");
  };

  const handleMarkAsListed = () => {
    if (isBundleMode) {
      if (selectedBundleItemIds.length === 0) return;
      selectedBundleItemIds.forEach(id => {
        const item = items.find(i => i.id === id);
        onStatusChange(id, {
          status: "listed",
          listedPlatform: "Facebook Marketplace",
          listedPrice: item?.listedPrice || (adData ? Math.round(adData.fbPrice / selectedBundleItemIds.length) : 35),
          updatedAt: new Date().toISOString()
        });
      });
    } else if (activeItem) {
      onStatusChange(activeItem.id, {
        status: "listed",
        listedPlatform: "Facebook Marketplace",
        listedPrice: adData ? adData.fbPrice : Number(customPrice) || activeItem.listedPrice || 35,
        updatedAt: new Date().toISOString()
      });
    }
    setIsListedSuccess(true);
    setTimeout(() => setIsListedSuccess(false), 3000);
  };

  // Direct Graph API Posting Handler
  const handlePostViaGraphApi = async () => {
    if (!adData) return;
    setPostingGraphApi(true);
    setPostSuccessMsg(null);

    try {
      const res = await fetch("/api/fb/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: adData.fbTitle,
          price: adData.fbPrice,
          description: adData.fbDescription,
          tags: adData.fbTags,
          photoUrl: activeItem?.photoUrl || activeItem?.photos?.[0],
          targetChannels,
          pageAccessToken,
          targetGroupIds
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to post to Facebook via Graph API.");

      setPostSuccessMsg("✅ Posted successfully via Facebook Graph API!");
      handleMarkAsListed();
      setTimeout(() => setPostSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Graph API Post: ${err.message}. You can still use the 1-Click Copy & Launch button below!`);
    } finally {
      setPostingGraphApi(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch("/api/fb/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifyToken,
          appId,
          appSecret,
          pageAccessToken,
          targetGroupIds,
          connectedPageName
        }),
      });
      alert("Facebook settings & API keys saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Trigger Simulation
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

      setSimSuccessMsg("⚡ Live Facebook Notification Triggered!");
      setTimeout(() => setSimSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  // Filter inbox notifications
  const filteredNotifications = notifications.filter((n) => {
    if (inboxFilter === "message") return n.type === "message" || n.type === "lead";
    if (inboxFilter === "comment") return n.type === "comment";
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="fb-hub-modal">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Share2 size={22} className="text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                Facebook Studio & Graph API Hub
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  connected ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  {connected ? "Real-time Live" : "Offline"}
                </span>
              </h3>
              <p className="text-xs text-blue-100/80">
                Post to Marketplace & Groups, manage buyer messages, and configure API webhooks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
            id="btn-close-fb-hub"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("connect")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "connect"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Link2 size={15} />
            <span>🔌 Account & API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("post")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "post"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Share2 size={15} />
            <span>🚀 Post to Marketplace & Groups</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 relative ${
              activeTab === "inbox"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <MessageSquare size={15} />
            <span>💬 Messenger Inbox</span>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("webhook")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "webhook"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <Zap size={15} />
            <span>⚡ Webhook Tester</span>
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 grow">

          {/* TAB 1: Facebook Account Connection & API Config */}
          {activeTab === "connect" && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    Facebook Meta Graph API Setup & Credentials
                  </h4>
                  <span className="text-[10px] bg-blue-200 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                    OAuth & Token Direct
                  </span>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Enter your Meta App credentials below to enable automated Graph API posting directly to your <b>Facebook Page</b>, <b>Facebook Groups</b>, and real-time <b>Messenger webhooks</b>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Meta App Credentials
                  </h5>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Facebook App ID
                    </label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="e.g. 1029384756102938"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Facebook App Secret
                    </label>
                    <input
                      type="password"
                      value={appSecret}
                      onChange={(e) => setAppSecret(e.target.value)}
                      placeholder="••••••••••••••••••••"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Page & Group Token Settings
                  </h5>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Page Access Token / User Token
                    </label>
                    <input
                      type="password"
                      value={pageAccessToken}
                      onChange={(e) => setPageAccessToken(e.target.value)}
                      placeholder="EAAB..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Target Facebook Group IDs (comma separated)
                    </label>
                    <input
                      type="text"
                      value={targetGroupIds}
                      onChange={(e) => setTargetGroupIds(e.target.value)}
                      placeholder="e.g. 84920491, 10294029, 39401928"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe size={15} className="text-blue-600" />
                  Meta Webhook Verification Settings
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Callback URL
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={callbackUrl}
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Verify Token
                    </label>
                    <input
                      type="text"
                      value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 font-medium">
                  Status: {pageAccessToken ? <b className="text-emerald-600">Access Token Provided</b> : <b className="text-slate-400">Manual / 1-Click Copy Ready</b>}
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  {savingSettings ? "Saving Settings..." : "Save Facebook Credentials"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Marketplace & Group Posting Tool */}
          {activeTab === "post" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Item Selector & Ad Customizer */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Select Item to Post
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBundleMode(!isBundleMode)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                        isBundleMode ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {isBundleMode ? "✓ Bundle Mode Active" : "+ Create Bundle Deal"}
                    </button>
                  </div>

                  {!isBundleMode ? (
                    <select
                      value={activeItem?.id || ""}
                      onChange={(e) => {
                        const item = items.find((i) => i.id === e.target.value);
                        if (item) setActiveItem(item);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                    >
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (${item.listedPrice || item.purchasePrice}) [{item.status.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-600 font-medium">
                        Select multiple items to combine into a discounted package bundle:
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 bg-white border border-slate-200 p-2 rounded-xl">
                        {items.map((item) => (
                          <label key={item.id} className="flex items-center gap-2 text-xs text-slate-800 p-1 hover:bg-slate-50 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedBundleItemIds.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBundleItemIds((prev) => [...prev, item.id]);
                                } else {
                                  setSelectedBundleItemIds((prev) => prev.filter((id) => id !== item.id));
                                }
                              }}
                              className="rounded text-blue-600"
                            />
                            <span className="truncate">{item.name}</span>
                            <span className="ml-auto font-bold text-slate-500">${item.listedPrice || item.purchasePrice}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Item Card Preview */}
                  {activeItem && !isBundleMode && (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                      {activeItem.photoUrl ? (
                        <img src={activeItem.photoUrl} alt={activeItem.name} className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-xs text-slate-900 truncate">{activeItem.name}</h5>
                        <p className="text-[10px] text-slate-500">{activeItem.category}</p>
                        <p className="text-xs font-black text-indigo-600 mt-0.5">${customPrice || activeItem.listedPrice || activeItem.purchasePrice}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tone & Custom Pricing Controls */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Copywriter Tone & Pricing
                  </h5>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Listing Tone
                      </label>
                      <select
                        value={tone}
                        onChange={(e: any) => setTone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800"
                      >
                        <option value="casual">Casual & Friendly</option>
                        <option value="urgent">Urgent Deal / Move Out</option>
                        <option value="detailed">Professional & Detailed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Target List Price ($)
                      </label>
                      <input
                        type="number"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Target Posting Channels
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetChannels.marketplace}
                          onChange={(e) => setTargetChannels((prev) => ({ ...prev, marketplace: e.target.checked }))}
                          className="rounded text-blue-600"
                        />
                        <span>Marketplace</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetChannels.page}
                          onChange={(e) => setTargetChannels((prev) => ({ ...prev, page: e.target.checked }))}
                          className="rounded text-blue-600"
                        />
                        <span>FB Page</span>
                      </label>
                      <label className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={targetChannels.groups}
                          onChange={(e) => setTargetChannels((prev) => ({ ...prev, groups: e.target.checked }))}
                          className="rounded text-blue-600"
                        />
                        <span>FB Groups</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleOptimizeWithAI}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {loading ? "Generating FB Ad..." : "✨ Optimize Ad Copy with Gemini AI"}
                  </button>
                </div>
              </div>

              {/* Right Column: High-Converting Ad Result Preview */}
              <div className="lg:col-span-7 space-y-4">
                {adData ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h4 className="font-extrabold text-sm text-slate-900">Facebook Ad Listing Copy</h4>
                      </div>

                      <button
                        type="button"
                        onClick={copyAllListing}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-blue-200"
                      >
                        {copiedField === "all" ? <Check size={14} /> : <Copy size={14} />}
                        {copiedField === "all" ? "Copied All!" : "Copy Full Listing"}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Title</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(adData.fbTitle, "title")}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1"
                          >
                            {copiedField === "title" ? <Check size={12} /> : <Copy size={12} />} Copy
                          </button>
                        </div>
                        <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800">
                          {adData.fbTitle}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Price</span>
                          <span className="font-black text-emerald-600 text-sm">${adData.fbPrice}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Category</span>
                          <span className="font-bold text-slate-800 truncate block">{adData.fbCategory}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase block mb-0.5">Condition</span>
                          <span className="font-bold text-slate-800">{adData.fbCondition}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Description</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(adData.fbDescription, "desc")}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1"
                          >
                            {copiedField === "desc" ? <Check size={12} /> : <Copy size={12} />} Copy
                          </button>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                          {adData.fbDescription}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Tags</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(adData.fbTags, "tags")}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold flex items-center gap-1"
                          >
                            {copiedField === "tags" ? <Check size={12} /> : <Copy size={12} />} Copy
                          </button>
                        </div>
                        <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium">
                          {adData.fbTags}
                        </p>
                      </div>
                    </div>

                    {postSuccessMsg && (
                      <div className="bg-emerald-600 text-white p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Check size={16} /> {postSuccessMsg}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handlePostViaGraphApi}
                        disabled={postingGraphApi}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {postingGraphApi ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        Post Direct via Graph API
                      </button>

                      <a
                        href="https://www.facebook.com/marketplace/create/item"
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleMarkAsListed}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <ExternalLink size={14} />
                        1-Click Copy & Launch FB Marketplace
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 text-center space-y-2">
                    <Share2 size={32} className="text-slate-300 mx-auto" />
                    <h5 className="font-extrabold text-sm text-slate-700">Ready to generate Facebook Ad</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Select an item on the left and click "Optimize Ad Copy with Gemini AI" to create high-converting copy!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Messenger Inbox & Live Messages */}
          {activeTab === "inbox" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInboxFilter("all")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      inboxFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInboxFilter("message")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      inboxFilter === "message" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    Messages ({notifications.filter((n) => n.type === "message" || n.type === "lead").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInboxFilter("comment")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      inboxFilter === "comment" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"
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
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearAll}
                      className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 ml-2"
                    >
                      <Trash2 size={13} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {filteredNotifications.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-10 text-center space-y-2">
                  <MessageSquare size={32} className="text-slate-300 mx-auto" />
                  <h4 className="text-sm font-extrabold text-slate-800">No Facebook messages yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When buyers message or comment on your Facebook listings, live notifications will appear here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notif) => {
                    const matchedItem = items.find(
                      (i) => i.id === notif.itemId || (notif.itemTitle && i.name.toLowerCase().includes(notif.itemTitle.toLowerCase()))
                    );

                    return (
                      <div
                        key={notif.id}
                        onClick={() => !notif.read && onMarkAsRead(notif.id)}
                        className={`border rounded-2xl p-4 transition cursor-pointer ${
                          !notif.read ? "bg-blue-50/70 border-blue-300 shadow-xs" : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                              {notif.type === "comment" ? <MessageCircle size={18} /> : <MessageSquare size={18} />}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">{notif.senderName}</span>
                                <span className="bg-slate-100 border text-[10px] font-bold text-slate-600 px-2 py-0.5 rounded-md">
                                  {notif.platform}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-xl border border-slate-200">
                                "{notif.messageText}"
                              </p>
                              {matchedItem && (
                                <p className="text-[11px] text-emerald-700 font-semibold">
                                  Matched Item: <b>{matchedItem.name}</b> (${matchedItem.listedPrice || matchedItem.purchasePrice})
                                </p>
                              )}
                            </div>
                          </div>

                          <a
                            href="https://facebook.com/messages"
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 transition shrink-0"
                            title="Open Facebook Messenger"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Webhook Tester & Simulator */}
          {activeTab === "webhook" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={15} className="text-blue-600" />
                  Live Webhook Simulator & Event Tester
                </h4>
                <p className="text-xs text-blue-900 leading-relaxed">
                  Simulate live Facebook buyer inquiries and Marketplace comments to verify real-time SSE notification delivery.
                </p>

                <form onSubmit={handleTriggerSimulation} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-950 mb-1">Event Type</label>
                      <select
                        value={simType}
                        onChange={(e: any) => setSimType(e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        <option value="message">Messenger Message</option>
                        <option value="comment">Marketplace Comment</option>
                        <option value="lead">FB Page Buyer Lead</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-950 mb-1">Buyer Name</label>
                      <input
                        type="text"
                        value={simSender}
                        onChange={(e) => setSimSender(e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-950 mb-1">Match to Inventory Item</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Select an item to test auto-matching --</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (${item.listedPrice || item.purchasePrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-blue-950 mb-1">Message Text</label>
                    <textarea
                      rows={2}
                      value={simText}
                      onChange={(e) => setSimText(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 resize-none"
                    />
                  </div>

                  {simSuccessMsg && (
                    <div className="bg-emerald-600 text-white text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                      <Zap size={16} /> {simSuccessMsg}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={simulating}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      {simulating ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                      Trigger Real-Time Webhook Notification
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Facebook Studio Graph API Ready</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Close Facebook Studio
          </button>
        </div>
      </div>
    </div>
  );
}
