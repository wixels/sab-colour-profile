import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDirectory, "../.env.local") });
dotenv.config({ path: path.resolve(scriptDirectory, "../.env") });

const definitionPath =
	process.argv[2] ??
	path.resolve(scriptDirectory, "./data/reflection-definition.json");

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
	throw new Error(
		"Missing NEXT_PUBLIC_CONVEX_URL. Set it before running the importer.",
	);
}

const definitionModule = await import(`file://${definitionPath}`, {
	with: { type: "json" },
});
const payload = definitionModule.default;

if (!payload?.definitions || !Array.isArray(payload.definitions)) {
	throw new Error("Definition file must contain a `definitions` array.");
}

const client = new ConvexHttpClient(convexUrl);
const result = await client.mutation("postAssessments:bulkUpsertDefinitions", {
	definitions: payload.definitions,
});

console.log(
	`Imported ${result.upserted} post-assessment definitions (deactivated ${result.deactivated}).`,
);
console.log(`Source file: ${path.resolve(definitionPath)}`);
