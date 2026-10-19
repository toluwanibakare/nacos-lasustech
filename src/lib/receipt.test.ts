import { describe, it, expect, vi } from "vitest";
import { jsPDF } from "jspdf";
import { readFileSync, writeFileSync } from "node:fs";
import { downloadReceipt, money, ReceiptData } from "@/lib/receipt";

vi.mock("@/assets/nacos_logo.png", () => ({ default: "/logo.png" }));

const receipt: ReceiptData = {
  receipt_no: "NACOS-R-9-10",
  code: "R9-10-A1B2C3D4E5",
  verify_url: "https://www.nacoslasustech.org.ng/verify/R9-10-A1B2C3D4E5",
  references: ["NACOS-BUNDLE-230303010052-1792268606626"],
  date: "2026-10-18 10:00:00",
  session: "2026/2027",
  name: "Ada Obi",
  matric: "230303010052",
  account_type: "student",
  items: [
    { label: "NACOS Session Dues", amount: 2000 },
    { label: "ID Card", amount: 1000 },
  ],
  total: 3000,
};

describe("receipt", () => {
  it("formats money without the naira sign (PDF fonts have none)", () => {
    expect(money(2000)).toBe("NGN 2,000.00");
  });

  it("builds a PDF named after the receipt number", async () => {
    let saved = "";
    let bytes: ArrayBuffer | null = null;
    // The Node build of jsPDF has no save(); capture what the browser would download.
    (jsPDF.API as any).save = function (this: jsPDF, name?: string) {
      saved = String(name);
      bytes = this.output("arraybuffer");
      return this;
    };
    // A real 1x1 PNG, so the logo and watermark are embedded like in the browser.
    const realLogo = process.env.RECEIPT_OUT ? new Uint8Array(readFileSync("src/assets/nacos_logo.png")) : null;
    const png = realLogo ?? Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    (globalThis as any).fetch = vi.fn(async () => ({ blob: async () => new Blob([png], { type: "image/png" }) }));
    await downloadReceipt(receipt);
    expect(saved).toBe("NACOS-receipt-NACOS-R-9-10.pdf");
    const head = new TextDecoder().decode(new Uint8Array(bytes!).slice(0, 5));
    expect(head).toBe("%PDF-");
    if (process.env.RECEIPT_OUT) writeFileSync(process.env.RECEIPT_OUT, Buffer.from(bytes!));
  });
});
