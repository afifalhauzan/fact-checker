import { describe, expect, it } from "vitest";
import { canSubmitChatMessage } from "../lib/chat-composer";

describe("chat composer submit validation", () => {
  it("blocks an empty message", () => {
    expect(canSubmitChatMessage("", 0, false)).toBe(false);
  });

  it("blocks whitespace-only text", () => {
    expect(canSubmitChatMessage("  \n  ", 0, false)).toBe(false);
  });

  it("allows non-empty text", () => {
    expect(canSubmitChatMessage("Cek lowongan ini", 0, false)).toBe(true);
  });

  it("allows a message that contains text around whitespace", () => {
    expect(canSubmitChatMessage("  cek lowongan  ", 0, false)).toBe(true);
  });

  it("allows an attachment without text", () => {
    expect(canSubmitChatMessage("", 1, false)).toBe(true);
  });

  it("allows text and attachments together", () => {
    expect(canSubmitChatMessage("Tolong periksa poster ini", 2, false)).toBe(true);
  });

  it("blocks text while an answer is loading", () => {
    expect(canSubmitChatMessage("Cek lowongan ini", 0, true)).toBe(false);
  });

  it("blocks attachments while an answer is loading", () => {
    expect(canSubmitChatMessage("", 1, true)).toBe(false);
  });
});
