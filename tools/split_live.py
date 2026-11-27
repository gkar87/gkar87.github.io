"""Write one small script per live demo, so each project page loads only the demo it shows.

live.js (in the site folder) stays the one file to edit: it holds the shared helpers and all
demos. This script copies it into live/<demo>.js once per demo, leaving out every other demo.
site_upkeep.py runs it; run it by hand with  python3 tools/split_live.py
"""
import os
import re

from chrome import SITE

START = re.compile(r'^  demos\.([a-z0-9]+) = fig => \{$')


def blocks(lines):
    """(name, first line, last line) for each demo: from its '// ====' banner to its closing '  };'."""
    out = []
    for i, line in enumerate(lines):
        m = START.match(line)
        if not m:
            continue
        first = i
        while first > 0 and lines[first - 1].startswith('  // '):
            first -= 1
        last = lines.index('  };', i)
        out.append((m.group(1), first, last))
    return out


def main():
    with open(os.path.join(SITE, 'live.js'), encoding='utf-8') as f:
        lines = f.read().split('\n')
    found = blocks(lines)
    outdir = os.path.join(SITE, 'live')
    os.makedirs(outdir, exist_ok=True)
    keep = set()
    for name, _, _ in found:
        drop = set()
        for other, a, b in found:
            if other != name:
                drop.update(range(a, b + 2 if b + 1 < len(lines) and lines[b + 1] == '' else b + 1))
        text = '\n'.join(l for i, l in enumerate(lines) if i not in drop)
        text = text.replace('// Live, interactive illustrations for the research pages.',
                            f'// Live illustration "{name}", generated from live.js by tools/split_live.py. Edit live.js, not this file.', 1)
        path = os.path.join(outdir, name + '.js')
        keep.add(name + '.js')
        old = open(path, encoding='utf-8').read() if os.path.exists(path) else None
        if old != text:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
    for n in os.listdir(outdir):          # remove demos that no longer exist in live.js
        if n not in keep:
            os.remove(os.path.join(outdir, n))
    return [n for n, _, _ in found]


if __name__ == '__main__':
    names = main()
    print('wrote', len(names), 'demo scripts to live/')
