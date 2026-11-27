# gkar87.github.io

Personal academic website of Gorkem Kar. Plain HTML and CSS. GitHub Pages serves the `main` branch root.

- `index.html`: home (introduction, about, recent news, research in brief, selected papers, contact)
- `research.html`: research overview, four directions, how I work
- `projects.html`: every project by direction, published work and open projects
- `publications.html`: selected papers, the full filterable list, submitted papers in brief
- `teaching.html`, `work-with-me.html`
- `research/*.html`: one page per project and the LaTeX and Overleaf guide (generated)
- `style.css`, `site.js` (theme, search, filters), `pages.json` (search index)
- `live.js`: all project demos (edit this one); `live/<demo>.js`: one generated file per demo, so each
  project page loads only its own
- `tools/`: the scripts that build and check the site (not part of the pages; `robots.txt` keeps them out of search)

## Updating the site

Every page shares the same header and footer. Edit them in `tools/chrome.py`; edit project pages in
`tools/build_projects.py` (search titles and descriptions for them are in `tools/seo.py`). Then run

    python3 tools/site_upkeep.py

It writes the header, footer, "Last updated" date and the `?v=` asset version (from the contents of
style.css, site.js and live.js) into every page, rebuilds the project pages and `pages.json`, writes
`live/<demo>.js` from `live.js`, and writes `sitemap.xml` with a last-changed date per page.
`site_upkeep.py --check` only reports what is out of date.

Before publishing, run

    python3 tools/check_site.py

It checks links and images inside the site, `#section` links, repeated ids, heading order, structured
data, and title and description length. GitHub runs the same check on every push
(`.github/workflows/check-site.yml`) and emails the owner if it fails.
