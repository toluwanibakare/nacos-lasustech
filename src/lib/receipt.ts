import { fetchApi } from "@/lib/api";
import nacosLogo from "@/assets/nacos_logo.png";

export interface ReceiptData {
  receipt_no: string;
  code: string;
  verify_url: string;
  references: string[];
  date?: string | null;
  session?: string | null;
  name: string;
  matric: string | null;
  account_type: string;
  exempt_from_dues?: boolean;
  items: { label: string; amount: number }[];
  total: number;
}

export interface ReceiptStatus {
  tied: boolean;
  hasApplication?: boolean;
  duesCleared: boolean;
  idCleared: boolean;
  duesExempt: boolean;
  locked_reason: string | null;
}

export const fetchReceiptStatus = (): Promise<ReceiptStatus> => fetchApi("/payments/receipt-status");

export const fetchReceipt = (reference: string): Promise<ReceiptData> =>
  fetchApi(`/payments/receipt/${encodeURIComponent(reference)}`);

// The standard PDF fonts have no naira sign, so the receipt writes the amount as NGN.
export const money = (n: number) => `NGN ${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toDataUrl = async (url: string): Promise<string | null> => {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
};

/** Faint repeated "NACOS LASUSTECH  ·  PAID" rows across the page, plus the logo, behind everything else. */
const drawWatermark = (doc: any, logo: string | null, color: [number, number, number]) => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const angle = 35;
  const rad = (angle * Math.PI) / 180;
  const label = "NACOS LASUSTECH   -   PAID";
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(...color);
  const w = doc.getTextWidth(label);
  const gap = 30;
  for (let k = -5; k <= 5; k++) {
    // The row's centre is moved sideways (perpendicular to the text), then the text is centred on it.
    const cx = W / 2 + k * gap * Math.sin(rad);
    const cy = H / 2 + k * gap * Math.cos(rad);
    doc.text(label, cx - (w / 2) * Math.cos(rad), cy + (w / 2) * Math.sin(rad), { angle });
  }
  if (logo) doc.addImage(logo, "PNG", W / 2 - 30, H / 2 - 30, 60, 60);
  doc.restoreGraphicsState();
};

/** Builds the receipt PDF and saves it. The PDF libraries are loaded only when someone asks for a receipt. */
export const downloadReceipt = async (r: ReceiptData) => {
  const [{ jsPDF }, QRCode] = await Promise.all([import("jspdf"), import("qrcode")]);
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const green: [number, number, number] = [22, 155, 45];
  const dark: [number, number, number] = [8, 17, 29];
  const grey: [number, number, number] = [110, 120, 130];

  const logo = await toDataUrl(nacosLogo);
  drawWatermark(doc, logo, green);

  if (logo) doc.addImage(logo, "PNG", M, 12, 16, 16);
  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold").setFontSize(15).text("NACOS LASUSTECH", logo ? M + 20 : M, 19);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...grey).text("Nigeria Association of Computing Students, LASUSTECH Chapter", logo ? M + 20 : M, 24.5);

  doc.setDrawColor(...green).setLineWidth(0.8).line(M, 32, W - M, 32);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...green).text("PAYMENT RECEIPT", M, 41);
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...green).text("PAID", W - M, 41, { align: "right" });

  const row = (y: number, label: string, value: string) => {
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...grey).text(label.toUpperCase(), M, y);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...dark).text(value, W - M, y, { align: "right" });
  };
  let y = 51;
  row(y, "Receipt no", r.receipt_no); y += 7;
  row(y, "Date", formatDate(r.date)); y += 7;
  row(y, "Session", r.session || "-"); y += 7;
  row(y, "Received from", r.name || "-"); y += 7;
  row(y, r.account_type === "fresher" ? "Account" : "Matric no", r.account_type === "fresher" ? "Fresher" : r.matric || "-"); y += 5;

  doc.setDrawColor(220, 224, 228).setLineWidth(0.3).line(M, y, W - M, y);
  y += 7;
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...grey).text("DESCRIPTION", M, y);
  doc.text("AMOUNT", W - M, y, { align: "right" });
  y += 7;
  const lines = r.exempt_from_dues ? [{ label: "NACOS Session Dues (exempt)", amount: 0 }, ...r.items] : r.items;
  for (const item of lines) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...dark).text(item.label, M, y);
    doc.text(money(item.amount), W - M, y, { align: "right" });
    y += 7;
  }
  doc.setDrawColor(...dark).setLineWidth(0.4).line(M, y - 3, W - M, y - 3);
  y += 4;
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...dark).text("TOTAL PAID", M, y);
  doc.setFontSize(13).setTextColor(...green).text(money(r.total), W - M, y, { align: "right" });

  y += 8;
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...grey);
  const refs = doc.splitTextToSize(`Transaction reference${r.references.length > 1 ? "s" : ""}: ${r.references.join(", ")}`, W - 2 * M);
  doc.text(refs, M, y);
  y += refs.length * 3.6 + 4;

  // QR code: scanning it opens the NACOS page that confirms this receipt is genuine.
  const qr = await QRCode.toDataURL(r.verify_url, { errorCorrectionLevel: "M", margin: 0, width: 300 });
  const QR = 28;
  doc.addImage(qr, "PNG", M, y, QR, QR);
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...green).text("VERIFY THIS RECEIPT", M + QR + 5, y + 6);
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...grey);
  const how = doc.splitTextToSize("Scan the QR code to confirm this receipt was issued by NACOS LASUSTECH and matches the payment record.", W - 2 * M - QR - 5);
  doc.text(how, M + QR + 5, y + 11);
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...dark).text(`Code: ${r.code}`, M + QR + 5, y + QR - 1);

  // Signatures
  const sy = H - 24;
  const colW = (W - 2 * M - 12) / 2;
  doc.setDrawColor(...dark).setLineWidth(0.3);
  doc.line(M, sy, M + colW, sy);
  doc.line(W - M - colW, sy, W - M, sy);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...grey);
  doc.text("President, NACOS LASUSTECH", M + colW / 2, sy + 4.5, { align: "center" });
  doc.text("Treasurer, NACOS LASUSTECH", W - M - colW / 2, sy + 4.5, { align: "center" });

  doc.setFontSize(7).text("This is a computer generated receipt. Verify it with the QR code above.", W / 2, H - 7, { align: "center" });

  doc.save(`NACOS-receipt-${r.receipt_no}.pdf`);
};
