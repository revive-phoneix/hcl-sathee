/**
 * Downscale / recompress an image so uploads fit Firebase Storage fallback
 * (inline data URLs have a ~700 KB server limit when Storage bucket is missing).
 */
export const compressImageForUpload = (
  file,
  { maxWidth = 1280, maxHeight = 1280, quality = 0.72, maxBytes = 650 * 1024 } = {}
) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }

    // Already small enough — keep original
    if (file.size <= maxBytes && file.size <= 400 * 1024) {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      const scale = Math.min(1, maxWidth / width, maxHeight / height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to process image"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const tryBlob = (q) =>
        new Promise((res) => {
          canvas.toBlob((blob) => res(blob), "image/jpeg", q);
        });

      (async () => {
        let q = quality;
        let blob = await tryBlob(q);
        while (blob && blob.size > maxBytes && q > 0.4) {
          q -= 0.1;
          blob = await tryBlob(q);
        }
        if (!blob) {
          reject(new Error("Unable to compress image"));
          return;
        }
        const name = String(file.name || "photo.jpg").replace(/\.\w+$/, ".jpg");
        resolve(new File([blob], name, { type: "image/jpeg" }));
      })().catch(reject);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image"));
    };

    img.src = objectUrl;
  });
