import { env } from "../../lib/env";
import { createLocalFactChecker } from "./local";
import { createOpenAIFactChcker } from "./openapi";
import type { FactChcker } from "./types";

export function createFactChecker(): FactChcker {
  const provider = ["prod", "dev"].includes(env) ? "openai" : "local";

  switch (provider) {
    case "openai":
      return createOpenAIFactChcker();
    case "local":
      return createLocalFactChecker();
    default:
      throw new Error(`Unknown fact checker provider: ${provider}`);
  }
}
