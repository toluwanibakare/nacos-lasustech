import { useCallback, useEffect, useState } from "react";
import { AlertCircle, BookOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/api";

interface HocItem {
  id: number;
  title: string;
  course_code: string | null;
  description: string | null;
  price: number;
  paid: boolean;
  created_at?: string | null;
}

const MaterialsPanel = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<HocItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

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

  const pay = async (item: HocItem) => {
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
        <p className="text-sm">{error}</p>
        <Button variant="outline" className="mt-3 rounded-full" onClick={() => { setError(null); load(); }}>Retry</Button>
      </div>
    );
  }
  if (!items) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading materials...
      </div>
    );
  }

  const purchased = items.filter((i) => i.paid).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">Books and materials</h2>
        <p className="text-sm text-muted-foreground">Your purchases: {purchased}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <BookOpen className="mx-auto mb-2 h-6 w-6" />
          No books or materials have been posted for your class yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-4">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{item.title}</h3>
                  {item.paid && <Badge className="rounded-full">Paid</Badge>}
                </div>
                {item.course_code && <p className="text-xs font-medium text-muted-foreground">{item.course_code}</p>}
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                {item.created_at && (
                  <p className="text-xs text-muted-foreground">Posted {new Date(item.created_at).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">₦{Number(item.price).toLocaleString()}</span>
                {!item.paid && (
                  <Button size="sm" className="rounded-full" disabled={payingId !== null} onClick={() => pay(item)}>
                    {payingId === item.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay ₦{Number(item.price).toLocaleString()}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialsPanel;
