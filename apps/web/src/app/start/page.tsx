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
		<div className="container mx-auto max-w-2xl px-4 py-6">
			<Card>
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
										className={cn(buttonVariants())}
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
						className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
					>
						Back to Home
					</Link>

					{identity ? (
						<Card>
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
											className="flex flex-wrap items-center gap-2 border p-2 text-xs"
										>
											<span>
												Submitted:{" "}
												{new Date(attempt.completedAt).toLocaleString()}
											</span>
											<span>Primary: {attempt.primaryColor}</span>
											<span>Secondary: {attempt.secondaryColor}</span>
											<Link
												href={`/reflection/${attempt.attemptId}`}
												className={cn(
													buttonVariants({ variant: "outline", size: "xs" }),
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
