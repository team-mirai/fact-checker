import "dotenv/config";
import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import { glob } from "fast-glob";
import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
	const args = process.argv.slice(2);
	const sourceDirFlag = args.find((arg) => arg.startsWith('--source-dir='));
	const sourceDir = sourceDirFlag ? sourceDirFlag.split('=')[1] : 'policy';

	console.log(`Using source directory: ${sourceDir}`);

	const files = await glob(`${sourceDir}/*.md`);
	if (!files.length) throw new Error("no corpus files found");

	const fileIds: string[] = [];

	for (const filePath of files) {
		const fileStream = createReadStream(filePath);
		const res = await openai.files.create({
			file: fileStream,
			purpose: "assistants",
		});
		fileIds.push(res.id);
		console.log(`uploaded: ${filePath}`);
	}

	const store = await openai.vectorStores.create({
		file_ids: fileIds,
		name: "policy",
	});

	await fs.mkdir("config", { recursive: true });
	await fs.writeFile(
		"config/vectorStore.json",
		JSON.stringify({ id: store.id }, null, 2),
	);

	console.log("vectorStoreId:", store.id);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
