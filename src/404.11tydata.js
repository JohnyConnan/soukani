/** Bilingual 404 page: data lives here (JS) so `edition` stays an object, not a rendered string. */
export default {
  layout: "layouts/base.njk",
  permalink: "/404.html",
  lang: "cs",
  eleventyExcludeFromCollections: true,
  eleventyComputed: {
    edition: (data) => data.db.current,
    metaTitle: (data) => `${data.db.copy.notFound.heading.cs} / ${data.db.copy.notFound.heading.en} – ${data.db.site.name}`,
    metaDescription: (data) => `${data.db.copy.notFound.text.cs} ${data.db.copy.notFound.text.en}`,
  },
};
