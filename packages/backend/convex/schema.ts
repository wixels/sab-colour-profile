import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const assessmentColor = v.union(
	v.literal("red"),
	v.literal("green"),
	v.literal("blue"),
	v.literal("yellow"),
);

const personGroup = v.union(
	v.literal("Tax Summit"),
	v.literal("Sales Manager Academy"),
);

const postAssessmentNode = v.union(
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
					colorHint: v.optional(assessmentColor),
				}),
			),
		),
		sortOrder: v.number(),
	}),
);

export default defineSchema({
	questions: defineTable({
		order: v.number(),
		prompt: v.string(),
		options: v.array(
			v.object({
				id: v.string(),
				label: v.string(),
				color: assessmentColor,
			}),
		),
		isActive: v.boolean(),
	})
		.index("by_order", ["order"])
		.index("by_isActive_and_order", ["isActive", "order"]),
	people: defineTable({
		name: v.string(),
		surname: v.string(),
		email: v.string(),
		emailNormalized: v.string(),
		group: v.optional(personGroup),
		lastSeenAt: v.number(),
	})
		.index("by_emailNormalized", ["emailNormalized"])
		.index("by_name_and_surname", ["name", "surname"]),
	attempts: defineTable({
		personId: v.id("people"),
		answers: v.array(
			v.object({
				questionId: v.id("questions"),
				selectedOptionId: v.string(),
				color: assessmentColor,
			}),
		),
		scores: v.object({
			red: v.number(),
			green: v.number(),
			blue: v.number(),
			yellow: v.number(),
		}),
		completedAt: v.number(),
	}).index("by_personId_and_completedAt", ["personId", "completedAt"]),
	postAssessmentDefinitions: defineTable({
		key: v.string(),
		title: v.string(),
		version: v.number(),
		isActive: v.boolean(),
		nodes: v.array(postAssessmentNode),
	})
		.index("by_key", ["key"])
		.index("by_isActive_and_key", ["isActive", "key"]),
	postAssessmentResponses: defineTable({
		definitionId: v.id("postAssessmentDefinitions"),
		personId: v.id("people"),
		attemptId: v.id("attempts"),
		answers: v.array(
			v.object({
				questionId: v.string(),
				value: v.string(),
			}),
		),
		submittedAt: v.number(),
	})
		.index("by_personId_and_submittedAt", ["personId", "submittedAt"])
		.index("by_attemptId_and_definitionId", ["attemptId", "definitionId"]),
});
