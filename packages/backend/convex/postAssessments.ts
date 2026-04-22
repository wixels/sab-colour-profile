import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

const assessmentColorValidator = v.union(
	v.literal("red"),
	v.literal("green"),
	v.literal("blue"),
	v.literal("yellow"),
);

const postAssessmentNodeValidator = v.union(
	v.object({
		id: v.string(),
		parentId: v.optional(v.string()),
		kind: v.literal("section"),
		title: v.string(),
		description: v.optional(v.string()),
		sortOrder: v.number(),
	}),
	v.object({
		id: v.string(),
		parentId: v.optional(v.string()),
		kind: v.literal("question"),
		label: v.string(),
		helpText: v.optional(v.string()),
		answerType: v.union(
			v.literal("short_text"),
			v.literal("textarea"),
			v.literal("radio"),
		),
		required: v.boolean(),
		autoFill: v.optional(
			v.union(
				v.literal("name"),
				v.literal("role"),
				v.literal("dominant_color"),
				v.literal("secondary_color"),
			),
		),
		options: v.optional(
			v.array(
				v.object({
					id: v.string(),
					label: v.string(),
					colorHint: v.optional(assessmentColorValidator),
				}),
			),
		),
		sortOrder: v.number(),
	}),
);

const answerValidator = v.object({
	questionId: v.string(),
	value: v.string(),
});

const definitionValidator = v.object({
	_id: v.id("postAssessmentDefinitions"),
	_creationTime: v.number(),
	key: v.string(),
	title: v.string(),
	version: v.number(),
	isActive: v.boolean(),
	nodes: v.array(postAssessmentNodeValidator),
});

const responseValidator = v.object({
	_id: v.id("postAssessmentResponses"),
	_creationTime: v.number(),
	definitionId: v.id("postAssessmentDefinitions"),
	personId: v.id("people"),
	attemptId: v.id("attempts"),
	answers: v.array(answerValidator),
	submittedAt: v.number(),
});

type QuestionNode = Extract<
	Doc<"postAssessmentDefinitions">["nodes"][number],
	{ kind: "question" }
>;

const dominantColors = (
	scores: Doc<"attempts">["scores"],
): {
	primary: "red" | "green" | "blue" | "yellow";
	secondary: "red" | "green" | "blue" | "yellow";
} => {
	const ordered = Object.entries(scores)
		.sort(([, left], [, right]) => right - left)
		.map(([color]) => color as "red" | "green" | "blue" | "yellow");

	return {
		primary: ordered[0] ?? "red",
		secondary: ordered[1] ?? "green",
	};
};

const getDefinitionByKey = async (ctx: QueryCtx | MutationCtx, key: string) => {
	const definition = await ctx.db
		.query("postAssessmentDefinitions")
		.withIndex("by_key", (q) => q.eq("key", key))
		.unique();

	if (!definition?.isActive) {
		throw new ConvexError("Post-assessment definition not found.");
	}

	return definition;
};

const getQuestionNodes = (definition: Doc<"postAssessmentDefinitions">) => {
	return definition.nodes
		.filter((node): node is QuestionNode => node.kind === "question")
		.sort((left, right) => left.sortOrder - right.sortOrder);
};

export const listActiveDefinitions = query({
	args: {},
	returns: v.array(definitionValidator),
	handler: async (ctx) => {
		return await ctx.db
			.query("postAssessmentDefinitions")
			.withIndex("by_isActive_and_key", (q) => q.eq("isActive", true))
			.take(50);
	},
});

export const getDefinitionWithResponseForAttempt = query({
	args: {
		attemptId: v.id("attempts"),
		definitionKey: v.string(),
	},
	returns: v.object({
		definition: definitionValidator,
		response: v.union(responseValidator, v.null()),
		attemptContext: v.object({
			attemptId: v.id("attempts"),
			personId: v.id("people"),
			name: v.string(),
			surname: v.string(),
			dominantColor: assessmentColorValidator,
			secondaryColor: assessmentColorValidator,
			submittedAt: v.number(),
		}),
	}),
	handler: async (ctx, args) => {
		const definition = await getDefinitionByKey(ctx, args.definitionKey);
		const attempt = await ctx.db.get(args.attemptId);

		if (!attempt) {
			throw new ConvexError("Attempt not found.");
		}

		const person = await ctx.db.get(attempt.personId);
		if (!person) {
			throw new ConvexError("Person not found.");
		}

		const response = await ctx.db
			.query("postAssessmentResponses")
			.withIndex("by_attemptId_and_definitionId", (q) =>
				q.eq("attemptId", args.attemptId).eq("definitionId", definition._id),
			)
			.unique();

		const colors = dominantColors(attempt.scores);

		return {
			definition,
			response,
			attemptContext: {
				attemptId: attempt._id,
				personId: person._id,
				name: person.name,
				surname: person.surname,
				dominantColor: colors.primary,
				secondaryColor: colors.secondary,
				submittedAt: attempt.completedAt,
			},
		};
	},
});

export const submitResponse = mutation({
	args: {
		attemptId: v.id("attempts"),
		definitionKey: v.string(),
		answers: v.array(answerValidator),
	},
	returns: v.object({
		responseId: v.id("postAssessmentResponses"),
	}),
	handler: async (ctx, args) => {
		const definition = await getDefinitionByKey(ctx, args.definitionKey);
		const attempt = await ctx.db.get(args.attemptId);

		if (!attempt) {
			throw new ConvexError("Attempt not found.");
		}

		const person = await ctx.db.get(attempt.personId);
		if (!person) {
			throw new ConvexError("Person not found.");
		}

		const existingResponse = await ctx.db
			.query("postAssessmentResponses")
			.withIndex("by_attemptId_and_definitionId", (q) =>
				q.eq("attemptId", args.attemptId).eq("definitionId", definition._id),
			)
			.unique();

		if (existingResponse) {
			throw new ConvexError("A reflection already exists for this attempt.");
		}

		const questionNodes = getQuestionNodes(definition);
		const questionsById = new Map(
			questionNodes.map((question) => [question.id, question]),
		);

		const seenQuestionIds = new Set<string>();
		const normalizedAnswers: Array<{ questionId: string; value: string }> = [];

		for (const answer of args.answers) {
			if (seenQuestionIds.has(answer.questionId)) {
				throw new ConvexError("Duplicate question answer found.");
			}
			seenQuestionIds.add(answer.questionId);

			const question = questionsById.get(answer.questionId);
			if (!question) {
				throw new ConvexError("Answer references an unknown question.");
			}

			const value = answer.value.trim();
			if (question.required && value.length === 0) {
				throw new ConvexError(
					"All required reflection fields must be completed.",
				);
			}

			if (question.answerType === "radio") {
				const hasMatch = question.options?.some(
					(option) => option.id === value,
				);
				if (!hasMatch) {
					throw new ConvexError("Invalid reflection choice provided.");
				}
			}

			normalizedAnswers.push({
				questionId: answer.questionId,
				value,
			});
		}

		for (const question of questionNodes) {
			const answered = normalizedAnswers.find(
				(answer) => answer.questionId === question.id,
			);
			if (question.required && !answered?.value) {
				throw new ConvexError(
					"All required reflection fields must be completed.",
				);
			}
		}

		const responseId = await ctx.db.insert("postAssessmentResponses", {
			definitionId: definition._id,
			personId: person._id,
			attemptId: attempt._id,
			answers: normalizedAnswers,
			submittedAt: Date.now(),
		});

		return { responseId };
	},
});

export const bulkUpsertDefinitions = mutation({
	args: {
		definitions: v.array(
			v.object({
				key: v.string(),
				title: v.string(),
				version: v.number(),
				isActive: v.boolean(),
				nodes: v.array(postAssessmentNodeValidator),
			}),
		),
	},
	returns: v.object({
		upserted: v.number(),
		deactivated: v.number(),
	}),
	handler: async (ctx, args) => {
		let upserted = 0;
		const activeKeys = new Set(
			args.definitions.map((definition) => definition.key),
		);

		for (const incoming of args.definitions) {
			const existing = await ctx.db
				.query("postAssessmentDefinitions")
				.withIndex("by_key", (q) => q.eq("key", incoming.key))
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, {
					title: incoming.title,
					version: incoming.version,
					isActive: incoming.isActive,
					nodes: incoming.nodes,
				});
			} else {
				await ctx.db.insert("postAssessmentDefinitions", incoming);
			}

			upserted += 1;
		}

		let deactivated = 0;
		const currentDefinitions = await ctx.db
			.query("postAssessmentDefinitions")
			.take(100);
		for (const definition of currentDefinitions) {
			if (!activeKeys.has(definition.key) && definition.isActive) {
				await ctx.db.patch(definition._id, { isActive: false });
				deactivated += 1;
			}
		}

		return {
			upserted,
			deactivated,
		};
	},
});
