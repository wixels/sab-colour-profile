"use client";

import { api } from "@sab-colour-profile/backend/convex/_generated/api";
import type { Id } from "@sab-colour-profile/backend/convex/_generated/dataModel";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@sab-colour-profile/ui/components/field";
import { Input } from "@sab-colour-profile/ui/components/input";
import { cn } from "@sab-colour-profile/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type LocalIdentity,
  loadLocalIdentity,
  saveLocalIdentity,
} from "@/lib/local-identity";

const requiredText = (value: string) =>
  value.trim().length === 0 ? "Required" : undefined;

const validateEmail = (value: string) => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return "Required";
  }
  if (!normalized.includes("@")) {
    return "Invalid email address";
  }
  return undefined;
};

const toFieldErrors = (errors: Array<unknown>) =>
  errors
    .filter((error): error is string => typeof error === "string")
    .map((message) => ({ message }));

const formatSubmissionDate = (value: number | string) => {
  const date = new Date(value);
  const now = new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  if (date.getFullYear() === now.getFullYear()) {
    return `${day}/${month} ${hour}:${minute}`;
  }

  const shortYear = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${shortYear} ${hour}:${minute}`;
};

const colorDotClassName = (color: string) => {
  switch (color.toLowerCase()) {
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    case "yellow":
      return "bg-yellow-400";
    case "green":
      return "bg-green-500";
    default:
      return "bg-muted-foreground";
  }
};

export default function StartPage() {
  const router = useRouter();
  const upsertByEmail = useMutation(api.people.upsertByEmail);
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const attempts = useQuery(
    api.attempts.listByPerson,
    identity ? { personId: identity.personId as Id<"people"> } : "skip",
  );

  const form = useForm({
    defaultValues: {
      name: "",
      surname: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      const person = await upsertByEmail(value);
      saveLocalIdentity(person);
      setIdentity(person);
      router.push("/assessment");
    },
  });

  useEffect(() => {
    const existingIdentity = loadLocalIdentity();
    if (!existingIdentity) {
      return;
    }

    form.setFieldValue("name", existingIdentity.name);
    form.setFieldValue("surname", existingIdentity.surname);
    form.setFieldValue("email", existingIdentity.emailNormalized);
    setIdentity(existingIdentity);
  }, [form]);

  return (
    <div className="container mx-auto flex max-w-2xl flex-col gap-2 px-4 py-6">
      <Button
        render={<Link href="/" />}
        variant="ghost"
        className="-ml-2.5 w-fit rounded-md"
        nativeButton={false}
      >
        <ChevronLeft />
        Home
      </Button>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Start Assessment</CardTitle>
          <CardDescription>
            Enter your details to begin. Your email links multiple attempts to
            your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="name"
                validators={{ onChange: ({ value }) => requiredText(value) }}
              >
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      className="rounded-md"
                    />
                    <FieldError
                      errors={toFieldErrors(field.state.meta.errors)}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="surname"
                validators={{ onChange: ({ value }) => requiredText(value) }}
              >
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Surname</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      className="rounded-md"
                    />
                    <FieldError
                      errors={toFieldErrors(field.state.meta.errors)}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="email"
                validators={{ onChange: ({ value }) => validateEmail(value) }}
              >
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      aria-invalid={field.state.meta.errors.length > 0}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      className="rounded-md"
                    />
                    <FieldError
                      errors={toFieldErrors(field.state.meta.errors)}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                  <button
                    type="submit"
                    className={cn(buttonVariants(), "rounded-md")}
                    disabled={!canSubmit}
                  >
                    Continue
                  </button>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-md",
            )}
          >
            Back to Home
          </Link>

          {identity ? (
            <Card className="rounded-lg bg-accent">
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
                <CardDescription>
                  Your assessment attempts with dominant and secondary colors.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {attempts === undefined ? (
                  <p className="text-muted-foreground text-xs">
                    Loading submissions...
                  </p>
                ) : attempts.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No submissions yet.
                  </p>
                ) : (
                  attempts.map((attempt) => (
                    <div
                      key={attempt.attemptId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background p-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{formatSubmissionDate(attempt.completedAt)}</span>
                        <div className="h-3.5 w-px bg-border" />
                        <div className="flex items-center gap-2">
                          <span>Primary:</span>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                "size-3 rounded-full",
                                colorDotClassName(attempt.primaryColor),
                              )}
                            />
                            <span className="capitalize">
                              {attempt.primaryColor}
                            </span>
                          </div>
                        </div>
                        <div className="h-3.5 w-px bg-border" />
                        <div className="flex items-center gap-2">
                          <span>Secondary:</span>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                "size-3 rounded-full",
                                colorDotClassName(attempt.secondaryColor),
                              )}
                            />
                            <span className="capitalize">
                              {attempt.secondaryColor}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/reflection/${attempt.attemptId}`}
                        className={cn(
                          buttonVariants({ size: "xs" }),
                          "rounded-md",
                        )}
                      >
                        Open Reflection
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
