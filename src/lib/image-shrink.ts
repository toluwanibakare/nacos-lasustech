/**
 * Phone photos are usually 3 to 8MB, but uploads are limited to 2MB. Scale the photo down in the
 * browser (keeping a PNG's transparent background) instead of rejecting it. Returns null if it cannot fit.
 */
export const shrinkToLimit = async (file: File, maxBytes: number, minSide: number): Promise<File | null> => {
  if (file.size <= maxBytes) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("unreadable"));
      el.src = url;
    });
    const type = file.type === "image/jpeg" ? "image/jpeg" : file.type === "image/webp" ? "image/webp" : "image/png";
    const ext = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
    const longSide = Math.max(img.naturalWidth, img.naturalHeight);
    const shortSide = Math.min(img.naturalWidth, img.naturalHeight);
    for (const target of [1600, 1280, 1024, 800, 600]) {
      // Shrink to the target, but never let the shorter side fall under the minimum.
      const scale = Math.min(1, Math.max(target / longSide, minSide / shortSide));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, w, h);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
      if (blob && blob.size <= maxBytes) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type });
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Checks a chosen file is a JPG, PNG or WEBP image and not too small. Returns an error message, or null when fine. */
export const checkImage = (file: File, minSide: number): Promise<string | null> =>
  new Promise((resolve) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return resolve("Photo must be a JPG, PNG or WEBP image.");
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(
        Math.min(img.naturalWidth, img.naturalHeight) < minSide
          ? `Photo is too small. The shorter side must be at least ${minSide}px.`
          : null,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("That file could not be read as an image.");
    };
    img.src = url;
  });
