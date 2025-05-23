import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const vectorStoreId = process.env.VECTOR_STORE_ID!;

export interface CheckResult {
  ok: boolean;     // 事実と概ね一致?
  answer: string;  // GPT が生成した全文 (OK / NG + 詳細 & 出典)
}

/**
 * ファクトチェック本体
 * @param statement チェック対象文章
 */
export async function factCheck(statement: string): Promise<CheckResult> {
  const res = await openai.responses.create({
    model: "o3-mini",
    tools: [{ type: "file_search", vector_store_ids: [vectorStoreId] }],
    include: ["file_search_call.results"],
    input: [
      {
        type: "message",
        role: "system",
        content: `あなたはファクトチェッカーです。データソースとしてファクトが与えられています。
        与えられた文章にファクトと比較して誤りがあるか確認し､回答をデータソースとともに出力してください。
        誤りがない場合は回答の冒頭にOKと出力してください。その後データソースのどこに記載があるか､詳細を出力してください。
        誤りがある場合は回答の冒頭にNGと出力してください。その後誤りの箇所を指摘してください。
        `,
      },
      {
        role: "user",
        content: statement,
      },
    ],
  });

  /* ───────── 出典を整形 ───────── */
  const citationBlocks: string[] = [];

  for (const item of res.output ?? []) {
    if (item.type === "file_search_call" && item.results) {
      for (const r of item.results) {
        citationBlocks.push(
          `- **${r.filename ?? r.file_id}**\n  > ${r.text?.trim()}`,
        );
      }
    }
  }

  const answer = citationBlocks.length
    ? `${res.output_text.trim()}

---

<details>
<summary>📚 出典</summary>

${citationBlocks.join("\n\n")}

</details>`
    : res.output_text;

  /* ───────── 判定 ───────── */
  const ok = /^OK/i.test(answer);

  return { ok, answer };
} 