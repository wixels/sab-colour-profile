import { v } from "convex/values";
import { query } from "./_generated/server";

export const listLatestScoresByPerson = query({
	args: {},
	returns: v.array(
		v.object({
			personId: v.id("people"),
			name: v.string(),
			surname: v.string(),
			fullName: v.string(),
			red: v.number(),
			green: v.number(),
			blue: v.number(),
			yellow: v.number(),
			completedAt: v.number(),
		}),
	),
	handler: async (ctx) => {
		const people = await ctx.db.query("people").take(500);
		const rows: Array<{
			personId: (typeof people)[number]["_id"];
			name: string;
			surname: string;
			fullName: string;
			red: number;
			green: number;
			blue: number;
			yellow: number;
			completedAt: number;
		}> = [];

		for (const person of people) {
			const latestAttempt = await ctx.db
				.query("attempts")
				.withIndex("by_personId_and_completedAt", (q) =>
					q.eq("personId", person._id),
				)
				.order("desc")
				.take(1);

			if (latestAttempt.length === 0) {
				continue;
			}

			const attempt = latestAttempt[0];
			rows.push({
				personId: person._id,
				name: person.name,
				surname: person.surname,
				fullName: `${person.name} ${person.surname}`.trim(),
				red: attempt.scores.red,
				green: attempt.scores.green,
				blue: attempt.scores.blue,
				yellow: attempt.scores.yellow,
				completedAt: attempt.completedAt,
			});
		}

		return rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
	},
});
