/**
 * Checks for the TelaahBareng redaction (langchain/agents/analyzer/redaction.ts): the applicant's
 * NIK and one-time codes are masked, posting data is not.
 *
 *   pnpm test:redaction
 */
import { describe, expect, it } from "vitest";
import { hasSensitiveData, looksLikePersonalData, redactSensitive, stripUrlQuery } from "../langchain/agents/analyzer/redaction";

describe("personal data redaction", () => {
it("masks a NIK, plain or grouped", () => {
  expect(redactSensitive("NIK 3201234567890001")).toBe("NIK [NIK disensor]");
  expect(redactSensitive("NIK: 3201 2345 6789 0001.")).toBe("NIK: [NIK disensor].");
});

it("keeps 16-digit numbers that cannot be a NIK", () => {
  // 88 is not a province code: e.g. a virtual account number from the posting
  expect(redactSensitive("VA 8808123456789012")).toBe("VA 8808123456789012");
});

it("masks one-time codes but not postal codes", () => {
  expect(redactSensitive("Kode OTP kamu 482913, jangan bagikan")).toBe("Kode OTP kamu [kode disensor], jangan bagikan");
  expect(redactSensitive("PIN: 1234")).toBe("PIN: [kode disensor]");
  expect(redactSensitive("kode pos 60111")).toBe("kode pos 60111");
});

it("leaves posting data intact", () => {
  const posting = "Transfer Rp1.350.000 ke BRI 0000-01-778899-50-1, WA 0812-0000-4471, gaji 6.000.000, 30 Oktober 2026";
  expect(redactSensitive(posting)).toBe(posting);
  expect(hasSensitiveData(posting)).toBe(false);
});

it("flags lines that probably describe the applicant", () => {
  expect(looksLikePersonalData("NIK [NIK disensor]")).toBe(true);
  expect(looksLikePersonalData("Tempat, tanggal lahir: Malang, 2 Mei 2003")).toBe(true);
  expect(looksLikePersonalData("Posisi: Staff Admin")).toBe(false);
});

it("strips query strings from links", () => {
  expect(stripUrlQuery("https://contoh.example/daftar?token=abc#x")).toBe("https://contoh.example/daftar");
});
});
