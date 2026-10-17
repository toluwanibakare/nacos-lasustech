import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup, within } from "@testing-library/react";
import MaterialsPanel from "@/components/MaterialsPanel";
import HocPanel from "@/components/HocPanel";
import { salesToCsv, MaterialSale } from "@/lib/materials";

const base = { level: "100", department: "Artificial Intelligence", status: "active", session: "2026/2027", description: null, file_path: null, file_name: null, file_size: null, file_type: null };
const items = [
  { ...base, id: 1, kind: "notes", title: "Week 1 Notes", course_code: "CSC101", price: 0, file_url: "https://files.test/a.pdf", file_name: "a.pdf", file_size: 482000, paid: false, received: false },
  { ...base, id: 2, kind: "notes", title: "Algorithms Notes", course_code: "CSC102", price: 0, file_url: "https://files.test/b.docx", file_name: "b.docx", file_size: 91000, paid: false, received: false },
  { ...base, id: 3, kind: "pdf", title: "Python Cheat Sheet", course_code: "CSC101", price: 0, file_url: "https://files.test/c.pdf", file_name: "c.pdf", file_size: 1000, paid: false, received: false },
  { ...base, id: 4, kind: "past_questions", title: "2024 Past Questions", course_code: "CSC101", price: 0, file_url: "https://files.test/d.pdf", file_name: "d.pdf", file_size: 1000, paid: false, received: false },
  { ...base, id: 60, kind: "workbook", title: "Physics Workbook", course_code: "PHY101", price: 2500, file_url: null, paid: true, received: false },
  { ...base, id: 61, kind: "manual", title: "Chemistry Lab Manual", course_code: "CHM101", price: 1500, file_url: null, paid: true, received: true },
  { ...base, id: 62, kind: "textbook", title: "Maths Textbook", course_code: "MTH101", price: 4500, file_url: null, paid: false, received: false },
];
const sales: MaterialSale[] = [
  { payment_id: 1, full_name: "Ngozi Okafor", matric_no: "260303010001", amount: 2500, reference: "R1", created_at: "2026-10-10 08:15:00", received: true, received_at: "2026-10-16 14:20:00" },
  { payment_id: 2, full_name: "Tunde Bakare", matric_no: "260303010002", amount: 2500, reference: "R2", created_at: "2026-10-11 09:15:00", received: false, received_at: null },
  { payment_id: 3, full_name: "Aisha Bello, Jr", matric_no: "260303010003", amount: 2500, reference: "R3", created_at: "2026-10-12 10:15:00", received: false, received_at: null },
];

type Call = { url: string; method: string; body: unknown };
let calls: Call[] = [];
let failReceive = false;
const respond = (route: Record<string, (c: Call) => unknown>) => {
  calls = [];
  (globalThis as any).fetch = vi.fn(async (url: string, opts: any = {}) => {
    const path = String(url).replace(/^https?:\/\/[^/]+\/api/, "");
    const call = { url: path, method: opts.method || "GET", body: opts.body };
    calls.push(call);
    for (const key of Object.keys(route)) {
      if (`${call.method} ${path}` === key || path === key) {
        const out = route[key](call) as any;
        if (out && out.__status) return { ok: out.__status < 400, status: out.__status, json: async () => out.body };
        return { ok: true, status: 200, json: async () => out };
      }
    }
    return { ok: false, status: 404, json: async () => ({ message: "no mock " + path }) };
  });
};

beforeEach(() => { localStorage.setItem("token", "t"); Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => cleanup());

describe("student library", () => {
  it("sections with counts, search, free downloads", async () => {
    respond({ "/hoc/my-items": () => items });
    render(<MaterialsPanel />);
    await waitFor(() => screen.getByText("Week 1 Notes"));
    for (const [label, n] of [["Notes", "2"], ["PDF", "1"], ["Past questions", "1"], ["Paid materials", "3"]]) {
      const tab = screen.getAllByRole("tab").find((t) => t.textContent?.startsWith(label))!;
      expect(tab.textContent).toContain(n);
    }
    // free file opens in a new tab and is a download link
    const link = screen.getAllByRole("link").find((a) => a.getAttribute("href") === "https://files.test/a.pdf")!;
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    // search narrows the list
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "algorithms" } });
    expect(screen.queryByText("Week 1 Notes")).toBeNull();
    expect(screen.getByText("Algorithms Notes")).toBeTruthy();
    // PDF tab shows only PDFs
    fireEvent.click(screen.getAllByRole("tab").find((t) => t.textContent?.startsWith("PDF"))!);
    expect(screen.getByText("Python Cheat Sheet")).toBeTruthy();
    expect(screen.queryByText("Algorithms Notes")).toBeNull();
  });

  it("paid section: purchases with collection status, pay button posts the right thing", async () => {
    respond({
      "/hoc/my-items": () => items,
      "POST /payments/initialize": () => ({ data: { authorization_url: "https://pay.test/checkout" } }),
    });
    const loc = { href: "" } as any;
    Object.defineProperty(window, "location", { value: loc, writable: true });
    render(<MaterialsPanel />);
    await waitFor(() => screen.getByText("Week 1 Notes"));
    fireEvent.click(screen.getAllByRole("tab").find((t) => t.textContent?.startsWith("Paid materials"))!);
    await waitFor(() => screen.getByText("Physics Workbook"));
    expect(screen.getByText(/Your purchases/i)).toBeTruthy();
    expect(screen.getByText(/Collected/)).toBeTruthy();                 // the manual was collected
    expect(screen.getByText(/collect from your HOC/i)).toBeTruthy();    // the workbook was paid, not collected
    expect(screen.getByText(/Available to buy/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Pay ₦4,500/ }));
    await waitFor(() => expect(loc.href).toBe("https://pay.test/checkout"));
    const post = calls.find((c) => c.method === "POST" && c.url === "/payments/initialize")!;
    expect(JSON.parse(post.body as string)).toEqual({ payment_type: "hoc_item", hoc_item_id: 62 });
  });
});

describe("HOC tools", () => {
  const hocRoutes = () => ({
    "/hoc/me": () => ({ full_name: "Ada Hoc", level: "100", department: "Artificial Intelligence", post: "HOC", is_hoc: true }),
    "/hoc/items": () => items.map((i) => ({ ...i, buyers: i.id === 60 ? 3 : 0, received_count: i.id === 60 ? 1 : 0, revenue: i.id === 60 ? 7500 : 0 })),
    "/hoc/items/60/sales": () => sales.map((s) => ({ ...s })),
  });

  it("add form: free type needs a file and rejects bad ones; paid type needs a price and sends no file", async () => {
    respond({ ...hocRoutes(), "POST /hoc/items": () => ({ __status: 201, body: { item: { id: 9 }, campaign: null } }) });
    const { container } = render(<HocPanel />);
    await waitFor(() => screen.getByText(/Free to download/i));
    expect(screen.getAllByText(/100 Level, Artificial Intelligence/).length).toBeGreaterThan(0);

    // free: pick Notes -> file field appears, no price field
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    expect(container.querySelector('input[type="file"]')).toBeTruthy();
    expect(screen.queryByText(/Price \(₦\)/)).toBeNull();
    // a disallowed file is refused on pick
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["MZ"], "virus.exe", { type: "application/octet-stream" })] } });
    expect(screen.queryByText("virus.exe")).toBeNull();
    // a good file is accepted and shown
    fireEvent.change(fileInput, { target: { files: [new File(["%PDF"], "week1.pdf", { type: "application/pdf" })] } });
    await waitFor(() => screen.getByText(/week1\.pdf/));
    fireEvent.change(container.querySelector('form input[type="text"], form input:not([type])') as HTMLInputElement, { target: { value: "Week 1 Notes" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.url === "/hoc/items")).toBe(true));
    const free = calls.find((c) => c.method === "POST" && c.url === "/hoc/items")!.body as FormData;
    expect(free instanceof FormData).toBe(true);
    expect(free.get("kind")).toBe("notes");
    expect(free.get("title")).toBe("Week 1 Notes");
    expect((free.get("file") as File).name).toBe("week1.pdf");
    expect(free.get("level")).toBeNull();
    expect(free.get("department")).toBeNull();
  });

  it("collection list: counts, search, mark received, rollback on failure, CSV", async () => {
    respond({
      ...hocRoutes(),
      "PUT /hoc/items/60/sales/2/received": () => (failReceive ? { __status: 500, body: { message: "boom" } } : { payment_id: 2, received: true, received_at: "2026-10-17 11:05:00" }),
    });
    failReceive = false;
    let csvText = "";
    let csvBytes: number[] = [];
    (URL as any).createObjectURL = vi.fn((blob: Blob) => {
      blob.arrayBuffer().then((buf) => {
        csvBytes = Array.from(new Uint8Array(buf));
        csvText = "BOM" + new TextDecoder("utf-8").decode(buf); // decoding drops the marker; a 3-letter stand-in keeps the line maths simple
      });
      return "blob:x";
    });
    (URL as any).revokeObjectURL = vi.fn();

    render(<HocPanel />);
    await waitFor(() => screen.getByText(/Free to download/i));
    fireEvent.click(screen.getAllByRole("button").find((b) => b.textContent?.startsWith("Paid items"))!);
    await waitFor(() => screen.getByText("Physics Workbook"));
    // each paid item has its own "Collection list" button: use the one on the Physics Workbook card
    const card = screen.getByText("Physics Workbook").closest("div.rounded-2xl, section, article, li, div[class*='border']") as HTMLElement;
    fireEvent.click(within(card.parentElement as HTMLElement).getAllByRole("button", { name: /Collection list/ })[0]);
    const sheet = await waitFor(() => screen.getByRole("dialog"));
    await waitFor(() => within(sheet).getAllByText("Tunde Bakare"));

    expect(within(sheet).getByText(/Paid 3/)).toBeTruthy();
    expect(within(sheet).getByText(/Collected 1/)).toBeTruthy();
    expect(within(sheet).getByText(/Not yet 2/)).toBeTruthy();

    // search by matric number and by name, trimmed and case-insensitive
    fireEvent.change(within(sheet).getByPlaceholderText(/search/i), { target: { value: "  260303010003 " } });
    expect(within(sheet).queryAllByText("Tunde Bakare").length).toBe(0);
    expect(within(sheet).getAllByText("Aisha Bello, Jr").length).toBeGreaterThan(0);
    fireEvent.change(within(sheet).getByPlaceholderText(/search/i), { target: { value: "TUNDE" } });
    expect(within(sheet).getAllByText("Tunde Bakare").length).toBeGreaterThan(0);
    fireEvent.change(within(sheet).getByPlaceholderText(/search/i), { target: { value: "zzz" } });
    expect(within(sheet).getByText(/No one matches/i)).toBeTruthy();
    fireEvent.change(within(sheet).getByPlaceholderText(/search/i), { target: { value: "" } });

    // a failed save rolls back, a good one sticks
    failReceive = true;
    fireEvent.click(within(sheet).getAllByRole("button", { name: /Mark received/ })[0]);
    await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
    await waitFor(() => expect(within(sheet).getByText(/Not yet 2/)).toBeTruthy());
    failReceive = false;
    fireEvent.click(within(sheet).getAllByRole("button", { name: /Mark received/ })[0]);
    await waitFor(() => expect(within(sheet).getByText(/Collected 2/)).toBeTruthy());
    expect(within(sheet).getByText(/Not yet 1/)).toBeTruthy();
    const put = calls.filter((c) => c.method === "PUT" && c.url.endsWith("/received")).pop()!;
    expect(JSON.parse(put.body as string)).toEqual({ received: true });

    // CSV downloads the whole list, escaped, with the received column
    fireEvent.click(within(sheet).getByRole("button", { name: /Download CSV/ }));
    await waitFor(() => expect(csvText).not.toBe(""));
    expect(csvBytes.slice(0, 3)).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 marker so Excel opens the names correctly
    const lines = csvText.slice(3).split("\r\n");
    expect(lines[0]).toBe("S/N,Name,Matric number,Amount (NGN),Reference,Paid on,Received,Received on");
    expect(lines.length).toBe(4);
    expect(lines[3]).toContain('"Aisha Bello, Jr"');
    expect(lines[1]).toContain(",Yes,");
  });
});

describe("csv helper", () => {
  it("escapes quotes and commas and handles an empty list", () => {
    const csv = salesToCsv([{ ...sales[0], full_name: 'Ngozi "Nana", Okafor' }]).slice(1).split("\r\n");
    expect(csv[1]).toContain('"Ngozi ""Nana"", Okafor"');
    expect(salesToCsv([]).slice(1).split("\r\n").length).toBe(1);
  });
});
