import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

const colorValidator = v.union(
	v.literal("red"),
	v.literal("green"),
	v.literal("blue"),
	v.literal("yellow"),
);

const scoreValidator = v.object({
	red: v.number(),
	green: v.number(),
	blue: v.number(),
	yellow: v.number(),
});

const answerValidator = v.object({
	questionId: v.id("questions"),
	selectedOptionId: v.string(),
});

const storedAnswerValidator = v.object({
	questionId: v.id("questions"),
	selectedOptionId: v.string(),
	color: colorValidator,
});

const attemptListItemValidator = v.object({
	attemptId: v.id("attempts"),
	personId: v.id("people"),
	completedAt: v.number(),
	scores: scoreValidator,
	primaryColor: colorValidator,
	secondaryColor: colorValidator,
});

export const submit = mutation({
	args: {
		personId: v.id("people"),
		answers: v.array(answerValidator),
	},
	returns: v.object({
		attemptId: v.id("attempts"),
		scores: scoreValidator,
	}),
	handler: async (ctx, args) => {
		const person = await ctx.db.get(args.personId);
		if (!person) {
			throw new ConvexError("Person not found.");
		}

		const activeQuestions = await ctx.db
			.query("questions")
			.withIndex("by_isActive_and_order", (q) => q.eq("isActive", true))
			.take(200);

		if (activeQuestions.length === 0) {
			throw new ConvexError("No active questions available.");
		}

		if (args.answers.length !== activeQuestions.length) {
			throw new ConvexError("All questions must be answered exactly once.");
		}

		const questionsById = new Map(
			activeQuestions.map((question) => [question._id, question]),
		);

		const seenQuestionIds = new Set<string>();
		const storedAnswers: Array<{
			questionId: (typeof args.answers)[number]["questionId"];
			selectedOptionId: string;
			color: "red" | "green" | "blue" | "yellow";
		}> = [];

		const scores: {
			red: number;
			green: number;
			blue: number;
			yellow: number;
		} = {
			red: 0,
			green: 0,
			blue: 0,
			yellow: 0,
		};

		for (const answer of args.answers) {
			const questionIdAsString = answer.questionId.toString();
			if (seenQuestionIds.has(questionIdAsString)) {
				throw new ConvexError("Each question can only be answered once.");
			}
			seenQuestionIds.add(questionIdAsString);

			const question = questionsById.get(answer.questionId);
			if (!question) {
				throw new ConvexError(
					"Answer contains an inactive or unknown question.",
				);
			}

			const selectedOption = question.options.find(
				(option) => option.id === answer.selectedOptionId,
			);
			if (!selectedOption) {
				throw new ConvexError(
					"Selected option does not belong to the question.",
				);
			}

			scores[selectedOption.color] += 1;

			storedAnswers.push({
				questionId: answer.questionId,
				selectedOptionId: answer.selectedOptionId,
				color: selectedOption.color,
			});
		}

		const attemptId = await ctx.db.insert("attempts", {
			personId: args.personId,
			answers: storedAnswers,
			scores,
			completedAt: Date.now(),
		});

		return { attemptId, scores };
	},
});

export const getById = query({
	args: {
		attemptId: v.id("attempts"),
	},
	returns: v.union(
		v.object({
			attemptId: v.id("attempts"),
			personId: v.id("people"),
			personName: v.string(),
			personSurname: v.string(),
			completedAt: v.number(),
			answers: v.array(storedAnswerValidator),
			scores: scoreValidator,
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const attempt = await ctx.db.get(args.attemptId);
		if (!attempt) {
			return null;
		}

		const person = await ctx.db.get(attempt.personId);
		if (!person) {
			throw new ConvexError("Person not found for this attempt.");
		}

		return {
			attemptId: attempt._id,
			personId: person._id,
			personName: person.name,
			personSurname: person.surname,
			completedAt: attempt.completedAt,
			answers: attempt.answers,
			scores: attempt.scores,
		};
	},
});

export const listByPerson = query({
	args: {
		personId: v.id("people"),
	},
	returns: v.array(attemptListItemValidator),
	handler: async (ctx, args) => {
		const attempts = await ctx.db
			.query("attempts")
			.withIndex("by_personId_and_completedAt", (q) =>
				q.eq("personId", args.personId),
			)
			.order("desc")
			.take(200);

		return attempts.map((attempt) => {
			const orderedColors = Object.entries(attempt.scores)
				.sort(([, leftScore], [, rightScore]) => rightScore - leftScore)
				.map(([color]) => color as "red" | "green" | "blue" | "yellow");

			return {
				attemptId: attempt._id,
				personId: attempt.personId,
				completedAt: attempt.completedAt,
				scores: attempt.scores,
				primaryColor: orderedColors[0] ?? "red",
				secondaryColor: orderedColors[1] ?? "green",
			};
		});
	},
});
