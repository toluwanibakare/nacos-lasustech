import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export const formatNaira = (amount: number | string | null | undefined) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

export const LEVELS = ["100", "200", "300", "400"] as const;
export const LEVEL_FILTERS = [...LEVELS, "alumni"] as const;

export const levelLabel = (level: string | null | undefined) => {
  if (!level) return "-";
  return level === "alumni" ? "Alumni" : `${level}L`;
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

export const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const errMessage = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

export const debounce = <A extends unknown[]>(fn: (...args: A) => void, wait = 300) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => timer && clearTimeout(timer);
  return debounced;
};

export const useDebouncedValue = <T,>(value: T, wait = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), wait);
    return () => clearTimeout(t);
  }, [value, wait]);
  return debounced;
};

export const isSuccess = (status: string | null | undefined) => String(status || "").toLowerCase() === "success";

export const isHocRole = (post: string | null | undefined) => post === "HOC" || post === "Assistant HOC";

/** Loads an admin GET endpoint with loading / error state and a reload function. */
export function useAdminData<T>(endpoint: string | null, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState<string | null>(null);
  const fallbackRef = useRef(fallback);

  const reload = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(endpoint);
      setData(res ?? fallbackRef.current);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
