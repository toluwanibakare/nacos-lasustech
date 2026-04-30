import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import ExecutiveCard from "@/components/ExecutiveCard";
import { executives } from "@/data/executives";

const Executives = () => {
  const topLeaders = executives.slice(0, 3);
  const coreExcos = executives.slice(3, 11);
  const hocs = executives.slice(11, 15);
  const asstHocs = executives.slice(15);

  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Leadership</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Executive Council</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              The dedicated leaders guiding the NACOS LASUSTECH Chapter towards academic excellence and professional growth.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container space-y-20">
          {/* Top Leadership */}
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Top Leadership</h2>
            <div className="flex justify-center">
              <div className="grid gap-6 w-full max-w-4xl sm:grid-cols-2 lg:grid-cols-3">
                {topLeaders.map((exec) => (
                  <ExecutiveCard key={exec.post} {...exec} />
                ))}
              </div>
            </div>
          </div>

          {/* Core Executives */}
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Core Executives</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {coreExcos.map((exec) => (
                <ExecutiveCard key={exec.post} {...exec} />
              ))}
            </div>
          </div>

          {/* HOCs */}
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Heads of Class (HOC)</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hocs.map((exec) => (
                <ExecutiveCard key={exec.post} {...exec} />
              ))}
            </div>
          </div>

          {/* Asst HOCs */}
          <div>
            <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">Assistant Heads of Class</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {asstHocs.map((exec) => (
                <ExecutiveCard key={exec.post} {...exec} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Executives;
