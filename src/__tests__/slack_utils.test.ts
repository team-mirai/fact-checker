import { describe, expect, test } from "bun:test";
import {
  extractTweetId,
  preventAutolink,
  removeMentions,
} from "../lib/slack/utils";

describe("slack utils", () => {
  describe("preventAutolink", () => {
    test("README.mdがリンク防止文字で変換されること", () => {
      const input = "See README.md for details";
      const result = preventAutolink(input);

      expect(result).toContain("README\u2060.md");
      expect(result).not.toContain("README.md");
    });

    test("HTTPSのURLがリンク防止文字で変換されること", () => {
      const input = "Visit https://example.com for more info";
      const result = preventAutolink(input);

      expect(result).toContain("https://example\u2060.com");
      expect(result).not.toContain("https://example.com");
    });

    test("複数のURLが変換されること", () => {
      const input = "Check https://github.com and http://example.org";
      const result = preventAutolink(input);

      expect(result).toContain("https://github\u2060.com");
      expect(result).toContain("http://example\u2060.org");
    });
  });

  describe("extractTweetId", () => {
    test.each([
      [
        "Twitter URLからIDが正しく抽出されること",
        "https://twitter.com/user/status/1234567890",
        "1234567890",
      ],
      [
        "X.com URLからIDが正しく抽出されること",
        "https://x.com/user/status/9876543210",
        "9876543210",
      ],
      [
        "statusが含まれないURLではundefinedが返されること",
        "https://twitter.com/user",
        undefined,
      ],
      ["無効なURLではundefinedが返されること", "invalid-url", undefined],
    ])("(%s) %s -> %s", (_, url, expected) => {
      const result = extractTweetId(url);
      const matcher = expect(result);
      if (expected === undefined) {
        matcher.toBeUndefined();
      } else {
        matcher.toBe(expected);
      }
    });
  });

  describe("removeMentions", () => {
    test("メンション文字列が除去されること", () => {
      const input = "<@U1234567> hello world";
      const result = removeMentions(input);

      expect(result).toBe("hello world");
    });

    test("複数のメンションが除去されること", () => {
      const input = "<@U1234567> <@W8901234> hello world";
      const result = removeMentions(input);

      expect(result).toBe("hello world");
    });

    test("メンションがない場合はそのまま返されること", () => {
      const input = "hello world";
      const result = removeMentions(input);

      expect(result).toBe("hello world");
    });

    test("前後の空白が適切にトリムされること", () => {
      const input = "  <@U1234567>  hello world  ";
      const result = removeMentions(input);

      expect(result).toBe("hello world");
    });
  });
});
