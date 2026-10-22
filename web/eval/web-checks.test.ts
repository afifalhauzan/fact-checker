/**
 * Checks for the evidence gathered before the analysis and the checklist shown under the verdict
 * (langchain/agents/analyzer/checks.ts, tools/domain-age.ts). No network: results are given.
 *
 *   pnpm test:web-checks
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildChecks, newDomainSignals } from "../langchain/agents/analyzer/checks";
import { detectSignals } from "../langchain/agents/analyzer/signals";
import { registrableDomain } from "../langchain/agents/analyzer/tools/domain-age";
import type { WebSearchResult } from "../langchain/agents/analyzer/tools/tavily-search";

const NOW = new Date("2026-10-22T00:00:00Z");

test("domain age is looked up on the registered domain, never on free hosting", () => {
  assert.equal(registrableDomain("career.idstar.co.id"), "idstar.co.id");
  assert.equal(registrableDomain("www.rekrutmen-pertamina.com"), "rekrutmen-pertamina.com");
  assert.equal(registrableDomain("loker.my.id"), "loker.my.id");
  assert.equal(registrableDomain("daftar-bumn.vercel.app"), null);
});

test("a domain registered weeks ago is a signal, an old one is not", () => {
  const ages = [
    { domain: "rekrutmen-baru.com", registeredAt: "2026-10-01T00:00:00Z" },
    { domain: "idstar.co.id", registeredAt: "2017-02-01T07:04:12Z" },
    { domain: "tidak-terjawab.id", registeredAt: null },
  ];
  const signals = newDomainSignals(ages, NOW);
  assert.deepEqual(signals.map((signal) => [signal.id, signal.floor]), [["new_domain", "sedang"]]);
  assert.match(signals[0].description, /21 hari/);

  const checks = buildChecks({ signals: [], links: null, search: null, domainAges: ages, now: NOW });
  assert.deepEqual(checks.slice(1).map((check) => check.status), ["warning", "ok", "skipped"]);
});

test("the checklist lists every check that ran, in pipeline order", () => {
  const search: WebSearchResult = {
    status: "ok",
    entity: { kind: "company", name: "PT Idstar Cipta Teknologi" },
    retrievedCount: 6,
    sources: [1, 2, 3].map((n) => ({ id: `S${n}`, title: "", url: `https://idstar.co.id/${n}`, snippet: "" })),
    site: { domain: "idstar.co.id", count: 2 },
  };
  const checks = buildChecks({
    signals: detectSignals("Kirim CV ke hrd.idstar@gmail.com, daftar di bit.ly/daftar-ids"),
    links: {
      shortlinks: [
        { link: "https://bit.ly/daftar-ids", destination: "https://forms.gle-example.com/form" },
        { link: "https://s.id/hilang", destination: null },
      ],
      page: { url: "https://www.jobstreet.co.id/id/job/123", text: null },
    },
    search,
    domainAges: [],
    now: NOW,
  });

  assert.deepEqual(
    checks.map((check) => [check.label, check.status]),
    [
      ["Pola penipuan umum", "warning"],
      ["Shortlink bit.ly/daftar-ids", "info"],
      ["Shortlink s.id/hilang", "warning"],
      ["Isi halaman link", "info"],
      ["Jejak di web", "ok"],
    ]
  );
  assert.match(checks[4].detail, /2 di antaranya dari situs idstar\.co\.id/);
});

test("without rules or web checks, their lines are left out instead of claiming a clean result", () => {
  assert.deepEqual(buildChecks({ signals: null, links: null, search: null, domainAges: [] }), []);
  const [patterns] = buildChecks({ signals: [], links: null, search: null, domainAges: [] });
  assert.equal(patterns.status, "ok");
});
