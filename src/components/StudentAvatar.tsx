import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { studentPhotoUrl } from "@/lib/photo-url";

interface Props {
  /** The stored photo path or full address. */
  path: string | null | undefined;
  className?: string;
  iconClassName?: string;
}

/** A student's photo that falls back to a person icon instead of a broken image when it cannot load. */
const StudentAvatar = ({ path, className = "h-full w-full object-cover", iconClassName = "h-5 w-5 text-muted-foreground/40" }: Props) => {
  const src = studentPhotoUrl(path);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <User className={iconClassName} />
      </div>
    );
  }
  return <img src={src} alt="Profile" className={className} onError={() => setFailed(true)} />;
};

export default StudentAvatar;
