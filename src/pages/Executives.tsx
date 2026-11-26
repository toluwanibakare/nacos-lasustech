import { useEffect, useState } from "react";
import { Calendar, Users } from "lucide-react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import ExecutiveCard from "@/components/ExecutiveCard";
import ExecutivesHallOfFame3D from "@/components/ExecutivesHallOfFame3D";
import { Button } from "@/components/ui/button";
import {
  CURRENT_SESSION,
  executiveSessions,
  hallOfFameByPosition,
} from "@/data/executives";
import { useLocation, useSearchParams } from "react-router-dom";

const Executives = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const requestedSession = searchParams.get("session");
  const initialSession =
    location.hash === "#hall-of-fame"
      ? "2025/2026"
      : executiveSessions.find((s) => s.session === requestedSession)?.session || CURRENT_SESSION;

  const [selectedSession, setSelectedSession] = useState(initialSession);

  useEffect(() => {
    if (location.hash === "#hall-of-fame") {
      setSelectedSession("2025/2026");
      return;
    }
    if (requestedSession && executiveSessions.some((s) => s.session === requestedSession)) {
      setSelectedSession(requestedSession);
    }
  }, [requestedSession, location.hash]);

  const activeData =
    executiveSessions.find((s) => s.session === selectedSession) || executiveSessions[0];

  const handleSelectSession = (session: string) => {
    setSelectedSession(session);
    setSearchParams({ session }, { replace: true });
  };

  const openHallOfFame = () => {
    handleSelectSession("2025/2026");
    setTimeout(() => {
      document.getElementById("hall-of-fame")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const hasCoreCouncil =
    activeData.topLeaders.length > 0 || activeData.coreExecutives.length > 0;
  const coreRow1 = activeData.coreExecutives.slice(0, 4);
  const coreRow2 = activeData.coreExecutives.slice(4);
  const isPastArchive = !activeData.isCurrent;

  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Leadership
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">
              Executive Council
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              The dedicated leaders guiding the NACOS LASUSTECH Chapter towards academic excellence and professional growth.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container space-y-16">
          {/* Session Category Switcher */}
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              <span className="shrink-0">Session:</span>
              <span className="truncate font-semibold text-foreground">
                {activeData.label}
                {isPastArchive ? " (Hall of Fame)" : ""}
              </span>
            </div>

            <div className="grid w-full grid-cols-2 gap-1 rounded-full border border-border bg-muted/60 p-1 sm:inline-flex sm:w-auto">
              {executiveSessions.map((item) => {
                const isSelected = item.session === activeData.session;
                return (
                  <button
                    key={item.session}
                    type="button"
                    onClick={() => handleSelectSession(item.session)}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-center text-[11px] font-semibold transition-all sm:px-4 sm:py-1.5 sm:text-xs ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.session}
                    {item.isCurrent ? " (Current)" : " (Hall of Fame)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* When viewing 2025/2026 (past session), show only the 3D Executives Hall of Fame */}
          {isPastArchive ? (
            <div id="hall-of-fame" className="space-y-8">
              <SectionHeading
                label="Legacy"
                title="Executives Hall of Fame"
                description="Walk through the 3D corridor or switch to Grid view to explore everyone who served in the 2025/2026 Executive Council."
              />
              <ExecutivesHallOfFame3D positions={hallOfFameByPosition} />
            </div>
          ) : (
            <>
              {hasCoreCouncil ? (
                <>
                  <div>
                    <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">
                      Top Leadership
                    </h2>
                    <div className="flex justify-center">
                      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {activeData.topLeaders.map((exec) => (
                          <ExecutiveCard key={`${activeData.session}-${exec.post}`} {...exec} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">
                      Core Executives
                    </h2>
                    <div className="space-y-6">
                      {coreRow1.length > 0 && (
                        <div className="flex justify-center">
                          <div className="grid w-full max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {coreRow1.map((exec) => (
                              <ExecutiveCard key={`${activeData.session}-${exec.post}`} {...exec} />
                            ))}
                          </div>
                        </div>
                      )}
                      {coreRow2.length > 0 && (
                        <div className="grid w-full gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                          {coreRow2.map((exec) => (
                            <ExecutiveCard key={`${activeData.session}-${exec.post}`} {...exec} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-primary/20 bg-card p-8 text-center md:p-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-widest text-primary">
                    {activeData.session} Executive Council
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-foreground md:text-3xl">
                    New Executive Council Unveiling Soon
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    The newly elected {activeData.session} executives have been chosen. Official portraits and profiles for the Executive Council will be published here shortly.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openHallOfFame}
                      className="rounded-full text-xs font-semibold"
                    >
                      View 2025/2026 Hall of Fame
                    </Button>
                  </div>
                </div>
              )}

              {/* HOCs */}
              <div>
                <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">
                  Heads of Class (HOC)
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {activeData.hocs.map((exec) => (
                    <ExecutiveCard key={`${activeData.session}-${exec.post}`} {...exec} />
                  ))}
                </div>
              </div>

              {/* Asst HOCs */}
              <div>
                <h2 className="mb-8 text-center text-xl font-bold uppercase tracking-tight text-muted-foreground/50">
                  Assistant Heads of Class
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {activeData.asstHocs.map((exec) => (
                    <ExecutiveCard key={`${activeData.session}-${exec.post}`} {...exec} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Executives;
