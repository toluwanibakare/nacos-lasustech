import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import cardTemplate from "@/assets/id_card_design.png";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  PhotoCrop,
  clampCrop,
  cropSourceSquare,
  defaultCrop,
} from "@/lib/photo-crop";

interface PhotoCropEditorProps {
  src: string;
  crop: PhotoCrop;
  onChange: (crop: PhotoCrop) => void;
  name: string;
  level: string;
  post?: string;
  matric?: string | null;
  readOnly?: boolean;
}

// Template geometry (720x1080)
const T_W = 720;
const T_H = 1080;
const CIRCLE = { cx: 374, cy: 469, r: 215 };
const cq = (px: number) => `${(px / T_W) * 100}cqw`;
const topPct = (baseline: number, fontPx: number) => `${((baseline - fontPx * 0.85) / T_H) * 100}%`;

const NUDGE = 0.01;

const PhotoCropEditor = ({
  src,
  crop,
  onChange,
  name,
  level,
  post,
  matric,
  readOnly = false,
}: PhotoCropEditorProps) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const circleRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; crop: PhotoCrop } | null>(null);

  useEffect(() => {
    setSize(null);
    setFailed(false);
  }, [src]);

  const safe = useMemo(() => (size ? clampCrop(crop, size.w, size.h) : crop), [crop, size]);
  const sq = size ? cropSourceSquare(size.w, size.h, safe) : null;

  const words = name.trim().split(/\s+/).filter(Boolean);
  const surname = (words[0] || "").toUpperCase();
  const others = words.slice(1).join(" ");

  const update = (next: PhotoCrop) => {
    if (size && !readOnly) onChange(clampCrop(next, size.w, size.h));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly || !size) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, crop: safe };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !size || !circleRef.current) return;
    const px = circleRef.current.getBoundingClientRect().width;
    const side = Math.min(size.w, size.h) / d.crop.zoom;
    const k = side / px;
    update({
      zoom: d.crop.zoom,
      cx: d.crop.cx - ((e.clientX - d.x) * k) / size.w,
      cy: d.crop.cy - ((e.clientY - d.y) * k) / size.h,
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const step = NUDGE / safe.zoom;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = map[e.key];
    if (m) {
      e.preventDefault();
      update({ ...safe, cx: safe.cx + m[0], cy: safe.cy + m[1] });
    } else if (e.key === "+" || e.key === "=") {
      update({ ...safe, zoom: safe.zoom + 0.1 });
    } else if (e.key === "-") {
      update({ ...safe, zoom: safe.zoom - 0.1 });
    }
  };

  const setZoom = (z: number) => update({ ...safe, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) });

  return (
    <div className="mx-auto w-full max-w-[300px] sm:max-w-[360px]">
      <div
        className="relative w-full overflow-hidden rounded-2xl border bg-white"
        style={{ aspectRatio: `${T_W} / ${T_H}`, containerType: "inline-size" }}
      >
        <img src={cardTemplate} alt="ID card template" className="absolute inset-0 h-full w-full select-none" draggable={false} />

        {/* Photo circle */}
        <div
          ref={circleRef}
          role={readOnly ? "img" : "slider"}
          aria-label="Photo position"
          aria-valuemin={MIN_ZOOM}
          aria-valuemax={MAX_ZOOM}
          aria-valuenow={Number(safe.zoom.toFixed(2))}
          tabIndex={readOnly ? -1 : 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className={`absolute overflow-hidden rounded-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${
            readOnly ? "" : "cursor-grab active:cursor-grabbing"
          }`}
          style={{
            left: `${((CIRCLE.cx - CIRCLE.r) / T_W) * 100}%`,
            top: `${((CIRCLE.cy - CIRCLE.r) / T_H) * 100}%`,
            width: `${((CIRCLE.r * 2) / T_W) * 100}%`,
            aspectRatio: "1 / 1",
            touchAction: "none",
          }}
        >
          {/* Hidden loader so natural size is known before rendering the circle image */}
          {!size && !failed && (
            <img
              src={src}
              alt=""
              className="hidden"
              onLoad={(e) =>
                setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
              }
              onError={() => setFailed(true)}
            />
          )}
          {failed && (
            <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
              Photo could not be loaded
            </div>
          )}
          {size && sq && (
            <img
              src={src}
              alt="Your photo"
              draggable={false}
              className="pointer-events-none absolute select-none"
              style={{
                maxWidth: "none",
                width: `${(size.w / sq.side) * 100}%`,
                left: `${(-sq.x / sq.side) * 100}%`,
                top: `${(-sq.y / sq.side) * 100}%`,
              }}
            />
          )}
        </div>

        {/* Printed text overlays */}
        <div
          className="pointer-events-none absolute left-0 w-full text-center font-bold"
          style={{ top: topPct(735, 48), fontSize: cq(48), lineHeight: 1, color: "#066000" }}
        >
          {surname}
        </div>
        <div
          className="pointer-events-none absolute left-0 w-full text-center"
          style={{ top: topPct(775, 31), fontSize: cq(31), lineHeight: 1, color: "#111" }}
        >
          {others}
        </div>
        <div
          className="pointer-events-none absolute bg-white text-center"
          style={{
            left: `${(180 / T_W) * 100}%`,
            top: `${(802 / T_H) * 100}%`,
            width: `${((570 - 180) / T_W) * 100}%`,
            height: `${((915 - 802) / T_H) * 100}%`,
          }}
        >
          <div
            className="absolute left-0 w-full font-semibold"
            style={{ top: `${((840 - 0.85 * 26 - 802) / (915 - 802)) * 100}%`, fontSize: cq(26), lineHeight: 1, color: "#111" }}
          >
            MATRIC: {matric || "PENDING"}
          </div>
          <div
            className="absolute left-0 w-full"
            style={{ top: `${((890 - 0.85 * 24 - 802) / (915 - 802)) * 100}%`, fontSize: cq(24), lineHeight: 1, color: "#111" }}
          >
            POST: {post || "Student"}, {level}Lvl
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Zoom out" onClick={() => setZoom(safe.zoom - 0.1)} disabled={!size}>
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="range"
              aria-label="Zoom"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={safe.zoom}
              disabled={!size}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="h-2 flex-1 accent-green-700"
            />
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Zoom in" onClick={() => setZoom(safe.zoom + 0.1)} disabled={!size}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => onChange(defaultCrop(size?.w, size?.h))} disabled={!size}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Drag to position, use the slider to zoom. This is exactly how your card will look.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoCropEditor;
