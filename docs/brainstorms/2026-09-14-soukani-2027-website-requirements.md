---
date: 2026-09-14
topic: soukani-2027-website
---

# Soukání Ostrov 2027 website

## Summary

A static, bilingual (CZ/EN) website for the 16th Soukání Ostrov festival, hosted on GitHub Pages under a domain the school admin provides. Seven pages plus a news section on the landing page, branded on cream, ink and one provisional edition colour, with the rings-and-spider hero from the Claude Design draft. It launches in autumn 2026 as an announcement and call for applications and is structured so the 2027 content becomes the site's own first archive in 2029.

---

## Problem Frame

The festival has never had a real website. Each edition lived as a cluster of pages inside the HOP-HOP ensemble site (hophop.zusostrov.cz), built in a 2008-era CMS: an AITA-style info page in English, groups, poster, programme, seminars, photos, film. Foreign groups, AITA/IATA and partners land on an ensemble homepage, not a festival one, and nothing there works on a phone.

A Claude Design draft exists (project `Soukani Ostrov 27`). Its structure and hero animation are right, but it was made without festival context: wrong dates, wrong organizer, invented history, lecturers, groups, statistics and press quotes, and a palette of seven colours that is louder than the organizers want.

---

## Key Decisions

- **One edition colour, provisional orange.** The site uses cream, ink and a single accent. Each edition already has its own colour in the logo (2021 green, 2025 magenta–violet), so the accent is the 2027 colour. Until the 2027 logo exists the accent is a warm orange close to the design's `#FF6B2C` and the 2025 logo sits in the hero. Both swap in one place when the identity lands.
- **Design structure kept, design content discarded.** Menu, page order, hero animation, news-as-dated-items and the dark footer come from the design. Every sentence, number, name and date comes from the 2027 project brief and the 2025 archive instead.
- **Launch as announcement and call for applications.** In autumn 2026 the groups, programme and workshops are unknown. The site tells the world the festival exists, when and where, and how to apply. Pages without content yet stay in the menu and say what will be published and roughly when, so the navigation never changes.
- **Past editions link to the old site.** The 2001–2025 archive stays on hophop.zusostrov.cz. The new site links to it and hosts only a small 2025 teaser in the gallery. No migration.
- **Root URLs, content stored per edition.** Visitors see `/program/`, not `/2027/program/`. Internally groups, programme, workshops, news and photos belong to an edition, so in 2029 the 2027 set becomes an archive page and the accent colour changes with the edition.
- **Only one editor, working in the repo.** Jonáš updates content by editing files and pushing. Content lives in simple data files (one entry per news item, group, workshop, programme slot) separate from layout, and every text has a CZ and an EN field. No CMS.
- **Facts over flourish.** Where the design showed statistics that cannot be true yet (8 countries, 20 productions), the site shows what is known: dates, 16th edition, biennial since ~1995, ages 14–18, max 50 minutes.

---

## Actors

- A1. **Foreign theatre group** — finds the festival via AITA/IATA or Facebook, reads English, needs conditions and how to apply, later needs programme and practical info.
- A2. **Local audience and Ostrov schools** — read Czech, need dates, programme, tickets, and the "Než půjdeme do divadla" school offer.
- A3. **Partners, funders and press** — need a credible festival face, logos, poster, a media contact and the organizer's identity (ZUŠ Ostrov).
- A4. **Editor (Jonáš)** — adds news, fills groups/programme/workshops as they become known, swaps logo and colour, adds photos during the festival.

---

## Requirements

**Identity and visual design**

- R1. The palette is cream background, ink text and one edition accent; no per-page hero colours.
- R2. The accent and the logo are defined once so the 2027 identity replaces the provisional orange and the 2025 logo in a single change.
- R3. The landing hero keeps the animated concentric rings with orbiting dots and one small spider from the design, with the festival logo in the centre.
- R4. Typography, circles and pill buttons follow the design's tone; Geist or a similar free font is acceptable, but the site must not depend on any paid asset.
- R5. The site is responsive and readable on phones without horizontal scrolling.

**Structure and navigation**

- R6. Menu in this order: Úvod, O festivalu, Soubory, Program, Dílny, Fotogalerie, Pro média, plus a language switch. EN labels: Home, About, Groups, Programme, Workshops, Photos, Press.
- R7. Every page exists in Czech and English; the language switch keeps the visitor on the same page.
- R8. The footer on every page holds the organizer (ZUŠ Ostrov, Masarykova 717, 363 01 Ostrov, IČO), the four contact roles, the Facebook link, a link to the old-site archive, and the partner logos.
- R9. Partners appear only in the footer, never in the news section.

**Landing page**

- R10. Hero states the festival name, "16. mezinárodní divadelní festival dětí a mládeže", 5.–9. 5. 2027, Ostrov, and a call-to-action to the application call (later to the programme).
- R11. A facts strip replaces the design's statistics: dates, 16th edition, biennial since ~1995, actors 14–18, productions up to 50 min. Age range is edition-specific and must be easy to change.
- R12. "Aktuality / News" lists dated items, newest first, each with a title, short text and a link into the site or outside. At launch it holds the call for applications and the festival announcement.
- R13. The landing page carries a short paragraph on the 2027 highlight: the South Korean professional company and the joint HOP-HOP production bridging Asian and European theatre.

**O festivalu / About**

- R14. Describes the festival as in the 2027 brief: international, biennial, organized by ZUŠ Ostrov, selection by an artistic committee from applications and videos, seminars for directors and young actors, discussion after every show, side programme (trip around Karlovarsko, parade, country stands, Soubor baví soubor, regional food tasting), involvement of Ostrov schools including "Než půjdeme do divadla".
- R15. Tells the origin of the name: the play about the little spider who "soukal" his friends to himself with threads, performed at the informal first meeting with the Italian group from Brixen around 1995, and lists countries that have taken part.
- R16. Names the venues: Kulturní a kreativní centrum Ostrov (Dům kultury) for performances, ZUŠ Ostrov for seminars, the town for the side programme.
- R17. Contains no invented milestones, quotes or lecturer affiliations; history states only what the sources support.

**Call for applications**

- R18. A section (on About, linked from the hero and news) gives the conditions from the brief and the 2025 info page: groups aged 14–18, production up to 50 minutes, max 10 actors plus 2–3 accompanying adults (plus driver), organizer covers board and lodging for 10 + 3 for the festival days, arrival one day early possible for flights, deadline end of December 2026, application via an online form plus a video of the production.
- R19. The form link is a single placeholder value until Jonáš supplies it; the page must not show a broken or empty link.

**Soubory / Groups**

- R20. Before groups are known, the page states that the artistic committee announces the selection after the deadline and names the expected month.
- R21. Each group entry holds country, town, ensemble name, director, production title, short CZ and EN text, and an optional photo, matching the fields used in the 2025 archive.

**Program / Programme**

- R22. The page shows the poster of the current edition beside the schedule; until the 2027 poster exists it shows a clearly labelled placeholder, not the 2025 poster presented as current.
- R23. The schedule is grouped by day with time, venue, ensemble, country, title and a one-line annotation; entries are bilingual inline as in 2025.
- R24. A link to a downloadable programme PDF and the ticket information appear once they exist; before that the page says when the programme will be published.

**Dílny / Workshops**

- R25. Lists the seminars: the directors' analysis seminar and the actor seminars (seven planned for 2027), each with title, lecturer, lecturer bio and description in both languages, following the 2025 seminar page.
- R26. Before lecturers are confirmed the page explains the seminar format (mornings, for participants) and when the list will be published.

**Fotogalerie / Photos**

- R27. At launch the page shows a handful of 2025 photos, a link to the 2025 festival film on YouTube, and a link to the old-site galleries per year, with a note that 2027 photos arrive during the festival.
- R28. Photos are stored per edition so 2027 photos can be added during the festival without touching the 2025 teaser.

**Pro média / Press**

- R29. Offers downloads: festival logo in all available variants (colour, white, negative), the current poster, and the programme PDF when ready.
- R30. Names one media contact (Irena Konývková, director) with a school email and phone.
- R31. Lists real coverage as links (Český rozhlas, Karlovarský deník, AITA/IATA listing, amaterskedivadlo.cz); no quotes that were not published.

**Contacts**

- R32. Four roles are published: Irena Konývková (director), Ondřej Šulc (technical coordinator), Jonáš Konývka (applications, arrivals and departures), Daniela Šulc Králová (workshops), each with a zusostrov.cz email and phone.

**Content lifecycle and operations**

- R33. All visitor-facing text exists as CZ and EN pairs in data files; layout files contain no festival-specific copy.
- R34. News, groups, workshops, programme slots and photos are records tagged with an edition, so an edition can be archived as a whole.
- R35. The site builds and deploys automatically on push to the default branch of the GitHub repository.
- R36. The site is ready to receive a custom domain: it works both at the github.io URL and at the final domain, and the repo documents the CNAME and DNS records the admin needs.
- R37. No cookies, trackers or third-party analytics; external embeds (YouTube, Facebook) load only via plain links or click-to-load.

**Partner logos**

- R38. The footer shows logos of ZUŠ Ostrov, Město Ostrov and Kulturní a kreativní centrum Ostrov, sourced from their public websites as the best available versions, to be replaced by official files later. Other 2025 partners are not shown until confirmed for 2027.

---

## Acceptance Examples

- AE1. **Covers R7.** Given a visitor is on the Czech Dílny page, when they click EN, then they land on the English Workshops page, not the English homepage.
- AE2. **Covers R20, R24, R26.** Given no 2027 groups exist, when a visitor opens Soubory, then the page is in the menu and shows a short explanation with the expected publication month, and no empty grid or "lorem" placeholders.
- AE3. **Covers R19.** Given the application form URL is not yet known, when the call for applications renders, then the apply button either points to a real URL or is replaced by "the form opens on <date>" text; it never links to nothing.
- AE4. **Covers R2.** Given the 2027 logo files and colour arrive, when the editor changes the accent value and swaps the logo files, then every page reflects the new identity without other edits.
- AE5. **Covers R22.** Given no 2027 poster exists, when a visitor opens Program, then the poster slot is a visibly labelled placeholder ("plakát 2027 připravujeme"), not the 2025 poster.
- AE6. **Covers R34.** Given the festival is over and the 2029 cycle starts, when the editor archives edition 2027, then all 2027 groups, programme, workshops, news and photos move together to an archive view and the landing page is empty of 2027-specific records.

---

## Scope Boundaries

- No web editor, CMS or admin interface; editing happens in the repository.
- No migration of the 2001–2025 archive; those pages stay on hophop.zusostrov.cz.
- No online ticket sales; ticket information is text only.
- The application form is external (Google Form or similar); the site only links to it.
- No participant logistics content (accommodation, meals, arrival letters); those remain direct communication with groups.
- No Instagram or YouTube channels are created; Facebook is the only social link.
- No search, comments or newsletter.

---

## Dependencies / Assumptions

- The festival domain is being arranged by the school admin; the site launches on the github.io address if the domain is late.
- hophop.zusostrov.cz stays online for the archive links.
- Jonáš supplies the application form URL, the 2027 logo and colour, the poster and programme PDF as they become available.
- The 2025 logo files (`S25-barevne.png`, `S25-bile.png`, `S25-negativ.png`) and the 2025/2021 posters in the personal design folder may be used on the site.
- School emails for the four contact roles exist in the form `<surname>@zusostrov.cz` as used on the old Kontakty page; phones are those published in 2025.
- Photos from 2025 on the old site may be reused for the gallery teaser.

---

## Outstanding Questions

**Deferred to Planning**

- Which static-site tooling gives per-edition data files, CZ/EN pairs and a GitHub Pages build with the least ceremony for a single editor.
- How the language switch is expressed in URLs.
- Whether Geist is used via self-hosted files or a Google Fonts equivalent.
- Exact wording of the "coming soon" texts and the expected publication months for groups, programme and workshops (Jonáš to confirm during content writing).

---

## Content facts to use

Facts the planner and writer should treat as authoritative, with the design's wrong values noted.

| Item | Use | Design had |
|---|---|---|
| Edition, dates | 16th, 5.–9. 5. 2027, biennial | 28. 4.–2. 5. 2027 |
| Organizer | ZUŠ Ostrov, director Mgr. Irena Konývková; Minidiv, spolek as co-organizing association | MDDM Ostrov |
| Venues | KKC Ostrov (Dům kultury) performances; ZUŠ seminars; town side programme; Karlovarsko trip | šapitó, Kinokavárna, Dvorana zámku |
| Age, length | 14–18, up to 50 min (2025 page said 12–15, 30–50 min) | 12–20 |
| Selection | artistic committee, applications + video, via AITA/IATA | — |
| Seminars | directors' analysis seminar + 7 actor seminars | Pohyb, Hlas, Maska, Slam poetry with "lektor z JAMU" |
| Side programme | trip, parade, country stands, Soubor baví soubor, regional food, "Než půjdeme do divadla" for schools | — |
| 2027 highlight | South Korean professional company + HOP-HOP joint production | — |
| Name origin | play about the spider who "soukal" friends together, first informal meeting with group from Brixen, ~1995; numbering from 1999 | 1995 regional show, 2005 first foreign groups, 2015 logo |
| Contacts | Irena Konývková, Ondřej Šulc, Jonáš Konývka, Daniela Šulc Králová | placeholders |
| Partners (footer) | ZUŠ Ostrov, Město Ostrov, KKC Ostrov now; 2025 poster also had Minidiv, MDDM, Městská knihovna, JPE, NIPOS, Mattoni, Müller Production | MDDM, JAMU, NIPOS in text |
| Social | facebook.com/SoukaniOstrov | FB, IG, YT |

---

## Sources

- Project brief: `Podrobný popis projektu_2027.docx` (ZUŠ Ostrov, Sept 2026) — organizer, dates, venues, conditions, seminar structure, side programme, Korean co-production.
- Old site, 2025 edition: https://hophop.zusostrov.cz/soukani-2025-cs.html and sibling pages `-soubory-`, `-program-`, `-seminare-`, `-fotogalerie-`, `-film-`, `-plakat-`; archive index https://hophop.zusostrov.cz/soukani-cs.html; contacts https://hophop.zusostrov.cz/kontakty-cs.html.
- Claude Design draft: project `fd0065fe-199f-4bd0-bc0e-d2690c6b206d`, file `Soukani Ostrov 27.dc.html` (41 KB) and `support.js`; readable while logged in to claude.ai via the design service's `GetFile` call with the project id and path (returns base64). Structure, hero animation and palette reference.
- Logo and poster assets: `~/Documents/personal_jesus/soukani/s27/design/` (S25 logos, poster21.jpg, poster25.jpg); further 2025 graphics in `~/Documents/personal_jesus/soukani/s25/grafika/`.
- Name origin and history: https://vary.rozhlas.cz/zus-ostrov-porada-15-rocnik-mezinarodniho-detskeho-divadelniho-festivalu-soukani-9460600, https://karlovarsky.denik.cz/volny-cas/desatemu-divadelnimu-soukani-je-uz-dvacet-let-20150506.html, https://www.amaterskedivadlo.cz/main.php?data=prehlidka&id=428.
- AITA/IATA listing: https://www.aitaiata.net/wp-content/uploads/2022/12/soukani_ostrov_2023.pdf. Venue: https://kkc-ostrov.cz. Facebook: https://www.facebook.com/SoukaniOstrov.
- Session context notes with all extracted facts: scratchpad `context-notes.md` (temporary; contents folded into this doc).
