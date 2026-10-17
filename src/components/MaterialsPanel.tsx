import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Download,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Presentation,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";
import { KIND_LABEL, fileExtension, formatBytes, isFreeKind, naira, type MaterialItem, type MaterialKind } from "@/lib/materials";
import { cn } from "@/lib/utils";

type TabKey = "notes" | "pdf" | "past_questions" | "paid";

const TABS: { key: TabKey; label: string }[] = [
  { key: "notes", label: "Notes" },
  { key: "pdf", label: "PDF" },
  { key: "past_questions", label: "Past questions" },
  { key: "paid", label: "Paid materials" },
];

const EMPTY_TEXT: Record<TabKey, string> = {
  notes: "No notes have been uploaded for your class yet.",
  pdf: "No PDF files have been uploaded for your class yet.",
  past_questions: "No past questions have been uploaded for your class yet.",
  paid: "No paid materials have been posted for your class yet.",
};

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3";

const FileTypeIcon = ({ item }: { item: MaterialItem }) => {
  const ext = fileExtension(item.file_name || item.file_url);
  let Icon = FileIcon;
  let tone = "bg-muted text-muted-foreground";
  if (ext === "pdf") {
    Icon = FileText;
    tone = "bg-red-500/10 text-red-600";
  } else if (ext === "doc" || ext === "docx" || ext === "txt") {
    Icon = FileText;
    tone = "bg-blue-500/10 text-blue-600";
  } else if (ext === "ppt" || ext === "pptx") {
    Icon = Presentation;
    tone = "bg-orange-500/10 text-orange-600";
  } else if (ext === "xls" || ext === "xlsx") {
    Icon = FileSpreadsheet;
    tone = "bg-green-500/10 text-green-600";
  } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    Icon = ImageIcon;
    tone = "bg-purple-500/10 text-purple-600";
  }
  return (
    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tone)}>
      <Icon className="h-5 w-5" />
    </div>
  );
};

const FreeCard = ({ item }: { item: MaterialItem }) => {
  const size = formatBytes(item.file_size);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <FileTypeIcon item={item} />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="break-words font-medium leading-snug">{item.title}</h3>
          {item.course_code && (
            <Badge variant="secondary" className="rounded-full">
              {item.course_code}
            </Badge>
          )}
        </div>
      </div>
      {item.description && <p className="line-clamp-2 break-words text-sm text-muted-foreground">{item.description}</p>}
      {(item.file_name || size) && (
        <p className="break-all text-xs text-muted-foreground">
          {item.file_name}
          {item.file_name && size ? " · " : ""}
          {size}
        </p>
      )}
      <div className="mt-auto pt-1">
        {item.file_url ? (
          <Button asChild className="h-11 w-full rounded-full sm:w-auto">
            <a href={item.file_url} target="_blank" rel="noopener noreferrer" download>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">File not available.</p>
        )}
      </div>
    </div>
  );
};

const KindBadge = ({ kind }: { kind: MaterialKind }) => (
  <Badge variant="outline" className="rounded-full">
    {KIND_LABEL[kind] || kind}
  </Badge>
);

const PurchaseCard = ({ item }: { item: MaterialItem }) => (
  <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
    <div className="space-y-2">
      <h3 className="break-words font-medium leading-snug">{item.title}</h3>
      <div className="flex flex-wrap items-center gap-2">
        <KindBadge kind={item.kind} />
        {item.course_code && (
          <Badge variant="secondary" className="rounded-full">
            {item.course_code}
          </Badge>
        )}
      </div>
    </div>
    {item.received ? (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-green-600/30 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        Collected
      </span>
    ) : (
      <div className="space-y-1.5">
        <span className="inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-700">
          Paid, collect from your HOC
        </span>
        <p className="text-xs text-muted-foreground">Show your matric number to your HOC to collect it.</p>
      </div>
    )}
  </div>
);

const BuyCard = ({ item, busy, anyBusy, onPay }: { item: MaterialItem; busy: boolean; anyBusy: boolean; onPay: () => void }) => (
  <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
    <div className="space-y-2">
      <h3 className="break-words font-medium leading-snug">{item.title}</h3>
      <div className="flex flex-wrap items-center gap-2">
        <KindBadge kind={item.kind} />
        {item.course_code && (
          <Badge variant="secondary" className="rounded-full">
            {item.course_code}
          </Badge>
        )}
      </div>
      {item.description && <p className="break-words text-sm text-muted-foreground">{item.description}</p>}
    </div>
    <div className="mt-auto space-y-3 pt-1">
      <p className="text-2xl font-semibold">{naira(item.price)}</p>
      <Button className="h-11 w-full rounded-full" disabled={anyBusy} onClick={onPay}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pay {naira(item.price)}
      </Button>
    </div>
  </div>
);

const EmptyBox = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
    <BookOpen className="mx-auto mb-2 h-6 w-6" />
    {text}
  </div>
);

const MaterialsPanel = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<MaterialItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>("notes");

  // On a phone the tab row scrolls sideways; make sure the chosen tab is always in view.
  useEffect(() => {
    document.querySelector('[data-active-tab="true"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [tab]);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("All");

  const load = useCallback(async () => {
    try {
      const data = await fetchApi("/hoc/my-items");
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load materials");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byTab = useMemo(() => {
    const all = items || [];
    return {
      notes: all.filter((i) => i.kind === "notes"),
      pdf: all.filter((i) => i.kind === "pdf"),
      past_questions: all.filter((i) => i.kind === "past_questions"),
      paid: all.filter((i) => !isFreeKind(i.kind)),
    } as Record<TabKey, MaterialItem[]>;
  }, [items]);

  // Reset filters when switching section.
  const switchTab = (key: TabKey) => {
    setTab(key);
    setQuery("");
    setCourse("All");
  };

  const pay = async (item: MaterialItem) => {
    if (payingId !== null) return;
    setPayingId(item.id);
    try {
      const data = await fetchApi("/payments/initialize", {
        method: "POST",
        body: JSON.stringify({ payment_type: "hoc_item", hoc_item_id: item.id }),
      });
      const url = data?.data?.authorization_url;
      if (!url) throw new Error("No payment link was returned");
      window.location.href = url;
    } catch (e) {
      toast({ title: "Could not start payment", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
      setPayingId(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
        <p className="break-words text-sm">{error}</p>
        <Button
          variant="outline"
          className="mt-3 h-11 rounded-full"
          onClick={() => {
            setError(null);
            load();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-full" />
          ))}
        </div>
        <div className={GRID}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const header = <h2 className="text-xl font-semibold">Course materials</h2>;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyBox text="Nothing has been posted for your class yet. Check back soon." />
      </div>
    );
  }

  const tabs = (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0" role="tablist">
      <div className="flex w-max gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              data-active-tab={active}
              onClick={() => switchTab(t.key)}
              className={cn(
                "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {byTab[t.key].length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const list = byTab[tab];
  let body: JSX.Element;

  if (tab === "paid") {
    const purchases = list.filter((i) => i.paid);
    const available = list.filter((i) => !i.paid);
    body =
      list.length === 0 ? (
        <EmptyBox text={EMPTY_TEXT.paid} />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">You pay here, then collect the item from your HOC.</p>
          {purchases.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-base font-semibold">Your purchases</h3>
              <div className={GRID}>
                {purchases.map((item) => (
                  <PurchaseCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            <h3 className="text-base font-semibold">Available to buy</h3>
            {available.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                You have bought everything that is on sale for your class.
              </p>
            ) : (
              <div className={GRID}>
                {available.map((item) => (
                  <BuyCard key={item.id} item={item} busy={payingId === item.id} anyBusy={payingId !== null} onPay={() => pay(item)} />
                ))}
              </div>
            )}
          </section>
        </div>
      );
  } else {
    const courses = Array.from(new Set(list.map((i) => i.course_code).filter((c): c is string => !!c)));
    const q = query.trim().toLowerCase();
    const filtered = list.filter((i) => {
      if (course !== "All" && i.course_code !== course) return false;
      if (!q) return true;
      return [i.title, i.course_code, i.description].some((v) => (v || "").toLowerCase().includes(q));
    });
    body =
      list.length === 0 ? (
        <EmptyBox text={EMPTY_TEXT[tab]} />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or course code"
              aria-label="Search"
              className="h-11 rounded-full pl-10"
            />
          </div>
          {courses.length > 1 && (
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
              <div className="flex w-max gap-2">
                {["All", ...courses].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCourse(c)}
                    className={cn(
                      "inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                      course === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyBox text="Nothing matches your search. Try a different word or course." />
          ) : (
            <div className={GRID}>
              {filtered.map((item) => (
                <FreeCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      );
  }

  return (
    <div className="min-w-0 space-y-4">
      {header}
      {tabs}
      {body}
    </div>
  );
};

export default MaterialsPanel;
