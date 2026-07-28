import { InventoryItem } from "../types";

/**
 * Calculates the next sequential stock number starting at 1 and going up.
 * Evaluates all existing items in inventory to find the current highest numeric stock number.
 */
export function getNextSequentialStockNumber(items: InventoryItem[]): string {
  let maxNum = 0;

  if (Array.isArray(items)) {
    items.forEach((item) => {
      if (item.stockNumber) {
        // Extract numeric digits e.g. "1", "#2", "SKU-3" -> 1, 2, 3
        const digits = String(item.stockNumber).replace(/\D/g, "");
        if (digits) {
          const num = parseInt(digits, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
  }

  return (maxNum + 1).toString();
}

/**
 * Maps raw category strings or item keywords into the standard category options.
 * Prevents HTML select dropdowns from falling back to "Clothing & Apparel".
 */
export function matchBestCategory(rawCategory: string = "", titleHint: string = ""): string {
  const textToScan = `${rawCategory} ${titleHint}`.toLowerCase();

  if (textToScan.includes("tool") || textToScan.includes("hardware") || textToScan.includes("wheel") || textToScan.includes("industrial") || textToScan.includes("salvage") || textToScan.includes("iron") || textToScan.includes("wagon") || textToScan.includes("saw") || textToScan.includes("plow") || textToScan.includes("machine")) {
    return "Tools & Hardware";
  }
  if (textToScan.includes("vintage") || textToScan.includes("antique") || textToScan.includes("rustic") || textToScan.includes("decor") || textToScan.includes("farmhouse") || textToScan.includes("estate")) {
    return "Vintage & Antiques";
  }
  if (textToScan.includes("cloth") || textToScan.includes("apparel") || textToScan.includes("shirt") || textToScan.includes("pant") || textToScan.includes("jacket") || textToScan.includes("hat")) {
    return "Clothing & Apparel";
  }
  if (textToScan.includes("shoe") || textToScan.includes("sneaker") || textToScan.includes("boot")) {
    return "Shoes & Sneakers";
  }
  if (textToScan.includes("electronic") || textToScan.includes("gadget") || textToScan.includes("audio") || textToScan.includes("phone") || textToScan.includes("speaker") || textToScan.includes("tv")) {
    return "Electronics & Gadgets";
  }
  if (textToScan.includes("game") || textToScan.includes("console") || textToScan.includes("nintendo") || textToScan.includes("playstation") || textToScan.includes("xbox")) {
    return "Video Games & Consoles";
  }
  if (textToScan.includes("toy") || textToScan.includes("collectible") || textToScan.includes("figure") || textToScan.includes("doll")) {
    return "Toys & Collectibles";
  }
  if (textToScan.includes("book") || textToScan.includes("comic") || textToScan.includes("media") || textToScan.includes("dvd") || textToScan.includes("vhs")) {
    return "Books, Comics & Media";
  }
  if (textToScan.includes("home") || textToScan.includes("kitchen") || textToScan.includes("appliance") || textToScan.includes("cookware")) {
    return "Home, Kitchen & Decor";
  }
  if (textToScan.includes("sport") || textToScan.includes("outdoor") || textToScan.includes("bike") || textToScan.includes("camp")) {
    return "Sports & Outdoors";
  }
  if (textToScan.includes("jewel") || textToScan.includes("watch") || textToScan.includes("accessory") || textToScan.includes("gold") || textToScan.includes("silver")) {
    return "Jewelry & Accessories";
  }
  if (textToScan.includes("card") || textToScan.includes("pokemon")) {
    return "Trading Cards";
  }

  return "Other / Miscellaneous";
}

/**
 * Normalizes platform names (e.g. "eBay: Excellent for..." -> "eBay")
 * to match exact HTML select dropdown values without defaulting to Facebook.
 */
export function cleanPlatformName(rawPlatform?: string | null): string {
  if (!rawPlatform) return "Facebook Marketplace";
  const str = rawPlatform.split(":")[0].trim();
  const lower = str.toLowerCase();
  if (lower.includes("ebay")) return "eBay";
  if (lower.includes("facebook") || lower.includes("fb")) return "Facebook Marketplace";
  if (lower.includes("mercari")) return "Mercari";
  if (lower.includes("poshmark")) return "Poshmark";
  if (lower.includes("offerup")) return "OfferUp";
  if (lower.includes("craigslist")) return "Craigslist";
  if (lower.includes("whatnot")) return "Whatnot";
  if (lower.includes("etsy")) return "Etsy";
  return str || "Facebook Marketplace";
}
