# gkar87.github.io

Personal academic website of Gorkem Kar. Plain HTML and CSS, no build step.

- `index.html`: home (introduction, about, recent news, research in brief, selected papers, contact)
- `research.html`: research overview, four directions, how I work
- `projects.html`: every project by direction, published work and open projects
- `publications.html`: selected papers, the full filterable list, submitted papers in brief
- `teaching.html`, `work-with-me.html`
- `research/*.html`: one page per project and the LaTeX and Overleaf guide (generated)
- `style.css`, `site.js` (theme, search, filters), `live.js` (project demos), `pages.json` (search index)

Every page shares the same header and footer. Edit them in `personal-website-tools/chrome.py`, then run
`python3 personal-website-tools/site_upkeep.py`: it writes the header, footer, "Last updated" date and the
`?v=` asset version (taken from the contents of style.css, site.js and live.js) into every page and rebuilds
the project pages. `site_upkeep.py --check` only reports pages that are out of date.
GitHub Pages serves the `main` branch root.
