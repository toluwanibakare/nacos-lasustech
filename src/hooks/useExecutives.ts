// NOT USED YET. The public Executives and Home pages still show the built-in list
// (src/data/executives.ts). This hook is ready to switch them to the database later.
import { useEffect, useState } from "react";
import { fetchApi, resolveImageUrl } from "@/lib/api";
import { executives as staticExecutives, Executive } from "@/data/executives";

export interface PublicExecutive extends Executive {
  session?: string;
}

interface ApiExecutive {
  name: string;
  post: string;
  level: string;
  description: string | null;
  image: string | null;
  session?: string;
}

// Photos shipped inside the website (src/assets), by file name. The first council's rows in the
// database point at "uploads/<name>" but those files only exist here, so use the bundled copy.
const bundled = import.meta.glob("/src/assets/*.{jpg,jpeg,png,webp,JPG}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const bundledByName = new Map(Object.entries(bundled).map(([path, url]) => [path.split("/").pop()!.toLowerCase(), url]));
const staticByName = new Map(staticExecutives.map((e) => [e.name.trim().toLowerCase(), e]));

const photoFor = (row: ApiExecutive): string => {
  const raw = row.image || "";
  const fileName = raw.split("/").pop()?.toLowerCase() || "";
  if (raw && !/^https?:\/\//i.test(raw) && bundledByName.has(fileName)) return bundledByName.get(fileName)!;
  if (raw) return resolveImageUrl(raw);
  return staticByName.get(row.name.trim().toLowerCase())?.image || "/placeholder.svg";
};

/**
 * The executive council to show on the public site. Comes from the database (so the admin's
 * changes appear); falls back to the built-in list if the server cannot be reached.
 */
export const useExecutives = () => {
  const [state, setState] = useState<{ executives: PublicExecutive[]; session: string }>({
    executives: staticExecutives,
    session: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetchApi("/content/executives")
      .then((rows: ApiExecutive[]) => {
        if (cancelled || !Array.isArray(rows) || rows.length === 0) return;
        setState({
          session: rows[0].session || "",
          executives: rows.map((row) => {
            const known = staticByName.get(row.name.trim().toLowerCase());
            return {
              name: row.name,
              post: row.post,
              level: row.level,
              description: row.description || known?.description || "",
              image: photoFor(row),
              objectPosition: known?.objectPosition,
              session: row.session,
            };
          }),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
