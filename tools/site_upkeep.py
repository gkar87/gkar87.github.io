"""Keep gkar87.github.io consistent in one step.

    python3 site_upkeep.py           # write header, footer, asset version and date, rebuild project pages
    python3 site_upkeep.py --check   # only report pages that are out of date (exit 1 if any)

What it does:
1. Works out the asset version from the contents of style.css, site.js and live.js
   (chrome.asset_version), so the ?v= number changes exactly when those files change.
2. Writes the shared header (with the right nav item marked) and the shared footer
   (with "Last updated <month year>") from chrome.py into every top-level page.
3. Sets every ?v= in the top-level pages and 404.html to that version.
4. Rebuilds research/*.html and pages.json with build_projects.py, which uses the same chrome.
5. Writes live/<demo>.js from live.js (split_live.py), so each project page loads only its own demo.
6. Writes sitemap.xml with a last-modified date per page. The dates live in tools/sitemap_dates.json:
   a page's date moves to today only when its content (ignoring the footer date and asset version) changes.

Edit the header or footer only in chrome.py. Edit project pages only in build_projects.py.
"""
import glob
import os
import re
import sys

import chrome

SITE = chrome.SITE
HEADER = re.compile(r'<header class="site">.*?</header>', re.S)
FOOTER = re.compile(r'<footer class="site-foot">.*?</footer>\s*<a class="totop".*?</a>', re.S)
VER = re.compile(r'\?v=[0-9A-Za-z]+')
HEADX = re.compile(re.escape(chrome.HEAD_START) + r'.*?' + re.escape(chrome.HEAD_END), re.S)
OG_ALT = {'index': 'Share card: Gorkem Kar, Ph.D., Assistant Professor of Computer Science and Cybersecurity'}


def top_pages():
    return sorted(p for p in glob.glob(os.path.join(SITE, '*.html')) if os.path.basename(p) != '404.html')


def refresh(text, name, version):
    if HEADER.search(text):
        text = HEADER.sub(lambda m: chrome.header('', name), text, count=1)
    if FOOTER.search(text):
        text = FOOTER.sub(lambda m: chrome.footer(''), text, count=1)
    if HEADX.search(text):
        base = name[:-5]
        og = None if name == '404.html' else base
        title = re.search(r'<title>(.*?)</title>', text).group(1).split(' · ')[0]
        alt = OG_ALT.get(base, 'Share card: ' + title)
        text = HEADX.sub(lambda m: chrome.head_extras('/' if name == '404.html' else '', og, alt), text, count=1)
    return VER.sub('?v=' + version, text)


SITEMAP_DATES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sitemap_dates.json')
VOLATILE = re.compile(r'\?v=[0-9A-Za-z]+|Last updated [A-Za-z]+ \d{4}|© \d{4}')


def sitemap_pages():
    pages = [p for p in top_pages()]
    pages += sorted(glob.glob(os.path.join(SITE, 'research', '*.html')))
    return pages


def url_of(path):
    rel = os.path.relpath(path, SITE).replace(os.sep, '/')
    return 'https://gkar87.github.io/' + ('' if rel == 'index.html' else rel)


def sitemap(today=None):
    """Return the sitemap text and the updated date table (does not write either)."""
    import datetime
    import hashlib
    import json
    today = (today or datetime.date.today()).isoformat()
    try:
        with open(SITEMAP_DATES, encoding='utf-8') as f:
            dates = json.load(f)
    except FileNotFoundError:
        dates = {}
    new = {}
    rows = []
    for path in sitemap_pages():
        with open(path, encoding='utf-8') as f:
            text = f.read()
        if 'name="robots" content="noindex' in text:
            continue
        rel = os.path.relpath(path, SITE).replace(os.sep, '/')
        h = hashlib.sha1(VOLATILE.sub('', text).encode('utf-8')).hexdigest()[:12]
        old = dates.get(rel)
        day = old[1] if old and old[0] == h else today
        new[rel] = [h, day]
        rows.append(f'  <url><loc>{url_of(path)}</loc><lastmod>{day}</lastmod></url>')
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + '\n'.join(rows) + '\n</urlset>\n')
    return xml, new


def write_sitemap():
    import json
    xml, dates = sitemap()
    with open(os.path.join(SITE, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(xml)
    with open(SITEMAP_DATES, 'w', encoding='utf-8') as f:
        f.write('{\n' + ',\n'.join(f'  {json.dumps(k)}: {json.dumps(v)}' for k, v in sorted(dates.items())) + '\n}\n')


def main(check=False):
    version = chrome.asset_version()
    stale = []
    for path in top_pages() + [os.path.join(SITE, '404.html')]:
        with open(path, encoding='utf-8') as f:
            old = f.read()
        new = refresh(old, os.path.basename(path), version)
        if new != old:
            stale.append(os.path.relpath(path, SITE))
            if not check:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new)
    if check:
        # project pages: compare what build_projects.py would write with what is there
        import build_projects as bp
        for slug, (title, lead, body) in list(bp.P.items()) + list(bp.PL.items()):
            kw = {} if slug in bp.P else dict(group=bp.PLANNED, crumb='Open projects', back='open-projects')
            path = os.path.join(SITE, 'research', slug + '.html')
            with open(path, encoding='utf-8') as f:
                if f.read() != bp.page(slug, title, lead, body, **kw):
                    stale.append(os.path.relpath(path, SITE))
        xml, _ = sitemap()
        try:
            cur = open(os.path.join(SITE, 'sitemap.xml'), encoding='utf-8').read()
        except FileNotFoundError:
            cur = ''
        if cur != xml:
            stale.append('sitemap.xml')
        print(f'asset version {version}: ' + (f'{len(stale)} page(s) out of date: ' + ', '.join(stale) if stale else 'all pages up to date'))
        return 1 if stale else 0
    import build_projects as bp
    import split_live
    bp.main()
    split_live.main()
    write_sitemap()
    print(f'asset version {version}; updated {len(stale)} top-level page(s)' + (': ' + ', '.join(stale) if stale else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main(check='--check' in sys.argv))
