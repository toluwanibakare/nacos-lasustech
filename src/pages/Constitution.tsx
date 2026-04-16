import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const Constitution = () => {
  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Constitution</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">NACOS Constitution</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              The official governing document of the Nigeria Computer Society, LASUSTECH Chapter.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container max-w-3xl">
          <div className="rounded-lg border border-border bg-card p-6 md:p-10">
            <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <h3 className="font-display text-lg font-bold text-foreground">NACOS LASUSTECH Constitution</h3>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <FileDown className="h-3.5 w-3.5" /> Download PDF
              </Button>
            </div>

            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h4 className="font-display text-base font-bold text-foreground">Preamble</h4>
                <p className="mt-2">
                  We, the students of Computer Science and related disciplines at the Lagos State University of Science and Technology,
                  in recognition of the need to promote academic excellence, technological advancement, and professional development,
                  do hereby establish this constitution to govern the affairs of the Nigeria Computer Society (NACOS), LASUSTECH Chapter.
                </p>
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-foreground">Article I: Name and Objectives</h4>
                <p className="mt-2">
                  <strong>Section 1:</strong> The name of the association shall be the Nigeria Computer Society (NACOS),
                  Lagos State University of Science and Technology Chapter.
                </p>
                <p className="mt-2">
                  <strong>Section 2:</strong> The objectives of the association shall be:
                </p>
                <ul className="list-disc space-y-1 pl-5 mt-2">
                  <li>To promote the study and application of computing and information technology</li>
                  <li>To foster unity and cooperation among students of computer science and related disciplines</li>
                  <li>To organize academic and social programs that benefit members</li>
                  <li>To represent the interests of members before the university and external bodies</li>
                  <li>To encourage professional development and industry readiness</li>
                </ul>
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-foreground">Article II: Membership</h4>
                <p className="mt-2">
                  <strong>Section 1:</strong> Membership shall be open to all registered students of Computer Science,
                  Information Technology, and related programs at LASUSTECH.
                </p>
                <p className="mt-2">
                  <strong>Section 2:</strong> Members are required to pay the prescribed association dues as determined by the executive council.
                </p>
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-foreground">Article III: Executive Council</h4>
                <p className="mt-2">
                  <strong>Section 1:</strong> The affairs of the association shall be managed by an Executive Council consisting of elected officers.
                </p>
                <p className="mt-2">
                  <strong>Section 2:</strong> The Executive Council shall comprise the President, Vice President, General Secretary,
                  Assistant General Secretary, Financial Secretary, Treasurer, Public Relations Officer, Director of Socials,
                  Director of Welfare, Director of Academics, and Head of Congress.
                </p>
              </div>

              <div className="rounded-md border border-border bg-muted p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  This is an excerpt. The full constitution document is available for download.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Constitution;
