const PHOTO_HOST = "https://nacosid.tmb.it.com/";

/**
 * Web address of a student's photo. The database holds either "uploads/students/x.jpg" (older records)
 * or just "x.jpg" (photos saved by the ID card flow, which live in uploads/). Already-complete addresses
 * are left alone.
 */
export const studentPhotoUrl = (path: string | null | undefined): string | null => {
  const raw = String(path ?? "").trim();
  if (!raw) return null;
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  const clean = raw.replace(/^\/+/, "");
  return PHOTO_HOST + (clean.startsWith("uploads/") ? clean : `uploads/${clean}`);
};
