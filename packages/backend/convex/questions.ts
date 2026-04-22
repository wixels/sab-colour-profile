import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const colorValidator = v.union(
	v.literal("red"),
	v.literal("green"),
	v.literal("blue"),
	v.literal("yellow"),
);

const questionOptionValidator = v.object({
	id: v.string(),
	label: v.string(),
	color: colorValidator,
});

const questionValidator = v.object({
	_id: v.id("questions"),
	_creationTime: v.number(),
	order: v.number(),
	prompt: v.string(),
	options: v.array(questionOptionValidator),
	isActive: v.boolean(),
});

export const listActive = query({
	args: {},
	returns: v.array(questionValidator),
	handler: async (ctx) => {
		return await ctx.db
			.query("questions")
			.withIndex("by_isActive_and_order", (q) => q.eq("isActive", true))
			.take(200);
	},
});

export const bulkUpsert = mutation({
	args: {
		questions: v.array(
			v.object({
				order: v.number(),
				prompt: v.string(),
				options: v.array(questionOptionValidator),
				isActive: v.optional(v.boolean()),
			}),
		),
	},
	returns: v.object({
		upserted: v.number(),
		deactivated: v.number(),
	}),
	handler: async (ctx, args) => {
		const desiredOrderSet = new Set<number>();
		let upserted = 0;

		for (const incoming of args.questions) {
			desiredOrderSet.add(incoming.order);

			const existing = await ctx.db
				.query("questions")
				.withIndex("by_order", (q) => q.eq("order", incoming.order))
				.unique();

			if (existing) {
				await ctx.db.patch(existing._id, {
					prompt: incoming.prompt,
					options: incoming.options,
					isActive: incoming.isActive ?? true,
				});
			} else {
				await ctx.db.insert("questions", {
					order: incoming.order,
					prompt: incoming.prompt,
					options: incoming.options,
					isActive: incoming.isActive ?? true,
				});
			}

			upserted += 1;
		}

		let deactivated = 0;
		const allQuestions = await ctx.db.query("questions").take(500);
		for (const question of allQuestions) {
			if (!desiredOrderSet.has(question.order) && question.isActive) {
				await ctx.db.patch(question._id, { isActive: false });
				deactivated += 1;
			}
		}

		return {
			upserted,
			deactivated,
		};
	},
});
