/**
 * Checks for cleanSessionTitle (langchain/agents/session-title.ts), the guard between the title
 * model's reply and the session history list.
 *
 *   pnpm test:session-title
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanSessionTitle } from "../langchain/agents/session-title";

test("keeps a plain title", () => {
  assert.equal(cleanSessionTitle("Lowongan Staff Admin PT Listrik Nusantara"), "Lowongan Staff Admin PT Listrik Nusantara");
});

test("drops quotes, markdown, a 'Judul:' label, and trailing punctuation", () => {
  assert.equal(cleanSessionTitle('**Judul: "Biaya administrasi rekrutmen".**'), "Biaya administrasi rekrutmen");
});

test("uses only the first non-empty line", () => {
  assert.equal(cleanSessionTitle("\nMagang remote VINIX7\nAlasan: ..."), "Magang remote VINIX7");
});

test("removes phone numbers and emails", () => {
  assert.equal(cleanSessionTitle("Lowongan kasir 0812-3456-7890 hrd@gmail.com"), "Lowongan kasir");
});

test("cuts long titles at a word boundary", () => {
  const title = cleanSessionTitle(
    "Tawaran kerja operator komputer di Bangkok Thailand dengan visa kunjungan dan tiket yang dibayari sponsor"
  );
  assert.ok(title && title.length <= 60 && !title.endsWith(" "), title ?? "null");
});

test("returns null when nothing usable is left", () => {
  assert.equal(cleanSessionTitle("  \n "), null);
  assert.equal(cleanSessionTitle("0812-3456-7890"), null);
});
