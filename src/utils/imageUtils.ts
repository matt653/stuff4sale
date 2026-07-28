/**
 * Compress and resize images for mobile phones to prevent Firestore 1MB document limit rejections.
 * Mobile WebKit (iOS Safari) safe with fallback timeout.
 */
export async function compressImage(
  dataUrl: string,
  maxDimension: number = 1000,
  quality: number = 0.7
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    let resolved = false;

    // Safety timeout: resolve with original dataUrl after 1sec if mobile WebKit stalls
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(dataUrl);
      }
    }, 1000);

    const img = new Image();
    
    img.onload = () => {
      if (resolved) return;
      clearTimeout(timeoutId);

      try {
        let width = img.width;
        let height = img.height;

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
          resolved = true;
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolved = true;
        resolve(compressed);
      } catch (err) {
        resolved = true;
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      if (!resolved) {
        clearTimeout(timeoutId);
        resolved = true;
        resolve(dataUrl);
      }
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
