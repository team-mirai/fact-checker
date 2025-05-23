import { readFile } from "node:fs/promises";
import { Marked } from "marked";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CheckResult {
  ok: boolean;            // 事実と概ね一致?
  diffSummary?: string;   // 乖離がある場合のみ
}

/**
 * ファクトチェック本体  
 * @param statement チェック対象文章 (X で拾った Tweet, YouTube 概要欄等)
 */
export async function factCheck(statement: string): Promise<CheckResult> {
  // マニフェスト(ローカル markdown)を system コンテキストに突っ込む
  const manifestMd = await readFile("./manifest.md", "utf-8");
  const manifestTxt = new Marked().parse(manifestMd);

  // prompt
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: [
          "あなたは事実確認を行うジャーナリストです。",
          "以下は公的に確認済みの情報です。誤った内容が含まれるか確認してください。",
          manifestTxt,
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "以下の文章に事実誤認があるか判定し、誤りがあれば簡潔に指摘してください。",
          "-----",
          statement,
          "-----",
        ].join("\n"),
      },
    ],
  });

  const answer = res.choices[0].message.content ?? "";
  const ok = /^OK/i.test(answer); // GPT に「OK」始まりで返してもらうシンプルな判定

  return {
    ok,
    diffSummary: ok ? undefined : answer,
  };
} 