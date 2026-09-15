import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatRange, formatMonth, formatMonthIn, ordinal, isValidIsoDate, isValidIsoMonth } from "../lib/dates.js";

test("same-month range", () => {
  assert.equal(formatRange("2027-05-05", "2027-05-09", "cs"), "5.–9. 5. 2027");
  assert.equal(formatRange("2027-05-05", "2027-05-09", "en"), "5–9 May 2027");
});

test("cross-month range", () => {
  assert.equal(formatRange("2025-04-30", "2025-05-03", "cs"), "30. 4.–3. 5. 2025");
  assert.equal(formatRange("2025-04-30", "2025-05-03", "en"), "30 April–3 May 2025");
});

test("single date and Date objects from YAML", () => {
  assert.equal(formatDate("2026-12-31", "cs"), "31. 12. 2026");
  assert.equal(formatDate("2026-12-31", "en"), "31 December 2026");
  assert.equal(formatDate(new Date("2026-12-31"), "cs"), "31. 12. 2026");
  assert.equal(formatRange("2027-05-05", "2027-05-05", "en"), "5 May 2027");
});

test("months and ordinals", () => {
  assert.equal(formatMonth("2027-02", "cs"), "únor 2027");
  assert.equal(formatMonth("2027-02", "en"), "February 2027");
  assert.equal(formatMonthIn("2027-02", "cs"), "únoru 2027");
  assert.equal(ordinal(16, "cs"), "16.");
  assert.equal(ordinal(16, "en"), "16th");
  assert.equal(ordinal(21, "en"), "21st");
  assert.equal(ordinal(12, "en"), "12th");
});

test("validation of ISO values", () => {
  assert.equal(isValidIsoDate("2027-05-05"), true);
  assert.equal(isValidIsoDate("5.5.2027"), false);
  assert.equal(isValidIsoDate("2027-02-30"), false);
  assert.equal(isValidIsoDate(new Date("2027-05-05")), true);
  assert.equal(isValidIsoMonth("2027-02"), true);
  assert.equal(isValidIsoMonth("February 2027"), false);
  assert.equal(isValidIsoMonth("2027-13"), false);
});
