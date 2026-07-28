import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { createClient } from "@supabase/supabase-js";
import firebaseConfig from "../firebase-applet-config.json" with { type: "json" };

const SUPABASE_URL = "https://yvekxqeltflessrblfbq.supabase.co";
const SUPABASE_KEY = "sb_publishable_qOutgWZwuKaCPODigqZCkw_t7KxhsLm";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
  console.log("Initializing Firebase app...");
  const app = initializeApp(firebaseConfig);

  // 1. Try named database ID
  const customDbId = (firebaseConfig as any).firestoreDatabaseId;
  const dbCustom = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  const dbDefault = getFirestore(app);

  let allDocs: any[] = [];

  try {
    console.log(`Fetching from custom database: ${customDbId}...`);
    const snap1 = await getDocs(collection(dbCustom, "inventory"));
    snap1.forEach((docSnap) => {
      allDocs.push({ sourceDb: customDbId, id: docSnap.id, ...docSnap.data() });
    });
    console.log(`Found ${snap1.size} items in custom database.`);
  } catch (e: any) {
    console.warn("Custom DB fetch error:", e.message);
  }

  try {
    console.log("Fetching from default database...");
    const snap2 = await getDocs(collection(dbDefault, "inventory"));
    snap2.forEach((docSnap) => {
      // Avoid duplicates if doc already exists
      if (!allDocs.some(d => d.id === docSnap.id)) {
        allDocs.push({ sourceDb: "default", id: docSnap.id, ...docSnap.data() });
      }
    });
    console.log(`Found ${snap2.size} items in default database.`);
  } catch (e: any) {
    console.warn("Default DB fetch error:", e.message);
  }

  console.log(`Total unique items found to migrate: ${allDocs.length}`);

  if (allDocs.length === 0) {
    console.log("No items found in Firebase to migrate.");
    return;
  }

  // Insert into Supabase table Stuff4Sale
  for (const docData of allDocs) {
    const rawPhotos = docData.photos || (docData.photoUrl ? [docData.photoUrl] : []);

    const payload = {
      name: docData.name || "Migrated Item",
      category: docData.category || "General Item",
      status: docData.status || "inventory",
      stock_number: docData.stockNumber || docData.id || "1",
      purchase_price: Number(docData.purchasePrice) || 0,
      purchase_date: docData.purchaseDate || new Date().toISOString().split("T")[0],
      purchase_location: docData.purchaseLocation || "",
      notes: docData.notes || "",
      photo_url: docData.photoUrl || (rawPhotos.length > 0 ? rawPhotos[0] : null),
      photos: rawPhotos,
      video_url: docData.videoUrl || null,
      listed_price: docData.listedPrice !== undefined && docData.listedPrice !== null ? Number(docData.listedPrice) : null,
      listed_platform: docData.listedPlatform || "Facebook Marketplace",
      sale_price: docData.salePrice !== undefined && docData.salePrice !== null ? Number(docData.salePrice) : null,
      sale_platform: docData.salePlatform || null,
      sale_date: docData.saleDate || null,
      research: docData.research || null,
      buyer_inquiries_count: docData.buyerInquiriesCount || 0,
      last_inquiry_at: docData.lastInquiryAt || null,
      updated_at: new Date().toISOString(),
    };

    console.log(`Migrating item: "${payload.name}" (Stock #${payload.stock_number})...`);

    const { data, error } = await supabase
      .from("Stuff4Sale")
      .insert([payload])
      .select();

    if (error) {
      console.error(`Failed to insert "${payload.name}":`, error.message);
    } else {
      console.log(`Successfully migrated "${payload.name}" (Supabase ID: ${data[0]?.id})`);
    }
  }

  console.log("Migration complete!");
}

migrate().catch((err) => console.error("Fatal migration error:", err));
