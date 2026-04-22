import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import xlsx from "xlsx";

const DEFAULT_WORKBOOK_PATH =
	"/Users/dan/Downloads/Colours Questionnaire - Answers.xlsx";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDirectory, "../.env.local") });
dotenv.config({ path: path.resolve(scriptDirectory, "../.env") });

const colorByOptionIndex = ["green", "red", "blue", "yellow"];

const workbookPath = process.argv[2] ?? DEFAULT_WORKBOOK_PATH;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
	throw new Error(
		"Missing NEXT_PUBLIC_CONVEX_URL. Set it before running the importer.",
	);
}

const workbook = xlsx.readFile(workbookPath);
const worksheet = workbook.Sheets.Sheet1;

if (!worksheet) {
	throw new Error("Sheet1 not found in workbook.");
}

const rows = xlsx.utils.sheet_to_json(worksheet, {
	header: 1,
	defval: null,
});

const questions = [];

for (const row of rows) {
	const questionNumber = row?.[0];
	if (typeof questionNumber !== "number") {
		continue;
	}

	const optionWords = [row[1], row[3], row[5], row[7]];
	if (optionWords.some((word) => typeof word !== "string")) {
		continue;
	}

	questions.push({
		order: questionNumber,
		prompt: `Question ${questionNumber}`,
		options: optionWords.map((word, index) => ({
			id: `${questionNumber}-${index + 1}`,
			label: word.trim(),
			color: colorByOptionIndex[index],
		})),
		isActive: true,
	});
}

if (questions.length === 0) {
	throw new Error("No question rows were parsed from Sheet1.");
}

const client = new ConvexHttpClient(convexUrl);
const result = await client.mutation("questions:bulkUpsert", { questions });

console.log(
	`Imported ${result.upserted} questions (deactivated ${result.deactivated}).`,
);
console.log(`Source workbook: ${path.resolve(workbookPath)}`);
