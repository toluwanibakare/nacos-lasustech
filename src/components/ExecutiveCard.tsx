import { UserPlus } from "lucide-react";
import Reveal from "@/components/Reveal";

interface ExecutiveCardProps {
  name: string;
  post: string;
  level: string;
  description: string;
  image: string;
  objectPosition?: string;
  vacant?: boolean;
  /** Seconds to delay the reveal, to stagger a row. */
  revealDelay?: number;
}

const ExecutiveCard = ({
  name,
  post,
  level,
  description,
  image,
  objectPosition = "object-center",
  vacant = false,
  revealDelay = 0,
}: ExecutiveCardProps) => {
  if (vacant) {
    return (
      <Reveal delay={revealDelay} className="h-full">
        <div className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-card/60 overflow-hidden">
          <div className="aspect-[3/4] flex flex-col items-center justify-center bg-muted/60 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Vacant Seat
            </span>
          </div>
          <div className="p-4 md:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{post}</p>
            <h3 className="mt-1 font-display text-base font-bold text-muted-foreground">{name}</h3>
            {level && <p className="mt-0.5 text-xs text-muted-foreground">{level}</p>}
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal delay={revealDelay} className="h-full">
      <div className="group h-full rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40">
        <div className="aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover ${objectPosition} transition-transform duration-500 group-hover:scale-[1.03]`}
          />
        </div>
        <div className="p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{post}</p>
          <h3 className="mt-1 font-display text-base font-bold text-foreground">{name}</h3>
          {level && <p className="mt-0.5 text-xs text-muted-foreground">{level}</p>}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </Reveal>
  );
};

export default ExecutiveCard;
