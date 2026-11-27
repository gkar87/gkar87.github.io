"""Paper data for gkar87.github.io: citations, topics, project pages and free copies.

Used by modernize.py (publications page: Cite button, topic/year filter, structured data)
and by build_projects.py (Free PDF and Cite links on project pages).

Sources (checked 2026-11-27):
- Authors, pages, volumes and issues: Crossref metadata for each DOI.
- Items without a DOI: the details already on the publications page.
- Free copies: each link was opened and confirmed to be the full paper.
  NSF Public Access Repository (par.nsf.gov), co-authors' university pages,
  and the publisher's own free PDF (SciTePress).
- Open access: the publisher's Creative Commons license in Crossref.
"""

SITE_URL = 'https://gkar87.github.io/'

# Research directions, as on research.html
DIRS = {
    1: 'Connected vehicles',
    2: 'Intrusion detection and quantum ML',
    3: 'IoT devices',
    4: 'Side channels and applied AI',
}

ME = 'Gorkem Kar'

# One entry per item on publications.html, matched by title (case-insensitive prefix).
# a: authors as "Given Family" (given may be initials)
# t: BibTeX type; c: container (journal or proceedings); proj: project page slug
PAPERS = [
    # ---- submitted (no citation, filter only)
    dict(key='nepal2026knob', title='One knob, two objectives', dir=4, year=2026, proj=None, cite=False),
    dict(key='posini2026chatbot', title='Enhancing university chatbots', dir=4, year=2026, proj=None, cite=False),
    dict(key='khan2025detection', title='The evolution of object detection', dir=4, year=2025, proj=None, cite=False),
    # ---- journal articles
    dict(key='kulkarni2026microplastics', title='A classical quantum neural network with dual-channel', dir=2, year=2026,
         proj='quantum-spectra', t='article',
         a=['H. G. Kulkarni', 'A. R. Banerjee', 'T. Mandloi', 'S. Sridevi', 'S. Geetha', ME],
         full='A classical quantum neural network with dual-channel feature extraction on IonQ QPU for classifying weathered microplastics from Raman spectra',
         c='AVS Quantum Science', volume='8', issue='1'),
    dict(key='sridevi2025unified', title='Unified hybrid quantum classical', dir=2, year=2025, proj='quantum-ids', t='article',
         doi='10.1140/epjqt/s40507-025-00380-z',
         a=['S. Sridevi', 'B. Indira', 'S. Geetha', 'S. Balachandran', ME, 'Shangirne Kharbanda'],
         full='Unified hybrid quantum classical neural network framework for detecting distributed denial of service and Android mobile malware attacks',
         c='EPJ Quantum Technology', volume='12', issue='1', pages='77', publisher='Springer'),
    dict(key='dutta2025quanvolutional', title='Novel quanvolutional neural network', dir=2, year=2025, proj='quantum-spectra', t='article',
         doi='10.1109/ACCESS.2025.3580316',
         a=['Shivanya Shomir|Dutta', 'Sahil Sandeep', 'S. Sridevi', 'Rajiv Mistry', 'Jonathan Ortega', ME],
         full='Novel quanvolutional neural network-based COVID-19 diagnosis from Raman spectroscopic signals of human serum',
         c='IEEE Access', volume='13', pages='104382--104405', publisher='IEEE'),
    dict(key='buyuktepe2025food', title='Food fraud detection using explainable', dir=4, year=2025, proj='applied-ai', t='article',
         doi='10.1111/exsy.13387', oa=True,
         a=['Okan Buyuktepe', 'Cagatay Catal', ME, 'Yamine Bouzembrak', 'H. J. P. Marvin', 'Anand Gavai'],
         full='Food fraud detection using explainable artificial intelligence',
         c='Expert Systems', volume='42', issue='1', pages='e13387', publisher='Wiley'),
    dict(key='catal2025strategic', title='Strategic technological innovation investment', dir=4, year=2025, proj='applied-ai', t='article',
         a=['C. Catal', ME, 'M. Zarali'],
         full='Strategic technological innovation investment: Enhancing resilience in the age of digital transformation',
         c='Journal of Innovative Digital Transformation', volume='2', issue='1', pages='50--72'),
    dict(key='aksoy2024automated', title='Automated network incident identification', dir=3, year=2024, proj='iot-identity', t='article',
         doi='10.3390/electronics13020293',
         a=['Ahmet Aksoy', 'Luis Valle', ME],
         full='Automated network incident identification through genetic algorithm-driven feature selection',
         c='Electronics', volume='13', issue='2', pages='293', publisher='MDPI'),
    dict(key='jenga2023crime', title='Machine learning in crime prediction', dir=4, year=2023, proj='applied-ai', t='article',
         doi='10.1007/s12652-023-04530-y', oa=True,
         a=['Karabo Jenga', 'Cagatay Catal', ME],
         full='Machine learning in crime prediction',
         c='Journal of Ambient Intelligence and Humanized Computing', volume='14', issue='3', pages='2887--2913', publisher='Springer'),
    dict(key='alkhateeb2022hybrid', title='Hybrid blockchain platforms for the Internet of Things', dir=3, year=2022, proj='iot-identity', t='article',
         doi='10.3390/s22041304',
         a=['Ahmed Alkhateeb', 'Cagatay Catal', ME, 'Alok Mishra'],
         full='Hybrid blockchain platforms for the Internet of Things (IoT): A systematic literature review',
         c='Sensors', volume='22', issue='4', pages='1304', publisher='MDPI'),
    dict(key='ozkan2022multiclass', title='Multiclass classification of scientific texts', dir=4, year=2022, proj='applied-ai', t='article',
         doi='10.21923/jesd.973181',
         a=['Mustafa Özkan', ME],
         full='Multiclass classification of scientific texts written in Turkish by applying deep learning technique',
         c='Journal of Engineering Sciences and Design', volume='10', issue='2', pages='504--519'),
    dict(key='omerustaoglu2020distracted', title='Distracted driver detection', dir=1, year=2020, proj='driver-behavior', t='article',
         doi='10.1016/j.asoc.2020.106657',
         a=['Furkan Omerustaoglu', 'C. Okan Sakar', ME],
         full='Distracted driver detection by combining in-vehicle and image data using deep learning',
         c='Applied Soft Computing', volume='96', pages='106657', publisher='Elsevier'),
    dict(key='qiu2018towards', title='Towards robust vehicular context sensing', dir=1, year=2018, proj='perception', t='article',
         doi='10.1109/TVT.2017.2771623',
         free='https://www3.cs.stonybrook.edu/~jain/papers/vehiclesensing_tvt2017.pdf',
         a=['Hang Qiu', 'Jinzhu Chen', 'Shubham Jain', 'Yurong Jiang', 'Matt McCartney', ME, 'Fan Bai',
            'Donald K. Grimm', 'Marco Gruteser', 'Ramesh Govindan'],
         full='Towards robust vehicular context sensing',
         c='IEEE Transactions on Vehicular Technology', volume='67', issue='3', pages='1909--1922', publisher='IEEE'),
    # ---- conference papers
    dict(key='aydogan2025attrition', title='Explainable AI-driven exploration of employee attrition', dir=4, year=2025, proj='applied-ai',
         t='inproceedings',
         a=['F. Aydogan', 'B. Aydogan', ME, 'C. Catal', 'A. Aksoy'],
         full='Explainable AI-driven exploration of employee attrition mechanisms',
         c='IEEE Latin American Conference on Computational Intelligence (LA-CCI)', publisher='IEEE'),
    dict(key='aksoy2024comparative', title='Comparative analysis of feature selection algorithms', dir=3, year=2024, proj='iot-identity',
         t='inproceedings', doi='10.5220/0012379100003648',
         free='https://www.scitepress.org/Papers/2024/123791/123791.pdf',
         a=['Ahmet Aksoy', 'Sundeep Varma', 'Ganesha Moorthy', 'Enya Pan', ME],
         full='Comparative analysis of feature selection algorithms for automated IoT device fingerprinting',
         c='Proceedings of the 10th International Conference on Information Systems Security and Privacy (ICISSP)',
         pages='430--437', publisher='SCITEPRESS'),
    dict(key='kar2019scotto', title='Scotto', dir=1, year=2019, proj='driver-behavior', t='inproceedings',
         doi='10.1109/VTCSpring.2019.8746461',
         a=[ME, 'Batuhan Asiroglu', 'Fatih Sinan Bir'],
         full='Scotto: Real-time driver behavior scoring using in-vehicle data',
         c='2019 IEEE 89th Vehicular Technology Conference (VTC2019-Spring)', pages='1--5', publisher='IEEE'),
    dict(key='helvaci2018improving', title='Improving driver behavior using gamification', dir=1, year=2018, proj='driver-behavior',
         t='inproceedings', doi='10.1007/978-3-319-97163-6_16',
         a=['Simge Helvaci', 'Aras Senova', ME, 'Sezer Gören'],
         full='Improving driver behavior using gamification',
         c='Mobile Web and Intelligent Information Systems (MobiWIS 2018)', series='Lecture Notes in Computer Science',
         pages='193--204', publisher='Springer'),
    dict(key='kar2017predriveid', title='PredriveID', dir=1, year=2017, proj='vehicles', t='inproceedings',
         doi='10.1145/3132211.3134462', free='https://par.nsf.gov/servlets/purl/10096392',
         a=[ME, 'Shubham Jain', 'Marco Gruteser', 'Jinzhu Chen', 'Fan Bai', 'Ramesh Govindan'],
         full='PredriveID: Pre-trip driver identification from in-vehicle data',
         c='Proceedings of the Second ACM/IEEE Symposium on Edge Computing (SEC)', pages='1--12', publisher='ACM'),
    dict(key='kar2017traffic', title='Real-time traffic estimation at vehicular edge nodes', dir=1, year=2017, proj='vehicles',
         t='inproceedings', doi='10.1145/3132211.3134461', free='https://par.nsf.gov/servlets/purl/10096391',
         a=[ME, 'Shubham Jain', 'Marco Gruteser', 'Fan Bai', 'Ramesh Govindan'],
         full='Real-time traffic estimation at vehicular edge nodes',
         c='Proceedings of the Second ACM/IEEE Symposium on Edge Computing (SEC)', pages='1--13', publisher='ACM'),
    dict(key='qiu2017augmented', title='Augmented vehicular reality', dir=1, year=2017, proj='perception', t='inproceedings',
         doi='10.1145/3032970.3032976',
         a=['Hang Qiu', 'Fawad Ahmad', 'Ramesh Govindan', 'Marco Gruteser', 'Fan Bai', ME],
         full='Augmented vehicular reality: Enabling extended vision for future vehicles',
         c='Proceedings of the 18th International Workshop on Mobile Computing Systems and Applications (HotMobile)',
         pages='67--72', publisher='ACM', free='https://www.winlab.rutgers.edu/~gruteser/papers/hotmobile17-final28.pdf'),
    dict(key='liu2015snooping', title='Snooping keystrokes with mm-level audio ranging', dir=4, year=2015, proj='side-channels',
         t='inproceedings', doi='10.1145/2789168.2790122',
         free='https://personal.stevens.edu/~ychen6/papers/Snooping%20Keystrokes%20with%20mmlevel%20Audio%20Ranging%20on%20a%20Single%20Phone.pdf',
         a=['Jian Liu', 'Yan Wang', ME, 'Yingying Chen', 'Jie Yang', 'Marco Gruteser'],
         full='Snooping keystrokes with mm-level audio ranging on a single phone',
         c='Proceedings of the 21st Annual International Conference on Mobile Computing and Networking (MobiCom)',
         pages='142--154', publisher='ACM'),
    dict(key='kar2014detection', title='Detection of on-road vehicles emanating GPS interference', dir=1, year=2014, proj='vehicles',
         t='inproceedings', doi='10.1145/2660267.2660336', free='https://par.nsf.gov/servlets/purl/10096387',
         a=[ME, 'Hossen Mustafa', 'Yan Wang', 'Yingying Chen', 'Wenyuan Xu', 'Marco Gruteser', 'Tam Vu'],
         full='Detection of on-road vehicles emanating GPS interference',
         c='Proceedings of the 2014 ACM SIGSAC Conference on Computer and Communications Security (CCS)',
         pages='621--632', publisher='ACM'),
    # ---- theses and patent
    dict(key='kar2017dissertation', title='Enhancing vehicle data availability and privacy', dir=1, year=2017, proj='vehicles',
         t='phdthesis', doi='10.7282/T3SB48MK',
         a=[ME], full='Enhancing vehicle data availability and privacy for connected cars',
         school='Rutgers, The State University of New Jersey'),
    dict(key='kar2011performance', title='Performance of static and adaptive subchannel allocation', dir=4, year=2011,
         proj='wireless-ffr', t='mastersthesis', url='https://hdl.handle.net/11693/15261',
         a=[ME], full='Performance of static and adaptive subchannel allocation schemes for fractional frequency reuse in WiMAX networks',
         school='Bilkent University'),
    dict(key='bai2019patent', title='Method and apparatus of differentiating drivers', dir=1, year=2019, proj='vehicles',
         t='patent', url='https://patents.google.com/patent/US10332020B2/en',
         a=['Fan Bai', ME, 'D. C. Martin', 'Donald K. Grimm', 'Marco Gruteser'],
         full='Method and apparatus of differentiating drivers based on driving behaviors',
         number='US 10,332,020 B2', date='2019-06-25',
         holder='GM Global Technology Operations LLC and Rutgers, The State University of New Jersey'),
]

BY_DOI = {p['doi'].lower(): p for p in PAPERS if p.get('doi')}


def split(name):
    """'Given Family' -> (given, family). 'Given|Family' forces the split."""
    if '|' in name:
        g, f = name.split('|')
        return g.strip(), f.strip()
    parts = name.split()
    return ' '.join(parts[:-1]), parts[-1]


def initials(given):
    out = []
    for w in given.replace('.', ' ').split():
        out.append('-'.join(x[0] + '.' for x in w.split('-')))
    return ' '.join(out)


def bib_escape(s):
    return s.replace('&', r'\&').replace('%', r'\%')


def bibtex(p):
    t = p['t']
    typ = {'patent': 'misc'}.get(t, t)
    f = [('author', ' and '.join(f'{split(n)[1]}, {split(n)[0]}' for n in p['a'])),
         ('title', '{' + bib_escape(p['full']) + '}')]
    if t == 'article':
        f.append(('journal', bib_escape(p['c'])))
    elif t == 'inproceedings':
        f.append(('booktitle', bib_escape(p['c'])))
        if p.get('series'):
            f.append(('series', p['series']))
    elif t in ('phdthesis', 'mastersthesis'):
        f.append(('school', p['school']))
    elif t == 'patent':
        f.append(('howpublished', f"U.S. Patent {p['number'].replace('US ', '')}"))
        f.append(('note', 'Assignees: ' + bib_escape(p['holder'])))
    for k in ('volume', 'issue', 'pages'):
        if p.get(k):
            f.append(('number' if k == 'issue' else k, p[k]))
    f.append(('year', str(p['year'])))
    if p.get('publisher') and t != 'patent':
        f.append(('publisher', p['publisher']))
    if p.get('doi'):
        f.append(('doi', p['doi']))
    if p.get('url'):
        f.append(('url', p['url']))
    w = max(len(k) for k, _ in f)
    body = ',\n'.join(f'  {k.ljust(w)} = {{{v}}}' if not v.startswith('{') else f'  {k.ljust(w)} = {{{v}}}' for k, v in f)
    return f'@{typ}{{{p["key"]},\n{body}\n}}'


def apa_names(names):
    out = []
    for n in names:
        g, fam = split(n)
        out.append(f'{fam}, {initials(g)}')
    if len(out) == 1:
        return out[0]
    if len(out) <= 20:
        return ', '.join(out[:-1]) + ', & ' + out[-1]
    return ', '.join(out[:19]) + ', ... ' + out[-1]


def apa(p):
    """A citation in APA 7 style, as plain text."""
    au, y, t = apa_names(p['a']), p['year'], p['full']
    pages = p.get('pages', '').replace('--', '–')
    link = f"https://doi.org/{p['doi']}" if p.get('doi') else p.get('url', '')
    kind = p['t']
    if kind == 'article':
        s = f"{au} ({y}). {t}. {p['c']}"
        if p.get('volume'):
            s += f", {p['volume']}"
            if p.get('issue'):
                s += f"({p['issue']})"
        if pages:
            s += f", {pages}"
        s += '.'
    elif kind == 'inproceedings':
        s = f"{au} ({y}). {t}. In {p['c']}"
        if pages:
            s += f" (pp. {pages})" if '–' in pages else f" ({pages})"
        s += '.'
        if p.get('publisher'):
            s += f" {p['publisher']}."
    elif kind in ('phdthesis', 'mastersthesis'):
        what = 'Doctoral dissertation' if kind == 'phdthesis' else "Master's thesis"
        s = f"{au} ({y}). {t} [{what}, {p['school']}]."
    else:  # patent
        s = f"{au} ({y}). {t} (U.S. Patent No. {p['number'].replace('US ', '').replace(' B2', '')})."
    return s + (f' {link}' if link else '')


def jsonld(p):
    """schema.org ScholarlyArticle (or Thesis / CreativeWork) for one paper."""
    typ = {'phdthesis': 'Thesis', 'mastersthesis': 'Thesis', 'patent': 'CreativeWork'}.get(p['t'], 'ScholarlyArticle')
    d = {'@type': typ, '@id': SITE_URL + 'publications.html#' + p['key'], 'name': p['full'],
         'datePublished': str(p['year']),
         'author': [{'@id': SITE_URL + '#person'} if n == ME else {'@type': 'Person', 'name': n.replace('|', ' ')}
                    for n in p['a']]}
    if p.get('doi'):
        d['url'] = 'https://doi.org/' + p['doi']
        d['identifier'] = {'@type': 'PropertyValue', 'propertyID': 'DOI', 'value': p['doi']}
    elif p.get('url'):
        d['url'] = p['url']
    if p.get('c'):
        d['isPartOf'] = {'@type': 'Periodical' if p['t'] == 'article' else 'CreativeWork', 'name': p['c']}
    if p.get('school'):
        d['sourceOrganization'] = {'@type': 'CollegeOrUniversity', 'name': p['school']}
    if p.get('publisher'):
        d['publisher'] = {'@type': 'Organization', 'name': p['publisher']}
    if p.get('free'):
        d['sameAs'] = p['free']
    if p.get('oa') or p.get('free'):
        d['isAccessibleForFree'] = True
    return d


def find(title):
    t = title.lower()
    for p in PAPERS:
        if t.startswith(p['title'].lower()):
            return p
    return None
