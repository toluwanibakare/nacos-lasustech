import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { resolveImageUrl } from "@/lib/api";
import { errMessage } from "./utils";

/** Same upload flow as the previous admin: /admin/upload in dev, /upload.php in production. */
export const uploadAdminImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);
  const uploadUrl = import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "") + "/admin/upload"
    : window.location.origin + "/upload.php";
  const token = localStorage.getItem("adminToken");
  const headers: Record<string, string> = {};
  if (import.meta.env.DEV && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(uploadUrl, { method: "POST", headers, body: formData });
  if (!res.ok) throw new Error("Upload failed.");
  const data = await res.json();
  const path = data.path || data.url;
  if (!path) throw new Error(data.message || "Failed to upload image.");
  return path as string;
};

export const useImageUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const path = await uploadAdminImage(file);
      toast({ title: "Image uploaded" });
      return path;
    } catch (err) {
      toast({ title: "Upload failed", description: errMessage(err), variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };
  return { uploading, upload };
};

export const ImageField = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
  const { uploading, upload } = useImageUpload();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      {value && <img src={resolveImageUrl(value)} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />}
      <Input className="flex-1 rounded-full" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <Button type="button" variant="outline" className="rounded-full" disabled={uploading} onClick={() => ref.current?.click()}>
        <Upload className="mr-1.5 h-4 w-4" />
        {uploading ? "..." : "Upload"}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const path = await upload(file);
          if (path) onChange(path);
        }}
      />
    </div>
  );
};
