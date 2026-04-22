"use client";

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

type ResponseRow = {
	personId: string;
	fullName: string;
	green: number;
	red: number;
	blue: number;
	yellow: number;
};

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
];

export function ResponsesTable({ rows }: { rows: Array<ResponseRow> }) {
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
					table.getRowModel().rows.map((row) => (
						<TableRow key={row.original.personId}>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				)}
			</TableBody>
		</Table>
	);
}
