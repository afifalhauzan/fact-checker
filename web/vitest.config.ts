import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["eval/identifiers.test.ts", "eval/redaction.test.ts"],
  },
});
