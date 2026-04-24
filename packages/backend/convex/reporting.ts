import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export const listLatestScoresByPerson = query({
	args: {},
	returns: v.array(
		v.object({
			personId: v.id("people"),
			attemptId: v.id("attempts"),
			name: v.string(),
			surname: v.string(),
			fullName: v.string(),
			red: v.number(),
			green: v.number(),
			blue: v.number(),
			yellow: v.number(),
			completedAt: v.number(),
			hasReflection: v.boolean(),
		}),
	),
	handler: async (ctx) => {
		const reflectionDefinition = await ctx.db
			.query("postAssessmentDefinitions")
			.withIndex("by_key", (q) => q.eq("key", "reflection"))
			.unique();
		const people = await ctx.db.query("people").take(500);
		const rows: Array<{
			personId: Id<"people">;
			attemptId: Id<"attempts">;
			name: string;
			surname: string;
			fullName: string;
			red: number;
			green: number;
			blue: number;
			yellow: number;
			completedAt: number;
			hasReflection: boolean;
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
			const reflectionResponse =
				reflectionDefinition === null
					? null
					: await ctx.db
							.query("postAssessmentResponses")
							.withIndex("by_attemptId_and_definitionId", (q) =>
								q
									.eq("attemptId", attempt._id)
									.eq("definitionId", reflectionDefinition._id),
							)
							.unique();

			rows.push({
				personId: person._id,
				attemptId: attempt._id,
				name: person.name,
				surname: person.surname,
				fullName: `${person.name} ${person.surname}`.trim(),
				red: attempt.scores.red,
				green: attempt.scores.green,
				blue: attempt.scores.blue,
				yellow: attempt.scores.yellow,
				completedAt: attempt.completedAt,
				hasReflection: reflectionResponse !== null,
			});
		}

		return rows.sort((a, b) => a.fullName.localeCompare(b.fullName));
	},
});
