"use client";

import { api } from "@sab-colour-profile/backend/convex/_generated/api";
import type { Id } from "@sab-colour-profile/backend/convex/_generated/dataModel";
import { buttonVariants } from "@sab-colour-profile/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sab-colour-profile/ui/components/card";
import { cn } from "@sab-colour-profile/ui/lib/utils";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { dominantColors } from "@/lib/assessment";

const colorDotClassName = (color: string | null | undefined) => {
  if (!color) {
    return "bg-muted-foreground";
  }

  switch (color.toLowerCase()) {
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    case "yellow":
      return "bg-yellow-400";
    case "green":
      return "bg-green-500";
    default:
      return "bg-muted-foreground";
  }
};

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId as Id<"attempts">;
  const attempt = useQuery(api.attempts.getById, { attemptId });

  if (attempt === undefined) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card className="rounded-md">
          <CardContent className="pt-4">Loading result...</CardContent>
        </Card>
      </div>
    );
  }

  if (attempt === null) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Result not found</CardTitle>
            <CardDescription>
              The assessment attempt could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const topColors = dominantColors(attempt.scores);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <Card className="rounded-md">
        <CardHeader>
          <CardTitle>Assessment Result</CardTitle>
          <CardDescription>
            {attempt.personName} {attempt.personSurname}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-3 rounded-full",
                  colorDotClassName("green"),
                )}
              />
              <span>Green: {attempt.scores.green}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn("size-3 rounded-full", colorDotClassName("red"))}
              />
              <span>Red: {attempt.scores.red}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn("size-3 rounded-full", colorDotClassName("blue"))}
              />
              <span>Blue: {attempt.scores.blue}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-3 rounded-full",
                  colorDotClassName("yellow"),
                )}
              />
              <span>Yellow: {attempt.scores.yellow}</span>
            </div>
          </div>
          <p className="flex items-center gap-2">
            Primary:{" "}
            <strong className="inline-flex items-center gap-1.5 capitalize">
              <span
                className={cn(
                  "size-3 rounded-full",
                  colorDotClassName(topColors.primary),
                )}
              />
              {topColors.primary ?? "n/a"}
            </strong>
          </p>
          <p className="flex items-center gap-2">
            Secondary:{" "}
            <strong className="inline-flex items-center gap-1.5 capitalize">
              <span
                className={cn(
                  "size-3 rounded-full",
                  colorDotClassName(topColors.secondary),
                )}
              />
              {topColors.secondary ?? "n/a"}
            </strong>
          </p>
          <div className="flex gap-2">
            <Link
              href={`/reflection/${attempt.attemptId}`}
              className={cn(buttonVariants({ className: "rounded-md" }))}
            >
              Start Reflection
            </Link>
            <Link
              href="/start"
              className={cn(
                buttonVariants({ variant: "outline", className: "rounded-md" }),
              )}
            >
              Another Attempt
            </Link>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", className: "rounded-md" }),
              )}
            >
              Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
