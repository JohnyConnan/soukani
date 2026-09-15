---
title: "Handover: Soukání Ostrov 2027 website – launch build"
date: 2026-09-15
plan: docs/plans/2026-09-15-001-feat-soukani-2027-website-plan.md
origin: docs/brainstorms/2026-09-14-soukani-2027-website-requirements.md
---

# Handover – launch build (2026-09-15)

## Where things stand

- **Repo:** https://github.com/JohnyConnan/soukani (public, `main` deploys via GitHub Actions to GitHub Pages).
- **Live (team review):** https://johnyconnan.github.io/soukani/ – Czech at the root, English under `/en/`. Carries `<meta name="robots" content="noindex">` until `SITE_URL` points at `soukani.cz`.
- **Plan status:** all ten implementation units U1–U10 shipped (14 commits). A Tier 2 code review (six reviewer personas, run id `20260915-095351-ad7eaff0`) found 5 P1 and 16 P2/P3 findings; all applied in commit `342e1bc`. Nothing actionable is open.
- **Tests:** `npm test` → 110 passing. The deploy workflow runs them before building.
- **Repository variables (already set):** `PATH_PREFIX=/soukani/`, `SITE_URL=https://johnyconnan.github.io`.

## How the project is organised (short)

| Path | Purpose |
|---|---|
| `content/*.yaml` | all editor-facing content; every text is a `{ cs, en }` pair; records carry `edition: <year>` |
| `lib/validate.js` | build-time validation; error messages name file › record › field |
| `lib/db.js` | builds the `db` object (state derivation, `forEdition`, `archivePages`, `pageUrl`) |
| `lib/dates.js`, `lib/urls.js` | date formatting per language; prefix/site-URL helpers |
| `src/_data/db.js`, `src/_data/build.js` | Eleventy global data: validated content, build variables |
| `src/_includes/` | base layout, header/footer/meta/jsonld, edition-parameterised partials |
| `src/pages/*.njk` | one template per page, paginated over `cs`/`en`; slugs from `content/pages.yaml` |
| `src/archive/edition.njk` | `/archiv/<year>/` pages for archived editions without an external URL |
| `test/` | Node test runner; `test/fixtures/seed/` is a **frozen copy of the launch content**; other fixtures override single files and fall back to the seed |
| `README.md` | the editor guide (add news/group/workshop/slots/photos, swap identity, flip states, archive, connect domain) |

Key rule learned in review: **tests never read live `content/` except `test/live-content.test.js`**, which checks invariants only. Editing content therefore cannot break the deploy. When launch content is changed deliberately and tests should follow, copy the file into `test/fixtures/seed/`.

## Decisions taken during the build (not in the plan)

- Fixture overlay: a fixture directory holds only the files it changes; missing files come from `test/fixtures/seed/`. Fixtures may carry their own `assets/` (see `test/fixtures/programme-out/`), never shipped.
- `db.state()`: an open call (`call: open`) always wins the hero CTA, even after a poster or groups exist.
- Archived-edition news items do not resolve page-key links (they would point at the new edition's pages); they render as plain headings.
- Czech month names in "coming soon" texts use the locative ("v únoru 2027") via the `monthIn` filter.
- `site.yaml` stores `postalCode`, `town`, `countryCode` separately so JSON-LD and llms.txt derive the address once.
- The Claude Design draft could not be fetched (permission classifier blocked the Chrome route); the hero follows the plan's description (rings, orbiting dots, one spider on a thread, logo centred), CSS-only, reduced-motion aware.

## Content assumptions to confirm with Jonáš

All live in `content/` and are one-line edits:

1. **IČO** `49753606` (public registry). The brief prints `497536306`, which looks like a stray digit.
2. **Minidiv, spolek** (IČO 26595176) shown as co-organizer in the footer – `site.coOrganizer`, set to `null` to drop.
3. **Announcement months** seeded: groups `2027-02`, workshops `2027-03`, programme `2027-04` (`editions.yaml`, 2027 record).
4. **Call state:** `call: announced`, `applyUrl: null`, `applyDeadline: 2026-12-31`, `applyOpensOn: null`. Set the form URL and `call: open` when the form exists.
5. **Contacts:** Jonáš's email assumed `konyvka@zusostrov.cz`; only Irena's phone is public (others `null`).
6. **School programme** copy names no contact person (Irena vs Daniela open).
7. **Partner logos** are public-site downloads (`src/assets/partners/`); replace with official files when available.
8. **Edition history wording**: "16th edition" and "since 1995" are used; the numbering start year is an open question from the origin doc.

## Open items / next steps

- Jonáš reviews both languages on the live URL and confirms the assumptions above.
- When DNS is ready: README › *Connect the domain* (set `SITE_URL=https://soukani.cz`, `PATH_PREFIX=/`, add the domain in Pages settings, rebuild, run the go-live check for the missing `noindex`, submit the sitemap).
- Residual risks noted by the review (not fixed, low impact): two `upcoming` editions at once pass validation; groups published while the call is still `announced` is not cross-checked; `eventStatus` stays `EventScheduled` for past editions; a copy string containing `</script>` would break the JSON-LD block.
- Deferred by the plan: group detail pages, withdrawn-group status, image pipeline/thumbnails, fingerprinted assets, scheduled rebuilds, PR preview builds.

## Useful commands

```bash
npm start          # local preview at http://localhost:8080/ (content/ edits rebuild)
npm test           # 110 tests, ~10 s
npm run build      # writes _site/
gh run list -R JohnyConnan/soukani --limit 3   # deploy history
```

Review artifacts (machine-local, temporary): `/tmp/compound-engineering/ce-code-review/20260915-095351-ad7eaff0/`.
