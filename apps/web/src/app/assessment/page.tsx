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
  FieldTitle,
} from "@sab-colour-profile/ui/components/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@sab-colour-profile/ui/components/radio-group";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
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
        <Card className="rounded-md">
          <CardContent className="pt-4">Loading questions...</CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <Card className="rounded-md">
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
    <div className="container mx-auto flex max-w-3xl flex-col gap-2 px-4 py-6">
      <Button
        render={<Link href="/" />}
        variant="ghost"
        className="-ml-2.5 w-fit rounded-md"
        nativeButton={false}
      >
        <ChevronLeft />
        Home
      </Button>
      <Card className="rounded-md">
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
                className="grid grid-cols-2"
              >
                {currentQuestion.options.map((option) => (
                  <FieldLabel
                    key={option.id}
                    className="transition-all hover:bg-accent has-[>[data-slot=field]]:rounded-md has-data-checked:bg-blue-500 has-data-checked:text-white has-data-checked:shadow-2xl has-data-checked:shadow-blue-500/20 has-data-checked:hover:bg-blue-500 *:data-[slot=field]:p-4"
                    htmlFor={`${currentQuestion._id}-${option.id}`}
                  >
                    <Field orientation="horizontal">
                      <FieldContent className="flex items-center justify-center">
                        <FieldTitle
                        //
                        //   className="w-fit text-left"
                        >
                          {option.label}
                        </FieldTitle>
                      </FieldContent>
                      <RadioGroupItem
                        id={`${currentQuestion._id}-${option.id}`}
                        className="hidden"
                        value={option.id}
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldSet>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-2 bg-accent">
          <Button
            className="rounded-md"
            variant="outline"
            onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={questionIndex === 0 || isSubmitting}
          >
            Previous
          </Button>

          {questionIndex < questions.length - 1 ? (
            <Button
              className="rounded-md"
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
              className="rounded-md"
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
