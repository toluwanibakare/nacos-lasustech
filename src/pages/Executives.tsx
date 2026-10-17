import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import ExecutiveCard from "@/components/ExecutiveCard";
import { useExecutives } from "@/hooks/useExecutives";

const isAssistantHoc = (post: string) => /assistant\s+hoc|asst\.?\s*hoc/i.test(post);
const isHoc = (post: string) => /hoc/i.test(post) && !isAssistantHoc(post);
const isTopLeader = (post: string) => /^(president|vice[- ]president|lady vice)/i.test(post);

const Executives = () => {
  const { executives, session } = useExecutives();
  const topLeaders = executives.filter((e) => isTopLeader(e.post));
  const hocs = executives.filter((e) => isHoc(e.post));
  const asstHocs = executives.filter((e) => isAssistantHoc(e.post));
  const core = executives.filter((e) => !isTopLeader(e.post) && !isHoc(e.post) && !isAssistantHoc(e.post));
  const keyOf = (e: { post: string; name: string }) => `${e.post}-${e.name}`;

  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Leadership</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Executive Council{session ? ` ${session}` : ""}</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              The dedicated leaders guiding the NACOS LASUSTECH Chapter towards academic excellence and professional growth.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container space-y-20">
          {/* Top Leadership */}
          {topLeaders.length > 0 && (
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Top Leadership</h2>
            <div className="flex justify-center">
              <div className="grid gap-6 w-full max-w-4xl sm:grid-cols-2 lg:grid-cols-3">
                {topLeaders.map((exec) => (
                  <ExecutiveCard key={keyOf(exec)} {...exec} />
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Core Executives */}
          {core.length > 0 && (
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Core Executives</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {core.map((exec) => (
                <div key={keyOf(exec)} className="w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)]">
                  <ExecutiveCard {...exec} />
                </div>
              ))}
            </div>
          </div>
          )}

          {/* HOCs */}
          {hocs.length > 0 && (
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Heads of Class (HOC)</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hocs.map((exec) => (
                <ExecutiveCard key={keyOf(exec)} {...exec} />
              ))}
            </div>
          </div>
          )}

          {/* Asst HOCs */}
          {asstHocs.length > 0 && (
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Assistant Heads of Class</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {asstHocs.map((exec) => (
                <ExecutiveCard key={keyOf(exec)} {...exec} />
              ))}
            </div>
          </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Executives;
