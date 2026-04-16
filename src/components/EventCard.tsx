import { Calendar } from "lucide-react";

interface EventCardProps {
  title: string;
  date: string;
  description: string;
  image: string;
  featured?: boolean;
}

const EventCard = ({ title, date, description, image, featured }: EventCardProps) => {
  if (featured) {
    return (
      <div className="group overflow-hidden rounded-2xl border border-border bg-card md:grid md:grid-cols-2 animate-reveal">
        <div className="aspect-video overflow-hidden md:aspect-auto md:h-full bg-muted">
          <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
        <div className="flex flex-col justify-center p-6 md:p-8">
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Upcoming
          </span>
          <h3 className="mt-3 font-display text-xl font-bold text-foreground md:text-2xl">{title}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-reveal">
      <div className="aspect-video overflow-hidden bg-muted">
        <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {date}
        </div>
        <h3 className="mt-1.5 font-display text-base font-bold text-foreground">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </div>
  );
};

export default EventCard;
