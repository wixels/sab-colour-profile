import { Button } from "@sab-colour-profile/ui/components/button";
import { Card } from "@sab-colour-profile/ui/components/card";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <main className="overflow-hidden">
      <section className="bg-background">
        <div className="relative pt-44 pb-32">
          <div className="mask-radial-from-45% mask-radial-to-75% mask-radial-at-top mask-radial-[75%_100%] absolute inset-0 aspect-square opacity-65 md:aspect-9/4 dark:opacity-5">
            <Image
              src="https://images.unsplash.com/photo-1740516367177-ae20098c8786?q=80&w=2268&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dt"
              alt="hero background"
              width={2102}
              height={1694}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
            <div className="mx-auto mb-16 max-w-xl lg:mb-24">
              <div className="grid scale-95 grid-cols-3 gap-12 **:fill-foreground">
                <div className="ml-auto blur-[2px]">
                  <Card className="flex h-8 w-fit items-center gap-2 rounded-xl px-3 shadow-foreground/10 sm:h-10 sm:px-4">
                    Assess
                  </Card>
                </div>
                <div className="ml-auto">
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    Score
                  </Card>
                </div>
                <div className="ml-auto blur-[2px]">
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    Traits
                  </Card>
                </div>
                <div className="mr-auto">
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    People
                  </Card>
                </div>
                <div className="blur-[2px]">
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    Results
                  </Card>
                </div>
                <div>
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    Insights
                  </Card>
                </div>
                <div className="ml-auto blur-[2px]">
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    Trends
                  </Card>
                </div>
                <div>
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    Reports
                  </Card>
                </div>
                <div className="blur-[2px]">
                  <Card className="sm:px- flex h-8 w-fit items-center justify-center rounded-xl px-3 shadow-foreground/10 sm:h-10">
                    Teams
                  </Card>
                </div>
              </div>
            </div>
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-balance font-medium font-serif text-4xl sm:text-5xl">
                Understand people. Lead with clarity.
              </h1>
              <p className="mt-4 text-balance text-muted-foreground">
                Capture RGBY assessment responses and surface clear insights for
                every person on your team.
              </p>

              <Button
                className="mt-6 rounded-md"
                render={<Link href="/start" />}
                nativeButton={false}
              >
                <span className="text-nowrap">Start Assessment</span>
                <ChevronRight className="opacity-50" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
