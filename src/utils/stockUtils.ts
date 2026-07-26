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
