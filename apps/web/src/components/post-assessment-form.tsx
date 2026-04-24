"use client";

import {
  Button,
  buttonVariants,
} from "@sab-colour-profile/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sab-colour-profile/ui/components/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@sab-colour-profile/ui/components/field";
import { Input } from "@sab-colour-profile/ui/components/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@sab-colour-profile/ui/components/radio-group";
import { Textarea } from "@sab-colour-profile/ui/components/textarea";
import { cn } from "@sab-colour-profile/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type PostAssessmentNode =
  | {
      id: string;
      parentId?: string;
      kind: "section";
      title: string;
      description?: string;
      sortOrder: number;
    }
  | {
      id: string;
      parentId?: string;
      kind: "question";
      label: string;
      helpText?: string;
      answerType: "short_text" | "textarea" | "radio";
      required: boolean;
      autoFill?: "name" | "role" | "dominant_color" | "secondary_color";
      options?: Array<{
        id: string;
        label: string;
        colorHint?: "red" | "green" | "blue" | "yellow";
      }>;
      sortOrder: number;
    };

type LooseFormFieldState = {
  value?: string;
  meta: {
    errors: Array<unknown>;
  };
};

type LooseFormFieldApi = {
  state: LooseFormFieldState;
  handleBlur: () => void;
  handleChange: (value: string) => void;
};

type LooseFormApi = {
  Field: (props: {
    name: string;
    validators?: {
      onChange?: (context: { value: unknown }) => string | undefined;
    };
    children: (field: LooseFormFieldApi) => ReactNode;
  }) => ReactNode;
  Subscribe: (props: {
    selector: (state: { canSubmit: boolean }) => boolean;
    children: (canSubmit: boolean) => ReactNode;
  }) => ReactNode;
  handleSubmit: () => Promise<void>;
};

const toFieldErrors = (errors: Array<unknown>) =>
  errors
    .filter((error): error is string => typeof error === "string")
    .map((message) => ({ message }));

const getChildren = (nodes: Array<PostAssessmentNode>, parentId?: string) =>
  nodes
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

export function PostAssessmentForm({
  title,
  nodes,
  initialValues,
  readOnly,
  onSubmit,
}: {
  title: string;
  nodes: Array<PostAssessmentNode>;
  initialValues: Record<string, string>;
  readOnly: boolean;
  onSubmit: (
    answers: Array<{ questionId: string; value: string }>,
  ) => Promise<void>;
}) {
  const form = useForm({
    defaultValues: {
      answers: initialValues,
    },
    onSubmit: async ({ value }) => {
      const answers = Object.entries(value.answers).map(
        ([questionId, answerValue]) => ({
          questionId,
          value: answerValue ?? "",
        }),
      );
      await onSubmit(answers);
    },
  }) as unknown as LooseFormApi;

  const rootNodes = getChildren(nodes).sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  const getOptionLabel = (
    question: Extract<PostAssessmentNode, { kind: "question" }>,
    value: string,
  ) => {
    return (
      question.options?.find((option) => option.id === value)?.label ?? value
    );
  };

  const renderQuestion = (
    question: Extract<PostAssessmentNode, { kind: "question" }>,
  ) => {
    if (readOnly) {
      return (
        <Field key={question.id}>
          <FieldLabel>{question.label}</FieldLabel>
          <FieldContent>
            <p className="text-muted-foreground text-xs">
              {question.answerType === "radio"
                ? getOptionLabel(question, initialValues[question.id] ?? "")
                : (initialValues[question.id] ?? "—")}
            </p>
          </FieldContent>
        </Field>
      );
    }

    return (
      <form.Field
        key={question.id}
        name={`answers.${question.id}` as never}
        validators={{
          onChange: (context: { value: unknown }) => {
            if (!question.required) {
              return undefined;
            }
            const nextValue =
              typeof context.value === "string" ? context.value.trim() : "";
            return nextValue.length === 0
              ? "This reflection field is required."
              : undefined;
          },
        }}
      >
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={question.id}>{question.label}</FieldLabel>
            {question.answerType === "textarea" ? (
              <Textarea
                id={question.id}
                value={field.state.value ?? ""}
                aria-invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="rounded-md"
              />
            ) : question.answerType === "radio" ? (
              <RadioGroup
                value={field.state.value ?? ""}
                onValueChange={(value) => field.handleChange(value)}
              >
                {question.options?.map((option) => (
                  <Field key={option.id} orientation="horizontal">
                    <RadioGroupItem
                      id={`${question.id}-${option.id}`}
                      value={option.id}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={`${question.id}-${option.id}`}>
                        {option.label}
                      </FieldLabel>
                    </FieldContent>
                  </Field>
                ))}
              </RadioGroup>
            ) : (
              <Input
                id={question.id}
                value={field.state.value ?? ""}
                aria-invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="rounded-md"
              />
            )}
            <FieldError errors={toFieldErrors(field.state.meta.errors)} />
          </Field>
        )}
      </form.Field>
    );
  };

  const renderNode = (node: PostAssessmentNode): ReactNode => {
    if (node.kind === "question") {
      return renderQuestion(node);
    }

    const children = getChildren(nodes, node.id);

    return (
      <Card key={node.id} className="rounded-md">
        <CardHeader>
          <CardTitle>{node.title}</CardTitle>
          {node.description ? (
            <CardDescription>{node.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {children.map((child) => renderNode(child))}
        </CardContent>
      </Card>
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <FieldSet>
        <FieldLegend>{title}</FieldLegend>
        <FieldGroup>{rootNodes.map((node) => renderNode(node))}</FieldGroup>
      </FieldSet>
      {readOnly ? (
        <Button
          render={<Link href="/" />}
          variant="outline"
          className="w-fit rounded-md"
          nativeButton={false}
        >
          <ChevronLeft />
          Home
        </Button>
      ) : (
        <form.Subscribe selector={(state) => state.canSubmit}>
          {(canSubmit: boolean) => (
            <button
              type="submit"
              className={cn(buttonVariants({ className: "rounded-md" }))}
              disabled={!canSubmit}
            >
              Submit Reflection
            </button>
          )}
        </form.Subscribe>
      )}
    </form>
  );
}
