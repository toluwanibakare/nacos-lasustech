interface SectionHeadingProps {
  label?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

const SectionHeading = ({ label, title, description, align = "center" }: SectionHeadingProps) => {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          {label}
        </span>
      )}
      <h2 className="mt-2 font-display text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-sm leading-relaxed text-muted-foreground md:text-base ${align === "center" ? "mx-auto max-w-xl" : "max-w-lg"}`}>
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
