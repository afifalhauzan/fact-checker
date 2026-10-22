/**
 * Checks for cleanSessionTitle (langchain/agents/session-title.ts), the guard between the title
 * model's reply and the session history list.
 *
 *   pnpm test:session-title
 */
import { describe, expect, it } from "vitest";
import { cleanSessionTitle } from "../langchain/agents/session-title";

describe("session title cleanup", () => {
  it("keeps a plain title", () => {
    expect(cleanSessionTitle("Lowongan Staff Admin PT Listrik Nusantara")).toBe("Lowongan Staff Admin PT Listrik Nusantara");
  });

  it("drops quotes, markdown, a 'Judul:' label, and trailing punctuation", () => {
    expect(cleanSessionTitle('**Judul: "Biaya administrasi rekrutmen".**')).toBe("Biaya administrasi rekrutmen");
  });

  it("uses only the first non-empty line", () => {
    expect(cleanSessionTitle("\nMagang remote VINIX7\nAlasan: ...")).toBe("Magang remote VINIX7");
  });

  it("removes phone numbers and emails", () => {
    expect(cleanSessionTitle("Lowongan kasir 0812-3456-7890 hrd@gmail.com")).toBe("Lowongan kasir");
  });

  it("cuts long titles at a word boundary", () => {
    const title = cleanSessionTitle(
      "Tawaran kerja operator komputer di Bangkok Thailand dengan visa kunjungan dan tiket yang dibayari sponsor"
    );
    expect(title).not.toBeNull();
    expect(title!.length).toBeLessThanOrEqual(60);
    expect(title).not.toMatch(/\s$/);
  });

  it("returns null when nothing usable is left", () => {
    expect(cleanSessionTitle("  \n ")).toBeNull();
    expect(cleanSessionTitle("0812-3456-7890")).toBeNull();
  });
});
