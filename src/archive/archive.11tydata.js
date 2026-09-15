import { ordinal } from "../../lib/dates.js";

/** Archived editions without an external archive URL render locally, one page per language. */
export default {
  layout: "layouts/base.njk",
  pageKey: "archive",
  pagination: { data: "db.archivePages", size: 1, alias: "ap" },
  permalink: "{{ db.archiveEditionUrl(ap.edition.year, ap.lang) }}",
  eleventyComputed: {
    lang: (data) => data.ap.lang,
    edition: (data) => data.ap.edition,
    alternates: (data) => {
      const out = {};
      for (const l of ["cs", "en"]) out[l] = data.db.archiveEditionUrl(data.ap.edition.year, l);
      return out;
    },
    metaTitle: (data) => `${data.db.copy.archive.title[data.ap.lang].replace("{year}", data.ap.edition.year)} – ${data.db.site.name}`,
    metaDescription: (data) => data.db.copy.archive.description[data.ap.lang].replace("{n}", ordinal(data.ap.edition.number, data.ap.lang)),
  },
};
