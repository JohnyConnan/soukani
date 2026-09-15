# Soukání Ostrov – festival website

Static website of **Soukání Ostrov**, the international theatre festival of children and youth organized by Základní umělecká škola Ostrov. Built with [Eleventy 3](https://www.11ty.dev/), published by GitHub Actions to GitHub Pages.

- Live (team review): https://johnyconnan.github.io/soukani/
- Target domain: https://soukani.cz (see [Connect the domain](#connect-the-domain))
- Content lives in `content/*.yaml`. Layouts carry no festival text. Every visitor-facing text is a `{ cs, en }` pair.

The rest of this file is the editor's guide. You never need to touch `src/` for content work.

---

## First-time setup

1. Install Node 22 (`nvm use` reads `.nvmrc`), then `npm ci`.
2. The repository has two **repository variables** (Settings → Secrets and variables → Actions → Variables):
   - `PATH_PREFIX` – `/soukani/` while the site is served from github.io, `/` on the custom domain.
   - `SITE_URL` – `https://johnyconnan.github.io` now, `https://soukani.cz` later.
   These are the only two values that change when the domain arrives.
3. Pages source is *GitHub Actions* (Settings → Pages). Every push to `main` builds and deploys; **Actions → Build and deploy → Run workflow** rebuilds by hand.

## Local preview

```bash
npm start
```

Opens http://localhost:8080/. Editing anything under `content/` rebuilds the page. `npm run build` writes the site to `_site/`, `npm test` runs the test suite (the deploy runs it too).

## How the content is organized

| File | Holds |
|---|---|
| `content/site.yaml` | `currentEdition`, organizer, venue, Facebook, old-site link |
| `content/editions.yaml` | one record per edition: dates, flags, conditions, accent colour, logo, poster, PDF, tickets, film, announcement months, old-site links |
| `content/pages.yaml` | the page registry: menu order, Czech and English slugs, titles and descriptions |
| `content/copy.yaml` | every UI string and page paragraph as `cs`/`en` pairs |
| `content/news.yaml`, `groups.yaml`, `workshops.yaml`, `programme.yaml`, `photos.yaml`, `coverage.yaml` | records, each tagged with `edition: <year>` |
| `content/contacts.yaml`, `partners.yaml`, `countries.yaml` | the four contact roles, footer partners, country names |

The edition record also carries `highlight: { cs, en }` (the "what is new this year" paragraph shown under *Other news* on the Press page and later on the archive page) — set it to `null` when there is nothing to say.

Two of its fields point at the old HOP-HOP site: `externalArchiveUrl` is the edition's page there, listed in the archive; `externalPhotosUrl` is the page there that actually **shows photos** of that edition, listed on the Photos page. Set `externalPhotosUrl: null` when that edition has no photos online — the edition then simply does not appear in the gallery list (2011, 2009 and 2007 are in that state).

Images and files live under `src/assets/…` and are referenced from the YAML by their path relative to `src/` (for example `assets/photos/2027/opening.jpg`).

**The build validates everything.** A missing English text, a wrong edition year, a mistyped country code, a photo that is too large or a group id that does not exist stops the build with a message naming the file, the record and the field:

```
Content validation failed (1 problem):
  • groups.yaml › it-brixen › text.en: missing value
```

Fix the file, push again.

## Add a news item

Append to `content/news.yaml`:

```yaml
- id: 2027-01-groups-announced        # unique, letters/digits/hyphens
  edition: 2027
  date: 2027-02-10                     # YYYY-MM-DD; the list sorts newest first
  published: true
  title: { cs: Vybrané soubory jsou známy, en: The selected groups are known }
  text:
    cs: Umělecká komise vybrala osm souborů z šesti zemí.
    en: The artistic committee selected eight groups from six countries.
  link: { page: groups }               # a key from pages.yaml, optionally with anchor: call
  # or an external address: link: { url: https://... }
```

Only items of the current edition show on the home page. Set `published: false` to hide an item without deleting it.

## Add a group

Append to `content/groups.yaml` (the file has a commented example):

```yaml
- id: it-brixen                        # used by programme slots
  edition: 2027
  published: true
  country: IT                          # two-letter code from countries.yaml (add it there first if missing)
  town: { cs: Brixen, en: Bressanone }
  ensemble: Teatro Giovani
  director: Anna Rossi
  titleOriginal: Il filo               # or null
  title: { cs: Nit, en: The Thread }
  text: { cs: Krátký text o souboru., en: A short text about the group. }
  photo: assets/photos/2027/it-brixen.jpg   # or null (photo rules below)
  host: false                          # true only for HOP-HOP
```

While `groupsComplete: false` on the edition record, the Groups page adds "more groups to be announced". Flip it to `true` when the list is final.

### The Groups page while the call runs

The call for applications lives on this page, above the groups, and the page is therefore labelled **Přihlášky / Applications** in `content/pages.yaml`. When the call closes, change that page's `label`, `title` and `description` back to *Soubory / Groups*; the slugs (`soubory`, `groups`) never change, so no link or bookmark breaks. The "Soubory" sub-heading above the list appears only while the call section is there.

## Add press coverage

Append to `content/coverage.yaml`: `id`, `edition`, `date` (YYYY-MM-DD), `outlet`, `title: { cs, en }` and the `url`. Items of the current edition list first on the Press page; older ones under "Earlier editions". Links only, never quotes.

## Change a contact

`content/contacts.yaml` holds the four roles (`id`, `name`, `role: { cs, en }`, `email`, `phone` or `null`). Exactly one contact carries `media: true` (the Press page contact) and exactly one `applications: true` (named in the call for applications); the build refuses zero or two.

## Add a workshop

Append to `content/workshops.yaml`. `kind` is `directors` (the analysis seminar) or `actors`. `lecturer` and `bio` may stay `null` until confirmed; the page then prints "lecturer TBA".

## Add programme slots

Append to `content/programme.yaml`. A `performance` slot needs `groupId` matching a published group of the same edition; a `side` slot (opening, parade, party) carries its own `title`. `time` must be quoted (`"17:00"`), `day` is `YYYY-MM-DD`. Slots sort by day and time automatically. Set `programmePdf`, `tickets` and `ticketsUrl` on the edition record when they exist.

## Add photos

1. Export as **JPEG** (HEIC is rejected by the build).
2. Resize so the long edge is **at most 1600 px** and the file **under 400 KB**.
   - Mac: open in Preview → Tools → Adjust Size (1600 px, keep proportions) → File → Export, JPEG, quality around 70 %.
   - iPhone: Photos → share sheet → *Options* → Image Size *Large*, or use the Shortcuts "Resize" action.
3. Save to `src/assets/photos/<year>/` with names that sort in the order you want (`01-opening.jpg`, `02-brixen.jpg`…).
4. Append to `content/photos.yaml`:

```yaml
- { id: 2027-01, edition: 2027, file: assets/photos/2027/01-opening.jpg, width: 1600, height: 1067, caption: { cs: Zahájení festivalu, en: Opening ceremony } }
```

`caption` may be `null`; `width`/`height` are optional but avoid layout jumps. The gallery shows current-edition photos as they arrive and keeps the previous edition as a teaser.

## Swap the identity (new logo and colour)

1. Put the three PNG variants into `src/assets/identity/2027/` (colour, white, negative).
2. On the 2027 record in `content/editions.yaml` set `accent: "#RRGGBB"`, the three `logo` paths and `logoYear: 2027`.

**Ask the designer for square PNGs, transparent background, cropped tight to the artwork — no empty
margin around the badge — at 1200 × 1200 px or larger.** Every place the logo appears (the hero, the
header and footer badges, the favicon, the Press downloads) fills its circle with the file as given,
so a file with a transparent margin baked in simply renders smaller everywhere. The 2025 files in the
repo were cropped from 1031 px to 809 px for exactly this reason.

Every page, the favicon, the theme colour, the hero and the Press downloads follow. Add `poster: assets/posters/poster-2027.jpg` when the poster exists; the Programme and Press pages pick it up.

## Flip states

All page states are flags on the edition record; nothing changes by itself with the calendar.

| Field | Values | Effect |
|---|---|---|
| `call` | `announced` → `open` → `closed` | opening text → apply button (needs `applyUrl`) → "applications closed" |
| `applyUrl`, `applyOpensOn`, `applyDeadline` | URL / dates or null | button target, "form opens on", deadline line |
| `status` | `upcoming` → `running` → `past` → `archived` | hides the call while running, retrospective hero and Photos CTA when past |
| `groupsComplete` | true/false | hides "more groups to be announced" |
| `announceGroups`, `announceProgramme`, `announceWorkshops` | `YYYY-MM` or null | the month named on empty pages; with `null` the page promises the selection at the end of the year before the festival and the programme at the start of the festival year |

Groups, programme and workshops pages switch from "coming soon" to lists as soon as the first record exists. While `call: open` the home page button always leads to the form, even after groups or a poster appear.

When the festival starts (`status: running`) the call section disappears from the Groups page, so set `published: false` on the "call for applications" news item at the same time — its `#call` link would otherwise point at nothing.

## Archive an edition (2029 rollover)

1. In `content/editions.yaml` set the 2027 record to `status: archived`, `call: closed`, `groupsComplete: true`.
2. Add a 2029 record (copy the 2027 one; number 17, new dates or `null`, `call: announced`, empty `poster`/`applyUrl`, its own `accent`).
3. In `content/site.yaml` set `currentEdition: 2029`.

The home page and menu pages now show 2029; `/archiv/2027/` and `/en/archive/2027/` render everything tagged 2027 (news, groups, programme, workshops, photos) in the 2027 colour, and appear in the sitemap. Editions with `externalArchiveUrl` link to the old site instead. The build refuses `currentEdition` pointing at an archived edition.

## Read a failed Actions run

Actions → the red run → *build* → expand *Run npm test* or *Build site*. Validation messages start with `Content validation failed` and list file › record › field. Test failures name the test and the expected text. Push a fix; the run repeats.

## Connect the domain

When the IT admin has the DNS records ready at Forpsi:

1. **Repository variables:** set `SITE_URL=https://soukani.cz` and `PATH_PREFIX=/`.
2. **Pages settings:** Settings → Pages → Custom domain → `soukani.cz` → Save; wait for the DNS check, then tick *Enforce HTTPS*. (A `CNAME` file in the repo is ignored under Actions publishing; the setting lives here.)
3. **Rebuild:** Actions → Build and deploy → Run workflow.
4. **DNS records for the admin**
   - Apex `soukani.cz`: four `A` records → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; four `AAAA` records → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
   - `www.soukani.cz` (optional): `CNAME` → `johnyconnan.github.io`.
   - Current values are always listed at https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
5. **Go-live check:** open https://soukani.cz, view the page source and confirm `<meta name="robots" content="noindex">` is **gone** (it is derived from `SITE_URL`; if it is still there the variable did not take). Then submit `https://soukani.cz/sitemap.xml` in Google Search Console. `robots.txt` and `llms.txt` only take effect at the domain root, so they become live with this step.

The domain must be live before the poster goes to print and before the AITA/IATA listing is submitted.

## Partner logos

The footer shows logos in two groups. Each record in `content/partners.yaml` carries a `tier`:
`funding` puts it under **Finančně podpořili** (Město Ostrov, Karlovarský kraj), `partner` under **Partneři**
(KKC Ostrov, Městský dům dětí a mládeže Ostrov). A missing or mistyped tier stops the build.
ZUŠ Ostrov has no logo here — it is the organizer, named in the first footer column.

`src/assets/partners/` holds the best public versions of those logos, downloaded from the partners' own
websites. Replace them with official files when the partners supply them. The Karlovarský kraj mark is
bound by the [region's graphic manual](https://www.kr-karlovarsky.cz/system/files/2024-08/Graficky_manual_KK_2021_0.pdf):
colour version on a light background (the footer puts every logo on a white chip), never recoloured or
distorted, and no smaller than 27 × 11.5 mm — hence the 48 px logo height in `components.css`. Add a partner
only when confirmed for the edition.

## Development notes

- `npm test` builds the site programmatically against a **frozen copy of the launch content** in `test/fixtures/seed/` plus one fixture per lifecycle scenario (each fixture overrides only the files it changes and falls back to the seed; `CONTENT_DIR` points at it). Live `content/` is only checked for generic invariants (valid data, no broken links or leftovers), so editing content never breaks the deploy. Fixtures may carry their own `assets/` for files that should not ship (see `test/fixtures/programme-out/`).
- `eleventy.config.js` and `src/_data/build.js` read `PATH_PREFIX` and `SITE_URL` inside their functions so tests can vary them.
- No image pipeline, no native dependencies: photos are committed pre-sized; the validator guards size and format.
- No cookies, trackers or third-party requests. Fonts (Geist, OFL) are self-hosted under `src/assets/fonts/`.
