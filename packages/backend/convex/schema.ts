import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const assessmentColor = v.union(
	v.literal("red"),
	v.literal("green"),
	v.literal("blue"),
	v.literal("yellow"),
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
});
