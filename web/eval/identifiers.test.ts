/**
 * Checks for contact extraction and normalization (langchain/agents/telaah-bersama/identifiers.ts),
 * which decide whether two postings share a number, account, or domain.
 *
 *   pnpm test:identifiers
 */
import { describe, expect, it } from "vitest";
import { findContacts, findLinks, normalizePhone } from "../langchain/agents/telaah-bersama/identifiers";

const valuesOf = (text: string, kind: string) =>
  findContacts(text).identifiers.filter((item) => item.kind === kind).map((item) => item.value);

describe("contact identifier extraction", () => {
it("normalizes +62, 62, and 08 spellings of a number", () => {
  const expected = "6281200004471";
  expect(normalizePhone("0812-0000-4471")).toBe(expected);
  expect(normalizePhone("+62 812 0000 4471")).toBe(expected);
  expect(normalizePhone("62812.0000.4471")).toBe(expected);
  expect(valuesOf("WA 0812-0000-4471 atau +62 812 0000 4471", "phone")).toEqual([expected]);
});

it("keeps the number as written for display", () => {
  expect(findContacts("Hubungi +62 812-0000-9921").contacts).toEqual([{ kind: "phone", value: "+62 812-0000-9921" }]);
});

it("finds emails without reading their domain as a link", () => {
  expect(valuesOf("Kirim CV ke HRD.MitraDigital@gmail.com", "email")).toEqual(["hrd.mitradigital@gmail.com"]);
  expect(valuesOf("Kirim CV ke hrd@gmail.com", "domain")).toEqual([]);
});

it("finds bank accounts with their bank", () => {
  expect(valuesOf("Transfer ke BRI 0000-01-778899-50-1 a.n. Citra", "account")).toEqual(["bri:000001778899501"]);
  expect(valuesOf("biaya Rp250.000 ke BCA 0000-112-233", "account")).toEqual(["bca:0000112233"]);
});

it("normalizes domains and preserves identifying short-link paths", () => {
  expect(valuesOf("Info: www.Karier-ListrikNusantara.example/tahap-2?ref=wa", "domain")).toEqual(["karier-listriknusantara.example"]);
  expect(valuesOf("daftar di bit.ly/Daftar-MDS", "domain")).toEqual(["bit.ly/daftar-mds"]);
  expect(valuesOf("grup t.me/tugasharian_resmi", "domain")).toEqual(["t.me/tugasharian_resmi"]);
});

it("does not treat social media handles as domains", () => {
  expect(valuesOf("Info dari IG @loker.bumn.id dan @rekrutmen.terbaru", "domain")).toEqual([]);
  expect(findLinks("Follow @loker.bumn.id")).toEqual([]);
});

it("tells job-board postings apart by their path, whoever shared them", () => {
  const first = "https://glints.com/id/opportunities/jobs/243fb988-cb24/share/a46b52a1";
  expect(valuesOf(first, "domain")).toEqual(["glints.com/id/opportunities/jobs/243fb988-cb24"]);
  expect(valuesOf("https://glints.com/id/opportunities/jobs/243fb988-cb24/share/99ffee00", "domain")).toEqual(valuesOf(first, "domain"));
  expect(valuesOf("https://glints.com/id/opportunities/jobs/1eb4b6ad-4644", "domain")).not.toEqual(valuesOf(first, "domain"));
});

it("does not treat a bare job board or social site as an identifier", () => {
  expect(valuesOf("Lowongan dari glints.com dan instagram.com", "domain")).toEqual([]);
});

it("does not treat amounts as domains", () => {
  expect(valuesOf("Gaji Rp1.350.000 per bulan", "domain")).toEqual([]);
});

it("adds https and removes query strings from links", () => {
  expect(findLinks("Daftar: karier.example/form?token=abc. Atau https://bit.ly/xyz")).toEqual([
    "https://karier.example/form",
    "https://bit.ly/xyz",
  ]);
});
});
