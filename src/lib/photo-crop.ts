// Photo crop maths. The PHP card renderer uses the same formula, so the
// browser preview matches the printed card.
export interface PhotoCrop {
  zoom: number;
  cx: number;
  cy: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const defaultCrop = (_w?: number, _h?: number): PhotoCrop => ({ zoom: 1, cx: 0.5, cy: 0.5 });

/** Clamp zoom and centre so the visible square always lies inside the photo. */
export const clampCrop = (crop: PhotoCrop, w: number, h: number): PhotoCrop => {
  const zoom = clamp(Number.isFinite(crop.zoom) ? crop.zoom : 1, MIN_ZOOM, MAX_ZOOM);
  const side = Math.min(w, h) / zoom;
  const mx = side / 2 / w;
  const my = side / 2 / h;
  const cx = clamp(Number.isFinite(crop.cx) ? crop.cx : 0.5, mx, 1 - mx);
  const cy = clamp(Number.isFinite(crop.cy) ? crop.cy : 0.5, my, 1 - my);
  return { zoom, cx, cy };
};

/** The visible square (x, y, side) in source-photo pixels. */
export const cropSourceSquare = (w: number, h: number, crop: PhotoCrop) => {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
  const side = Math.min(w, h) / zoom;
  const x = clamp(crop.cx * w - side / 2, 0, w - side);
  const y = clamp(crop.cy * h - side / 2, 0, h - side);
  return { x, y, side };
};
