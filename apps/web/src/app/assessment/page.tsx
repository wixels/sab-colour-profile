"use client";

import { api } from "@sab-colour-profile/backend/convex/_generated/api";
import type { Id } from "@sab-colour-profile/backend/convex/_generated/dataModel";
import { Button } from "@sab-colour-profile/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@sab-colour-profile/ui/components/card";
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@sab-colour-profile/ui/components/field";
import {
	RadioGroup,
	RadioGroupItem,
} from "@sab-colour-profile/ui/components/radio-group";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
	clearAssessmentDraft,
	type LocalIdentity,
	loadAssessmentDraft,
	loadLocalIdentity,
	saveAssessmentDraft,
} from "@/lib/local-identity";

type AnswerMap = Record<string, string>;

export default function AssessmentPage() {
	const router = useRouter();
	const questions = useQuery(api.questions.listActive);
	const submitAttempt = useMutation(api.attempts.submit);

	const [identity, setIdentity] = useState<LocalIdentity | null>(null);
	const [questionIndex, setQuestionIndex] = useState(0);
	const [answersByQuestionId, setAnswersByQuestionId] = useState<AnswerMap>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const existingIdentity = loadLocalIdentity();
		if (!existingIdentity) {
			router.replace("/start");
			return;
		}
		setIdentity(existingIdentity);

		const draft = loadAssessmentDraft();
		if (draft) {
			setQuestionIndex(draft.questionIndex);
			setAnswersByQuestionId(draft.answersByQuestionId);
		}
	}, [router]);

	useEffect(() => {
		saveAssessmentDraft({ questionIndex, answersByQuestionId });
	}, [questionIndex, answersByQuestionId]);

	const currentQuestion = useMemo(() => {
		if (!questions || questions.length === 0) {
			return null;
		}

		return questions[Math.min(questionIndex, questions.length - 1)];
	}, [questionIndex, questions]);

	const currentAnswer = currentQuestion
		? answersByQuestionId[currentQuestion._id]
		: undefined;

	if (!identity) {
		return null;
	}

	if (!questions) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-6">
				<Card>
					<CardContent className="pt-4">Loading questions...</CardContent>
				</Card>
			</div>
		);
	}

	if (questions.length === 0 || !currentQuestion) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-6">
				<Card>
					<CardHeader>
						<CardTitle>No questions available</CardTitle>
						<CardDescription>
							Import the question bank first using the importer script.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-3xl px-4 py-6">
			<Card>
				<CardHeader>
					<CardTitle>Assessment</CardTitle>
					<CardDescription>
						Question {Math.min(questionIndex + 1, questions.length)} of{" "}
						{questions.length}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<FieldGroup>
						<FieldSet>
							<FieldLegend>{currentQuestion.prompt}</FieldLegend>
							<RadioGroup
								value={currentAnswer ?? ""}
								onValueChange={(value) => {
									setAnswersByQuestionId((prev) => ({
										...prev,
										[currentQuestion._id]: value,
									}));
								}}
							>
								{currentQuestion.options.map((option) => (
									<Field key={option.id} orientation="horizontal">
										<RadioGroupItem
											id={`${currentQuestion._id}-${option.id}`}
											value={option.id}
										/>
										<FieldContent>
											<FieldLabel
												htmlFor={`${currentQuestion._id}-${option.id}`}
											>
												{option.label}
											</FieldLabel>
										</FieldContent>
									</Field>
								))}
							</RadioGroup>
						</FieldSet>
					</FieldGroup>
				</CardContent>
				<CardFooter className="justify-between gap-2">
					<Button
						variant="outline"
						onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
						disabled={questionIndex === 0 || isSubmitting}
					>
						Previous
					</Button>

					{questionIndex < questions.length - 1 ? (
						<Button
							onClick={() =>
								setQuestionIndex((prev) =>
									Math.min(questions.length - 1, prev + 1),
								)
							}
							disabled={!currentAnswer || isSubmitting}
						>
							Next
						</Button>
					) : (
						<Button
							disabled={!currentAnswer || isSubmitting}
							onClick={async () => {
								if (!identity) {
									return;
								}

								const answers = questions.map((question) => ({
									questionId: question._id,
									selectedOptionId: answersByQuestionId[question._id],
								}));

								if (answers.some((answer) => !answer.selectedOptionId)) {
									return;
								}

								setIsSubmitting(true);
								try {
									const result = await submitAttempt({
										personId: identity.personId as Id<"people">,
										answers: answers as Array<{
											questionId: Id<"questions">;
											selectedOptionId: string;
										}>,
									});
									clearAssessmentDraft();
									router.push(`/results/${result.attemptId}`);
								} finally {
									setIsSubmitting(false);
								}
							}}
						>
							{isSubmitting ? "Submitting..." : "Submit Assessment"}
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	);
}
