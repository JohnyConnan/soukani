import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import YAML from "yaml";
import { build } from "./helpers.js";

const fixture = (name) => build({ PATH_PREFIX: undefined, CONTENT_DIR: name ? `test/fixtures/${name}` : undefined });
const callSection = (html) => html.slice(html.indexOf('id="call"'), html.indexOf("</section>", html.indexOf('id="call"')));

/** Writes a one-off fixture with the 2027 record changed. */
function editionVariant(mutate) {
  const dir = mkdtempSync(join(tmpdir(), "soukani-call-"));
  const editions = YAML.parse(readFileSync("content/editions.yaml", "utf8"));
  mutate(editions.find((e) => e.year === 2027));
  writeFileSync(join(dir, "editions.yaml"), YAML.stringify(editions));
  return dir;
}

test("AE3: without applyUrl the call section has no empty or # link and shows the opening text", async () => {
  const p = await fixture();
  for (const url of ["/o-festivalu/", "/en/about/"]) {
    const section = callSection(p.get(url));
    assert.ok(section.length > 100, "call section present");
    assert.doesNotMatch(section, /href=""|href="#"|href="null"|href="undefined"/);
    assert.doesNotMatch(section, /class="button"/);
  }
  assert.match(callSection(p.get("/o-festivalu/")), /Přihlašovací formulář zveřejníme na tomto místě\./);
  assert.match(callSection(p.get("/en/about/")), /The application form will be published here\./);
});

test("call open: the apply button links to the form in both languages", async () => {
  const p = await fixture("call-open");
  assert.match(callSection(p.get("/o-festivalu/")), /<a class="button" href="https:\/\/forms\.example\.org\/soukani-2027" rel="noopener">Vyplnit přihlášku<\/a>/);
  assert.match(callSection(p.get("/en/about/")), /href="https:\/\/forms\.example\.org\/soukani-2027" rel="noopener">Open the application form</);
});

test("call closed: no button, closed text", async () => {
  const p = await fixture("call-closed");
  const cs = callSection(p.get("/o-festivalu/"));
  assert.doesNotMatch(cs, /class="button"/);
  assert.match(cs, /Příjem přihlášek byl uzavřen\. Všechny přihlášené soubory informujeme e-mailem\./);
  assert.match(callSection(p.get("/en/about/")), /Applications are closed\. All applicants are notified by email\./);
});

test("conditions print the edition record's numbers and the deadline", async () => {
  const p = await fixture();
  const cs = callSection(p.get("/o-festivalu/"));
  assert.match(cs, /Herci ve věku 14–18 let\./);
  assert.match(cs, /do 50 minut/);
  assert.match(cs, /nejvýše 10 herců a 2–3 dospělí/);
  assert.match(cs, /pro 13 osob \(10 herců a 3 dospělé\)/);
  assert.match(cs, /Uzávěrka přihlášek: 31\. 12\. 2026/);
  const en = callSection(p.get("/en/about/"));
  assert.match(en, /Actors aged 14–18\./);
  assert.match(en, /up to 50 minutes/);
  assert.match(en, /Application deadline: 31 December 2026/);
  assert.match(en, /konyvka@zusostrov\.cz/);
});

test("changing maxMinutes on the record changes the conditions text", async () => {
  const dir = editionVariant((e) => (e.maxMinutes = 45));
  try {
    const p = await build({ PATH_PREFIX: undefined, CONTENT_DIR: dir });
    assert.match(callSection(p.get("/o-festivalu/")), /do 45 minut/);
    assert.match(p.get("/"), /fact-value">45 minut</);
  } finally { rmSync(dir, { recursive: true }); }
});

test("applyOpensOn with call announced prints the formatted date per language", async () => {
  const dir = editionVariant((e) => (e.applyOpensOn = "2026-10-01"));
  try {
    const p = await build({ PATH_PREFIX: undefined, CONTENT_DIR: dir });
    assert.match(callSection(p.get("/o-festivalu/")), /zveřejníme na tomto místě 1\. 10\. 2026\./);
    assert.match(callSection(p.get("/en/about/")), /opens here on 1 October 2026\./);
  } finally { rmSync(dir, { recursive: true }); }
});

test("the #call anchor exists in both languages and the About page carries the brief's facts", async () => {
  const p = await fixture();
  assert.match(p.get("/o-festivalu/"), /<section class="wrap section" id="call">/);
  assert.match(p.get("/en/about/"), /<section class="wrap section" id="call">/);
  for (const needle of ["Brixen", "1995", "Kulturní a kreativní centrum Ostrov", "Základní umělecká škola Ostrov", "Než půjdeme do divadla"]) assert.match(p.get("/o-festivalu/"), new RegExp(needle));
  for (const needle of ["Brixen", "1995", "Kulturní a kreativní centrum Ostrov", "Základní umělecká škola Ostrov", "Before we go to the theatre"]) assert.match(p.get("/en/about/"), new RegExp(needle));
});

test("past edition: the call section is hidden", async () => {
  const p = await fixture("past");
  assert.doesNotMatch(p.get("/o-festivalu/"), /id="call"/);
});
