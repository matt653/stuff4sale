import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Download, Sparkles, Filter, SlidersHorizontal, 
  X, Check, AlertCircle, RefreshCw, Layers, MapPin, Calendar, 
  Tag, Info, DollarSign, Archive, ShoppingBag, Eye, Star, LayoutGrid, LayoutList,
  Edit, Trash2, TrendingUp, Smartphone, Cloud, Share2, Clock, CheckCircle
} from "lucide-react";
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { InventoryItem, ItemStatus, AIResearchResult } from "./types";
import StatsGrid from "./components/StatsGrid";
import ItemCard from "./components/ItemCard";
import CameraCapture from "./components/CameraCapture";
import AIResearchView from "./components/AIResearchView";
import FBMarketplacePostingTool from "./components/FBMarketplacePostingTool";
import AIIntakeInspector from "./components/AIIntakeInspector";
import FBLeadSyncModal from "./components/FBLeadSyncModal";

const COMMON_CATEGORIES = [
  "Clothing & Apparel",
  "Shoes & Sneakers",
  "Electronics & Gadgets",
  "Video Games & Consoles",
  "Toys & Collectibles",
  "Books, Comics & Media",
  "Home, Kitchen & Decor",
  "Tools & Hardware",
  "Sports & Outdoors",
  "Jewelry & Accessories",
  "Vintage & Antiques",
  "Trading Cards",
  "Other / Miscellaneous"
];

export default function App() {
  // Inventory state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & View states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ItemStatus>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "profit" | "roi" | "cost-desc" | "cost-asc">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showFBTool, setShowFBTool] = useState(false);
  const [fbSelectedItem, setFbSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Active Form Fields
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Clothing & Apparel");
  const [stockNumber, setStockNumber] = useState("");
  const [bundleTitle, setBundleTitle] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [itemStatus, setItemStatus] = useState<ItemStatus>("inventory");

  // Listing / Sales fields
  const [listedPrice, setListedPrice] = useState("");
  const [listedPlatform, setListedPlatform] = useState("eBay");
  const [salePrice, setSalePrice] = useState("");
  const [salePlatform, setSalePlatform] = useState("eBay");
  const [saleDate, setSaleDate] = useState("");

  // AI Research states
  const [aiResult, setAiResult] = useState<AIResearchResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedItems: InventoryItem[] = [];
        snapshot.forEach((doc) => {
          fetchedItems.push({ id: doc.id, ...doc.data() } as InventoryItem);
        });
        setItems(fetchedItems);
        setLoading(false);
        setErrorMessage(null);
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setErrorMessage("Unable to sync live inventory sheet. Running in offline view.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle Form triggers
  const resetForm = () => {
    setItemName("");
    setItemCategory("Clothing & Apparel");
    setStockNumber("");
    setBundleTitle("");
    setPurchasePrice("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setPurchaseLocation("");
    setNotes("");
    setPhotoUrl(null);
    setPhotos([]);
    setVideoUrl(null);
    setItemStatus("inventory");
    setListedPrice("");
    setListedPlatform("eBay");
    setSalePrice("");
    setSalePlatform("eBay");
    setSaleDate("");
    setAiResult(null);
    setAiError(null);
    setEditingItem(null);
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setStockNumber(item.stockNumber || "");
    setBundleTitle(item.bundleTitle || "");
    setPurchasePrice(item.purchasePrice.toString());
    setPurchaseDate(item.purchaseDate);
    setPurchaseLocation(item.purchaseLocation || "");
    setNotes(item.notes || "");
    setPhotoUrl(item.photoUrl);
    setPhotos(item.photos && item.photos.length > 0 ? item.photos : item.photoUrl ? [item.photoUrl] : []);
    setVideoUrl(item.videoUrl || null);
    setItemStatus(item.status);
    setListedPrice(item.listedPrice ? item.listedPrice.toString() : "");
    setListedPlatform(item.listedPlatform || "eBay");
    setSalePrice(item.salePrice ? item.salePrice.toString() : "");
    setSalePlatform(item.salePlatform || "eBay");
    setSaleDate(item.saleDate || "");
    setAiResult(item.research);
    setShowAddForm(true);
    
    // Scroll to form nicely
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Connect to server-side Gemini research API
  const handleAiResearch = async () => {
    const activeImage = photos[0] || photoUrl;
    if (!itemName && !activeImage && photos.length === 0) {
      setAiError("Please input an item name or take a photo first so the AI has context to research.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: itemName,
          category: itemCategory,
          notes: notes,
          image: activeImage,
          images: photos.length > 0 ? photos : activeImage ? [activeImage] : [],
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to complete market research.");
      }

      const result: AIResearchResult = await response.json();
      setAiResult(result);

      // Auto-fill Box 2 ("Add New Item") fields from Gemini AI identification
      if (result.suggestedTitle) {
        setItemName(result.suggestedTitle);
      }
      if (result.category) {
        setItemCategory(result.category);
      }
      if (result.estimatedValueMin && result.estimatedValueMax) {
        const midpoint = Math.round((result.estimatedValueMin + result.estimatedValueMax) / 2);
        setListedPrice(midpoint.toString());
      }
      
      let descriptionText = result.suggestedDescription || "";
      if (result.cleaningInstructions && result.cleaningInstructions.length > 0) {
        descriptionText += "\n\n🧼 Cleaning & Prep Steps:\n" + result.cleaningInstructions.map((s: string) => `• ${s}`).join("\n");
      }
      if (descriptionText) {
        setNotes(descriptionText);
      }
    } catch (err: any) {
      console.error("AI Research error:", err);
      setAiError(err.message || "Something went wrong while contacting the AI research center.");
    } finally {
      setAiLoading(false);
    }
  };

  // Form Field update triggers from AI
  const handleApplyAiField = (fieldName: "name" | "notes" | "listedPrice" | "category", value: any) => {
    if (fieldName === "name") setItemName(value);
    if (fieldName === "notes") setNotes(value);
    if (fieldName === "listedPrice") setListedPrice(value.toString());
    if (fieldName === "category") setItemCategory(value);
  };

  const handleApplyAllAi = (research: AIResearchResult) => {
    setItemName(research.suggestedTitle);
    setNotes(research.suggestedDescription);
    setItemCategory(research.category || itemCategory);
    
    // Set listed price as midpoint of recommended range
    const midpoint = Math.round((research.estimatedValueMin + research.estimatedValueMax) / 2);
    setListedPrice(midpoint.toString());
    
    // Auto progress to listed status if not already progressed
    if (itemStatus === "inventory") {
      setItemStatus("listed");
    }
    
    // Auto apply first recommended platform
    if (research.targetPlatforms.length > 0) {
      const platformName = research.targetPlatforms[0].split("-")[0].trim();
      setListedPlatform(platformName);
    }
  };

  // Firestore operations
  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;

    try {
      const pPrice = Number(purchasePrice) || 0;
      const sPrice = salePrice ? Number(salePrice) : null;
      const lPrice = listedPrice ? Number(listedPrice) : null;

      // Bulletproof photo retention: ensure primary cover photo and photo list are never wiped during editing
      const finalPhotos = photos.length > 0 ? photos : photoUrl ? [photoUrl] : (editingItem?.photos || (editingItem?.photoUrl ? [editingItem.photoUrl] : []));
      const finalCoverPhoto = finalPhotos[0] || photoUrl || editingItem?.photoUrl || null;

      const itemData: Omit<InventoryItem, "id"> = {
        name: itemName,
        category: itemCategory,
        stockNumber: stockNumber.trim() || null as any,
        bundleId: editingItem?.bundleId || (bundleTitle.trim() ? "BUNDLE-" + Date.now().toString().slice(-4) : null as any),
        bundleTitle: bundleTitle.trim() || null as any,
        bundledItemIds: editingItem?.bundledItemIds || null as any,
        status: itemStatus,
        purchasePrice: pPrice,
        purchaseDate,
        purchaseLocation,
        notes,
        photoUrl: finalCoverPhoto,
        photos: finalPhotos,
        videoUrl,
        listedPrice: lPrice,
        listedPlatform: itemStatus === "listed" ? listedPlatform : null,
        salePrice: itemStatus === "sold" ? sPrice : null,
        salePlatform: itemStatus === "sold" ? salePlatform : null,
        saleDate: itemStatus === "sold" ? saleDate : null,
        research: aiResult || editingItem?.research || null,
        createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingItem) {
        // Update existing doc
        const docRef = doc(db, "inventory", editingItem.id);
        await updateDoc(docRef, itemData);
      } else {
        // Create new doc
        const collectionRef = collection(db, "inventory");
        await addDoc(collectionRef, itemData);
      }

      setShowAddForm(false);
      resetForm();
    } catch (err: any) {
      console.error("Error saving inventory item:", err);
      alert("Failed to save inventory item: " + err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "inventory", id));
    } catch (err: any) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    }
  };

  const handleQuickStatusUpdate = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const docRef = doc(db, "inventory", id);
      await updateDoc(docRef, updates);
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  // Export Filtered Items to Google Sheets compatible CSV
  const handleExportCSV = () => {
    if (items.length === 0) return;

    const headers = [
      "Item ID",
      "Item Name",
      "Category",
      "Status",
      "Purchase Price",
      "Purchase Date",
      "Purchase Location",
      "Listed Price",
      "Listed Platform",
      "Sale Price",
      "Sale Date",
      "Sale Platform",
      "Net Profit",
      "ROI (%)",
      "Notes",
      "AI Demand Score"
    ];

    const rows = filteredItems.map((item) => {
      const profit = item.status === "sold" && item.salePrice !== null ? item.salePrice - item.purchasePrice : "";
      const roi = item.status === "sold" && item.purchasePrice > 0 && profit ? ((Number(profit) / item.purchasePrice) * 100).toFixed(1) : "";
      
      return [
        item.id,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        item.status.toUpperCase(),
        item.purchasePrice,
        item.purchaseDate,
        `"${(item.purchaseLocation || "").replace(/"/g, '""')}"`,
        item.listedPrice || "",
        item.listedPlatform || "",
        item.salePrice || "",
        item.saleDate || "",
        item.salePlatform || "",
        profit,
        roi,
        `"${(item.notes || "").replace(/"/g, '""')}"`,
        item.research?.demandScore || ""
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `side-hustle-inventory-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Onboarding template generator for side hustle beginners
  const handleLoadSampleData = async () => {
    if (confirm("Would you like to seed 3 highly interactive sample items to see how tracking works?")) {
      try {
        const collectionRef = collection(db, "inventory");
        
        const sample1: Omit<InventoryItem, "id"> = {
          name: "Sony PlayStation 4 Console 500GB (Jet Black)",
          category: "Video Games & Consoles",
          status: "sold",
          purchasePrice: 40.00,
          purchaseDate: "2026-07-10",
          purchaseLocation: "Yard Sale",
          listedPrice: 130.00,
          listedPlatform: "eBay",
          salePrice: 125.00,
          saleDate: "2026-07-15",
          salePlatform: "eBay",
          notes: "Bought complete with one controller and HDMI. Cleaned off dust and tested. Works perfectly.",
          photoUrl: null,
          research: {
            estimatedValueMin: 90,
            estimatedValueMax: 140,
            suggestedTitle: "Sony PlayStation 4 PS4 500GB Console Black - Tested & Working!",
            suggestedDescription: "Up for sale is a tested and fully functional Sony PlayStation 4 (500GB) console in Jet Black. Includes original controller, power cord, and HDMI cable. Console has been fully factory reset and cleaned.",
            demandScore: 9,
            targetPlatforms: ["eBay - Massive console demand", "FB Marketplace - Sells fast locally"],
            sellingTips: ["Bundle with cheap games to raise margin", "Take clear photos of serial number"],
            category: "Video Games & Consoles",
            keywords: ["ps4 console", "sony playstation", "gaming console", "ps4 bundle"]
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const sample2: Omit<InventoryItem, "id"> = {
          name: "Patagonia Better Sweater Fleece Jacket Mens Medium",
          category: "Clothing & Apparel",
          status: "listed",
          purchasePrice: 6.50,
          purchaseDate: "2026-07-12",
          purchaseLocation: "Goodwill Outlet",
          listedPrice: 45.00,
          listedPlatform: "eBay",
          salePrice: null,
          saleDate: null,
          salePlatform: null,
          notes: "Excellent condition. No snags or stains. Freshly laundered.",
          photoUrl: null,
          research: {
            estimatedValueMin: 35,
            estimatedValueMax: 55,
            suggestedTitle: "Patagonia Better Sweater Full Zip Fleece Jacket Grey Mens Size Medium",
            suggestedDescription: "Beautiful Patagonia Better Sweater full zip fleece jacket in men's size Medium. Light heather grey color. Warm knit fabric style with zippered pockets. In excellent pre-owned condition.",
            demandScore: 8,
            targetPlatforms: ["Poshmark - Strong outdoor clothing market", "eBay - Reliable audience"],
            sellingTips: ["Measure pit-to-pit and length", "Photograph the Patagonia logo close-up"],
            category: "Clothing & Apparel",
            keywords: ["patagonia fleece", "better sweater", "mens patagonia", "fleece zip up"]
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const sample3: Omit<InventoryItem, "id"> = {
          name: "Vintage Polaroid Sun 600 Instant Camera",
          category: "Vintage & Antiques",
          status: "inventory",
          purchasePrice: 5.00,
          purchaseDate: "2026-07-18",
          purchaseLocation: "Estate Sale",
          listedPrice: null,
          listedPlatform: null,
          salePrice: null,
          saleDate: null,
          salePlatform: null,
          notes: "Body is in great shape. Flash opens correctly. Untested since I don't have 600 film.",
          photoUrl: null,
          research: {
            estimatedValueMin: 25,
            estimatedValueMax: 45,
            suggestedTitle: "Vintage Polaroid Sun 600 LMS Instant Film Camera - Beautiful Retro Aesthetics",
            suggestedDescription: "Up for sale is a classic vintage Polaroid Sun 600 Light Management System instant camera. Uses Polaroid 600 film. Mechanically clean with opening flash bar. Being sold as-is vintage untested.",
            demandScore: 6,
            targetPlatforms: ["eBay - Collectors dream", "Etsy - High vintage value"],
            sellingTips: ["Wipe clean with isopropyl alcohol", "List model details clearly in description"],
            category: "Vintage & Antiques",
            keywords: ["polaroid sun 600", "vintage camera", "polaroid instant", "retro polaroid"]
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await addDoc(collectionRef, sample1);
        await addDoc(collectionRef, sample2);
        await addDoc(collectionRef, sample3);
        setErrorMessage(null);
      } catch (err) {
        console.error("Failed seeding sample data:", err);
      }
    }
  };

  // Filter and sort computation
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.stockNumber && item.stockNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.purchaseLocation && item.purchaseLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" 
      ? true 
      : selectedStatus === ("bundles" as any) 
      ? Boolean(item.bundleId || item.bundleTitle || (item.bundledItemIds && item.bundledItemIds.length > 0))
      : item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "profit") {
      const aProfit = a.status === "sold" ? (a.salePrice || 0) - a.purchasePrice : -999999;
      const bProfit = b.status === "sold" ? (b.salePrice || 0) - b.purchasePrice : -999999;
      return bProfit - aProfit;
    }
    if (sortBy === "roi") {
      const aRoi = a.status === "sold" && a.purchasePrice > 0 ? ((a.salePrice || 0) - a.purchasePrice) / a.purchasePrice : -999999;
      const bRoi = b.status === "sold" && b.purchasePrice > 0 ? ((b.salePrice || 0) - b.purchasePrice) / b.purchasePrice : -999999;
      return bRoi - aRoi;
    }
    if (sortBy === "cost-desc") {
      return b.purchasePrice - a.purchasePrice;
    }
    if (sortBy === "cost-asc") {
      return a.purchasePrice - b.purchasePrice;
    }
    return 0;
  });

  // Compute some stats for sidebar goal tracking
  const soldItems = items.filter((item) => item.status === "sold");
  const totalSalesRevenue = soldItems.reduce((sum, item) => sum + (item.salePrice || 0), 0);
  const costOfSoldItems = soldItems.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);
  const realizedNetProfit = totalSalesRevenue - costOfSoldItems;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col" id="main-app-container">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between flex-none sticky top-0 z-50 shadow-sm" id="header-main">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            HustleSheet<span className="text-indigo-600">HQ</span>
          </span>
          <div className="hidden sm:flex items-center gap-1.5 ml-4 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">Synced</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search inventory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Export list to Google Sheets compatible CSV"
              id="btn-export-csv"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm shadow-indigo-200 active:scale-95"
            id="btn-add-item-toggle"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            <span>{showAddForm ? "Close Form" : "New Entry"}</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full md:w-60 bg-slate-900 text-slate-300 p-6 flex flex-col flex-none">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
            <button
              onClick={() => {
                setSelectedStatus("all");
                setSelectedCategory("All");
                setShowAddForm(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left font-medium transition-colors ${
                !showAddForm && selectedStatus === "all" ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Layers size={18} />
              <span>Live Inventory</span>
            </button>

            <button
              onClick={() => {
                setSelectedStatus("sold");
                setShowAddForm(false);
                const el = document.getElementById("stats-grid-dashboard");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left font-medium transition-colors ${
                selectedStatus === "sold" && !showAddForm ? "bg-indigo-500/10 text-indigo-400" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <TrendingUp size={18} />
              <span>Sales Performance</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
                const el = document.getElementById("form-drawer-container");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left font-medium transition-colors ${
                showAddForm ? "bg-indigo-500/10 text-indigo-400 font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <Sparkles size={18} className="text-indigo-400" />
              <span>New Entry & AI Valuation</span>
            </button>
          </div>

          <div className="mt-8 md:mt-auto pt-6 border-t border-slate-800/60 md:border-t-0">
            <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Monthly Profit</p>
              <h3 className="text-xl font-bold text-white">${realizedNetProfit.toFixed(2)}</h3>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (realizedNetProfit / 1000) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                {Math.min(100, (realizedNetProfit / 1000) * 100).toFixed(0)}% of $1,000 goal reached
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 flex flex-col space-y-6 overflow-y-auto bg-slate-50" id="main-dashboard-body">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Active Inventory</h1>
              <p className="text-slate-500 text-sm">Manage your sourcing and sales pipeline in real-time.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLeadModal(true)}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200 shadow-sm transition active:scale-95 cursor-pointer"
                id="btn-show-lead-sync"
              >
                💬 FB Lead Alerts
                {items.reduce((sum, i) => sum + (i.buyerInquiriesCount || 0), 0) > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {items.reduce((sum, i) => sum + (i.buyerInquiriesCount || 0), 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFbSelectedItem(items[0] || null);
                  setShowFBTool(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                id="btn-show-fb-poster"
              >
                <Share2 size={14} />
                FB Marketplace Poster
              </button>

              <button
                type="button"
                onClick={() => setShowMobileModal(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-indigo-200 shadow-sm transition active:scale-95 cursor-pointer"
                id="btn-show-mobile-connect"
              >
                <Smartphone size={14} className="text-indigo-500" />
                Mobile Sync & Free Deploy
              </button>
            </div>
          </header>

          {/* Error Feedback */}
          {errorMessage && (
            <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm" id="error-sync-banner">
              <AlertCircle size={16} className="shrink-0 text-amber-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

        {/* Live Finance Stats */}
        <StatsGrid items={items} />

        {/* Create/Edit Form Drawer (Accordion block on top) */}
        {showAddForm && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-5 lg:p-6 mb-6 transition-all duration-300" id="form-drawer-container">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
              <div>
                <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                  <ShoppingBag size={18} className="text-indigo-600" />
                  {editingItem ? "Edit Inventory Record" : "Add New Side Hustle Find"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Take a photo, type name, and let Gemini AI suggest listing titles, prices, and descriptions!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
                id="btn-close-form"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* BOX 1: What is it? (Sourcing Identification & AI Valuation) */}
              <div className="lg:col-span-6 bg-indigo-50/40 border border-indigo-100 p-5 rounded-2xl space-y-4 shadow-xs" id="box-1-what-is-it">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-indigo-600 text-white rounded-lg text-xs font-black flex items-center justify-center">1</span>
                    <h3 className="font-extrabold text-sm text-indigo-950">What Is It? (Snap Pictures & AI Check)</h3>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    Step 1
                  </span>
                </div>

                {/* Visual Capture Camera Component */}
                <CameraCapture 
                  onPhotoCaptured={(base64) => setPhotoUrl(base64 || null)} 
                  onPhotosCaptured={(photoList) => {
                    setPhotos(photoList);
                    setPhotoUrl(photoList[0] || null);
                  }}
                  onVideoCaptured={(base64) => setVideoUrl(base64 || null)}
                  initialPhotoUrl={photoUrl}
                  initialPhotos={photos}
                  initialVideoUrl={videoUrl}
                />

                {/* Big "Gemini Find It!" Identification Button */}
                <button
                  type="button"
                  disabled={aiLoading || (photos.length === 0 && !itemName && !photoUrl)}
                  onClick={handleAiResearch}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-300 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer"
                  id="btn-trigger-ai-research"
                >
                  {aiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} className="animate-bounce" />}
                  {aiLoading ? "Gemini is Identifying Item & Researching Comps..." : "✨ Gemini Find It! (Auto-Fill Form)"}
                </button>

                {/* Conversational Valuation Chat & Research Panel View */}
                <AIResearchView 
                  research={aiResult} 
                  photos={photos.length > 0 ? photos : photoUrl ? [photoUrl] : []}
                  itemName={itemName}
                  itemNotes={notes}
                  onApplyAll={handleApplyAllAi} 
                  onApplyField={handleApplyAiField}
                  isLoading={aiLoading} 
                  error={aiError} 
                />
              </div>

              {/* BOX 2: Add New Item Record (Auto-populated by Gemini) */}
              <form onSubmit={handleSubmitItem} className="lg:col-span-6 bg-slate-50/80 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs" id="box-2-add-new">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-800 text-white rounded-lg text-xs font-black flex items-center justify-center">2</span>
                    <h3 className="font-extrabold text-sm text-slate-900">Add New Item Record</h3>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    Step 2
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                      Item Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Patagonia Fleece, PS4 console, Vintage Camera..."
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                      id="form-item-name"
                    />
                  </div>

                  {/* Category Field */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Category</label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white"
                      id="form-item-category"
                    >
                      {COMMON_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Internal Stock # / SKU Field */}
                  <div>
                    <label className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center justify-between mb-1.5">
                      <span>Stock # / Internal SKU</span>
                      <span className="text-[9px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <Tag size={13} className="absolute left-3.5 top-3 text-indigo-500" />
                      <input
                        type="text"
                        placeholder="e.g. BIN-A4, #SKU-102..."
                        value={stockNumber}
                        onChange={(e) => setStockNumber(e.target.value)}
                        className="w-full text-xs border border-indigo-200 bg-indigo-50/30 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 font-bold"
                        id="form-item-stock-number"
                      />
                    </div>
                  </div>

                  {/* Bundle Name / Group Field */}
                  <div>
                    <label className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center justify-between mb-1.5">
                      <span>Bundle Group / Name</span>
                      <span className="text-[9px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <Layers size={13} className="absolute left-3.5 top-3 text-purple-600" />
                      <input
                        type="text"
                        placeholder="e.g. Gaming Setup Bundle, Stereo Set..."
                        value={bundleTitle}
                        onChange={(e) => setBundleTitle(e.target.value)}
                        className="w-full text-xs border border-purple-200 bg-purple-50/30 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-900 font-bold"
                        id="form-item-bundle-title"
                      />
                    </div>
                  </div>

                  {/* Purchase Location */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Where'd you buy it?</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Garage Sale, Thrift, Estate..."
                        value={purchaseLocation}
                        onChange={(e) => setPurchaseLocation(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        id="form-item-location"
                      />
                    </div>
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                      Purchase Cost ($) <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign size={13} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                        id="form-item-purchase-price"
                      />
                    </div>
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Purchase Date</label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="date"
                        required
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white"
                        id="form-item-purchase-date"
                      />
                    </div>
                  </div>

                  {/* Status Picker */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Current Status</label>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {(["inventory", "listed", "sold", "archived"] as ItemStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setItemStatus(status)}
                          className={`py-2 text-[11px] font-bold rounded-lg border transition capitalize ${
                            itemStatus === status 
                              ? "bg-indigo-600 border-indigo-600 text-white" 
                              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                          }`}
                          id={`btn-form-status-${status}`}
                        >
                          {status === "inventory" ? "In Stock" : status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CONDITIONAL: Listed Info */}
                  {itemStatus === "listed" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">List Price ($)</label>
                        <div className="relative">
                          <DollarSign size={13} className="absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={listedPrice}
                            onChange={(e) => setListedPrice(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                            id="form-item-listed-price"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Listing Platform</label>
                        <select
                          value={listedPlatform}
                          onChange={(e) => setListedPlatform(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white"
                          id="form-item-listed-platform"
                        >
                          <option value="eBay">eBay</option>
                          <option value="Facebook Marketplace">Facebook Marketplace</option>
                          <option value="Mercari">Mercari</option>
                          <option value="Poshmark">Poshmark</option>
                          <option value="Craigslist">Craigslist</option>
                          <option value="OfferUp">OfferUp</option>
                          <option value="Other">Other Platform</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* CONDITIONAL: Sold Info */}
                  {itemStatus === "sold" && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Sale Price ($)</label>
                        <div className="relative">
                          <DollarSign size={13} className="absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-semibold"
                            id="form-item-sale-price"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Sale Platform</label>
                        <select
                          value={salePlatform}
                          onChange={(e) => setSalePlatform(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white"
                          id="form-item-sale-platform"
                        >
                          <option value="eBay">eBay</option>
                          <option value="Facebook Marketplace">Facebook Marketplace</option>
                          <option value="Mercari">Mercari</option>
                          <option value="Poshmark">Poshmark</option>
                          <option value="Craigslist">Craigslist</option>
                          <option value="OfferUp">OfferUp</option>
                          <option value="Other">Other Platform</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Date Sold</label>
                        <div className="relative">
                          <Calendar size={13} className="absolute left-3.5 top-3 text-slate-400" />
                          <input
                            type="date"
                            required
                            value={saleDate}
                            onChange={(e) => setSaleDate(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 bg-white"
                            id="form-item-sale-date"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes / Descriptions block */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Notes & Research Logs
                      </label>
                      <span className="text-[10px] text-slate-400">Private notes or copy AI listing details here</span>
                    </div>
                    <textarea
                      rows={5}
                      placeholder="Input condition, flaws, bundled items, accessories, or details you found during your research."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 whitespace-pre-wrap leading-relaxed"
                      id="form-item-notes"
                    />
                  </div>
                </div>

                {/* Form Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                    id="btn-cancel-form"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                    id="btn-submit-item"
                  >
                    {editingItem ? "Save Changes" : "Save to Live Sheet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters Toolbar Bar */}
        <section className="bg-white border border-slate-150 rounded-2xl p-4 mb-6 shadow-sm space-y-3" id="filters-toolbar">
          {/* Status Filter Tabs (Posted vs Not Posted) */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                selectedStatus === "all" ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Items ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("inventory")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                selectedStatus === "inventory" ? "bg-amber-500 text-white shadow-xs" : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Clock size={12} /> Not Posted Yet ({items.filter(i => i.status === "inventory").length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("listed")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                selectedStatus === "listed" ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
              }`}
            >
              <Share2 size={12} /> Posted on FB ({items.filter(i => i.status === "listed").length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("sold")}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                selectedStatus === "sold" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <CheckCircle size={12} /> Sold ({items.filter(i => i.status === "sold").length})
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-slate-400 shrink-0" size={15} />
              <input
                type="text"
                placeholder="Search by title, notes, brand, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-medium"
                id="search-input-field"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  id="btn-clear-search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Selector drop downs and sort */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={12} className="text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none font-semibold cursor-pointer"
                  id="filter-category-select"
                >
                  <option value="All">All Categories</option>
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={12} className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none font-semibold cursor-pointer"
                  id="sort-select-field"
                >
                  <option value="newest">Newest Scanned</option>
                  <option value="oldest">Oldest Scanned</option>
                  <option value="profit">Highest Profit (Sold)</option>
                  <option value="roi">Highest ROI (Sold)</option>
                  <option value="cost-desc">Cost: High to Low</option>
                  <option value="cost-asc">Cost: Low to High</option>
                </select>
              </div>

              {/* Grid/List views toggles */}
              <div className="border-l border-slate-200 pl-2 ml-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
                  title="Grid view"
                  id="btn-view-grid"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition ${viewMode === "list" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
                  title="List view"
                  id="btn-view-list"
                >
                  <LayoutList size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick status tabs selection bar */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none" id="status-quick-tabs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filter Status:</span>
            {[
              { id: "all", label: "All Items" },
              { id: "inventory", label: "In Stock" },
              { id: "listed", label: "Listed" },
              { id: "bundles", label: "📦 Bundles" },
              { id: "sold", label: "Sold" },
              { id: "archived", label: "Archived" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id as any)}
                className={`text-xs px-3.5 py-1 rounded-full font-bold transition shrink-0 border ${
                  selectedStatus === tab.id
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                }`}
                id={`tab-status-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Live List Display section */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center" id="loading-spinner-view">
            <RefreshCw className="animate-spin text-indigo-600 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-600">Retrieving live side hustle sheets...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State view */
          <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm" id="empty-state-view">
            <div className="w-16 h-16 bg-slate-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
              <ShoppingBag size={28} className="stroke-[1.25]" />
            </div>
            
            <h3 className="font-bold text-base text-slate-800 mb-1.5">No Inventory Found</h3>
            
            {searchQuery || selectedCategory !== "All" || selectedStatus !== "all" ? (
              <>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  No products matched your active filters or searches. Try clearing search fields.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setSelectedStatus("all");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 font-semibold text-xs rounded-xl transition"
                  id="btn-clear-all-filters"
                >
                  Clear All Filters
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                  Your side hustle tracker is online and ready! Add your first item, scan a photo with your tablet/phone, and track your revenue.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition"
                    id="btn-add-item-empty"
                  >
                    Add First Find
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                    id="btn-load-sample-data"
                  >
                    Seed Sample Products
                  </button>
                </div>
              </>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="inventory-grid-list">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                allItems={items}
                onEdit={handleEditClick}
                onDelete={handleDeleteItem}
                onStatusChange={handleQuickStatusUpdate}
                onFBPost={(selected) => {
                  setFbSelectedItem(selected);
                  setShowFBTool(true);
                }}
              />
            ))}
          </div>
        ) : (
          /* LIST VIEW (Table style) */
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm" id="inventory-table-list">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Cost Info</th>
                    <th className="py-3 px-4">Listed / Sold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredItems.map((item) => {
                    const profit = item.status === "sold" ? (item.salePrice || 0) - item.purchasePrice : null;
                    const roi = profit && item.purchasePrice > 0 ? (profit / item.purchasePrice) * 100 : null;
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        {/* Title & Photo */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
                              {item.photoUrl ? (
                                <img src={item.photoUrl} alt="" className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                              ) : (
                                <ShoppingBag size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold text-slate-800 truncate" title={item.name}>
                                  {item.name}
                                </span>
                                {(item.bundleId || item.bundleTitle) && (
                                  <span className="bg-purple-100 text-purple-900 text-[9px] font-extrabold px-1.5 py-0.2 rounded shrink-0">
                                    📦 BUNDLE
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {item.notes || "No notes"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 font-semibold text-slate-500 whitespace-nowrap">
                          {item.category}
                        </td>

                        {/* Cost & Location */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold block text-slate-800">${item.purchasePrice.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 block flex items-center gap-0.5">
                            <MapPin size={9} /> {item.purchaseLocation || "Unknown"}
                          </span>
                        </td>

                        {/* Listed or Sold Info */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.status === "sold" ? (
                            <div>
                              <span className="font-bold block text-emerald-600">${item.salePrice?.toFixed(2)}</span>
                              <span className="text-[10px] text-emerald-700 block font-semibold uppercase">
                                Profit: ${(profit || 0).toFixed(2)} ({roi?.toFixed(0)}%)
                              </span>
                            </div>
                          ) : item.status === "listed" ? (
                            <div>
                              <span className="font-bold block text-indigo-600">${item.listedPrice?.toFixed(2)}</span>
                              <span className="text-[10px] text-indigo-500 block">
                                on {item.listedPlatform}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unlisted</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "sold" ? "bg-emerald-100 text-emerald-700" :
                            item.status === "listed" ? "bg-amber-100 text-amber-700" :
                            item.status === "archived" ? "bg-slate-100 text-slate-500" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {item.status === "inventory" ? "Stock" : item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setFbSelectedItem(item);
                                setShowFBTool(true);
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition text-[11px] font-bold flex items-center gap-1"
                              title="Create FB Marketplace Post"
                            >
                              <Share2 size={11} className="text-blue-600" /> FB Ad
                            </button>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200/50 transition"
                              title="Edit item"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this inventory item?")) {
                                  handleDeleteItem(item.id);
                                }
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200/50 transition"
                              title="Delete item"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile Connect & Free Deploy Modal */}
        {showMobileModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="mobile-connect-modal">
            <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Mobile Sync & Free Deploy</h3>
                    <p className="text-xs text-slate-400">Run your hustle manager from anywhere for free</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileModal(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition"
                  id="btn-close-mobile-modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Section 1: Mobile Sync */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 p-5 rounded-2xl items-center">
                  <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-slate-150 shadow-sm shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                      alt="Scan to open on phone"
                      className="w-32 h-32"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2.5">Scan with Camera</span>
                  </div>
                  <div className="md:col-span-8 space-y-2.5">
                    <h4 className="font-extrabold text-sm text-slate-900">Connect Your Phone / Tablet</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Scan this QR code with your mobile device to open the **live synced applet** instantly. 
                      You can snap pictures of new items and record short video clips directly from your phone's camera, and they will save to your inventory sheet in real-time!
                    </p>
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        readOnly
                        value={window.location.href}
                        className="text-[11px] font-mono text-slate-600 flex-1 bg-transparent border-none outline-none select-all truncate"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard! Share it with your phone/tablet.");
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: Free Deployment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Cloud size={16} className="text-indigo-600" />
                    <h4 className="font-extrabold text-sm text-slate-900">Run Free Forever on Your Own Account</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This application is built with standard React and Firestore, making it fully compatible with completely free hosting tiers. Follow these steps to host your own independent version:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Step 1 & 2 */}
                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-extrabold">1</span>
                        <h5 className="font-bold text-xs text-slate-800">Export Your Code</h5>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Click the **Settings gear** in the top-right corner of Google AI Studio and choose **Export as ZIP** or **Export to GitHub**.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-extrabold">2</span>
                        <h5 className="font-bold text-xs text-slate-800">Free Frontend Hosting</h5>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Log in to **Vercel.com** or **Netlify.com** (both are completely free) and import your repository to deploy it automatically on your own domain.
                      </p>
                    </div>

                    {/* Step 3 & 4 */}
                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-extrabold">3</span>
                        <h5 className="font-bold text-xs text-slate-800">Free Firestore Database</h5>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Go to **console.firebase.google.com** and create a free project. Enable the Firestore Database under the Spark Plan (100% free with no credit card).
                      </p>
                    </div>

                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-extrabold">4</span>
                        <h5 className="font-bold text-xs text-slate-800">Configure Environment Keys</h5>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Set your Firebase configurations and your free `GEMINI_API_KEY` inside your Vercel/Netlify dashboard settings so AI search is active.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowMobileModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FB Marketplace Posting Tool Modal Overlay */}
        {showFBTool && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" id="fb-tool-modal-overlay">
            <div className="w-full max-w-4xl my-auto animate-fade-in">
              <FBMarketplacePostingTool
                items={items}
                selectedItem={fbSelectedItem}
                onStatusChange={handleQuickStatusUpdate}
                onClose={() => setShowFBTool(false)}
              />
            </div>
          </div>
        )}

        {/* FB Messenger Lead Sync & Alert Tracker Modal Overlay */}
        {showLeadModal && (
          <FBLeadSyncModal
            items={items}
            onStatusChange={handleQuickStatusUpdate}
            onClose={() => setShowLeadModal(false)}
          />
        )}
        </main>
      </div>
    </div>
  );
}
