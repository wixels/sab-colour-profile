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
import { useEffect, useState } from "react";

import { ResponsesTable } from "@/components/responses-table";
import { loadLocalIdentity } from "@/lib/local-identity";

export default function ResponsesPage() {
  const rows = useQuery(api.reporting.listLatestScoresByPerson);
  const [localPersonId, setLocalPersonId] = useState<string | null>(null);

  useEffect(() => {
    setLocalPersonId(loadLocalIdentity()?.personId ?? null);
  }, []);

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
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment Responses</CardTitle>
          <CardDescription>Latest RGBY score for each person.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsesTable
            rows={rows.map((row) => ({
              personId: row.personId,
              attemptId: row.attemptId,
              fullName: row.fullName,
              green: row.green,
              red: row.red,
              blue: row.blue,
              yellow: row.yellow,
            }))}
            localPersonId={localPersonId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
