"""Shared page chrome for gkar87.github.io: the header, the footer and the asset version.

Edit the header or footer here, then run site_upkeep.py. It writes them into every
top-level page and rebuilds the project pages (build_projects.py imports this file).
"""
import datetime
import hashlib
import os

# The site is the folder this tools/ folder sits in.
SITE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

NAV = [('index.html', 'About'), ('research.html', 'Research'), ('projects.html', 'Projects'),
       ('publications.html', 'Publications'), ('teaching.html', 'Teaching'),
       ('work-with-me.html', 'Work with me'), ('index.html#contact', 'Contact')]

ASSETS = ['style.css', 'site.js', 'live.js']


def asset_version(site=SITE):
    """Changes only when style.css, site.js or live.js change, so browsers refetch them then."""
    h = hashlib.sha1()
    for name in ASSETS:
        with open(os.path.join(site, name), 'rb') as f:
            h.update(f.read())
    return h.hexdigest()[:8]


def updated(today=None):
    today = today or datetime.date.today()
    return today.strftime('%B %Y')


FIND_BTN = ('<button class="find" type="button" aria-label="Search the site" aria-keyshortcuts="Control+K Meta+K /">'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/>'
            '<path d="M20 20l-4.2-4.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><kbd>Ctrl K</kbd></button>')

THEME_BTN = ('<button class="theme" type="button" aria-label="Switch theme"><svg viewBox="0 0 24 24" aria-hidden="true">'
             '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"/></svg></button>')


def header(root='', active=None):
    """root is '' for top-level pages and '../' for research/ pages; active is the nav href to mark."""
    items = []
    for href, label in NAV:
        cur = ' class="active" aria-current="page"' if href == active else ''
        items.append(f'          <li><a href="{root}{href}"{cur}>{label}</a></li>')
    nav = '\n'.join(items)
    return f'''<header class="site">
  <div class="wrap">
    <a class="brand" href="{root}index.html">Gorkem Kar<span class="muted">, Ph.D.</span></a>
    <div class="navbar">
      <nav aria-label="Main">
        <ul>
{nav}
        </ul>
      </nav>
      {FIND_BTN}
      {THEME_BTN}
    </div>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>'''


def footer(root='', when=None):
    return f"""<footer class="site-foot">
  <div class="wrap fgrid">
    <div class="fabout"><a class="brand" href="{root}index.html">Gorkem Kar<span class="muted">, Ph.D.</span></a>
      <p>Assistant Professor of Computer Science and Cybersecurity, University of Central Missouri.</p></div>
    <nav aria-label="Site"><h2 class="fh">Site</h2><ul>
      <li><a href="{root}research.html">Research</a></li><li><a href="{root}projects.html">Projects</a></li>
      <li><a href="{root}publications.html">Publications</a></li><li><a href="{root}teaching.html">Teaching</a></li>
      <li><a href="{root}work-with-me.html">Work with me</a></li></ul></nav>
    <nav aria-label="Profiles"><h2 class="fh">Profiles</h2><ul>
      <li><a href="https://scholar.google.com/citations?user=dz-6amUAAAAJ&amp;hl=en">Google Scholar</a></li><li><a href="https://github.com/gkar87">GitHub</a></li>
      <li><a href="https://orcid.org/0000-0003-0367-4409">ORCID</a></li><li><a href="https://www.linkedin.com/in/gorkem-kar/">LinkedIn</a></li><li><a href="https://www.researchgate.net/profile/Gorkem-Kar-2">ResearchGate</a></li></ul></nav>
    <nav aria-label="Contact"><h2 class="fh">Contact</h2><ul>
      <li><a href="mailto:kar@ucmo.edu">kar@ucmo.edu</a></li><li>MIC D159, University of Central Missouri</li>
      <li><a href="{root}research/latex-overleaf.html">LaTeX and Overleaf guide</a></li></ul></nav>
  </div>
  <div class="wrap fbase"><span>© {(when or datetime.date.today()).year} Gorkem Kar · Last updated {updated(when)}</span><a href="#top">Back to top ↑</a></div>
</footer>
<a class="totop" href="#top" aria-label="Back to top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></a>"""


HEAD_START, HEAD_END = '<!-- shared head: written by site_upkeep.py -->', '<!-- /shared head -->'


def head_extras(root='', og=None, alt=''):
    """Icons, app manifest, font preload and share-card tags, shared by every page.

    og is the share card's name in images/og/ (see make_images.og_name); alt describes it.
    """
    lines = [HEAD_START,
             f'<link rel="icon" href="{root}favicon.ico" sizes="32x32">',
             f'<link rel="icon" href="{root}favicon.svg" type="image/svg+xml">',
             f'<link rel="apple-touch-icon" href="{root}apple-touch-icon.png">',
             f'<link rel="manifest" href="{root}site.webmanifest">',
             f'<link rel="preload" href="{root}fonts/source-serif-4-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>']
    if og:
        lines += [f'<meta property="og:image" content="https://gkar87.github.io/images/og/{og}.jpg">',
                  '<meta property="og:image:width" content="1200">',
                  '<meta property="og:image:height" content="630">',
                  f'<meta property="og:image:alt" content="{alt}">',
                  '<meta property="og:site_name" content="Gorkem Kar">',
                  '<meta name="twitter:card" content="summary_large_image">']
    lines.append(HEAD_END)
    return '\n'.join(lines)
