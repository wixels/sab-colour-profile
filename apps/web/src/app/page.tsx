"use client";
import { api } from "@sab-colour-profile/backend/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sab-colour-profile/ui/components/card";
import { useQuery } from "convex/react";
import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section-2";
import { ResponsesTable } from "@/components/responses-table";

export default function Home() {
  const rows = useQuery(api.reporting.listLatestScoresByPerson);

  if (!rows) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <Card>
          <CardContent className="pt-4">Loading responses...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <HeroHeader />
      <HeroSection />
      <div id="responses" className="container mx-auto max-w-5xl px-4 py-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Assessment Responses</CardTitle>
            <CardDescription>
              Latest RGBY score for each person.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsesTable
              rows={rows.map((row) => ({
                personId: row.personId,
                fullName: row.fullName,
                green: row.green,
                red: row.red,
                blue: row.blue,
                yellow: row.yellow,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
