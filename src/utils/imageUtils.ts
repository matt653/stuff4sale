/**
 * Compress and resize images for mobile phones to prevent Firestore 1MB document limit rejections.
 */
export async function compressImage(
  dataUrl: string,
  maxDimension: number = 1000,
  quality: number = 0.7
): Promise<string> {
  // If it's already a small HTTP/HTTPS URL or non-base64, return as-is
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Compress an array of base64 photo URLs in parallel.
 */
export async function compressImageArray(
  photos: string[],
  maxDimension: number = 1000,
  quality: number = 0.7
): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  return Promise.all(photos.map(p => compressImage(p, maxDimension, quality)));
}
