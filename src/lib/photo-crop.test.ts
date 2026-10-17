import { describe, it, expect } from "vitest";
import { clampCrop, cropSourceSquare, defaultCrop } from "./photo-crop";

const sq = (w: number, h: number, zoom: number, cx: number, cy: number) => {
  const r = cropSourceSquare(w, h, { zoom, cx, cy });
  return [r.x, r.y, r.side];
};

describe("photo-crop", () => {
  it("zoom 1 on a square photo is the full photo", () => {
    expect(sq(1000, 1000, 1, 0.5, 0.5)).toEqual([0, 0, 1000]);
  });
  it("zoom 2 centred", () => {
    expect(sq(1000, 1000, 2, 0.5, 0.5)).toEqual([250, 250, 500]);
  });
  it("clamps at corners", () => {
    expect(sq(1000, 1000, 2, 0, 1)).toEqual([0, 500, 500]);
    expect(sq(1000, 1000, 2, 1, 0)).toEqual([500, 0, 500]);
  });
  it("portrait photo", () => {
    expect(sq(600, 1000, 1, 0.5, 0.5)).toEqual([0, 200, 600]);
  });
  it("landscape photo", () => {
    expect(sq(1000, 600, 1, 0.5, 0.5)).toEqual([200, 0, 600]);
  });
  it("clampCrop keeps the window inside and defaultCrop is centred", () => {
    expect(defaultCrop(10, 20)).toEqual({ zoom: 1, cx: 0.5, cy: 0.5 });
    expect(clampCrop({ zoom: 9, cx: 0, cy: 1 }, 1000, 1000)).toEqual({ zoom: 5, cx: 0.1, cy: 0.9 });
  });
});
