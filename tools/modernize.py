"""One-time upgrade of gkar87.github.io (2026-11-27). Safe to run again: every step checks first.

    python3 modernize.py && python3 make_images.py && python3 site_upkeep.py

1. Shared head block (icons, manifest, font preload, share cards) in every top-level page.
2. Publications: Cite button with BibTeX and APA, Free PDF and project links, topic and
   year filter, open-access tags from publisher licenses, schema.org data for each paper.
3. Heading levels on Projects and Work with me no longer skip a level.
4. Web app manifest.
"""
import html
import json
import os
import re

import chrome
import papers

SITE = chrome.SITE


def rd(name):
    with open(os.path.join(SITE, name), encoding='utf-8') as f:
        return f.read()


def wr(name, text):
    with open(os.path.join(SITE, name), 'w', encoding='utf-8') as f:
        f.write(text)


# ---------------------------------------------------------------- 1. shared head block
def head_block():
    names = [n for n in os.listdir(SITE) if n.endswith('.html')]
    for name in names:
        s = rd(name)
        if chrome.HEAD_START in s:
            continue
        s = re.sub(r'<link rel="icon" href="/?favicon\.svg" type="image/svg\+xml">\n?', '', s)
        s = re.sub(r'<meta property="og:image" content="[^"]*">\n?', '', s)
        block = chrome.HEAD_START + '\n' + chrome.HEAD_END + '\n'
        s = s.replace('<link rel="stylesheet"', block + '<link rel="stylesheet"', 1)
        wr(name, s)
    s = rd('index.html')
    if '"@id":"https://gkar87.github.io/#person"' not in s:
        s = s.replace('{"@context":"https://schema.org","@type":"Person",',
                      '{"@context":"https://schema.org","@type":"Person","@id":"https://gkar87.github.io/#person",', 1)
        wr('index.html', s)


# ---------------------------------------------------------------- 2. publications
TOPICS = ('<div class="pubtools pubtopics" role="group" aria-label="Filter by research direction">'
          + '<button type="button" data-dir="all" aria-pressed="true">All topics</button>'
          + ''.join(f'<button type="button" data-dir="{k}" aria-pressed="false"><i class="dot d{k}"></i>{v}</button>'
                    for k, v in papers.DIRS.items())
          + '<label class="yearsel">Year <select aria-label="Filter by year"><option value="all">Any</option>{years}</select></label>'
          + '</div>')


def li_upgrade(m):
    li = m.group(0)
    if '<li id=' in li:
        return li
    title = html.unescape(re.sub('<[^>]+>', '', re.search(r'<div class="pt">(.*?)</div>', li, re.S).group(1)))
    title = re.sub(r'(Open access|Most cited|Submitted)+$', '', title).strip()
    p = papers.find(title)
    if not p:
        raise SystemExit('no paper data for: ' + title)
    li = li.replace('<li>', f'<li id="{p["key"]}" data-dir="{p["dir"]}" data-year="{p["year"]}">', 1)
    if p.get('oa') and '>Open access<' not in li:
        li = re.sub(r'(<div class="pt">.*?)(<span class="tag">|</div>)', r'\1<span class="tag">Open access</span>\2', li, count=1, flags=re.S)
    extra = ''
    if p.get('free') and 'Free PDF' not in li:
        extra += f'<a href="{html.escape(p["free"])}">Free PDF</a>'
    if p.get('proj'):
        extra += f'<a href="research/{p["proj"]}.html">Project page</a>'
    if p.get('cite', True) and p.get('a'):
        extra += (f'<button type="button" class="cite-btn" aria-expanded="false" aria-controls="cite-{p["key"]}">Cite</button>')
    li = re.sub(r'(<div class="pl">)(.*?)(</div>)', lambda k: k.group(1) + k.group(2) + extra + k.group(3), li, count=1, flags=re.S)
    return li


def publications():
    s = rd('publications.html')
    s = re.sub(r'<li>\s*<div class="pt">.*?</li>', li_upgrade, s, flags=re.S)
    if 'pubtopics' not in s:
        years = sorted({p['year'] for p in papers.PAPERS}, reverse=True)
        opts = ''.join(f'<option value="{y}">{y}</option>' for y in years)
        s = s.replace('  <p class="pubcount" aria-live="polite"></p>',
                      '  ' + TOPICS.format(years=opts) + '\n  <p class="pubcount" aria-live="polite"></p>', 1)
    # legend: mention the new links
    s = s.replace("<span class=\"tag\">Open access</span> papers can be read free;",
                  "<span class=\"tag\">Open access</span> papers can be read free, and <b>Free PDF</b> links go to a free copy "
                  "the authors or a public repository host; <b>Cite</b> gives BibTeX and an APA citation to copy;", 1)
    # citation data and schema.org, rebuilt every run
    data = {p['key']: {'bib': papers.bibtex(p), 'apa': papers.apa(p)}
            for p in papers.PAPERS if p.get('cite', True) and p.get('a')}
    blob = '<script type="application/json" id="cite-data">' + json.dumps(data, ensure_ascii=False).replace('</', '<\\/') + '</script>'
    s = re.sub(r'<script type="application/json" id="cite-data">.*?</script>\n?', '', s, flags=re.S)
    s = s.replace('\n</main>', '\n' + blob + '\n</main>', 1)
    graph = {'@context': 'https://schema.org', '@graph': [papers.jsonld(p) for p in papers.PAPERS
                                                          if p.get('cite', True) and p.get('a')]}
    ld = '<script type="application/ld+json" id="papers-ld">' + json.dumps(graph, ensure_ascii=False).replace('</', '<\\/') + '</script>'
    s = re.sub(r'<script type="application/ld\+json" id="papers-ld">.*?</script>\n?', '', s, flags=re.S)
    s = s.replace('<link rel="stylesheet"', ld + '\n<link rel="stylesheet"', 1)
    wr('publications.html', s)


# ---------------------------------------------------------------- 3. headings
def headings():
    s = rd('projects.html')
    s = re.sub(r'<h4><span>(\d\d)</span>(.*?)</h4>', r'<h3><span>\1</span>\2</h3>', s)
    s = s.replace('<h4 class="pgroup">', '<h3 class="pgroup">')
    s = re.sub(r'(<h3 class="pgroup">.*?)</h4>', r'\1</h3>', s)
    wr('projects.html', s)
    s = rd('work-with-me.html')
    if 'class="vh">Three ways in' not in s:
        s = s.replace('<section id="ways-in">\n', '<section id="ways-in">\n  <h2 class="vh">Three ways in</h2>\n', 1)
    s = re.sub(r'<div class="xp (x\d) reveal"><h4>(.*?)</h4>', r'<div class="xp \1 reveal"><h3>\2</h3>', s)
    wr('work-with-me.html', s)


# ---------------------------------------------------------------- 4. manifest
def manifest():
    m = {
        'name': 'Gorkem Kar, Ph.D.',
        'short_name': 'G. Kar',
        'description': 'Research, projects, publications and teaching of Gorkem Kar, University of Central Missouri.',
        'start_url': '/',
        'scope': '/',
        'display': 'browser',
        'background_color': '#fbfbfd',
        'theme_color': '#1d4f91',
        'icons': [
            {'src': '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
            {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
            {'src': '/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }
    wr('site.webmanifest', json.dumps(m, indent=2) + '\n')


if __name__ == '__main__':
    head_block()
    publications()
    headings()
    manifest()
    print('done')
