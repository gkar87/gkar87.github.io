"""Draw the share cards (1200x630, one per page) and the site icons for gkar87.github.io.

    python3 make_images.py

Writes images/og/*.jpg, apple-touch-icon.png, icon-192.png, icon-512.png,
icon-maskable-512.png and favicon.ico into the site folder. Needs Pillow and fontTools
(to read the site's own Source Serif 4 font). Run again after a page title or lead changes.
"""
import glob
import html
import io
import math
import os
import random
import re

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import chrome

SITE = chrome.SITE
W, H = 1200, 630
BG, FG, MUTED, LINE = (251, 251, 253), (20, 26, 38), (86, 96, 116), (226, 230, 238)
ACCENTS = {1: (29, 79, 145), 2: (15, 123, 108), 3: (180, 35, 58), 4: (107, 79, 179)}
BLUE, RED, TEAL = ACCENTS[1], ACCENTS[3], ACCENTS[2]
SANS = '/usr/share/fonts/opentype/inter/Inter-Medium.otf'
SANS_B = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
SANS_X = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'

DIR_OF = {}
for d, slugs in {1: 'driver-behavior perception planned-can planned-ev planned-gnss planned-v2x planned-vprivacy vehicles',
                 2: 'planned-adversarial planned-federated planned-quantum planned-tinyml planned-xai quantum-ids quantum-spectra',
                 3: 'iot-identity planned-benchmark planned-blockchain planned-encrypted planned-pqc planned-rf',
                 4: 'applied-ai planned-acoustic planned-llmsoc planned-rag side-channels wireless-ffr'}.items():
    for s in slugs.split():
        DIR_OF[s] = d
DIR_NAME = {1: 'Connected vehicles', 2: 'Intrusion detection', 3: 'IoT devices', 4: 'Side channels and applied AI'}


def serif(size, weight=600):
    path = '/tmp/ss4.ttf'
    if not os.path.exists(path):
        f = TTFont(os.path.join(SITE, 'fonts', 'source-serif-4-latin-wght-normal.woff2'))
        f.flavor = None
        f.save(path)
    font = ImageFont.truetype(path, size)
    font.set_variation_by_axes([weight])
    return font


def meta(text, prop):
    m = re.search(r'<meta (?:property|name)="%s" content="([^"]*)"' % re.escape(prop), text)
    return html.unescape(m.group(1)) if m else ''


def wrap(draw, text, font, width, max_lines):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        while draw.textlength(lines[-1] + '…', font=font) > width:
            lines[-1] = lines[-1].rsplit(' ', 1)[0]
        lines[-1] = lines[-1].rstrip(',;:') + '…'
    return lines


def first_sentence(s, limit=200):
    # end at a full stop followed by a capital, but not after an initial or abbreviation like U.S.
    m = re.match(r'(.{40,}?[a-z0-9)][.?!])\s+[A-Z]', s)
    s = m.group(1) if m else s
    return s if len(s) <= limit else s[:limit].rsplit(' ', 1)[0] + '…'


def network(img, accent, seed):
    """The hero's quiet network of nodes, on the right side of the card."""
    rnd = random.Random(seed)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    nodes = [(rnd.uniform(900, 1190), rnd.uniform(10, 520), rnd.random() < .1) for _ in range(22)]
    for i, (x, y, _) in enumerate(nodes):
        for x2, y2, _ in nodes[i + 1:]:
            dist = math.hypot(x - x2, y - y2)
            if dist < 150:
                a = int(70 * (1 - dist / 150))
                d.line((x, y, x2, y2), fill=accent + (a,), width=2)
    for x, y, bad in nodes:
        c = RED if bad else accent
        if bad:
            d.ellipse((x - 11, y - 11, x + 11, y + 11), outline=c + (90,), width=2)
        d.ellipse((x - 4.5, y - 4.5, x + 4.5, y + 4.5), fill=c + (200,))
    img.alpha_composite(layer)


def background(accent, seed):
    img = Image.new('RGBA', (W, H), BG + (255,))
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((700, -320, 1500, 330), fill=accent + (40,))
    g.ellipse((-260, 420, 420, 900), fill=TEAL + (26,))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(110)))
    network(img, accent, seed)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 14, H), fill=accent)
    return img


def card(path, kicker, title, sub, accent, seed, photo=False, chip=None):
    img = background(accent, seed)
    d = ImageDraw.Draw(img)
    x = 80
    width = 800 if not photo else 680
    if photo:
        p = Image.open(os.path.join(SITE, 'images', 'headshot.jpg')).convert('RGB').resize((300, 300), Image.LANCZOS)
        mask = Image.new('L', (300, 300), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, 299, 299), 36, fill=255)
        shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle((830, 170, 1130, 470), 36, fill=(16, 24, 40, 60))
        img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
        img.paste(p, (820, 160), mask)
        d = ImageDraw.Draw(img)
        d.rounded_rectangle((820, 160, 1119, 459), 36, outline=LINE, width=2)
    kf = ImageFont.truetype(SANS_B, 22)
    d.text((x, 78), kicker.upper(), font=kf, fill=accent, spacing=4)
    size = 68
    for size in (68, 62, 56, 50, 46):
        tf = serif(size)
        lines = wrap(d, title, tf, width, 3)
        if len(lines) <= 2 or size == 46:
            break
    y = 130
    for ln in lines:
        d.text((x, y), ln, font=tf, fill=FG)
        y += int(size * 1.16)
    y += 18
    sf = ImageFont.truetype(SANS, 29)
    for ln in wrap(d, sub, sf, width, 3 if len(lines) < 3 else 2):
        d.text((x, y), ln, font=sf, fill=MUTED)
        y += 42
    # footer: name, place, site
    d.line((x, 530, W - 80, 530), fill=LINE, width=2)
    nf, uf = serif(30, 600), ImageFont.truetype(SANS, 22)
    d.text((x, 552), 'Gorkem Kar, Ph.D.', font=nf, fill=FG)
    nw = d.textlength('Gorkem Kar, Ph.D.', font=nf)
    d.text((x + nw + 18, 560), 'University of Central Missouri', font=uf, fill=MUTED)
    site = 'gkar87.github.io'
    if chip:
        cf = ImageFont.truetype(SANS_B, 20)
        cw = d.textlength(chip, font=cf) + 36
        cx = W - 80 - cw
        d.rounded_rectangle((cx, 549, W - 80, 591), 21, fill=accent + (255,))
        d.text((cx + 18, 558), chip, font=cf, fill=(255, 255, 255))
    else:
        d.text((W - 80 - d.textlength(site, font=uf), 560), site, font=uf, fill=MUTED)
    img.convert('RGB').save(path, 'JPEG', quality=86, optimize=True, progressive=True)


TOP = {
    'index': ('Computer Science and Cybersecurity', 'Gorkem Kar, Ph.D.',
              'Assistant Professor of Computer Science and Cybersecurity. Security for vehicles, phones, IoT devices and networks.'),
    'research': ('Research', None, None),
    'projects': ('Projects', None, None),
    'publications': ('Publications', None, None),
    'teaching': ('Teaching', None, None),
    'work-with-me': ('Work with me', None, None),
}


def og_name(page):
    """images/og/<name>.jpg for a page path relative to the site (e.g. 'research/vehicles.html')."""
    base = os.path.basename(page)[:-5]
    return ('p-' + base) if page.startswith('research/') else base


def cards():
    out = os.path.join(SITE, 'images', 'og')
    os.makedirs(out, exist_ok=True)
    n = 0
    for name, (kicker, title, sub) in TOP.items():
        text = open(os.path.join(SITE, name + '.html'), encoding='utf-8').read()
        if title is None:
            title = meta(text, 'og:title').split(' · ')[0]
            title = {'Publications': 'Publications', 'Work with me': 'Work with me'}.get(title, title)
            h1 = re.search(r'<h1[^>]*>(.*?)</h1>', text, re.S)
            title = html.unescape(re.sub('<[^>]+>', '', h1.group(1))).strip() if h1 else title
            sub = first_sentence(meta(text, 'description'))
        card(os.path.join(out, name + '.jpg'), kicker,
             title, sub, BLUE, name, photo=(name == 'index'))
        n += 1
    for path in sorted(glob.glob(os.path.join(SITE, 'research', '*.html'))):
        slug = os.path.basename(path)[:-5]
        text = open(path, encoding='utf-8').read()
        title = meta(text, 'og:title')
        sub = first_sentence(meta(text, 'og:description'))
        d = DIR_OF.get(slug)
        accent = ACCENTS.get(d, BLUE)
        if slug == 'latex-overleaf':
            kicker, chip = 'Guide for students', None
        else:
            kicker = 'Open project for new students' if slug.startswith('planned-') else 'Published work'
            chip = DIR_NAME.get(d)
        card(os.path.join(out, 'p-' + slug + '.jpg'), kicker, title, sub, accent, slug, chip=chip)
        n += 1
    return n


def icon(size, maskable=False, square=False):
    """The favicon's blue rounded square with GK, drawn at any size."""
    scale = 4
    S = size * scale
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    color = (31, 78, 140)
    if maskable:
        d.rectangle((0, 0, S, S), fill=color)
        fs = int(S * .34)
    else:
        d.rectangle((0, 0, S, S), fill=color) if square else d.rounded_rectangle((0, 0, S - 1, S - 1), int(S * 14 / 64), fill=color)
        fs = int(S * 28 / 64)
    f = ImageFont.truetype(SANS_X, fs)
    box = d.textbbox((0, 0), 'GK', font=f)
    tw, th = box[2] - box[0], box[3] - box[1]
    d.text(((S - tw) / 2 - box[0], (S - th) / 2 - box[1]), 'GK', font=f, fill=(255, 255, 255))
    return img.resize((size, size), Image.LANCZOS)


def icons():
    icon(180, square=True).convert('RGB').save(os.path.join(SITE, 'apple-touch-icon.png'), optimize=True)
    icon(192).save(os.path.join(SITE, 'icon-192.png'), optimize=True)
    icon(512).save(os.path.join(SITE, 'icon-512.png'), optimize=True)
    icon(512, maskable=True).save(os.path.join(SITE, 'icon-maskable-512.png'), optimize=True)
    icon(64).save(os.path.join(SITE, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == '__main__':
    print(cards(), 'share cards')
    icons()
    print('icons written')
