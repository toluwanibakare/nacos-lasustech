// Shared by the student library (MaterialsPanel) and the HOC tools (HocPanel).

export type MaterialKind = "notes" | "pdf" | "past_questions" | "manual" | "workbook" | "textbook";

/** Free library files: a file is uploaded and everyone in the class can download it. */
export const FREE_KINDS: MaterialKind[] = ["notes", "pdf", "past_questions"];
/** Paid items: no file. Students pay on the portal, then collect it from the HOC. */
export const PAID_KINDS: MaterialKind[] = ["manual", "workbook", "textbook"];

export const KIND_LABEL: Record<MaterialKind, string> = {
  notes: "Notes",
  pdf: "PDF",
  past_questions: "Past questions",
  manual: "Manual",
  workbook: "Workbook",
  textbook: "Textbook",
};

export const isFreeKind = (kind: string): boolean => (FREE_KINDS as string[]).includes(kind);

/** Largest file the server accepts for a library upload. */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "jpg", "jpeg", "png", "webp"];
export const FILE_ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

export interface MaterialItem {
  id: number;
  level: string;
  department: string | null;
  kind: MaterialKind;
  title: string;
  course_code: string | null;
  description: string | null;
  /** 0 for free library files. */
  price: number;
  session: string;
  status: "active" | "archived";
  /** Ready-to-open link for free library files, null for paid items. */
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at?: string;
  /** From GET /hoc/my-items: this student has paid for it / has collected it. */
  paid?: boolean;
  received?: boolean;
  /** From GET /hoc/items (HOC only). */
  buyers?: number;
  received_count?: number;
  revenue?: number;
}

/** One payment for a paid item (HOC only). */
export interface MaterialSale {
  payment_id: number;
  full_name: string;
  matric_no: string | null;
  amount: number;
  reference: string;
  created_at: string;
  received: boolean;
  received_at: string | null;
}

export const naira = (n: number | string | null | undefined) => `₦${Number(n || 0).toLocaleString()}`;

export const formatBytes = (bytes: number | null | undefined): string => {
  const n = Number(bytes || 0);
  if (n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export const fileExtension = (nameOrUrl: string | null | undefined): string =>
  String(nameOrUrl || "").split("?")[0].split(".").pop()?.toLowerCase() || "";

const csvCell = (value: unknown): string => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV of everyone who paid for an item, for printing as a hard copy. Opens cleanly in Excel. */
export const salesToCsv = (sales: MaterialSale[]): string => {
  const rows = [
    ["S/N", "Name", "Matric number", "Amount (NGN)", "Reference", "Paid on", "Received", "Received on"],
    ...sales.map((s, i) => [
      i + 1,
      s.full_name,
      s.matric_no || "",
      s.amount,
      s.reference,
      s.created_at,
      s.received ? "Yes" : "No",
      s.received_at || "",
    ]),
  ];
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
};

export const downloadTextFile = (filename: string, text: string, type = "text/csv;charset=utf-8") => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const safeFilename = (text: string): string => text.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "list";
