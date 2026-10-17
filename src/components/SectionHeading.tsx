import Reveal from "@/components/Reveal";

interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

const SectionHeading = ({ label, title, description, align = "center" }: SectionHeadingProps) => {
  return (
    <Reveal className={align === "center" ? "text-center" : "text-left"}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          {label}
        </span>
      )}
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
        {title}
      </h2>
      <span aria-hidden="true" className={`mt-4 block h-1 w-12 rounded-full bg-gradient-to-r from-primary to-secondary ${align === "center" ? "mx-auto" : ""}`} />
      {description && (
        <p className={`mt-3 text-sm leading-relaxed text-muted-foreground md:text-base ${align === "center" ? "mx-auto max-w-xl" : "max-w-lg"}`}>
          {description}
        </p>
      )}
    </Reveal>
  );
};

export default SectionHeading;
