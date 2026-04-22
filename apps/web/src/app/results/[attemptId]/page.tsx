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

export default function ResultPage() {
	const params = useParams<{ attemptId: string }>();
	const attemptId = params.attemptId as Id<"attempts">;
	const attempt = useQuery(api.attempts.getById, { attemptId });

	if (attempt === undefined) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-6">
				<Card>
					<CardContent className="pt-4">Loading result...</CardContent>
				</Card>
			</div>
		);
	}

	if (attempt === null) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-6">
				<Card>
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
			<Card>
				<CardHeader>
					<CardTitle>Assessment Result</CardTitle>
					<CardDescription>
						{attempt.personName} {attempt.personSurname}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<div className="grid grid-cols-2 gap-2">
						<div>Green: {attempt.scores.green}</div>
						<div>Red: {attempt.scores.red}</div>
						<div>Blue: {attempt.scores.blue}</div>
						<div>Yellow: {attempt.scores.yellow}</div>
					</div>
					<p>
						Dominant: <strong>{topColors.primary ?? "n/a"}</strong>
					</p>
					<p>
						Secondary: <strong>{topColors.secondary ?? "n/a"}</strong>
					</p>
					<div className="flex gap-2">
						<Link href="/start" className={cn(buttonVariants())}>
							Start Another Attempt
						</Link>
						<Link
							href="/responses"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							View All Responses
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
