"use client";
import { api } from "@sab-colour-profile/backend/convex/_generated/api";
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

export default function Home() {
	const healthCheck = useQuery(api.healthCheck.get);

	return (
		<div className="container mx-auto max-w-3xl px-4 py-6">
			<Card>
				<CardHeader>
					<CardTitle>Personality Assessment</CardTitle>
					<CardDescription>
						Complete the RGBY questionnaire and review assessment responses.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<p className="text-muted-foreground">
						Backend status: {healthCheck ?? "Loading..."}
					</p>
					<div className="flex gap-2">
						<Link href="/start" className={cn(buttonVariants())}>
							Start Assessment
						</Link>
						<Link
							href="/responses"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							View Responses
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
