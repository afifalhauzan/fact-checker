/**
 * Checks for the TelaahBareng redaction (langchain/agents/analyzer/redaction.ts): the applicant's
 * NIK and one-time codes are masked, posting data is not.
 *
 *   pnpm test:redaction
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { hasSensitiveData, looksLikePersonalData, redactSensitive, stripUrlQuery } from "../langchain/agents/analyzer/redaction";

test("masks a NIK, plain or grouped", () => {
  assert.equal(redactSensitive("NIK 3201234567890001"), "NIK [NIK disensor]");
  assert.equal(redactSensitive("NIK: 3201 2345 6789 0001."), "NIK: [NIK disensor].");
});

test("keeps 16-digit numbers that cannot be a NIK", () => {
  // 88 is not a province code: e.g. a virtual account number from the posting
  assert.equal(redactSensitive("VA 8808123456789012"), "VA 8808123456789012");
});

test("masks one-time codes but not postal codes", () => {
  assert.equal(redactSensitive("Kode OTP kamu 482913, jangan bagikan"), "Kode OTP kamu [kode disensor], jangan bagikan");
  assert.equal(redactSensitive("PIN: 1234"), "PIN: [kode disensor]");
  assert.equal(redactSensitive("kode pos 60111"), "kode pos 60111");
});

test("leaves posting data intact", () => {
  const posting = "Transfer Rp1.350.000 ke BRI 0000-01-778899-50-1, WA 0812-0000-4471, gaji 6.000.000, 30 Oktober 2026";
  assert.equal(redactSensitive(posting), posting);
  assert.equal(hasSensitiveData(posting), false);
});

test("flags lines that probably describe the applicant", () => {
  assert.equal(looksLikePersonalData("NIK [NIK disensor]"), true);
  assert.equal(looksLikePersonalData("Tempat, tanggal lahir: Malang, 2 Mei 2003"), true);
  assert.equal(looksLikePersonalData("Posisi: Staff Admin"), false);
});

test("strips query strings from links", () => {
  assert.equal(stripUrlQuery("https://contoh.example/daftar?token=abc#x"), "https://contoh.example/daftar");
});
