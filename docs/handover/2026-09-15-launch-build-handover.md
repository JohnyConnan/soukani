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
- **Plan status:** all ten implementation units U1–U10 shipped (16 commits). A Tier 2 code review (six reviewer personas, run id `20260915-095351-ad7eaff0`) found 5 P1 and 16 P2/P3 findings; all applied in commit `342e1bc`. Nothing actionable is open.
- **Tests:** `npm test` → 115 passing. The deploy workflow runs them before building.
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
- The Claude Design draft **was** fetched on 2026-09-15 (see *Reading the design draft* below) and its visual language now drives the site: dark sticky header with pill navigation, the accent hero band with off-canvas circles, the rings-and-spider composition (four rings, two orbits carrying dots and a third carrying the spider), the dark facts band, circular date stamps on news and schedule days, and the dark footer. Photographs stay rounded rectangles rather than the draft's circles so production shots are not cropped away. The draft's seven colours are still reduced to cream, ink and one accent, and every string comes from `content/`.
- A closed `<details>` hides its content in current browsers, so the desktop menu needed `::details-content` plus a small script fallback that sets `open` above 900 px. Before this the desktop navigation rendered invisible.

## The hero composition

Revisited on 2026-09-15 after the launch build (commits `ba08518` onwards), so the notes above about
the first design pass are superseded on these two points:

- **Logo size.** The identity PNGs were exported with a 10.8 % transparent margin (809 px of artwork
  inside a 1031 px canvas), so every circle that shows the logo rendered it about a fifth smaller
  than its box. The three 2025 files are now cropped to the artwork, and the hero composition was
  grown with it (`.rings` cap 33.5 → 38 rem, hero grid `1.1fr/1fr` → `1fr/1.15fr`): the badge reads
  373 px on desktop and 201 px on a phone, up from 259 and 158. **New identity files must be square,
  transparent and cropped tight to the badge** — the README's *Swap the identity* section says so,
  and a file with margin baked in will silently shrink everywhere again.
- **The spider.** It has its own orbit (`.orbit.os`) whose radius is the custom property
  `--spider-ring`. A ~20-line script in `base.njk` cycles it through the three inner ring insets
  (6.15 %, 11.75 %, 17 %) every `DWELL` = 9 s, and a hover or tap on the spider jumps it early. The
  CSS transition on `inset` is what you see as the jump; the spider's hit area is padded to ~48 px
  by `.spider::after`, `.rings` is `pointer-events: none` so nothing else in the hero loses a click,
  and reduced motion freezes the spin, the jump and the pointer handling alike. Tests assert that
  every inset the script cycles through is a ring the CSS actually draws, so the two lists cannot
  drift apart.

**Assets are not fingerprinted** (deferred by the plan), and GitHub Pages serves CSS with
`cache-control: max-age=600`. A returning visitor can therefore hold an old stylesheet against new
HTML for up to ten minutes after a deploy. With the pre-`ba08518` CSS that shows up as a spider
frozen in the top-left of the composition while the rings still turn, because `.orbit.os` gets no
`inset` and collapses to 0 × 0. It clears itself within ten minutes, or immediately with a hard
reload (⌘⇧R). Fingerprinting the assets would remove the window for good.

## Reading the design draft

`/design-login` cannot run in a non-interactive session, so the `claude_design` MCP refuses with "DesignSync needs design-system authorization". Two ways in:

1. Run `/design-login` once in an interactive `claude` terminal on this machine; later sessions reuse that authorization and `DesignSync` works directly.
2. Without it: open the project URL in the signed-in Chrome and POST from page context to `https://claude.ai/design/anthropic.omelette.api.v1alpha.OmeletteService/ListFiles` and `/GetFile` with `{projectId, path}` and the header `Connect-Protocol-Version: 1`. `GetFile` returns base64; decode in the page and read it back as text.

Project `fd0065fe-199f-4bd0-bc0e-d2690c6b206d`, file `Soukani Ostrov 27.dc.html`.

## Editorial revision (2026-09-15, after the launch build)

Ten changes requested by Jonáš once the launch build was live. All ten shipped; `npm test` → 115 passing.

- **The call for applications moved from About to the Groups page**, which is now labelled *Přihlášky /
  Applications* (the direct equivalent; "Call for applications" in the title would have repeated the
  section heading right below it, and is long in the menu bar). The slugs stay `soubory` / `groups`, so the hero CTA, the news item's `#call`
  link and every bookmark keep working; when the call closes, only `label`, `title` and `description`
  of that record in `pages.yaml` go back to *Soubory / Groups*.
- **The "Co chystáme na rok 2027" highlight left the home page** for a new *Další aktuality / Other news*
  section on the Press page (`press.otherNewsHeading` in `copy.yaml`). It is still the edition record's
  `highlight` field, so an edition without one renders no section.
- **The news bubbles lost their "Více" line** — the headline is the link. `news.more` and `.news-more`
  are gone with it.
- **The announcement news item is dated 2026-06-25**; the call item keeps 2026-09-15 and still sorts first.
- **Applications e-mail** for the call and the footer: `festivalsoukani@gmail.com` (was
  `konyvka@zusostrov.cz`). This settles assumption 5 below for Jonáš's address.
- **`applyDeadline` is 2026-11-30** (was 2026-12-31). The call news item's text was changed to match —
  it promised "do konce prosince 2026" and would otherwise have contradicted the deadline line.
- **The announce months are `null` for 2027** and the no-month copy now carries the promise instead:
  groups "Výběr zveřejníme koncem roku {yearBefore}", programme and workshops "…startem roku {year}".
  `{yearBefore}` is `edition.year - 1`, passed by `groups-list.njk`: the groups are selected after the
  deadline, which falls in the year *before* the festival, so 2027 prints "koncem roku 2026" and the
  sentence stays right for every later edition. Setting an `announce*` month again switches that page
  back to "v únoru 2027" wording; the `call-open` fixture covers that path.
- **The footer lost the logo**, so *Pořadatel*, *Kontakty* and *Partneři* now start on the same line;
  the type dropped to `--step--2`, the spacing tightened and partner logos to 44 px. Desktop footer
  height 316 px.
- **`externalPhotosUrl`** is a new edition field: the old-site page that actually shows photos of that
  edition, used by the *Fotogalerie starších ročníků* list. `externalArchiveUrl` keeps its old job on
  the archive page. Checked page by page against hophop.zusostrov.cz: 2025 and 2023 use the gallery
  pages Jonáš named (2023's is spelled `fotogralerie`), 2017 and 2015 their galleries, 2021 and 2019
  their *soubory* pages (production photos; those editions have no gallery), 2013 its edition page
  (poster and programme scans), 2005/2003/2001 their edition pages (8–11 photos each). **2011, 2009 and
  2007 carry `null`** — their gallery pages on the old site are empty and 2007's external link
  (soukani.wz.cz) is a dead domain — so they are listed in the archive but not in the gallery list.

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
