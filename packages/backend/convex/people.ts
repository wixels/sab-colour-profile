import { v } from "convex/values";
import { mutation } from "./_generated/server";

const personValidator = v.object({
	personId: v.id("people"),
	name: v.string(),
	surname: v.string(),
	email: v.string(),
	emailNormalized: v.string(),
	group: v.string(),
});

export const upsertByEmail = mutation({
	args: {
		name: v.string(),
		surname: v.string(),
		email: v.string(),
		group: v.union(v.literal("Tax Summit"), v.literal("Sales Manager Academy")),
	},
	returns: personValidator,
	handler: async (ctx, args) => {
		const emailNormalized = args.email.trim().toLowerCase();
		const now = Date.now();

		const existing = await ctx.db
			.query("people")
			.withIndex("by_emailNormalized", (q) =>
				q.eq("emailNormalized", emailNormalized),
			)
			.unique();

		if (existing) {
			await ctx.db.patch(existing._id, {
				name: args.name.trim(),
				surname: args.surname.trim(),
				email: args.email.trim(),
				group: args.group,
				lastSeenAt: now,
			});

			return {
				personId: existing._id,
				name: args.name.trim(),
				surname: args.surname.trim(),
				email: args.email.trim(),
				emailNormalized,
				group: args.group,
			};
		}

		const personId = await ctx.db.insert("people", {
			name: args.name.trim(),
			surname: args.surname.trim(),
			email: args.email.trim(),
			emailNormalized,
			group: args.group,
			lastSeenAt: now,
		});

		return {
			personId,
			name: args.name.trim(),
			surname: args.surname.trim(),
			email: args.email.trim(),
			emailNormalized,
			group: args.group,
		};
	},
});
