

import { factCheck } from "../src/lib/fact-check";

async function main() {
  const statement = process.argv.slice(2).join(" ").trim();

  if (!statement) {
    console.error("❌ 文章を引数で渡してください。例:\n  pnpm run fact-check \"地球は平らである\"");
    process.exit(1);
  }

  try {
    const result = await factCheck(statement);
    console.log(
      `\n=== ファクトチェック結果 =================\n${JSON.stringify(
        result,
        null,
        2,
      )}\n`,
    );
    if (!result.ok && result.diffSummary) {
      console.log("\n=== 差分サマリ =================\n");
      console.log(result.diffSummary);
    }
  } catch (err) {
    console.error("💥 factCheck 実行中にエラー:", err);
    process.exit(1);
  }
}

main(); 