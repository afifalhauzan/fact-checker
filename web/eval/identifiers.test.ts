/**
 * Checks for contact extraction and normalization (langchain/agents/telaah-bersama/identifiers.ts),
 * which decide whether two postings share a number, account, or domain.
 *
 *   pnpm test:identifiers
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { findContacts, findLinks, normalizePhone } from "../langchain/agents/telaah-bersama/identifiers";

const valuesOf = (text: string, kind: string) =>
  findContacts(text).identifiers.filter((item) => item.kind === kind).map((item) => item.value);

test("+62, 62, and 08 spellings of a number normalize to the same value", () => {
  const expected = "6281200004471";
  assert.equal(normalizePhone("0812-0000-4471"), expected);
  assert.equal(normalizePhone("+62 812 0000 4471"), expected);
  assert.equal(normalizePhone("62812.0000.4471"), expected);
  assert.deepEqual(valuesOf("WA 0812-0000-4471 atau +62 812 0000 4471", "phone"), [expected]);
});

test("keeps the number as written for display", () => {
  assert.deepEqual(findContacts("Hubungi +62 812-0000-9921").contacts, [{ kind: "phone", value: "+62 812-0000-9921" }]);
});

test("finds emails without reading their domain as a link", () => {
  assert.deepEqual(valuesOf("Kirim CV ke HRD.MitraDigital@gmail.com", "email"), ["hrd.mitradigital@gmail.com"]);
  assert.deepEqual(valuesOf("Kirim CV ke hrd@gmail.com", "domain"), []);
});

test("finds bank accounts with their bank", () => {
  assert.deepEqual(valuesOf("Transfer ke BRI 0000-01-778899-50-1 a.n. Citra", "account"), ["bri:000001778899501"]);
  assert.deepEqual(valuesOf("biaya Rp250.000 ke BCA 0000-112-233", "account"), ["bca:0000112233"]);
});

test("domains drop www and paths, but shortlinks keep their path", () => {
  assert.deepEqual(valuesOf("Info: www.Karier-ListrikNusantara.example/tahap-2?ref=wa", "domain"), ["karier-listriknusantara.example"]);
  assert.deepEqual(valuesOf("daftar di bit.ly/Daftar-MDS", "domain"), ["bit.ly/daftar-mds"]);
  assert.deepEqual(valuesOf("grup t.me/tugasharian_resmi", "domain"), ["t.me/tugasharian_resmi"]);
});

test("social media handles are not domains", () => {
  assert.deepEqual(valuesOf("Info dari IG @loker.bumn.id dan @rekrutmen.terbaru", "domain"), []);
  assert.deepEqual(findLinks("Follow @loker.bumn.id"), []);
});

test("amounts are not domains", () => {
  assert.deepEqual(valuesOf("Gaji Rp1.350.000 per bulan", "domain"), []);
});

test("links come out with https and without query strings", () => {
  assert.deepEqual(findLinks("Daftar: karier.example/form?token=abc. Atau https://bit.ly/xyz"), [
    "https://karier.example/form",
    "https://bit.ly/xyz",
  ]);
});
