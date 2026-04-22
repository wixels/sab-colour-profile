"use client";

import { api } from "@sab-colour-profile/backend/convex/_generated/api";
import type { Id } from "@sab-colour-profile/backend/convex/_generated/dataModel";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@sab-colour-profile/ui/components/card";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PostAssessmentForm } from "@/components/post-assessment-form";
import { type LocalIdentity, loadLocalIdentity } from "@/lib/local-identity";

const DEFINITION_KEY = "reflection";

const toTitleCase = (value: string) =>
	value
		.split("_")
		.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
		.join(" ");

export default function ReflectionPage() {
	const params = useParams<{ attemptId: string }>();
	const attemptId = params.attemptId as Id<"attempts">;
	const [identity, setIdentity] = useState<LocalIdentity | null>(null);

	const payload = useQuery(
		api.postAssessments.getDefinitionWithResponseForAttempt,
		{
			attemptId,
			definitionKey: DEFINITION_KEY,
		},
	);
	const submitReflection = useMutation(api.postAssessments.submitResponse);

	useEffect(() => {
		setIdentity(loadLocalIdentity());
	}, []);

	const initialValues = useMemo(() => {
		if (!payload) {
			return {};
		}

		if (payload.response) {
			return Object.fromEntries(
				payload.response.answers.map((answer) => [
					answer.questionId,
					answer.value,
				]),
			);
		}

		const baseName = identity
			? `${identity.name} ${identity.surname}`.trim()
			: `${payload.attemptContext.name} ${payload.attemptContext.surname}`.trim();

		const values: Record<string, string> = {};
		for (const node of payload.definition.nodes) {
			if (node.kind !== "question") {
				continue;
			}

			if (node.autoFill === "name") {
				values[node.id] = baseName;
			} else if (node.autoFill === "dominant_color") {
				values[node.id] = toTitleCase(payload.attemptContext.dominantColor);
			} else if (node.autoFill === "secondary_color") {
				values[node.id] = toTitleCase(payload.attemptContext.secondaryColor);
			} else {
				values[node.id] = "";
			}
		}
		return values;
	}, [identity, payload]);

	if (payload === undefined) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-6">
				<Card>
					<CardContent className="pt-4">Loading reflection...</CardContent>
				</Card>
			</div>
		);
	}

	const isReadOnly = payload.response !== null;

	return (
		<div className="container mx-auto max-w-4xl px-4 py-6">
			<Card>
				<CardHeader>
					<CardTitle>Reflection</CardTitle>
					<CardDescription>
						Assessment submitted at{" "}
						{new Date(payload.attemptContext.submittedAt).toLocaleString()}.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PostAssessmentForm
						title={payload.definition.title}
						nodes={payload.definition.nodes}
						initialValues={initialValues}
						readOnly={isReadOnly}
						onSubmit={async (answers) => {
							await submitReflection({
								attemptId,
								definitionKey: DEFINITION_KEY,
								answers,
							});
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
