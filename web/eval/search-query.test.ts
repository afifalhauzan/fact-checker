/**
 * Checks for what the web search verifies (langchain/agents/analyzer/tools/tavily-search.ts).
 *
 *   pnpm test:search-query
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { preprocessJobInput } from "../langchain/agents/analyzer/preprocessor";
import { buildVerificationQuery } from "../langchain/agents/analyzer/tools/tavily-search";

const queryFor = (text: string) => buildVerificationQuery(preprocessJobInput(text))?.query ?? null;

test("a bare site on a poster is searched even without PT/CV", () => {
  assert.equal(queryFor("IDstar is hiring! APPLY NOW See Details idstar.co.id. Email hello@idstar.group"), "idstar.co.id");
});

test("an employer email domain is searched when no site is given", () => {
  assert.equal(queryFor("Kirim CV ke recruitment@sumbermakmur.co.id"), "sumbermakmur.co.id");
});

test("free mail, shortlinks, and abbreviations are not searched", () => {
  assert.equal(queryFor("Lulusan S.Kom, datang ke Jl.Mawar 12, kirim CV ke hrd.toko@gmail.com atau bit.ly/daftar"), null);
});

test("a legal company name still comes first", () => {
  assert.equal(queryFor("PT Sukses Makmur Sentosa membuka lowongan. Info: sukses.example.com"), '"PT Sukses Makmur Sentosa" lowongan kerja');
});
