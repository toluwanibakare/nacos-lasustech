import { Student } from "./types";
import { Card, Pill } from "./shared";
import { LEVELS, levelLabel } from "./utils";

export const ClassLeaders = ({ students }: { students: Student[] }) => (
  <Card title="Class leaders" description="Current HOC and Assistant HOC for each level.">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {LEVELS.map((level) => {
        const inLevel = students.filter((s) => s.level === level);
        const hoc = inLevel.filter((s) => s.post === "HOC");
        const asst = inLevel.filter((s) => s.post === "Assistant HOC");
        return (
          <div key={level} className="rounded-2xl bg-[#f7fbf6] p-3">
            <p className="text-sm font-bold text-[#062018]">{levelLabel(level)}</p>
            <Leader label="HOC" tone="green" people={hoc} />
            <Leader label="Asst. HOC" tone="blue" people={asst} />
          </div>
        );
      })}
    </div>
  </Card>
);

const Leader = ({ label, tone, people }: { label: string; tone: "green" | "blue"; people: Student[] }) => (
  <div className="mt-2 flex items-start gap-2">
    <Pill tone={tone}>{label}</Pill>
    <div className="min-w-0 text-xs">
      {people.length === 0 ? (
        <span className="text-muted-foreground">Not assigned</span>
      ) : (
        people.map((p) => (
          <p key={p.id} className="truncate font-medium">
            {p.full_name}
            {p.department ? <span className="text-muted-foreground"> ({p.department})</span> : null}
          </p>
        ))
      )}
    </div>
  </div>
);
