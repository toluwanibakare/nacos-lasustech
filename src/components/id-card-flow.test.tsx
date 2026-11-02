import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import IdCards from "@/components/admin/IdCards";
import IdCardApplication from "@/components/IdCardApplication";
import FresherMatricCard from "@/components/FresherMatricCard";
import FresherRegistration from "@/components/FresherRegistration";
import { Toaster } from "@/components/ui/toaster";

(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
(globalThis as any).HTMLElement.prototype.scrollIntoView ??= () => {};
(globalThis as any).HTMLElement.prototype.hasPointerCapture ??= () => false;

const row = (over: Record<string, unknown>) => ({
  id: 1, student_id: 11, fresher_id: null, account_type: "student", full_name: "Lola", matric_number: "250303010025",
  fee_amount: 1000, status: "processing", department: "Computer Science", level: "100", has_matric: 1, dues_paid: 1, flagged: 0, flag_reason: null,
  created_at: "2026-10-20T10:00:00Z", ...over,
});

const rows = [
  row({ id: 1, full_name: "Lola", status: "processing" }),
  row({ id: 2, student_id: 12, full_name: "Tunde", status: "pending" }),
  row({ id: 3, student_id: 13, full_name: "Unpaid Una", status: "awaiting_payment" }),
  row({ id: 4, student_id: 14, full_name: "Flagged Fola", status: "awaiting_payment", flagged: 1, flag_reason: "Photo broke the rules" }),
];

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

const mockFetch = (handlers: Record<string, (init?: RequestInit) => unknown>) => {
  const calls: { url: string; init?: RequestInit }[] = [];
  (globalThis as any).fetch = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const key = Object.keys(handlers).find((k) => String(url).includes(k));
    const body = key ? handlers[key](init) : {};
    return { ok: true, status: 200, headers: new Headers(), json: async () => body };
  });
  return calls;
};

describe("admin ID cards: printed and flag", () => {
  it("marks ticked cards as printed, and flags with a reason", async () => {
    localStorage.setItem("adminToken", "t");
    const calls = mockFetch({
      "/admin/id-requests/status": () => ({ changed: 2, skipped: 0, emailed: 2, noEmail: 0 }),
      "/admin/id-requests/flag": () => ({ flagged: 1, skipped: 0, fee: 2000, emailed: 1, noEmail: 0 }),
      "/admin/id-requests": () => rows,
    });
    render(<><IdCards /><Toaster /></>);
    await screen.findByText("Lola");

    // Printed is labelled in plain words, and the flagged person shows why.
    expect(screen.getAllByText("Printed").length).toBeGreaterThan(0); // status filter option
    expect(screen.getByText("Flagged")).toBeTruthy();
    expect(screen.getByText("Photo broke the rules")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Mark as printed/ }) as HTMLButtonElement).disabled).toBe(true);

    // The flagged row cannot be ticked.
    expect((screen.getByLabelText("Select Flagged Fola") as HTMLInputElement).disabled).toBe(true);

    // Select all ticks only the people who can be acted on (not the flagged one).
    fireEvent.click(screen.getByLabelText("Select all"));
    await waitFor(() => expect(screen.getByRole("button", { name: /Mark as printed \(2\)/ })).toBeTruthy());
    // Generate needs a paid card: Lola and Tunde, not the unpaid one.
    expect(screen.getByRole("button", { name: /Generate cards \(2\)/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Flag \(3\)/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Mark as printed \(2\)/ }));
    await waitFor(() => {
      const post = calls.find((c) => c.url.endsWith("/admin/id-requests/status") && c.init?.method === "POST");
      expect(post).toBeTruthy();
      expect(JSON.parse(String(post!.init!.body))).toEqual({ ids: [1, 2], status: "ready" });
    });

    // Flag: needs a reason first.
    fireEvent.click(screen.getByLabelText("Select Lola"));
    fireEvent.click(await screen.findByRole("button", { name: /^Flag \(1\)/ }));
    const dialog = await screen.findByRole("dialog");
    const submit = within(dialog).getByRole("button", { name: "Flag and email" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(within(dialog).getByPlaceholderText(/Reason/), { target: { value: "Wrong photo" } });
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => {
      const post = calls.find((c) => c.url.endsWith("/admin/id-requests/flag"));
      expect(post).toBeTruthy();
      expect(JSON.parse(String(post!.init!.body))).toEqual({ ids: [1], reason: "Wrong photo" });
    });
  });

  it("can remove a flag", async () => {
    localStorage.setItem("adminToken", "t");
    const calls = mockFetch({
      "/admin/id-requests/unflag": () => ({ status: "success", cleared: 1 }),
      "/admin/id-requests": () => rows,
    });
    render(<><IdCards /><Toaster /></>);
    await screen.findByText("Flagged Fola");
    fireEvent.click(screen.getByRole("button", { name: "Remove flag" }));
    await waitFor(() => {
      const post = calls.find((c) => c.url.endsWith("/admin/id-requests/unflag"));
      expect(JSON.parse(String(post!.init!.body))).toEqual({ ids: [4] });
    });
  });
});

describe("a flagged member's ID card page", () => {
  const flagged = {
    status: "success",
    request: { id: 9, status: "awaiting_payment", fee_amount: 2000, birthday: null },
    fee: 2000,
    photo: { image_path: null, zoom: null, cx: null, cy: null },
    card_issuable: false,
    card_note: null,
    editable: true,
    dues_cleared: false,
    dues_exempt: false,
    dues_fee: 2000,
    flagged: true,
    flag_reason: "Photo did not follow the rules",
    flag_fee: 2000,
  };

  it("explains the flag and offers only the flag fee, not the bundle", async () => {
    localStorage.setItem("user", JSON.stringify({ name: "Lola", account_type: "student", matric: "250303010025", level: "100" }));
    const calls = mockFetch({
      "/services/id-card/status": () => flagged,
      "/payments/initialize": () => ({ data: { authorization_url: "about:blank#paid" } }),
    });
    render(<><IdCardApplication /><Toaster /></>);
    await screen.findByText("Your portal is locked until you pay for a new ID card.");
    expect(screen.getByText(/Photo did not follow the rules/)).toBeTruthy();
    expect(screen.queryByText(/Pay dues and ID card/)).toBeNull();
    expect(screen.queryByRole("button", { name: /^Pay ID card/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Pay new ID card ₦2,000/ }));
    await waitFor(() => {
      const post = calls.find((c) => c.url.endsWith("/payments/initialize"));
      expect(JSON.parse(String(post!.init!.body))).toEqual({ payment_type: "id_flag" });
    });
  });
});

describe("fresher level and matric number", () => {
  it("registration asks for 100 level or 200 level (direct entry) and sends it", async () => {
    const calls = mockFetch({
      "/content/settings": () => ({ departments: ["Computer Science", "Cyber Security"], de_departments: ["Computer Science"] }),
      "/fresher/register": () => ({ status: "success" }),
    });
    render(<MemoryRouter><FresherRegistration onLoggedIn={() => {}} onSwitchToStalite={() => {}} /><Toaster /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Create account" }));
    await screen.findByText("Level");
    const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
    const levelSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === "200"))!;
    expect(Array.from(levelSelect.options).map((o) => o.text)).toEqual(["Select level", "100 Level (new student)", "200 Level (direct entry)"]);
    const deptSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === "Computer Science"))!;

    fireEvent.change(screen.getByPlaceholderText(/Surname first/) as HTMLInputElement, { target: { value: "Deb Entry" } });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), { target: { value: "deb@test.dev" } });
    fireEvent.change(deptSelect, { target: { value: "Computer Science" } });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), { target: { value: "password1" } });
    fireEvent.change(screen.getByPlaceholderText("Re-type password"), { target: { value: "password1" } });

    // Without a level it will not submit.
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(levelSelect.required).toBe(true);
    expect(calls.some((c) => c.url.endsWith("/fresher/register"))).toBe(false);

    fireEvent.change(levelSelect, { target: { value: "200" } });
    // Direct entry only offers the open departments.
    expect(Array.from(deptSelect.options).map((o) => o.value)).toEqual(["", "Computer Science"]);
    expect(screen.getByText(/open for Computer Science only/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    await waitFor(() => {
      const post = calls.find((c) => c.url.endsWith("/fresher/register"));
      expect(JSON.parse(String(post!.init!.body)).level).toBe("200");
    });
  });

  it("the matric card saves it and then asks them to sign in as a stalite", async () => {
    const calls = mockFetch({ "/fresher/matric": () => ({ status: "success", matric_no: "260303019902", level: "200" }) });
    render(<MemoryRouter><FresherMatricCard level="200" /><Toaster /></MemoryRouter>);
    expect(screen.getByText(/200 level \(direct entry\)/)).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Matric number"), { target: { value: "260303019902" } });
    fireEvent.click(screen.getByRole("button", { name: /Save matric number/ }));
    await screen.findByText("Matric number saved: 260303019902");
    expect(JSON.parse(String(calls.find((c) => c.url.endsWith("/fresher/matric"))!.init!.body))).toEqual({ matric_no: "260303019902" });
    expect(screen.getByRole("button", { name: "Sign in as a Stalite" })).toBeTruthy();
  });
});
