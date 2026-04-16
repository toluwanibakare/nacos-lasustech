import { Calendar, User, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { BlogPost } from "@/data/blogs";

const BlogCard = ({ title, excerpt, author, date, category, image }: BlogPost) => {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {category}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {author}
          </div>
        </div>
        <h3 className="mt-3 font-display text-lg font-bold leading-tight text-foreground line-clamp-2">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {excerpt}
        </p>
        <div className="mt-auto pt-5">
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-semibold text-primary hover:bg-transparent hover:text-primary/80">
            Read More <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
