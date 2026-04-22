export type AssessmentColor = "red" | "green" | "blue" | "yellow";

export type AssessmentScores = Record<AssessmentColor, number>;

export const emptyScores = (): AssessmentScores => ({
	red: 0,
	green: 0,
	blue: 0,
	yellow: 0,
});

export const dominantColors = (scores: AssessmentScores) => {
	const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);

	return {
		primary: sorted[0]?.[0] as AssessmentColor | undefined,
		secondary: sorted[1]?.[0] as AssessmentColor | undefined,
	};
};
