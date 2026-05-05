"use client";

import { api } from "@sab-colour-profile/backend/convex/_generated/api";
import { Button } from "@sab-colour-profile/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sab-colour-profile/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sab-colour-profile/ui/components/dropdown-menu";
import { useQuery } from "convex/react";
import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { ResponsesTable } from "@/components/responses-table";
import { loadLocalIdentity } from "@/lib/local-identity";

export default function ResponsesPage() {
  const rows = useQuery(api.reporting.listLatestScoresByPerson);
  const [localPersonId, setLocalPersonId] = useState<string | null>(null);

  const exportRows = rows?.map((row) => ({
    Name: row.fullName,
    Group: row.group?.trim() ? row.group : "-",
    Green: row.green,
    Red: row.red,
    Blue: row.blue,
    Yellow: row.yellow,
  }));

  useEffect(() => {
    setLocalPersonId(loadLocalIdentity()?.personId ?? null);
  }, []);

  const exportAsCsv = () => {
    if (!exportRows || exportRows.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "assessment-responses.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportAsExcel = () => {
    if (!exportRows || exportRows.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    XLSX.writeFile(workbook, "assessment-responses.xlsx");
  };

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
        <CardHeader className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle>Assessment Responses</CardTitle>
            <CardDescription>
              Latest RGBY score for each person.
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-fit"
              render={
                <Button className="rounded-md" size="sm">
                  Export
                  <DownloadIcon />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={exportAsCsv}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsExcel}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <ResponsesTable
            rows={rows.map((row) => ({
              personId: row.personId,
              attemptId: row.attemptId,
              fullName: row.fullName,
              group: row.group,
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
