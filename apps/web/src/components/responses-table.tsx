"use client";

import { buttonVariants } from "@sab-colour-profile/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sab-colour-profile/ui/components/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@sab-colour-profile/ui/lib/utils";
import Link from "next/link";

type ResponseRow = {
  personId: string;
  attemptId: string;
  fullName: string;
  green: number;
  red: number;
  blue: number;
  yellow: number;
  hasReflection: boolean;
};

const COLOUR_KEYS = ["green", "red", "blue", "yellow"] as const;

function getPrimaryAndSecondaryColours(row: ResponseRow): {
  primary: (typeof COLOUR_KEYS)[number];
  secondary: (typeof COLOUR_KEYS)[number];
} {
  const sortedColours = [...COLOUR_KEYS].sort((a, b) => row[b] - row[a]);

  return {
    primary: sortedColours[0],
    secondary: sortedColours[1],
  };
}

const columns: Array<ColumnDef<ResponseRow>> = [
  {
    accessorKey: "fullName",
    header: "Name",
  },
  {
    accessorKey: "green",
    header: "Green",
  },
  {
    accessorKey: "red",
    header: "Red",
  },
  {
    accessorKey: "blue",
    header: "Blue",
  },
  {
    accessorKey: "yellow",
    header: "Yellow",
  },
  {
    id: "reflection",
    header: "Reflection",
  },
];

export function ResponsesTable({
  rows,
  localPersonId,
}: {
  rows: Array<ResponseRow>;
  localPersonId: string | null;
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length}>No responses found.</TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => {
            const { primary, secondary } = getPrimaryAndSecondaryColours(
              row.original,
            );

            return (
              <TableRow key={row.original.personId}>
                {row.getVisibleCells().map((cell) => {
                  const columnId = cell.column.id;
                  if (columnId === "reflection") {
                    if (row.original.hasReflection) {
                      return (
                        <TableCell key={cell.id}>
                          <Link
                            href={`/reflection/${row.original.attemptId}`}
                            className={cn(
                              buttonVariants({
                                size: "sm",
                                variant: "outline",
                                className: "rounded-md",
                              }),
                            )}
                          >
                            See reflection
                          </Link>
                        </TableCell>
                      );
                    }

                    if (row.original.personId === localPersonId) {
                      return (
                        <TableCell key={cell.id}>
                          <Link
                            href={`/reflection/${row.original.attemptId}`}
                            className={cn(
                              buttonVariants({
                                size: "sm",
                                className: "rounded-md",
                              }),
                            )}
                          >
                            Start reflection
                          </Link>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={cell.id}>
                        <span className="text-muted-foreground text-sm">
                          Not available
                        </span>
                      </TableCell>
                    );
                  }

                  const className =
                    columnId === primary
                      ? "bg-green-200"
                      : columnId === secondary
                        ? "bg-orange-200"
                        : undefined;

                  return (
                    <TableCell key={cell.id} className={className}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
