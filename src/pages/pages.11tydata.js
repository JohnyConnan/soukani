/** Every page template renders once per language at the slug from content/pages.yaml. */
export default {
  layout: "layouts/base.njk",
  pagination: { data: "db.languages", size: 1, alias: "lang" },
  permalink: "{{ db.pageUrl(pageKey, lang) }}",
  eleventyComputed: {
    registry: (data) => {
      const page = data.db.pageByKey[data.pageKey];
      if (!page) throw new Error(`Template ${data.page.inputPath} uses pageKey "${data.pageKey}" which is not in content/pages.yaml`);
      return page;
    },
    alternates: (data) => {
      const out = {};
      for (const l of ["cs", "en"]) out[l] = data.db.pageUrl(data.pageKey, l);
      return out;
    },
    metaTitle: (data) => {
      const page = data.db.pageByKey[data.pageKey];
      return data.pageKey === "home" ? page.title[data.lang] : `${page.title[data.lang]} – ${data.db.site.name}`;
    },
    metaDescription: (data) => data.db.pageByKey[data.pageKey].description[data.lang],
    edition: (data) => data.db.current,
  },
};
