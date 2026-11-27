"""Check every page of the site before it goes live.

    python3 tools/check_site.py          # from the site folder (or give the folder as an argument)

Errors (exit code 1): a link or image to a file of this site that does not exist, a link to a
#section that is not on the target page, an id used twice on one page, a heading that skips a
level, structured data (JSON-LD) that does not parse, a page without a title or description,
or a live demo with no script. Warnings (shown, exit code 0): a search title over 60 characters
or a description over 160, which Google cuts off. Outside links are not fetched here; a monthly
check covers those.

GitHub runs this on every push (.github/workflows/check-site.yml); it uses only the Python
standard library.
"""
import glob
import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

SITE = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SKIP_DIRS = {'tools', '.git', '.github', 'node_modules'}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.heads, self.ld, self.demos, self.scripts = [], [], [], [], [], []
        self.title, self.desc, self._in_ld, self._in_title, self._buf = None, None, False, False, ''

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'a' and 'name' in a:
            self.ids.append(a['name'])
        for key in ('href', 'src'):
            if a.get(key) and tag in ('a', 'link', 'img', 'script', 'source', 'iframe'):
                if not (tag == 'link' and a.get('rel') in ('preconnect', 'dns-prefetch')):
                    self.links.append((tag, a[key]))
        if tag == 'img' and a.get('srcset'):
            for part in a['srcset'].split(','):
                if part.strip():
                    self.links.append(('img', part.strip().split()[0]))
        if re.fullmatch(r'h[1-6]', tag):
            self.heads.append(int(tag[1]))
        if tag == 'script':
            if a.get('type') == 'application/ld+json':
                self._in_ld, self._buf = True, ''
            if a.get('src'):
                self.scripts.append(a['src'])
        if tag == 'title':
            self._in_title, self._buf = True, ''
        if tag == 'meta' and a.get('name') == 'description':
            self.desc = a.get('content', '')
        if tag == 'figure' and 'data-demo' in a and 'live' in (a.get('class') or ''):
            self.demos.append(a['data-demo'])

    def handle_endtag(self, tag):
        if tag == 'script' and self._in_ld:
            self.ld.append(self._buf)
            self._in_ld = False
        if tag == 'title' and self._in_title:
            self.title, self._in_title = self._buf.strip(), False

    def handle_data(self, data):
        if self._in_ld or self._in_title:
            self._buf += data


def pages():
    out = []
    for path in glob.glob(os.path.join(SITE, '**', '*.html'), recursive=True):
        rel = os.path.relpath(path, SITE)
        if rel.split(os.sep)[0] in SKIP_DIRS:
            continue
        out.append(path)
    return sorted(out)


def parse(path):
    p = Page()
    with open(path, encoding='utf-8') as f:
        p.feed(f.read())
    return p


def main():
    errors, warnings = [], []
    parsed = {path: parse(path) for path in pages()}
    for path, p in parsed.items():
        rel = os.path.relpath(path, SITE)
        err = lambda m: errors.append(f'{rel}: {m}')
        warn = lambda m: warnings.append(f'{rel}: {m}')
        dup = sorted({i for i in p.ids if p.ids.count(i) > 1})
        if dup:
            err('id used more than once: ' + ', '.join(dup))
        last = 0
        for level in p.heads:
            if last and level > last + 1:
                err(f'heading skips a level (h{last} then h{level})')
            last = level
        if p.heads.count(1) != 1 and os.path.basename(path) != '404.html':
            err(f'{p.heads.count(1)} h1 headings (expected 1)')
        for block in p.ld:
            try:
                json.loads(block)
            except ValueError as e:
                err(f'structured data does not parse: {e}')
        if not p.title:
            err('no <title>')
        elif len(p.title) > 60:
            warn(f'title is {len(p.title)} characters; Google shows about 60')
        if os.path.basename(path) != '404.html':
            if not p.desc:
                err('no meta description')
            elif len(p.desc) > 160:
                warn(f'description is {len(p.desc)} characters; Google shows about 155')
        bundle = any(re.search(r'(^|/)live\.js(\?|$)', s) for s in p.scripts)
        for demo in p.demos:
            if not bundle and not any(re.search(rf'(^|/)live/{re.escape(demo)}\.js(\?|$)', s) for s in p.scripts):
                err(f'live demo "{demo}" has no script')
        for tag, url in p.links:
            u = urlsplit(url)
            if u.scheme or url.startswith('//') or url.startswith('mailto:') or url.startswith('tel:'):
                continue
            if u.path.startswith('/'):
                target = os.path.join(SITE, unquote(u.path).lstrip('/'))
            elif u.path:
                target = os.path.normpath(os.path.join(os.path.dirname(path), unquote(u.path)))
            else:
                target = path
            if os.path.isdir(target):
                target = os.path.join(target, 'index.html')
            if not os.path.exists(target):
                err(f'broken link: {url}')
                continue
            if u.fragment and target.endswith('.html') and u.fragment != 'top':
                tp = parsed.get(target) or parse(target)
                if unquote(u.fragment) not in tp.ids:
                    err(f'link to a missing section: {url}')
    for w in warnings:
        print('warning:', w)
    for e in errors:
        print('ERROR:', e)
    print(f'{len(parsed)} pages checked: {len(errors)} error(s), {len(warnings)} warning(s)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
