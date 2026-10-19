import { fetchApi } from "@/lib/api";
import nacosLogo from "@/assets/nacos_logo.png";

export interface ReceiptData {
  receipt_no: string;
  reference: string;
  date?: string | null;
  session?: string | null;
  name: string;
  matric: string | null;
  account_type: string;
  items: { label: string; amount: number }[];
  total: number;
}

export interface ReceiptStatus {
  tied: boolean;
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

/** Builds the receipt PDF and saves it. jsPDF is loaded only when someone asks for a receipt. */
export const downloadReceipt = async (r: ReceiptData) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  const M = 14;
  const green: [number, number, number] = [22, 155, 45];
  const dark: [number, number, number] = [8, 17, 29];
  const grey: [number, number, number] = [110, 120, 130];

  const logo = await toDataUrl(nacosLogo);

  // Watermark, drawn first so the text sits on top: a faint logo and a diagonal name.
  const H0 = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.07 }));
  if (logo) doc.addImage(logo, "PNG", W / 2 - 38, H0 / 2 - 38, 76, 76);
  doc.setFont("helvetica", "bold").setFontSize(30).setTextColor(...green);
  doc.text("NACOS LASUSTECH", W / 2, H0 / 2 + 4, { align: "center", angle: 35 });
  doc.restoreGraphicsState();

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
  let y = 52;
  row(y, "Receipt no", r.receipt_no); y += 8;
  row(y, "Date", formatDate(r.date)); y += 8;
  row(y, "Session", r.session || "-"); y += 8;
  row(y, "Received from", r.name || "-"); y += 8;
  row(y, r.account_type === "fresher" ? "Account" : "Matric no", r.account_type === "fresher" ? "Fresher" : r.matric || "-"); y += 8;

  y += 2;
  doc.setDrawColor(220, 224, 228).setLineWidth(0.3).line(M, y, W - M, y);
  y += 7;
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...grey).text("DESCRIPTION", M, y);
  doc.text("AMOUNT", W - M, y, { align: "right" });
  y += 7;
  for (const item of r.items) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...dark).text(item.label, M, y);
    doc.text(money(item.amount), W - M, y, { align: "right" });
    y += 7;
  }
  doc.setDrawColor(...dark).setLineWidth(0.4).line(M, y, W - M, y);
  y += 8;
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...dark).text("TOTAL PAID", M, y);
  doc.setFontSize(13).setTextColor(...green).text(money(r.total), W - M, y, { align: "right" });

  y += 14;
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...grey).text(`Transaction reference: ${r.reference}`, M, y);
  const H = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5).text("This is a computer generated receipt and needs no signature.", W / 2, H - 10, { align: "center" });

  doc.save(`NACOS-receipt-${r.reference}.pdf`);
};
