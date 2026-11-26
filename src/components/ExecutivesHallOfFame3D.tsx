import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  Award,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Grid2X2,
  Heart,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { HallOfFameHolder, HallOfFamePositionGroup } from "@/data/executives";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchApi } from "@/lib/api";
import hallOfFameMusic from "@/assets/The_Script_-_Hall_of_Fame_Instrumental_(mp3.pm).mp3";

interface ExecutivesHallOfFame3DProps {
  positions: HallOfFamePositionGroup[];
}

interface HallStop {
  positionTitle: string;
  holder: HallOfFameHolder;
  portraitPos: THREE.Vector3;
  standPos: THREE.Vector3;
  faceYaw: number;
}

function createCoverPortraitTexture(
  src: string,
  objectPosition: string | undefined,
  onReady: (texture: THREE.CanvasTexture) => void,
) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const width = 768;
    const height = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgRatio = img.width / img.height;
    const targetRatio = width / height;
    let drawW = width;
    let drawH = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > targetRatio) {
      drawH = height;
      drawW = height * imgRatio;
      offsetX = (width - drawW) / 2;
    } else {
      drawW = width;
      drawH = width / imgRatio;
      offsetY = objectPosition === "object-top" ? 0 : (height - drawH) * 0.2;
    }

    ctx.fillStyle = "#0b1e15";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    const grad = ctx.createLinearGradient(0, height * 0.72, 0, height);
    grad.addColorStop(0, "rgba(4, 17, 11, 0)");
    grad.addColorStop(1, "rgba(4, 17, 11, 0.35)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    onReady(texture);
  };
  img.src = src;
}

function createPositionHeaderTexture(title: string): THREE.CanvasTexture {
  const width = 1024;
  const height = 180;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#06150e";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#c8a24b";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  ctx.fillStyle = "#d9be75";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = title.length > 24 ? 38 : 46;
  ctx.font = `700 ${fontSize}px Outfit, Inter, system-ui, sans-serif`;
  ctx.fillText(title.toUpperCase(), width / 2, height / 2, width - 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createPlaqueTexture(holder: HallOfFameHolder): THREE.CanvasTexture {
  const width = 1024;
  const height = 280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0b2419");
  bg.addColorStop(1, "#06140e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#c8a24b";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.fillStyle = "#f4f7f5";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = holder.name.length > 24 ? 44 : 52;
  ctx.font = `700 ${fontSize}px Outfit, Inter, system-ui, sans-serif`;
  ctx.fillText(holder.name, width / 2, 104, width - 96);

  ctx.fillStyle = "#c8a24b";
  ctx.fillRect(width / 2 - 70, 152, 140, 3);

  ctx.fillStyle = "#d9be75";
  ctx.font = "600 32px Inter, system-ui, sans-serif";
  ctx.fillText(`${holder.session} SESSION`, width / 2, 206, width - 96);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createEndMonumentTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#081c13");
  bg.addColorStop(1, "#040e09");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#c8a24b";
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.fillStyle = "#d9be75";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 28px Inter, system-ui, sans-serif";
  ctx.fillText("NACOS LASUSTECH CHAPTER", width / 2, 145);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 58px Outfit, Inter, system-ui, sans-serif";
  ctx.fillText("EXECUTIVES HALL OF FAME", width / 2, 245);

  ctx.fillStyle = "#c8a24b";
  ctx.fillRect(width / 2 - 120, 310, 240, 4);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "500 26px Inter, system-ui, sans-serif";
  ctx.fillText("HONORING PAST LEADERS ACROSS SESSIONS", width / 2, 372);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/**
 * Renders a high-resolution 1080x1350 PNG snapshot card of a single executive
 * on the Hall of Fame wall (role card, gold-framed portrait, name & session plaque).
 */
async function renderExecutiveSnapshotPng(
  positionTitle: string,
  holder: HallOfFameHolder,
): Promise<Blob | null> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Museum wall background with warm spotlight radial glow
  ctx.fillStyle = "#04100a";
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, 540, 60, width / 2, 540, 620);
  glow.addColorStop(0, "rgba(217, 190, 117, 0.16)");
  glow.addColorStop(0.55, "rgba(13, 43, 29, 0.55)");
  glow.addColorStop(1, "rgba(4, 16, 10, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Subtle gold outer border
  ctx.strokeStyle = "rgba(200, 162, 75, 0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Role Card at the top
  const roleW = 680;
  const roleH = 96;
  const roleX = (width - roleW) / 2;
  const roleY = 92;
  ctx.fillStyle = "#06150e";
  ctx.fillRect(roleX, roleY, roleW, roleH);
  ctx.strokeStyle = "#c8a24b";
  ctx.lineWidth = 4;
  ctx.strokeRect(roleX, roleY, roleW, roleH);

  ctx.fillStyle = "#d9be75";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const roleFontSize = positionTitle.length > 24 ? 28 : 34;
  ctx.font = `700 ${roleFontSize}px Outfit, Inter, system-ui, sans-serif`;
  ctx.fillText(positionTitle.toUpperCase(), width / 2, roleY + roleH / 2, roleW - 48);

  // Gold Portrait Frame
  const frameW = 540;
  const frameH = 700;
  const frameX = (width - frameW) / 2;
  const frameY = 232;

  ctx.fillStyle = "#c8a24b";
  ctx.fillRect(frameX - 16, frameY - 16, frameW + 32, frameH + 32);
  ctx.fillStyle = "#081710";
  ctx.fillRect(frameX - 6, frameY - 6, frameW + 12, frameH + 12);

  // Load and cover-crop portrait
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const imgRatio = img.width / img.height;
      const targetRatio = frameW / frameH;
      let drawW = frameW;
      let drawH = frameH;
      let ox = 0;
      let oy = 0;
      if (imgRatio > targetRatio) {
        drawH = frameH;
        drawW = frameH * imgRatio;
        ox = (frameW - drawW) / 2;
      } else {
        drawW = frameW;
        drawH = frameW / imgRatio;
        oy = holder.objectPosition === "object-top" ? 0 : (frameH - drawH) * 0.2;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(frameX, frameY, frameW, frameH);
      ctx.clip();
      ctx.drawImage(img, frameX + ox, frameY + oy, drawW, drawH);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = holder.image;
  });

  // Name & Session Plaque below portrait
  const plaqueW = 640;
  const plaqueH = 174;
  const plaqueX = (width - plaqueW) / 2;
  const plaqueY = frameY + frameH + 46;

  const plaqueBg = ctx.createLinearGradient(0, plaqueY, 0, plaqueY + plaqueH);
  plaqueBg.addColorStop(0, "#0b2419");
  plaqueBg.addColorStop(1, "#06140e");
  ctx.fillStyle = plaqueBg;
  ctx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH);
  ctx.strokeStyle = "#c8a24b";
  ctx.lineWidth = 4;
  ctx.strokeRect(plaqueX, plaqueY, plaqueW, plaqueH);

  ctx.fillStyle = "#f4f7f5";
  const nameFont = holder.name.length > 24 ? 34 : 40;
  ctx.font = `700 ${nameFont}px Outfit, Inter, system-ui, sans-serif`;
  ctx.fillText(holder.name, width / 2, plaqueY + 62, plaqueW - 48);

  ctx.fillStyle = "#c8a24b";
  ctx.fillRect(width / 2 - 55, plaqueY + 98, 110, 3);

  ctx.fillStyle = "#d9be75";
  ctx.font = "600 24px Inter, system-ui, sans-serif";
  ctx.fillText(`${holder.session} SESSION`, width / 2, plaqueY + 134, plaqueW - 48);

  // Subtle Footer Branding
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.font = "700 21px Inter, system-ui, sans-serif";
  ctx.fillText("NACOS LASUSTECH EXECUTIVE HALL OF FAME", width / 2, height - 92);

  ctx.fillStyle = "rgba(217, 190, 117, 0.85)";
  ctx.font = "600 18px Inter, system-ui, sans-serif";
  ctx.fillText("BUILT BY TMB", width / 2, height - 56);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

type SocialPlatform = "x" | "linkedin" | "tiktok" | "whatsapp";

const SocialBrandIcon = ({ platform }: { platform: SocialPlatform }) => {
  if (platform === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.77 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.14.1-1.84-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.83 2.04.9 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.18-.31.4-.44.54-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.34.07.12.07.7-.17 1.38z" />
      </svg>
    );
  }
  if (platform === "x") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (platform === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
};

function playCameraShutterSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const bufferSize = ctx.sampleRate * 0.055;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (ctx.sampleRate * 0.012));
      data[i] = (Math.random() * 2 - 1) * env * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;

    noise.connect(filter);
    filter.connect(ctx.destination);
    noise.start();
    setTimeout(() => ctx.close().catch(() => undefined), 200);
  } catch {
    // AudioContext unavailable
  }
}

async function captureWebGLGalleryShot(
  webglCanvas: HTMLCanvasElement,
  positionTitle: string,
  holder: HallOfFameHolder,
): Promise<Blob | null> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#04100a";
  ctx.fillRect(0, 0, width, height);

  const photoH = height - 110;
  const srcRatio = webglCanvas.width / Math.max(1, webglCanvas.height);
  const dstRatio = width / photoH;
  let drawW = width;
  let drawH = photoH;
  let ox = 0;
  let oy = 0;

  if (srcRatio > dstRatio) {
    drawH = photoH;
    drawW = photoH * srcRatio;
    ox = (width - drawW) / 2;
  } else {
    drawW = width;
    drawH = width / srcRatio;
    oy = (photoH - drawH) / 2;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, photoH);
  ctx.clip();
  ctx.drawImage(webglCanvas, ox, oy, drawW, drawH);
  ctx.restore();

  // Subtle dark film-strip footer with official Hall of Fame & Built by TMB tag
  ctx.fillStyle = "#040d08";
  ctx.fillRect(0, photoH, width, 110);
  ctx.strokeStyle = "rgba(200, 162, 75, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, photoH);
  ctx.lineTo(width, photoH);
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f4f7f5";
  ctx.font = "700 22px Outfit, Inter, system-ui, sans-serif";
  ctx.fillText(`${holder.name}  ·  ${positionTitle.toUpperCase()}`, 44, photoH + 38, width - 280);

  ctx.fillStyle = "rgba(217, 190, 117, 0.9)";
  ctx.font = "600 17px Inter, system-ui, sans-serif";
  ctx.fillText(`NACOS LASUSTECH EXECUTIVE HALL OF FAME  (${holder.session})`, 44, photoH + 74, width - 280);

  ctx.textAlign = "right";
  ctx.fillStyle = "#d9be75";
  ctx.font = "700 17px Inter, system-ui, sans-serif";
  ctx.fillText("BUILT BY TMB", width - 44, photoH + 56);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function buildSocialDrafts(positionTitle: string, holder: HallOfFameHolder, pageUrl: string): Record<SocialPlatform, string> {
  return {
    x: `Honoring ${holder.name} (${positionTitle}, ${holder.session}) in the NACOS LASUSTECH Executive Hall of Fame! 🏆\n\nStep into the 3D gallery: ${pageUrl}\n\n#NACOSLASUSTECH #HallOfFame #BuiltByTMB`,
    linkedin: `Proud to celebrate ${holder.name}, who served as ${positionTitle} during the ${holder.session} academic session at NACOS LASUSTECH.\n\nExplore the interactive 3D NACOS LASUSTECH Executive Hall of Fame to honor our past student leaders:\n${pageUrl}\n\nBuilt by TMB.\n#NACOSLASUSTECH #StudentLeadership #TechCommunity`,
    tiktok: `Stepping into the 3D NACOS LASUSTECH Executive Hall of Fame! 🏆✨ Shoutout to ${holder.name} (${positionTitle} - ${holder.session}) for the service and legacy.\n\nExplore here: ${pageUrl}\n\nBuilt by TMB 💻🔥 #NACOSLASUSTECH #LASUSTECH #HallOfFame #TechTok`,
    whatsapp: `*NACOS LASUSTECH Executive Hall of Fame* 🏆\n\nCelebrating *${holder.name}* (${positionTitle}, ${holder.session} Session) for their service to our chapter.\n\nWalk through the 3D Hall of Fame here:\n${pageUrl}\n\n_Built by TMB_`,
  };
}

const ExecutivesHallOfFame3D = ({ positions }: ExecutivesHallOfFame3DProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");
  const [webglError, setWebglError] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [autoTour, setAutoTour] = useState(true);
  const [sharingSnapshot, setSharingSnapshot] = useState(false);
  const [cameraStage, setCameraStage] = useState<"aiming" | "flash" | null>(null);
  const rendererCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snapshotPreview, setSnapshotPreview] = useState<{
    url: string;
    blob: Blob;
    fileName: string;
    positionTitle: string;
    holder: HallOfFameHolder;
  } | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<SocialPlatform>("whatsapp");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [stats, setStats] = useState<{ views: number; likes: number }>(() => {
    try {
      const saved = localStorage.getItem("hof_stats_cache");
      return saved ? JSON.parse(saved) : { views: 1, likes: 0 };
    } catch {
      return { views: 1, likes: 0 };
    }
  });
  const [liked, setLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hof_liked") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    const alreadyViewed = sessionStorage.getItem("hof_viewed_session") === "true";
    const endpoint = alreadyViewed ? "/content/hall-of-fame/stats" : "/content/hall-of-fame/view";
    const method = alreadyViewed ? "GET" : "POST";

    fetchApi(endpoint, { method })
      .then((res: { views?: number; likes?: number }) => {
        if (cancelled || typeof res?.views !== "number") return;
        const next = { views: res.views, likes: Number(res.likes || 0) };
        setStats(next);
        sessionStorage.setItem("hof_viewed_session", "true");
        localStorage.setItem("hof_stats_cache", JSON.stringify(next));
      })
      .catch(() => {
        if (cancelled || alreadyViewed) return;
        sessionStorage.setItem("hof_viewed_session", "true");
        setStats((prev) => {
          const next = { views: prev.views + 1, likes: prev.likes };
          localStorage.setItem("hof_stats_cache", JSON.stringify(next));
          return next;
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    localStorage.setItem("hof_liked", String(nextLiked));
    setStats((prev) => {
      const next = {
        views: prev.views,
        likes: Math.max(0, prev.likes + (nextLiked ? 1 : -1)),
      };
      localStorage.setItem("hof_stats_cache", JSON.stringify(next));
      return next;
    });

    fetchApi("/content/hall-of-fame/like", {
      method: "POST",
      body: JSON.stringify({ liked: nextLiked }),
    })
      .then((res: { views?: number; likes?: number }) => {
        if (typeof res?.likes === "number") {
          const synced = { views: Number(res.views ?? stats.views), likes: res.likes };
          setStats(synced);
          localStorage.setItem("hof_stats_cache", JSON.stringify(synced));
        }
      })
      .catch(() => undefined);
  };

  const handleShareSnapshot = async (positionTitle: string, holder: HallOfFameHolder) => {
    if (sharingSnapshot) return;
    setSharingSnapshot(true);
    try {
      let blob: Blob | null = null;

      if (viewMode === "3d" && !webglError && rendererCanvasRef.current) {
        // Pause tour and frame the person squarely before taking the shot
        setAutoTour(false);
        autoTourRef.current = false;
        walkToRef.current?.(activeStopIndex);
        setCameraStage("aiming");
        await new Promise((r) => setTimeout(r, 480));

        setCameraStage("flash");
        playCameraShutterSound();
        blob = await captureWebGLGalleryShot(rendererCanvasRef.current, positionTitle, holder);
        await new Promise((r) => setTimeout(r, 260));
        setCameraStage(null);
      } else {
        setCameraStage("flash");
        playCameraShutterSound();
        blob = await renderExecutiveSnapshotPng(positionTitle, holder);
        await new Promise((r) => setTimeout(r, 220));
        setCameraStage(null);
      }

      if (!blob) return;
      const slug = holder.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const fileName = `${slug}-hall-of-fame.png`;
      const url = URL.createObjectURL(blob);
      setSnapshotPreview((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { url, blob, fileName, positionTitle, holder };
      });
      setCopiedCaption(false);
    } finally {
      setCameraStage(null);
      setSharingSnapshot(false);
    }
  };

  const closeSnapshotPreview = () => {
    setSnapshotPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  const downloadSnapshot = () => {
    if (!snapshotPreview) return;
    const a = document.createElement("a");
    a.href = snapshotPreview.url;
    a.download = snapshotPreview.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const nativeShareSnapshot = async (caption: string) => {
    if (!snapshotPreview) return;
    const file = new File([snapshotPreview.blob], snapshotPreview.fileName, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${snapshotPreview.holder.name} - NACOS LASUSTECH Executive Hall of Fame`,
          text: caption,
        });
      } catch {
        // Cancelled
      }
    } else {
      downloadSnapshot();
    }
  };

  const copyCaptionText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const shareToPlatform = async (platform: SocialPlatform, caption: string, pageUrl: string) => {
    await copyCaptionText(caption);
    if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "tiktok") {
      downloadSnapshot();
      window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
    }
  };

  const autoTourRef = useRef(true);
  const activeStopRef = useRef(0);
  const musicMutedRef = useRef(false);

  useEffect(() => {
    autoTourRef.current = autoTour;
  }, [autoTour]);

  useEffect(() => {
    activeStopRef.current = activeStopIndex;
  }, [activeStopIndex]);

  useEffect(() => {
    musicMutedRef.current = musicMuted;
    if (audioRef.current) {
      audioRef.current.muted = musicMuted;
    }
  }, [musicMuted]);

  const allEntries = useMemo(
    () =>
      positions.flatMap((group) =>
        group.holders.map((holder) => ({ positionTitle: group.position, holder })),
      ),
    [positions],
  );

  const walkToRef = useRef<((stopIdx: number) => void) | null>(null);
  const resetToEntranceRef = useRef<(() => void) | null>(null);

  const tryStartMusic = () => {
    const audio = audioRef.current;
    if (!audio || musicMutedRef.current) return;
    audio.volume = 0.45;
    audio
      .play()
      .then(() => setMusicPlaying(true))
      .catch(() => {
        // Browser autoplay policy may wait for user gesture
      });
  };

  // Sync fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Attempt background music playback when entering 3D mode; pause in grid mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (viewMode === "3d" && !webglError) {
      tryStartMusic();
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }, [viewMode, webglError]);

  const toggleFullscreen = async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
        tryStartMusic();
      }
    } catch {
      // Fullscreen unsupported or blocked
    }
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicMuted || audio.paused) {
      setMusicMuted(false);
      audio.muted = false;
      audio.volume = 0.45;
      audio
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => undefined);
    } else {
      setMusicMuted(true);
      audio.muted = true;
    }
  };

  useEffect(() => {
    if (viewMode !== "3d" || positions.length === 0) return;
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setAutoTour(false);
      autoTourRef.current = false;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglError(true);
      return;
    }
    rendererCanvasRef.current = renderer.domElement;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#04100a");
    scene.fog = new THREE.FogExp2("#04100a", 0.028);

    const camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 120);

    scene.add(new THREE.AmbientLight("#d7efe2", 0.6));
    scene.add(new THREE.HemisphereLight("#9ee2bd", "#06140d", 0.65));

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      textures.push(t);
      return t;
    };

    const halfWidth = 3.8;
    const pairCount = Math.ceil(positions.length / 2);
    const baySpacing = 5.4;
    const startZ = -1.5;
    const endZ = startZ - (pairCount - 1) * baySpacing - 5.5;
    const entranceZ = 4.2;
    const hallLength = entranceZ - endZ;
    const hallCenterZ = (entranceZ + endZ) / 2;
    const wallHeight = 5.0;

    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: "#071810",
        roughness: 0.28,
        metalness: 0.45,
      }),
    );
    const wallMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: "#091e14",
        roughness: 0.65,
        metalness: 0.15,
      }),
    );
    const ceilingMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: "#040f0a",
        roughness: 0.85,
        metalness: 0.1,
      }),
    );
    const goldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: "#c8a24b",
        roughness: 0.28,
        metalness: 0.85,
      }),
    );
    const darkFrameMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: "#081710",
        roughness: 0.45,
        metalness: 0.35,
      }),
    );
    const runnerMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: "#0d2b1d",
        roughness: 0.75,
        metalness: 0.1,
      }),
    );

    const floor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfWidth * 2 + 1, hallLength)), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, hallCenterZ);
    floor.userData = { isFloor: true };
    scene.add(floor);

    const runner = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.9, hallLength - 2)), runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.008, hallCenterZ);
    runner.userData = { isFloor: true };
    scene.add(runner);

    const borderGeo = trackGeo(new THREE.PlaneGeometry(0.05, hallLength - 2));
    for (const bx of [-0.97, 0.97]) {
      const border = new THREE.Mesh(borderGeo, goldMat);
      border.rotation.x = -Math.PI / 2;
      border.position.set(bx, 0.01, hallCenterZ);
      scene.add(border);
    }

    const ceiling = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(halfWidth * 2 + 1, hallLength)), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, wallHeight, hallCenterZ);
    scene.add(ceiling);

    const sideWallGeo = trackGeo(new THREE.PlaneGeometry(hallLength, wallHeight));
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-halfWidth, wallHeight / 2, hallCenterZ);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(halfWidth, wallHeight / 2, hallCenterZ);
    scene.add(rightWall);

    const endWallGeo = trackGeo(new THREE.PlaneGeometry(halfWidth * 2 + 0.5, wallHeight));
    const endWall = new THREE.Mesh(endWallGeo, wallMat);
    endWall.position.set(0, wallHeight / 2, endZ);
    scene.add(endWall);

    const backWall = new THREE.Mesh(endWallGeo, wallMat);
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, wallHeight / 2, entranceZ);
    scene.add(backWall);

    const monumentTex = trackTex(createEndMonumentTexture());
    const monumentMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: monumentTex,
        roughness: 0.35,
        metalness: 0.2,
      }),
    );
    const monument = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(4.6, 2.3)), monumentMat);
    monument.position.set(0, 2.45, endZ + 0.05);
    scene.add(monument);

    const moldingGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.08, hallLength));
    for (const mx of [-halfWidth + 0.04, halfWidth - 0.04]) {
      const baseMolding = new THREE.Mesh(moldingGeo, goldMat);
      baseMolding.position.set(mx, 0.12, hallCenterZ);
      scene.add(baseMolding);

      const topMolding = new THREE.Mesh(moldingGeo, goldMat);
      topMolding.position.set(mx, wallHeight - 0.18, hallCenterZ);
      scene.add(topMolding);
    }

    const pilasterGeo = trackGeo(new THREE.BoxGeometry(0.22, wallHeight, 0.24));
    const sconceGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.14, 0.14));
    const sconceMat = trackMat(new THREE.MeshBasicMaterial({ color: "#ffe7ad" }));

    for (let p = 0; p <= pairCount; p++) {
      const pz = startZ - p * baySpacing + baySpacing * 0.5;
      for (const px of [-halfWidth + 0.08, halfWidth - 0.08]) {
        const pilaster = new THREE.Mesh(pilasterGeo, darkFrameMat);
        pilaster.position.set(px, wallHeight / 2, pz);
        scene.add(pilaster);
      }
      const sconce = new THREE.Mesh(sconceGeo, sconceMat);
      sconce.position.set(0, wallHeight - 0.12, pz - baySpacing * 0.5);
      scene.add(sconce);

      const bayPointLight = new THREE.PointLight("#ffefd0", 5.5, 11, 1.5);
      bayPointLight.position.set(0, wallHeight - 0.55, pz - baySpacing * 0.5);
      scene.add(bayPointLight);
    }

    const stops: HallStop[] = [];
    const interactiveMeshes: THREE.Object3D[] = [];
    const floorMeshes: THREE.Object3D[] = [floor, runner];

    const headerBackingGeo = trackGeo(new THREE.BoxGeometry(2.6, 0.46, 0.06));
    const headerFaceGeo = trackGeo(new THREE.PlaneGeometry(2.5, 0.4));
    const outerFrameGeo = trackGeo(new THREE.BoxGeometry(1.74, 2.22, 0.1));
    const innerMatteGeo = trackGeo(new THREE.BoxGeometry(1.58, 2.06, 0.11));
    const portraitGeo = trackGeo(new THREE.PlaneGeometry(1.42, 1.88));
    const plaqueBackingGeo = trackGeo(new THREE.BoxGeometry(1.68, 0.48, 0.06));
    const plaqueFaceGeo = trackGeo(new THREE.PlaneGeometry(1.6, 0.42));

    positions.forEach((groupData, posIdx) => {
      const isLeft = posIdx % 2 === 0;
      const pairIdx = Math.floor(posIdx / 2);
      const bayZ = startZ - pairIdx * baySpacing;
      const wallX = isLeft ? -halfWidth + 0.06 : halfWidth - 0.06;
      const wallRotY = isLeft ? Math.PI / 2 : -Math.PI / 2;

      const bayGroup = new THREE.Group();
      bayGroup.position.set(wallX, 0, bayZ);
      bayGroup.rotation.y = wallRotY;

      const headerBacking = new THREE.Mesh(headerBackingGeo, darkFrameMat);
      headerBacking.position.set(0, 3.62, 0.03);
      bayGroup.add(headerBacking);

      const headerTex = trackTex(createPositionHeaderTexture(groupData.position));
      const headerMat = trackMat(
        new THREE.MeshStandardMaterial({
          map: headerTex,
          roughness: 0.35,
          metalness: 0.2,
        }),
      );
      const headerFace = new THREE.Mesh(headerFaceGeo, headerMat);
      headerFace.position.set(0, 3.62, 0.065);
      bayGroup.add(headerFace);

      const holders = groupData.holders;
      const holderSpacing = 2.0;

      holders.forEach((holder, hIdx) => {
        const localX = (hIdx - (holders.length - 1) / 2) * holderSpacing;
        const stopIdx = stops.length;

        const portraitGroup = new THREE.Group();
        portraitGroup.position.set(localX, 2.22, 0.05);

        const outerFrame = new THREE.Mesh(outerFrameGeo, goldMat);
        outerFrame.userData = { stopIdx };
        portraitGroup.add(outerFrame);
        interactiveMeshes.push(outerFrame);

        const innerMatte = new THREE.Mesh(innerMatteGeo, darkFrameMat);
        innerMatte.position.z = 0.01;
        portraitGroup.add(innerMatte);

        const portraitMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: "#153224",
            roughness: 0.35,
            metalness: 0.08,
          }),
        );
        const portrait = new THREE.Mesh(portraitGeo, portraitMat);
        portrait.position.z = 0.068;
        portrait.userData = { stopIdx };
        portraitGroup.add(portrait);
        interactiveMeshes.push(portrait);

        createCoverPortraitTexture(holder.image, holder.objectPosition, (tex) => {
          trackTex(tex);
          portraitMat.map = tex;
          portraitMat.color.set("#ffffff");
          portraitMat.needsUpdate = true;
        });

        const plaqueBacking = new THREE.Mesh(plaqueBackingGeo, darkFrameMat);
        plaqueBacking.position.set(0, -1.46, 0.02);
        portraitGroup.add(plaqueBacking);

        const plaqueTex = trackTex(createPlaqueTexture(holder));
        const plaqueMat = trackMat(
          new THREE.MeshStandardMaterial({
            map: plaqueTex,
            roughness: 0.32,
            metalness: 0.2,
          }),
        );
        const plaqueFace = new THREE.Mesh(plaqueFaceGeo, plaqueMat);
        plaqueFace.position.set(0, -1.46, 0.055);
        plaqueFace.userData = { stopIdx };
        portraitGroup.add(plaqueFace);
        interactiveMeshes.push(plaqueFace);

        bayGroup.add(portraitGroup);

        const portraitWorld = new THREE.Vector3(localX, 2.15, 0.1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          wallRotY,
        );
        portraitWorld.add(new THREE.Vector3(wallX, 0, bayZ));

        const standX = isLeft ? -0.35 : 0.35;
        const standZ = bayZ + (isLeft ? localX : -localX);
        const standPos = new THREE.Vector3(standX, 1.68, THREE.MathUtils.clamp(standZ, endZ + 1.5, entranceZ - 1.0));
        const faceYaw = isLeft ? Math.PI / 2 : -Math.PI / 2;

        stops.push({
          positionTitle: groupData.position,
          holder,
          portraitPos: portraitWorld,
          standPos,
          faceYaw,
        });
      });

      scene.add(bayGroup);
    });

    const particleCount = 130;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * (halfWidth * 1.7);
      particlePositions[i * 3 + 1] = Math.random() * 3.8 + 0.4;
      particlePositions[i * 3 + 2] = endZ + Math.random() * hallLength;
    }
    const particleGeo = trackGeo(new THREE.BufferGeometry());
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = trackMat(
      new THREE.PointsMaterial({
        color: "#d9be75",
        size: 0.035,
        transparent: true,
        opacity: 0.4,
      }),
    );
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const eyePos = new THREE.Vector3(0, 1.68, entranceZ - 1.2);
    const targetPos = eyePos.clone();
    let yaw = 0;
    let targetYaw = 0;
    let pitch = 0.02;
    let targetPitch = 0.02;
    let autoWalking = false;
    let tourTimer = 2.6; // brief entrance glide before moving to first person

    const applyStopTarget = (idx: number) => {
      if (stops.length === 0) return;
      const clampedIdx = ((idx % stops.length) + stops.length) % stops.length;
      const stop = stops[clampedIdx];
      targetPos.copy(stop.standPos);
      let deltaYaw = stop.faceYaw - yaw;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
      targetYaw = yaw + deltaYaw;
      targetPitch = 0.11;
      autoWalking = true;
      activeStopRef.current = clampedIdx;
      setActiveStopIndex(clampedIdx);
    };

    const walkToStop = (idx: number) => {
      tourTimer = 0;
      applyStopTarget(idx);
    };

    const restartTour = () => {
      targetPos.set(0, 1.68, entranceZ - 1.2);
      let deltaYaw = 0 - yaw;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
      targetYaw = yaw + deltaYaw;
      targetPitch = 0.02;
      autoWalking = true;
      tourTimer = 2.0;
      activeStopRef.current = 0;
      setActiveStopIndex(0);
      setAutoTour(true);
      autoTourRef.current = true;

      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        if (!musicMutedRef.current) {
          audio.volume = 0.45;
          audio
            .play()
            .then(() => setMusicPlaying(true))
            .catch(() => undefined);
        }
      }
    };

    walkToRef.current = walkToStop;
    resetToEntranceRef.current = restartTour;

    const keysDown = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
        if (document.activeElement === container || container.contains(document.activeElement)) {
          e.preventDefault();
        }
        tryStartMusic();
        setAutoTour(false);
        autoTourRef.current = false;
        keysDown.add(e.key.toLowerCase());
        autoWalking = false;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key.toLowerCase());
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isDragging = false;
    let dragDistance = 0;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: PointerEvent) => {
      tryStartMusic();
      isDragging = true;
      dragDistance = 0;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (!isDragging) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(interactiveMeshes, false);
        renderer.domElement.style.cursor = hits.length > 0 ? "pointer" : "grab";
        return;
      }

      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      prevX = e.clientX;
      prevY = e.clientY;

      if (dragDistance > 6) {
        setAutoTour(false);
        autoTourRef.current = false;
      }
      autoWalking = false;
      targetYaw += dx * 0.0048;
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.0035, -0.45, 0.55);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;

      if (dragDistance < 8) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(interactiveMeshes, false);
        if (hits.length > 0) {
          const hitStop = hits[0].object.userData?.stopIdx;
          if (typeof hitStop === "number") {
            setAutoTour(false);
            autoTourRef.current = false;
            walkToStop(hitStop);
            return;
          }
        }

        const floorHits = raycaster.intersectObjects(floorMeshes, false);
        if (floorHits.length > 0) {
          const pt = floorHits[0].point;
          setAutoTour(false);
          autoTourRef.current = false;
          const destX = THREE.MathUtils.clamp(pt.x, -halfWidth + 1.15, halfWidth - 1.15);
          const destZ = THREE.MathUtils.clamp(pt.z, endZ + 1.4, entranceZ - 0.8);
          const dx = destX - eyePos.x;
          const dz = destZ - eyePos.z;
          if (Math.hypot(dx, dz) > 0.35) {
            const desiredYaw = Math.atan2(-dx, -dz);
            let deltaYaw = desiredYaw - yaw;
            while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
            while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
            targetYaw = yaw + deltaYaw;
          }
          targetPos.set(destX, 1.68, destZ);
          targetPitch = 0.04;
          autoWalking = true;
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.style.touchAction = "pan-y";
    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();
    const forwardVec = new THREE.Vector3();
    const rightVec = new THREE.Vector3();
    let elapsedTotal = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsedTotal += dt;

      // Cinematic auto-tour: slides smoothly from one person to another
      if (autoTourRef.current && stops.length > 0 && !isDragging && keysDown.size === 0) {
        tourTimer += dt;
        const holdDuration = 4.5;
        if (tourTimer >= holdDuration) {
          tourTimer = 0;
          const nextIdx = (activeStopRef.current + 1) % stops.length;
          applyStopTarget(nextIdx);
        }
      }

      if (keysDown.size > 0) {
        const speed = 4.6 * dt;
        forwardVec.set(-Math.sin(yaw), 0, -Math.cos(yaw));
        rightVec.set(Math.cos(yaw), 0, -Math.sin(yaw));

        if (keysDown.has("w") || keysDown.has("arrowup")) {
          targetPos.addScaledVector(forwardVec, speed);
        }
        if (keysDown.has("s") || keysDown.has("arrowdown")) {
          targetPos.addScaledVector(forwardVec, -speed);
        }
        if (keysDown.has("a") || keysDown.has("arrowleft")) {
          targetPos.addScaledVector(rightVec, -speed);
        }
        if (keysDown.has("d") || keysDown.has("arrowright")) {
          targetPos.addScaledVector(rightVec, speed);
        }

        targetPos.x = THREE.MathUtils.clamp(targetPos.x, -halfWidth + 1.15, halfWidth - 1.15);
        targetPos.z = THREE.MathUtils.clamp(targetPos.z, endZ + 1.4, entranceZ - 0.8);
      }

      // Smooth cinematic glide during auto-tour vs crisp manual control
      const posLerp = prefersReducedMotion ? 1 : autoTourRef.current ? 0.032 : autoWalking ? 0.065 : 0.18;
      const rotLerp = prefersReducedMotion ? 1 : autoTourRef.current ? 0.038 : autoWalking ? 0.075 : 0.22;

      eyePos.lerp(targetPos, posLerp);
      yaw += (targetYaw - yaw) * rotLerp;
      pitch += (targetPitch - pitch) * rotLerp;

      if (autoWalking && eyePos.distanceTo(targetPos) < 0.03) {
        autoWalking = false;
      }

      // Subtle Steadicam breathing sway during cinematic auto-tour
      const swayX = autoTourRef.current && !prefersReducedMotion ? Math.sin(elapsedTotal * 0.7) * 0.08 : 0;
      const swayY = autoTourRef.current && !prefersReducedMotion ? Math.cos(elapsedTotal * 0.9) * 0.025 : 0;

      camera.position.set(eyePos.x + swayX, eyePos.y + swayY, eyePos.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      if (!prefersReducedMotion) {
        particles.rotation.y += dt * 0.015;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      domEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      rendererCanvasRef.current = null;
      renderer.dispose();
    };
  }, [positions, viewMode]);

  if (positions.length === 0) return null;

  const currentEntry = allEntries[Math.min(activeStopIndex, allEntries.length - 1)];
  const showGrid = viewMode === "grid" || webglError;

  return (
    <div
      ref={wrapperRef}
      className={`border border-primary/20 bg-[#04100a] text-white overflow-hidden shadow-xl ${
        isFullscreen ? "flex h-screen w-screen flex-col rounded-none" : "rounded-3xl"
      }`}
    >
      <audio ref={audioRef} src={hallOfFameMusic} loop preload="auto" />

      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center lg:justify-between md:px-7">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
              <Award className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/90 sm:text-[11px]">
                Interactive 3D Corridor
              </p>
              <h3 className="truncate font-display text-base font-bold text-white sm:text-lg">
                Executives Hall of Fame
              </h3>
            </div>
          </div>

          {!webglError && (
            <div className="inline-flex shrink-0 rounded-full border border-white/15 bg-white/5 p-0.5 lg:hidden">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewMode === "3d" ? "bg-primary text-white" : "text-white/70 hover:text-white"
                }`}
              >
                <Eye className="h-3 w-3" />
                3D
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  viewMode === "grid" ? "bg-primary text-white" : "text-white/70 hover:text-white"
                }`}
              >
                <Grid2X2 className="h-3 w-3" />
                Grid
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!showGrid && (
            <div className="grid w-full grid-cols-4 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  tryStartMusic();
                  setAutoTour((prev) => !prev);
                }}
                className={`inline-flex items-center justify-center gap-1 rounded-full border px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                  autoTour
                    ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                    : "border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white"
                }`}
              >
                {autoTour ? <Pause className="h-3.5 w-3.5 shrink-0" /> : <Play className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{autoTour ? "Pause" : "Tour"}</span>
              </button>

              <button
                type="button"
                onClick={toggleMusic}
                aria-label={musicMuted || !musicPlaying ? "Unmute background music" : "Mute background music"}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/15 hover:text-white sm:px-3 sm:text-xs"
              >
                {musicMuted || !musicPlaying ? (
                  <VolumeX className="h-3.5 w-3.5 shrink-0 text-white/60" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                )}
                <span className="truncate">{musicMuted || !musicPlaying ? "Muted" : "Music"}</span>
              </button>

              <button
                type="button"
                onClick={() => resetToEntranceRef.current?.()}
                aria-label="Restart tour and music"
                className="inline-flex items-center justify-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/15 hover:text-white sm:px-3 sm:text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Restart</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/15 hover:text-white sm:px-3 sm:text-xs"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{isFullscreen ? "Exit" : "Full"}</span>
              </button>
            </div>
          )}

          {!webglError && (
            <div className="hidden rounded-full border border-white/15 bg-white/5 p-1 lg:inline-flex">
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "3d" ? "bg-primary text-white" : "text-white/70 hover:text-white"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                3D Walk
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  viewMode === "grid" ? "bg-primary text-white" : "text-white/70 hover:text-white"
                }`}
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                Grid
              </button>
            </div>
          )}
        </div>
      </div>

      {!showGrid ? (
        <div className={`relative ${isFullscreen ? "flex flex-1 flex-col min-h-0" : ""}`}>
          <div
            ref={mountRef}
            tabIndex={0}
            className={`w-full outline-none ${
              isFullscreen ? "flex-1 min-h-0" : "h-[480px] md:h-[580px]"
            }`}
            aria-label="First-person 3D Executives Hall of Fame corridor. Click any wall portrait to walk to it, drag to look around, or use WASD keys."
          />

          {/* Camera Viewfinder & Shutter Flash Overlay */}
          {cameraStage && (
            <div
              className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-200 ${
                cameraStage === "flash" ? "bg-white opacity-95" : "bg-black/20 opacity-100"
              }`}
            >
              {cameraStage === "aiming" && (
                <div className="relative h-full w-full p-6">
                  <div className="absolute left-6 top-6 h-8 w-8 border-l-2 border-t-2 border-amber-300" />
                  <div className="absolute right-6 top-6 h-8 w-8 border-r-2 border-t-2 border-amber-300" />
                  <div className="absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-amber-300" />
                  <div className="absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-amber-300" />
                  <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-amber-300/80" />
                  <div className="absolute left-8 top-8 flex items-center gap-2 rounded bg-black/65 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-amber-200">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    Focus Locked
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom HUD */}
          {currentEntry && (
            <div className="flex flex-col gap-3 border-t border-white/10 bg-black/45 px-4 py-3.5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-5 md:px-7">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-400/35 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                    {currentEntry.positionTitle}
                  </span>
                  <span className="text-xs font-medium text-white/70">
                    {currentEntry.holder.session}
                  </span>
                  <span className="hidden text-xs text-white/45 md:inline">
                    - Click any wall frame, drag to look, or use WASD
                  </span>
                </div>
                <p className="mt-1 truncate font-display text-base font-bold text-white md:text-lg">
                  {currentEntry.holder.name}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/80 sm:gap-1.5 sm:px-2.5 sm:text-xs">
                    <Eye className="h-3.5 w-3.5 text-amber-300" />
                    {stats.views.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    aria-pressed={liked}
                    aria-label={liked ? "Unlike Hall of Fame" : "Like Hall of Fame"}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-2.5 sm:text-xs ${
                      liked
                        ? "border-rose-400/50 bg-rose-500/20 text-rose-200"
                        : "border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-400 text-rose-400" : ""}`} />
                    {stats.likes.toLocaleString()}
                  </button>
                  <button
                    type="button"
                    disabled={sharingSnapshot}
                    onClick={() => handleShareSnapshot(currentEntry.positionTitle, currentEntry.holder)}
                    aria-label={`Share PNG snapshot of ${currentEntry.holder.name}`}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-400/35 bg-amber-400/15 px-2.5 py-1 text-[11px] font-medium text-amber-200 transition-colors hover:bg-amber-400/25 disabled:opacity-50 sm:gap-1.5 sm:text-xs"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{sharingSnapshot ? "Saving..." : "Snapshot"}</span>
                  </button>
                </div>

                {allEntries.length > 1 && (
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        tryStartMusic();
                        setAutoTour(false);
                        autoTourRef.current = false;
                        walkToRef.current?.(activeStopIndex - 1);
                      }}
                      className="h-7 w-7 rounded-full border-white/20 bg-white/5 p-0 text-white hover:bg-white/15 hover:text-white sm:h-8 sm:w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="whitespace-nowrap px-1 text-[11px] font-medium text-white/75 tabular-nums sm:px-1.5 sm:text-xs">
                      {activeStopIndex + 1} / {allEntries.length}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        tryStartMusic();
                        setAutoTour(false);
                        autoTourRef.current = false;
                        walkToRef.current?.(activeStopIndex + 1);
                      }}
                      className="h-7 w-7 rounded-full border-white/20 bg-white/5 p-0 text-white hover:bg-white/15 hover:text-white sm:h-8 sm:w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10 p-6 md:p-8">
          {positions.map((group) => (
            <div key={group.id} className="space-y-4">
              <h4 className="font-display text-lg font-bold uppercase tracking-wider text-amber-300 border-b border-white/10 pb-2">
                {group.position}
              </h4>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {group.holders.map((holder) => (
                  <div
                    key={holder.id}
                    className="overflow-hidden rounded-2xl border border-amber-400/25 bg-[#091d14]"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-black/30">
                      <img
                        src={holder.image}
                        alt={holder.name}
                        className={`h-full w-full object-cover ${holder.objectPosition || "object-center"}`}
                      />
                    </div>
                    <div className="border-t border-amber-400/20 p-4 text-center">
                      <h5 className="font-display text-base font-bold text-white">{holder.name}</h5>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
                        {holder.session}
                      </p>
                      <button
                        type="button"
                        disabled={sharingSnapshot}
                        onClick={() => handleShareSnapshot(group.position, holder)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-400/20 disabled:opacity-50"
                      >
                        <Camera className="h-3 w-3" />
                        Share PNG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Camera Snapshot Preview & Social Share Modal */}
      <Dialog open={!!snapshotPreview} onOpenChange={(open) => !open && closeSnapshotPreview()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#0b0f0d] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pr-6 font-display text-base text-white">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-amber-300" />
                Camera Shot Review
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                1080×1350 · PNG
              </span>
            </DialogTitle>
          </DialogHeader>

          {snapshotPreview && (() => {
            const pageUrl =
              typeof window !== "undefined"
                ? `${window.location.origin}/executives?session=2025/2026`
                : "https://nacoslasustech.org/executives?session=2025/2026";
            const drafts = buildSocialDrafts(snapshotPreview.positionTitle, snapshotPreview.holder, pageUrl);
            const activeCaption = drafts[selectedSocial];
            const socialMeta: { id: SocialPlatform; label: string }[] = [
              { id: "whatsapp", label: "WhatsApp" },
              { id: "x", label: "X" },
              { id: "linkedin", label: "LinkedIn" },
              { id: "tiktok", label: "TikTok" },
            ];

            return (
              <div className="grid gap-5 md:grid-cols-[250px_1fr]">
                {/* Real Camera Viewfinder Frame */}
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-lg border border-white/15 bg-black p-2 shadow-2xl">
                    <div className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-amber-300/70" />
                    <div className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-amber-300/70" />
                    <div className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-amber-300/70" />
                    <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-amber-300/70" />
                    <img
                      src={snapshotPreview.url}
                      alt={`${snapshotPreview.holder.name} snapshot`}
                      className="w-full rounded-sm object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={downloadSnapshot}
                      className="flex-1 rounded-full gap-1.5 text-xs font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PNG
                    </Button>
                    {typeof navigator !== "undefined" && "share" in navigator && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => nativeShareSnapshot(activeCaption)}
                        aria-label="Share image file"
                        className="rounded-full border-white/20 bg-white/5 px-3 text-white hover:bg-white/15 hover:text-white"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Social Platform Tabs & Drafted Caption */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                      Share to Socials
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {socialMeta.map((s) => {
                        const active = selectedSocial === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedSocial(s.id);
                              setCopiedCaption(false);
                            }}
                            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11px] font-semibold transition-colors ${
                              active
                                ? "border-amber-400 bg-amber-400/15 text-amber-200"
                                : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <SocialBrandIcon platform={s.id} />
                            <span>{s.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/50 p-3">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-white/85">
                        {activeCaption}
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => copyCaptionText(activeCaption)}
                      className="rounded-full border-white/20 bg-white/5 text-xs text-white hover:bg-white/15 hover:text-white gap-1.5"
                    >
                      {copiedCaption ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCaption ? "Copied" : "Copy Caption"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => shareToPlatform(selectedSocial, activeCaption, pageUrl)}
                      className="flex-1 rounded-full bg-amber-400 text-black hover:bg-amber-300 text-xs font-semibold gap-1.5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Share on {socialMeta.find((m) => m.id === selectedSocial)?.label}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExecutivesHallOfFame3D;
