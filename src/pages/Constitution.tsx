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
              <a href="/NACOS_LASUSTECH_CONSTITUTION.pdf" download="NACOS_LASUSTECH_Constitution.pdf">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <FileDown className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </a>
            </div>

            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h4 className="font-display text-base font-bold text-foreground">Preamble</h4>
                <p className="mt-2 italic">
                  "We, the students of the Nigeria Association of Computing Students (NACOS), LASUSTECH Chapter, having firmly and solemnly resolved to come together as one indivisible body under the Nigeria Computer Society and God, dedicated to advancing the art, science, engineering, and application of information technology, serving both professional and public interests by fostering the open interchange of information and by promoting the highest professional and ethical standards; and to provide for a constitution for the purpose of promoting the development and welfare of the members of the Association on the principle of equality, fairness, justice and good governance and for consolidating the unity of our members; and also being conscious of our rights, duties and obligations as computing students do hereby make, enact and give to ourselves the following constitution."
                </p>
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-foreground">Article I: Establishment of the Association</h4>
                <div className="mt-2 space-y-4">
                  <p>
                    <strong>Section 1: Name</strong><br />
                    The Association shall be officially recognized as the <strong>Nigeria Association of Computing Students (NACOS), LASUSTECH Chapter</strong>. It shall be a body corporate with perpetual succession and a common seal, with power to sue and be sued in its corporate name.
                  </p>
                  <p>
                    <strong>Section 2: The Motto</strong><br />
                    The motto of the Association shall be <strong>"Towards Advanced Computing"</strong>.
                  </p>
                  <p>
                    <strong>Section 3: Definition</strong><br />
                    For the purpose of this constitution, <strong>Computing</strong> shall be defined to include disciplines such as <strong>Computer Science, Computer Engineering, Information Technology, Software Engineering, Cybersecurity, Data Science</strong>, and all other IT-related disciplines within the Lagos State University of Science and Technology.
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  This is an excerpt. The full constitution document is available for download using the button above.
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
