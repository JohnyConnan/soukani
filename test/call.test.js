import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { build, buildFixture as fixture, editionVariant } from "./helpers.js";

const callSection = (html) => html.slice(html.indexOf('id="call"'), html.indexOf("</section>", html.indexOf('id="call"')));

test("AE3: without applyUrl the call section has no empty or # link and shows the opening text", async () => {
  const p = await fixture();
  for (const url of ["/prihlasky/", "/en/applications/"]) {
    const section = callSection(p.get(url));
    assert.ok(section.length > 100, "call section present");
    assert.doesNotMatch(section, /href=""|href="#"|href="null"|href="undefined"/);
    assert.doesNotMatch(section, /class="button"/);
  }
  assert.match(callSection(p.get("/prihlasky/")), /Přihlašovací formulář zveřejníme na tomto místě\./);
  assert.match(callSection(p.get("/en/applications/")), /The application form will be published here\./);
});

test("call open: the apply button links to the form in both languages", async () => {
  const p = await fixture("call-open");
  assert.match(callSection(p.get("/prihlasky/")), /<a class="button" href="https:\/\/forms\.example\.org\/soukani-2027" rel="noopener">Vyplnit přihlášku<\/a>/);
  assert.match(callSection(p.get("/en/applications/")), /href="https:\/\/forms\.example\.org\/soukani-2027" rel="noopener">Open the application form</);
});

test("call closed: no button, closed text", async () => {
  const p = await fixture("call-closed");
  const cs = callSection(p.get("/prihlasky/"));
  assert.doesNotMatch(cs, /class="button"/);
  assert.match(cs, /Příjem přihlášek byl uzavřen\. Všechny přihlášené soubory informujeme e-mailem\./);
  assert.match(callSection(p.get("/en/applications/")), /Applications are closed\. All applicants are notified by email\./);
});

test("conditions print the edition record's numbers and the deadline", async () => {
  const p = await fixture();
  const cs = callSection(p.get("/prihlasky/"));
  assert.match(cs, /Herci ve věku 14–18 let\./);
  assert.match(cs, /do 50 minut/);
  assert.match(cs, /nejvýše 10 herců a 2–3 dospělí/);
  assert.match(cs, /pro 13 osob \(10 herců a 3 dospělé\)/);
  assert.match(cs, /Uzávěrka přihlášek: 30\. 11\. 2026/);
  const en = callSection(p.get("/en/applications/"));
  assert.match(en, /Actors aged 14–18\./);
  assert.match(en, /up to 50 minutes/);
  assert.match(en, /Application deadline: 30 November 2026/);
  assert.match(en, /festivalsoukani@gmail\.com/);
});

test("the call intro says when the selection is published, one year before the edition", async () => {
  const p = await fixture();
  assert.match(callSection(p.get("/prihlasky/")), /videozáznamu inscenace\. Výběr zveřejníme koncem roku 2026\./);
  assert.match(callSection(p.get("/en/applications/")), /a video of the production\. The selection will be published at the end\s+of 2026\./);
});

test("changing maxMinutes on the record changes the conditions text", async () => {
  const dir = editionVariant((e) => (e.maxMinutes = 45));
  try {
    const p = await build({ PATH_PREFIX: undefined, CONTENT_DIR: dir });
    assert.match(callSection(p.get("/prihlasky/")), /do 45 minut/);
    assert.match(p.get("/"), /fact-value">45 minut</);
  } finally { rmSync(dir, { recursive: true }); }
});

test("applyOpensOn with call announced prints the formatted date per language", async () => {
  const dir = editionVariant((e) => (e.applyOpensOn = "2026-10-01"));
  try {
    const p = await build({ PATH_PREFIX: undefined, CONTENT_DIR: dir });
    assert.match(callSection(p.get("/prihlasky/")), /zveřejníme na tomto místě 1\. 10\. 2026\./);
    assert.match(callSection(p.get("/en/applications/")), /opens here on 1 October 2026\./);
  } finally { rmSync(dir, { recursive: true }); }
});

test("the #call anchor exists in both languages and the About page carries the brief's facts", async () => {
  const p = await fixture();
  assert.match(p.get("/prihlasky/"), /<section class="wrap section" id="call">/);
  assert.match(p.get("/en/applications/"), /<section class="wrap section" id="call">/);
  // About keeps the festival's story; only the call moved.
  assert.doesNotMatch(p.get("/o-festivalu/"), /id="call"/);
  assert.doesNotMatch(p.get("/en/about/"), /id="call"/);
  for (const needle of ["Brixen", "1995", "Kulturní a kreativní centrum Ostrov", "Základní umělecká škola Ostrov", "Než půjdeme do divadla"]) assert.match(p.get("/o-festivalu/"), new RegExp(needle));
  for (const needle of ["Brixen", "1995", "Kulturní a kreativní centrum Ostrov", "Základní umělecká škola Ostrov", "Before we go to the theatre"]) assert.match(p.get("/en/about/"), new RegExp(needle));
});

test("past edition: the call section is gone from Přihlášky and Soubory carries no empty sub-heading", async () => {
  const p = await fixture("past");
  assert.doesNotMatch(p.get("/prihlasky/"), /id="call"/);
  assert.doesNotMatch(p.get("/soubory/"), /id="call"/);
  assert.equal((p.get("/soubory/").match(/<h2>Soubory<\/h2>/g) || []).length, 0, "no empty sub-heading once the call is gone");
});
