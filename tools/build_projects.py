#!/usr/bin/env python3
"""Generates the research project pages in research/ (the site folder above tools/).

Every number on these pages comes from the cited paper; the source line under
each chart names the paper and section/figure. Edit here, then run:
    python3 build_projects.py
"""
import os, html, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from directions import start_here_detailed  # detailed Start here steps (Nov 27)
from discuss import discussion
import json
import seo  # search-result titles and descriptions
from chrome import header, footer, asset_version, head_extras, SITE  # shared header, footer and asset version

V = asset_version()

OUT = os.path.join(SITE, 'research')
SCHOLAR = 'https://scholar.google.com/citations?user=dz-6amUAAAAJ&amp;hl=en'
SC = 'https://scholar.google.com/citations?view_op=view_citation&amp;hl=en&amp;user=dz-6amUAAAAJ&amp;citation_for_view=dz-6amUAAAAJ:'

PROJECTS = [
    ('vehicles', 'Connected vehicles: sensing, identity and trust'),
    ('perception', 'Extending what a car can see and sense'),
    ('driver-behavior', 'Scoring and coaching drivers from in-vehicle data'),
    ('quantum-ids', 'Hybrid quantum-classical intrusion detection'),
    ('quantum-spectra', 'Quantum machine learning for Raman spectroscopy'),
    ('iot-identity', 'IoT device identity and network incidents'),
    ('side-channels', 'Acoustic side channels on phones'),
    ('applied-ai', 'Explainable and applied AI'),
    ('wireless-ffr', 'Sharing spectrum fairly: fractional frequency reuse'),
]


def bar(label, v, shown, hi=False):
    return (f'<div class="bar{" hi" if hi else ""}"><span class="bl">{label}</span>'
            f'<span class="bt"><span class="bf" style="--v:{v}"></span></span><span class="bv">{shown}</span></div>')


def chart(title, bars, src):
    return (f'<figure class="chart reveal" aria-label="{html.escape(title)}"><h3>{title}</h3>'
            + ''.join(bar(*b) for b in bars) + f'<figcaption class="src">{src}</figcaption></figure>')


def stats(items, src=None):
    s = '<div class="stats reveal">' + ''.join(f'<div class="stat-t"><b>{a}</b><span>{b}</span></div>' for a, b in items) + '</div>'
    if src:
        s += f'<p class="src">{src}</p>'
    return s


def flow(steps, label):
    return (f'<ol class="flow" aria-label="{label}">'
            + ''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in steps) + '</ol>')


def fig(svg, cap):
    return f'<figure class="fig reveal">{svg}<figcaption>{cap}</figcaption></figure>'


def pubs(items):
    """Paper list on a project page, with a free copy and a citation link where papers.py has them."""
    import papers
    out = '<ol class="pubs">'
    for t, a, v, link in items:
        p = papers.BY_DOI.get(link.split('doi.org/')[-1].lower()) if 'doi.org/' in link else papers.find(re.sub('<.*?>', '', t))
        extra = ''
        if p and p.get('free'):
            extra += f'<a href="{p["free"]}">Free PDF</a>'
        if p and p.get('cite', True) and p.get('a'):
            extra += f'<a href="../publications.html#{p["key"]}">Cite</a>'
        out += (f'<li><div class="pt">{t}</div><div class="pa">{a}</div><div class="pv">{v}</div>'
                f'<div class="pl"><a href="{link}">Paper</a>{extra}</div></li>')
    return out + '</ol>'


# ---------------------------------------------------------------- live, interactive figures (live.js)
DISC = 'A simplified model of the idea, for illustration. It does not reproduce the paper\'s data or results.'
DISC_PLANNED = 'A simplified model of the idea, for illustration. This project has not started; there are no results yet.'
DEMOS = {
    'vehicles': ('jam', 'Find the jammer', 720, 300,
        'Cars drive past two roadside checkpoints. When a checkpoint senses GPS interference, it notes every car in view. The jammer is the car on both lists.',
        'Animated highway with numbered cars and two checkpoints; each checkpoint lists the cars it saw when it sensed interference, and the car on both lists is named as the jammer', DISC),
    'side-channels': ('tdoa', 'Hear which key was pressed', 720, 340,
        'Click a key, or click the figure and type. The sound reaches the phone\'s two microphones a few microseconds apart. That one time difference places the key on a curve, not a point, so every key on the shaded band sounds the same to the timing step; the paper then tells those keys apart by their sound.',
        'A keyboard above a phone with two microphones; the pressed key sends sound to both microphones, a shaded band marks every point with the same time difference, and a small timeline shows the two arrivals', DISC),
    'iot-identity': ('packet', 'Which device sent this packet?', 720, 300,
        'Send one packet from a device. A simple nearest-profile classifier reads four header fields and names the device. Turn up the network noise and watch it start to confuse devices.',
        'Header fields of one packet and a bar for each device showing how close the packet is to that device profile', DISC + ' The header profiles are invented.'),
    'quantum-ids': ('qubit', 'Turn a feature into a qubit rotation', 720, 300,
        'Hybrid quantum models often encode a scaled input as a rotation of a qubit. Move the feature and the trainable rotation; measuring the qubit gives each outcome with the probability shown, and a run of shots samples it.',
        'A circle slice of the Bloch sphere with the qubit state vector, bars for the probabilities of measuring 0 and 1, and a bar for sampled shots', DISC),
    'applied-ai': ('shap', 'Explain one prediction', 720, 320,
        'A toy model of whether an employee will leave, with invented weights. Start from the average employee at the top; each input then moves the risk up (red) or down (blue) until you reach this employee at the bottom. Move the sliders and watch the steps change. For a simple model like this, the steps are exactly the SHAP values.',
        'A waterfall chart: starting from the average risk, one step per input moves the predicted risk up or down, ending at this employee\'s risk on a percentage axis', DISC + ' The model and its weights are invented.'),
    'planned-gnss': ('gnss', 'Catch a spoofed GPS fix', 720, 300,
        'The blue line is where wheel speed and steering say the car is; the dashed red line is the GPS fix. Start the spoofer and the two drift apart. Set the alarm threshold too low and normal noise raises false alarms; too high and the spoofer gets further before it is caught.',
        'A car path from wheel and steering data and a GPS path that drifts away when spoofing starts, with a plot of the gap between them against an alarm threshold', DISC_PLANNED),
    'planned-can': ('can', 'Spot an intruder on the bus', 720, 230,
        'Each identifier on a car\'s internal bus repeats at a steady rhythm. Plug in an injector that floods one identifier and the timing detector flags frames that arrive much faster than usual.',
        'Four rows of periodic bus frames scrolling past; injected frames are flagged when they arrive faster than their identifier\'s usual period', DISC_PLANNED + ' The identifiers and periods are invented.'),
    'perception': ('avr', 'See past the truck', 720, 280,
        'A truck blocks your car\'s view of a stopped car ahead. Move the gap, click the road to move the stopped car, and turn on sharing to add what the truck\'s own sensors see.',
        'Top view of a road: your car, a truck that casts a blind zone, a stopped car, and the truck\'s shared sensor view', DISC),
    'driver-behavior': ('score', 'Score a trip', 720, 290,
        'A simulated drive: speed on top, acceleration below. Braking or speeding up past the dashed line counts as a harsh event and costs points. Make the driver calmer or more aggressive, or move the line.',
        'Speed and acceleration traces of a simulated trip with harsh events marked, and a trip score ring', DISC + ' The trip, thresholds and scoring rule are invented.'),
    'quantum-spectra': ('quanv', 'Slide a quantum filter over a spectrum', 720, 300,
        'A window slides along a made-up Raman spectrum. Each point in the window rotates one qubit; after a chain of entangling gates, measuring all qubits together gives the product of cos(π × value), one number per window. Those numbers form the feature map a classical network would read.',
        'A spectrum with a sliding window, qubit dials showing each rotation, and a bar chart of the quantum feature map', DISC + ' The spectra are invented.'),
    'wireless-ffr': ('ffr', 'Split the band between center and edge', 720, 370,
        'The bar under the cells shows how the band is cut: one part every cell center reuses, and the rest split three ways so neighboring cell edges never share a slice. Move the inner share: total throughput rises, but edge users get less, so fairness falls. The best balance depends on how many users sit near the edge.',
        'Seven hexagonal cells with users in the middle cell, a bar showing how the band is split between the shared center part and three edge parts, and curves of throughput, Jain fairness and their product against the inner share', DISC + ' The link efficiencies are invented.'),
    'planned-encrypted': ('flows', 'Name the app without reading it', 720, 290,
        'Three apps and one unknown encrypted flow, drawn as packet sizes over time. A nearest-profile classifier guesses the app from sizes and timing alone. Turn on padding and timing changes and see what it costs to stop it.',
        'Packet size and timing strips for three apps and an unknown flow, with the classifier guess', DISC_PLANNED + ' The app profiles are invented.'),
    'planned-v2x': ('v2x', 'Catch a ghost car', 720, 290,
        'Someone broadcasts a car ahead of you that is not there, claiming hard braking. Switch on the checks: the motion check catches a crude ghost that jumps around; a careful ghost is caught only where a camera or your radar can look.',
        'A road with your car, other cars, a ghost car drawn dashed, a roadside camera zone and radar cone, and which checks flagged the ghost', DISC_PLANNED),
    'planned-benchmark': ('leak', 'Find the shortcut', 720, 290,
        'Four made-up devices, each recorded mostly in its own week. Under a random split, a model that only knows the capture day looks brilliant. Split by time and the shortcut collapses, while the real behavior feature holds up.',
        'Scatter of capture day against a behavior feature, colored by device, and test accuracy bars for two nearest-neighbor models', DISC_PLANNED + ' The data are random.'),
    'planned-quantum': ('ci', 'Is a one-point gap real?', 720, 285,
        'Two models whose true accuracies differ by one point. Each test run samples a new test set; the bars are 95% confidence intervals. Small test sets cannot tell the models apart, which is why fair benchmarks need statistics.',
        'Two rows of accuracy estimates with 95 percent confidence intervals and the dots of earlier runs', DISC_PLANNED + ' The two accuracies are invented.'),
    'planned-xai': ('deletion', 'Check an explanation', 720, 300,
        'An alert from a toy detector. Remove features in the order the explanation ranks them and watch the alert score: a faithful explanation makes it fall faster than a random order. Switch to the detector that learned a shortcut.',
        'Ranked feature bars for one alert, and deletion curves comparing the explanation order with a random order', DISC_PLANNED + ' The model and its weights are invented.'),
    'planned-acoustic': ('rate', 'What survives the audio pipeline?', 720, 350,
        'A keystroke gives an attacker two clues: when its sound reaches each microphone (where the key is) and what it sounds like (which key it is). Pick how the audio is captured and see which clues are left. Fewer samples per second blur the timing, mono audio erases it, and noise suppression and a narrow band strip the sound.',
        'Two microphone waveforms of one keystroke sampled at the chosen rate, a spectrum showing how much of the keystroke sound is kept, and a row of keys marking the timing resolution', DISC_PLANNED + ' The keystroke waveform and spectrum are invented; real attacks refine timing below one sample.'),
    'planned-rag': ('rag', 'Poison the chatbot, then defend it', 720, 270,
        'A student asks about the drop deadline. Four passages come back, one planted. Switch defenses on and see which passages the chatbot may use, and what each defense costs.',
        'Four retrieved passages with their sources, which ones are removed by each defense, and the chatbot answer', DISC_PLANNED + ' The passages and dates are invented.'),
    'planned-tinyml': ('tiny', 'Will the model fit?', 720, 300,
        'Memory for the weights is just weights × bits. Shrink the model or the bits until it fits under an example RAM budget, and watch the rounding error that fewer bits cause on a typical weight distribution.',
        'A memory bar against a RAM line, and a weight histogram with the quantization grid', DISC_PLANNED + ' Weights only; activations and code need room too.'),
    'planned-pqc': ('pqc', 'Count the radio frames', 720, 310,
        'Real key, ciphertext and signature sizes for today\'s and post-quantum algorithms. Small radios carry little per frame, so set the payload size and count the frames a handshake needs.',
        'Bars of handshake bytes for X25519, ML-KEM, Ed25519 and ML-DSA with the number of frames needed at the chosen payload size', 'Sizes are from the algorithm standards (NIST FIPS 203 and 204, RFC 7748 and 8032). Frame counts ignore headers and retransmissions. This project has not started; there are no results yet.'),
    'planned-blockchain': ('chain', 'Tamper with the ledger', 720, 280,
        'Each block records a device and its traffic fingerprint and the hash of the block before it. Tamper with one and the chain shows it. Then let a cloned device check in with a valid credential but the wrong behavior.',
        'Five linked ledger blocks marked valid or broken, and a check-in panel comparing ledger and observed fingerprints', DISC_PLANNED),
}


SHORT = {
 'vehicles': ('Can data that cars and phones already produce single out a car jamming GPS, or tell who is behind the wheel?', 'One cheap jammer knocks out GPS for everyone nearby, and knowing who is driving matters for safety, insurance and theft.', 'Two roadside monitoring points together picked out the jamming car in every highway test pass, and the rhythm of starting the car identified the driver with over 90% accuracy within 20 seconds.', 'What we found'),
 'driver-behavior': ("Can a car's own data score how someone drives during the trip, and can that score change how they drive?", 'Insurers and fleets often score drivers from coarse data after the trip, when feedback comes too late to matter.', 'Scotto scores driving in real time from in-vehicle data, and in the gamification study, results on real-world and simulated trips agreed more than 95% of the time.', 'What we found'),
 'perception': ('Can a car see past the truck in front of it, and can the phone in the cabin read the road?', 'Sensors stop at line of sight, so a stopped car or a pedestrian hidden behind a truck stays invisible until it is too late.', 'Nearby cars sharing their sensor views let a car see what was hidden, and phone and car sensors recognized lane changes with over 90% accuracy, more reliably when many drives were combined.', 'What we found'),
 'iot-identity': ('Can a network tell which device sent a packet, and which attack it is facing, from packet headers alone?', 'Vulnerable IoT devices have to be found and isolated quickly, without installing software on them.', "One packet's header named the device with 95.3% weighted accuracy, and features chosen by a genetic algorithm caught two denial-of-service floods every time and DNS botnets and OS scans about 95% of the time.", 'What we found'),
 'quantum-ids': ('Can a small quantum circuit inside a deep-learning pipeline help catch network attacks and mobile malware?', 'A quantum layer has very few parameters, which matters for detectors that must run on gateways and phones.', 'In simulation, one hybrid framework detected DDoS traffic with 99.86% accuracy and classified 12 Android malware families with 95.33%, against 86.80% and 78.94% for classical CNNs.', 'What we found'),
 'quantum-spectra': ('Can hybrid quantum-classical models classify Raman spectra, the light fingerprints of molecules?', 'Spectra are one-dimensional, noisy and costly to label, which makes them a natural test bed for small quantum models.', 'A quanvolutional network classified COVID-19 from the Raman spectra of serum, and a hybrid network classified weathered microplastics while running on a real IonQ quantum processor.', 'What we found'),
 'planned-adversarial': ('Can an attacker fool a network intrusion detector when the traffic must stay valid and the attack must still work?', 'Attacks that change features freely can overstate the risk, and defenses tested only against them give false comfort.', 'Attack the same detectors once in feature space and once under realistic constraints, compare evasion rates, then test defenses against adaptive attacks they have not seen.', 'How we will test it'),
 'planned-benchmark': ('How much of the near-perfect accuracy reported for IoT traffic classifiers survives once shortcuts in the data are removed?', 'A model can score 99% because a field such as an IP address or a timestamp gives away the capture, not because it understands the device or the attack.', 'Train on each field alone to flag shortcuts, then rerun representative pipelines under random, time, network and device splits and report the gap for each.', 'How we will test it'),
 'planned-blockchain': ('Can a ledger of device identities, checked against live traffic, catch cloned or tampered IoT devices?', 'A cloned device can present a valid credential; the network should notice that it behaves like something else and revoke it everywhere.', 'Stage cloning, spoofing and tampering attacks in an IoT testbed, compare detection by the ledger check, the traffic check and both, and load-test the ledger on fog-class hardware.', 'How we will test it'),
 'planned-can': ("Can a detector notice when a message on a car's internal bus does not belong there?", 'Dozens of control units share one bus with no sender authentication, and an attacker who reaches it can control brakes, engine and locks.', 'Benchmark timing, content and learning detectors on public in-vehicle datasets, test them on another car or software version, and profile them on gateway-class hardware.', 'How we will test it'),
 'planned-encrypted': ('How much do packet sizes and timing reveal about the app behind encrypted traffic, and how can users be protected?', 'Operators need to manage networks without breaking encryption, and the same metadata is a privacy risk for users.', 'Evolve small feature sets on labeled encrypted captures, compare classical models with fine-tuned language models, and measure what padding and timing defenses cost.', 'How we will test it'),
 'planned-ev': ('Could an attacker who controls many EV chargers stress the local power grid, and can the attack be caught early?', "One compromised management server can reach thousands of chargers, and switching them together changes a feeder's load in seconds.", 'Simulate charging on standard distribution test feeders as the share of compromised chargers grows, then test detectors on graded attacks for detection delay and false alarms.', 'How we will test it'),
 'planned-federated': ('Can gateways train one intrusion detector together without pooling their traffic, even when one of them is malicious?', 'Traffic is private and often cannot leave the site that recorded it, and any site can send a poisoned update.', 'Split public IoT intrusion datasets across simulated gateways, compare federated, local and pooled models, and measure how few poisoned sites it takes to plant a backdoor under each aggregation rule.', 'How we will test it'),
 'planned-gnss': ('Can a car notice that its GPS is lying, using only the motion data it already has?', 'A spoofer feeds the receiver fake signals and quietly moves the car to the wrong place.', 'Replay recorded drives with injected attacks of graded speed, plot detection delay against false alarms per hour, and run the detector in real time on a phone and an embedded board.', 'How we will test it'),
 'planned-pqc': ('What does moving to post-quantum cryptography cost on small IoT devices, and does it break the tools that watch their traffic?', 'Traffic recorded today can be decrypted later, and the new standards use much larger keys and signatures than small sensors were built for.', 'Measure TLS and MQTT-over-TLS handshakes on several boards with an energy meter, and run traffic models on captures from before and after the switch.', 'How we will test it'),
 'planned-quantum': ('Does a quantum layer really improve intrusion detection, and what survives on real quantum hardware?', 'A large 2024 benchmark found classical models often beat quantum classifiers on small tasks, so a quantum security result has to clear a high bar.', 'Compare quantum layers with classical twins of the same size over many random seeds, then run the same circuits on a noisy simulator and on a quantum processor.', 'How we will test it'),
 'planned-rf': ('Can tiny flaws in each radio identify IoT devices reliably, even when the device moves and conditions change?', 'Addresses and certificates can be copied; the analog flaws of a radio are much harder to fake.', 'Record the same devices over days, temperatures and battery levels, train in one place and test in another, and stage cloning attacks that fake one fingerprint.', 'How we will test it'),
 'planned-tinyml': ('How small can an intrusion detector get before it stops working, and can it run on a microcontroller?', 'Most IoT devices cannot run a full detector, and one on the device keeps working even when the gateway is bypassed.', 'Compress detectors step by step, plot detection rate and false alarms against model size, and compare model families on a microcontroller by energy per inference.', 'How we will test it'),
 'planned-v2x': ('Can a connected car tell when a V2X message describes a vehicle that is not there?', 'A signature proves who sent a message, not that it is true, and a fake car braking hard ahead can trigger emergency braking behind it.', 'Evaluate plausibility checks on public misbehavior datasets and simulated attacks, add roadside and on-board sensors, and profile each detector on embedded boards.', 'How we will test it'),
 'planned-vprivacy': ('Can connected cars share position data for traffic services without revealing where their drivers live and work?', 'A few points in space and time are enough to single out most people, and every morning trace starts at the same house.', 'Re-identify pseudonymous traces in public mobility datasets, then apply noise, cloaking and trip-end hiding and plot re-identification against traffic-estimate error.', 'How we will test it'),
 'planned-xai': ("Do today's explanation methods tell a security analyst the truth about why a detector fired?", 'Analysts must act on alerts quickly, explanation methods can disagree, and a convincing explanation can still be wrong about what the model used.', 'Measure agreement and faithfulness of LIME, SHAP and gradient methods on several detectors, plant known shortcuts to see which explainers find them, and run a study with analysts.', 'How we will test it'),
 'side-channels': ('Can one phone lying near a keyboard tell which keys you press, from sound alone?',
   'Microphones are everywhere, and nobody thinks of them as a way to steal a password.',
   'Yes. Timing each keystroke at the phone\'s two microphones placed it to within millimeters; the first guess was right for 85.5% of keystrokes at 48 kHz and 94.2% at 192 kHz on one keyboard, with no training data.', 'What we found'),
 'applied-ai': ('When a model makes a high-stakes call, such as flagging food fraud or predicting who will quit, can it show which inputs drove it?',
   'Analysts and managers need reasons they can check, not a black-box score.',
   'We compared LIME, SHAP and the What-If Tool on a food-fraud model, explained employee attrition, reviewed 68 crime-prediction studies and sorted Turkish scientific texts with 96% accuracy.', 'What we found'),
 'wireless-ffr': ('How should a cell split its spectrum between users near the tower and users at the edge?',
   'Giving more to the center raises total speed but starves the edge; a network has to be both fast and fair.',
   'Adapting the split to where users actually are gave about 5% higher throughput × fairness than the best fixed split.', 'What we found'),
 'planned-acoustic': ('Do earbuds, smart speakers and video calls leak what you type, the way a phone did in our 2015 attack?',
   'People type passwords during calls every day, surrounded by more microphones than ever.',
   'Record the same typing through each device and app, run a timing attack and a deep-learning attack, and switch each audio-processing stage on and off to see which one removes the leak.', 'How we will test it'),
 'planned-rag': ('Can a planted web page or a crafted question make a campus chatbot give wrong or harmful answers?',
   'Universities are putting these chatbots in front of students for admissions, aid and IT help, and they trust whatever they retrieve.',
   'Red-team a sandboxed copy of our chatbot, compare keyword-plus-vector retrieval with vector search alone, and measure what each defense blocks and what it costs.', 'How we will test it'),
 'planned-llmsoc': ('Can a language model that reads the records around each alert put real incidents ahead of false alarms?',
   'Analysts are buried in false positives, and a confident wrong answer can close a real incident.',
   'Replay labeled alerts, rank them by rule severity, by a model alone and by a model with retrieved context, and check every claim the model makes against the records.', 'How we will test it'),
}


def brief(slug):
    if slug not in SHORT:
        return ''
    q, why, res, lab = SHORT[slug]
    return (f'<section class="brief" aria-label="In short"><div><h2>The question</h2><p>{html.escape(q)}</p></div>'
            f'<div><h2>Why it matters</h2><p>{html.escape(why)}</p></div>'
            f'<div><h2>{lab}</h2><p>{html.escape(res)}</p></div></section>\n')


def live(slug):
    if slug not in DEMOS:
        return ''
    demo, title, w, h, how, alt, disc = DEMOS[slug]
    return f"""<figure class="live" data-demo="{demo}" aria-labelledby="live-{demo}">
  <div class="lhead"><h2 id="live-{demo}">Try it: {html.escape(title)}</h2><span class="kicker">Live illustration</span></div>
  <p class="how">{html.escape(how)}</p>
  <canvas width="{w}" height="{h}" role="img" aria-label="{html.escape(alt)}"></canvas>
  <div class="ctrl"></div>
  <p class="disc">{html.escape(disc)}</p>
</figure>
"""


NEWDIR = {'planned-rag', 'planned-tinyml', 'planned-pqc', 'planned-blockchain'}


def _anchor(t):
    return re.sub(r'[^a-z0-9]+', '-', html.unescape(re.sub('<.*?>', '', t)).lower()).strip('-')[:48]


def _openq(slug):
    items = OPENQ.get(slug)
    if not items:
        return ''
    out = ('<section>\n<h2>Open research questions</h2>\n<p class="muted">Questions this work leaves open. '
           'They are directions, not results; each links to the planned project that takes it up.</p>\n<ol class="rqx open">')
    for q, why, links in items:
        ls = ' · '.join(f'<a href="{s}.html">{t}</a>' for s, t in links)
        out += (f'<li class="reveal"><p class="q">{q}</p><dl><dt>Why it is open</dt><dd>{why}</dd>'
                f'<dt>Taken up in</dt><dd>{ls}</dd></dl></li>')
    return out + '</ol>\n</section>\n'


def _hero(slug, title, lead, body, planned):
    if slug in HERO_OVERRIDE:
        kicker, facts = HERO_OVERRIDE[slug][0], list(HERO_OVERRIDE[slug][1])
    elif planned:
        area = 'New direction' if slug in NEWDIR else 'Core area'
        kicker = 'Planned project · ' + area.lower()
        n = body.count('<p class="q">')
        facts = [area, f'{n} research questions', 'Open to new graduate students']
    else:
        kicker, facts = 'Published work', []
        for v in re.findall(r'<div class="pv">(.*?)</div>', body):
            v = v.replace(' (open access)', '')
            if v not in facts:
                facts.append(v)
        if not facts:
            facts = re.findall(r'<p class="pl"><a [^>]*>(.*?)</a>', body)
        facts = facts[:4]
    if slug in DEMOS:
        facts.append('Live demo')
    chips = ''.join(f'<li>{f}</li>' for f in facts)
    return f'''<section class="phead">
  <span class="kicker">{kicker}</span>
  <h1>{title}</h1>
  <p class="lead">{lead}</p>
  <ul class="facts" aria-label="At a glance">{chips}</ul>
</section>'''



# ---------------------------------------------------------------- "Start here": first steps, tools and data
# Every link below was opened and checked in November 2026.
RES = {
 'cic23': ('CICIoT2023 dataset', 'https://www.unb.ca/cic/datasets/iotdataset-2023.html', 'IoT attack traffic from a 105-device testbed, 33 attacks.'),
 'cic17': ('CIC-IDS2017 dataset', 'https://www.unb.ca/cic/datasets/ids-2017.html', 'Benign and attack network traffic, a common intrusion detection benchmark.'),
 'vpn': ('ISCX VPN-nonVPN dataset', 'https://www.unb.ca/cic/datasets/vpn.html', 'Labeled encrypted traffic across application categories.'),
 'andmal': ('CIC-AndMal2020 dataset', 'https://www.unb.ca/cic/datasets/andmal2020.html', 'Android malware in 14 categories and 191 families.'),
 'toniot': ('TON_IoT datasets', 'https://research.unsw.edu.au/projects/toniot-datasets', 'IoT and industrial IoT telemetry and network data with attacks.'),
 'flower': ('Flower', 'https://flower.ai/docs/', 'Open-source framework for federated learning, with simulation.'),
 'art': ('Adversarial Robustness Toolbox', 'https://github.com/Trusted-AI/adversarial-robustness-toolbox', 'Python library of evasion, poisoning and defense methods.'),
 'gnuradio': ('GNU Radio', 'https://wiki.gnuradio.org/', 'Open-source toolkit for software-defined radio.'),
 'sumo': ('Eclipse SUMO', 'https://eclipse.dev/sumo/', 'Open-source traffic simulator.'),
 'veins': ('Veins', 'https://veins.car2x.org/', 'Vehicular network simulation framework built on SUMO and OMNeT++.'),
 'veremi': ('VeReMi datasets', 'https://veremi-dataset.github.io/', 'Simulated V2X message logs with labeled misbehavior.'),
 'acn': ('ACN-Data', 'https://ev.caltech.edu/dataset', 'Public dataset of real EV charging sessions.'),
 'pandapower': ('pandapower', 'https://www.pandapower.org/', 'Open-source power system modeling in Python.'),
 'ocpp': ('Open Charge Point Protocol (OCPP)', 'https://openchargealliance.org/protocols/open-charge-point-protocol/', 'The protocol between chargers and their management systems.'),
 'attack': ('MITRE ATT&amp;CK', 'https://attack.mitre.org/', 'Knowledge base of adversary tactics and techniques.'),
 'owasp': ('OWASP Top 10 for LLM applications', 'https://genai.owasp.org/llm-top-10/', 'The main risk list for applications built on language models.'),
 'garak': ('garak', 'https://github.com/NVIDIA/garak', 'Open-source scanner that probes language models for prompt injection and leaks.'),
 'hf': ('Hugging Face Transformers', 'https://huggingface.co/docs/transformers/index', 'Library for pre-trained language and sequence models.'),
 'bots': ('Boss of the SOC v3 dataset', 'https://github.com/splunk/botsv3', 'Public security operations dataset of logs and alerts.'),
 'wazuh': ('Wazuh documentation', 'https://documentation.wazuh.com/current/index.html', 'Open-source security monitoring platform for a lab alert pipeline.'),
 'zeek': ('Zeek documentation', 'https://docs.zeek.org/en/current/', 'Network monitor that turns traffic into structured logs.'),
 'opendp': ('OpenDP', 'https://opendp.org/', 'Open-source differential privacy library.'),
 'geolife': ('GeoLife GPS trajectories', 'https://www.microsoft.com/en-us/download/details.aspx?id=52367', 'Public GPS traces from 182 users, Microsoft Research.'),
 'comma': ('comma2k19', 'https://github.com/commaai/comma2k19', 'Driving logs with raw GNSS and all CAN data, including wheel speeds and steering.'),
 'gnsssdr': ('GNSS-SDR', 'https://gnss-sdr.org/', 'Open-source software GNSS receiver.'),
 'carhack': ('HCRL Car-Hacking dataset', 'https://ocslab.hksecurity.net/Datasets/car-hacking-dataset', 'CAN traffic from a real car with injection attacks.'),
 'canutils': ('can-utils', 'https://github.com/linux-can/can-utils', 'Linux SocketCAN tools for logging and replaying CAN traffic.'),
 'carla': ('CARLA', 'https://carla.org/', 'Open-source simulator for autonomous driving research.'),
 'ns3': ('ns-3', 'https://www.nsnam.org/', 'Discrete-event network simulator.'),
 'librosa': ('librosa', 'https://librosa.org/doc/latest/index.html', 'Python audio analysis library.'),
 'shap': ('SHAP', 'https://shap.readthedocs.io/en/latest/', 'Explanations based on Shapley values.'),
 'captum': ('Captum', 'https://captum.ai/', 'Model interpretability for PyTorch.'),
 'scapy': ('Scapy', 'https://scapy.readthedocs.io/en/latest/', 'Python library to read, build and send packets.'),
 'wireshark': ('Wireshark documentation', 'https://www.wireshark.org/docs/', 'The standard packet analyzer.'),
 'oqs': ('Open Quantum Safe', 'https://openquantumsafe.org/', 'Open-source post-quantum cryptography libraries for prototyping.'),
 'fips203': ('NIST FIPS 203 (ML-KEM)', 'https://csrc.nist.gov/pubs/fips/203/final', 'The post-quantum key-encapsulation standard.'),
 'fabric': ('Hyperledger Fabric', 'https://hyperledger-fabric.readthedocs.io/en/latest/', 'Permissioned blockchain platform.'),
 'pennylane': ('PennyLane', 'https://pennylane.ai/qml/', 'Quantum machine learning tutorials and library.'),
 'qiskit': ('Qiskit and IBM Quantum documentation', 'https://quantum.cloud.ibm.com/docs/en/guides', 'Build and run circuits on simulators and IBM hardware.'),
 'sklearn': ('scikit-learn', 'https://scikit-learn.org/stable/getting_started.html', 'Classical machine learning, pipelines and cross-validation.'),
 'pytorch': ('PyTorch', 'https://pytorch.org/get-started/locally/', 'Deep learning framework.'),
 'edge': ('Edge Impulse documentation', 'https://docs.edgeimpulse.com/', 'Train and deploy small models to microcontrollers.'),
 'oracle': ('ORACLE RF fingerprinting dataset', 'https://www.genesys-lab.org/oracle', 'IQ recordings from bit-similar radios, released with the ORACLE paper.'),
}

STARTS = {
 'vehicles': (['Read the GPS-jammer and PredriveID papers below, and write one paragraph on what each assumed about the attacker.',
               'Download the one-minute comma2k19 sample and plot GNSS speed against wheel speed for the same drive.',
               'Build a short highway scenario in SUMO and log every vehicle\'s position, the raw material for roadside detection.',
               'Pick one open question below and write a one-page plan: data, method and how you would measure success.'], ['comma', 'sumo', 'gnsssdr']),
 'perception': (['Read the papers below and sketch the geometry of one occlusion case by hand.',
                 'Install CARLA, place two cars behind a truck, and record what each car\'s sensors see.',
                 'Measure how much of the blind zone a shared view removes, and how much bandwidth that costs.'], ['carla', 'sumo']),
 'driver-behavior': (['Read the papers below and list the events each scoring rule counts.',
                      'Extract speed and acceleration from comma2k19 drives and detect harsh events with a simple threshold.',
                      'Compare your threshold rule with a small classifier, and report how the score changes from drive to drive.'], ['comma', 'sklearn']),
 'quantum-ids': (['Read our EPJ Quantum Technology paper and note each dataset, model size and metric.',
                  'Work through PennyLane\'s variational classifier tutorials.',
                  'Train a classical model on the same data with the same parameter count, the baseline every quantum claim must beat.'], ['pennylane', 'cic23', 'andmal', 'qiskit']),
 'quantum-spectra': (['Read the papers below and redraw the quanvolution pipeline from input spectrum to classifier.',
                      'Rebuild a one-dimensional quanvolution filter in PennyLane on a public spectrum.',
                      'Run the same circuit on a simulator and, with an IBM Quantum account, on hardware, and compare.'], ['pennylane', 'qiskit']),
 'iot-identity': (['Read our ICISSP and Electronics papers below.',
                   'Capture traffic from two of your own devices with Wireshark and extract header fields with Scapy.',
                   'Train a nearest-profile classifier on CICIoT2023 headers and check which fields it leans on.'], ['scapy', 'wireshark', 'cic23']),
 'side-channels': (['Read the keystroke paper below and work through its time-difference geometry for one key.',
                    'Record key presses with a phone, load the audio with librosa and locate each press in time.',
                    'Measure the time difference between two microphones for a few keys and compare with the geometry.'], ['librosa']),
 'applied-ai': (['Read the food-fraud and attrition papers linked on this page.',
                 'Train a small model on a public tabular dataset and explain ten predictions with SHAP.',
                 'Compare two explanation methods on the same predictions and note where they disagree.'], ['shap', 'captum', 'sklearn']),
 'wireless-ffr': (['Read the thesis below and redraw the inner and outer regions of one cell.',
                   'Install ns-3 and run one of its LTE examples with several cells.',
                   'Vary the share of the band used in cell centers and plot throughput and Jain fairness.'], ['ns3']),
 'planned-gnss': (['Read the five papers below, starting with ours.',
                   'Download the comma2k19 sample and compute dead-reckoning position from wheel speed and steering.',
                   'Add a synthetic drift to the GNSS track and plot the gap between the two paths over time.',
                   'Set an alarm threshold from normal driving and report detection delay for your drift.'], ['comma', 'gnsssdr', 'sumo']),
 'planned-benchmark': (['Read the papers below, especially the dos and don\'ts of machine learning in security.',
                        'Load CICIoT2023 and train a classifier with a random split, then with a split by time or by capture.',
                        'Drop fields that identify the capture rather than the device and measure the change.'], ['cic23', 'toniot', 'sklearn']),
 'planned-quantum': (['Read the papers below, including the benchmark study that found classical models hard to beat.',
                      'Rebuild one hybrid model in PennyLane and a classical twin with the same parameter count.',
                      'Run both over repeated splits and report confidence intervals, not single numbers.'], ['pennylane', 'qiskit', 'cic17']),
 'planned-xai': (['Read the papers below.',
                  'Train a malware or intrusion detector and explain its alerts with SHAP and a gradient method from Captum.',
                  'Run a deletion test: remove the top features in ranked order and in random order, and compare.'], ['shap', 'captum', 'andmal']),
 'planned-can': (['Read the papers below.',
                  'Download the HCRL Car-Hacking dataset and plot the gap between frames for each identifier.',
                  'Write a timing detector and report detection and false alarms for each attack type.',
                  'Replay a log on a virtual CAN interface with can-utils to test your detector live.'], ['carhack', 'canutils']),
 'planned-acoustic': (['Read the papers below, including our keystroke ranging paper.',
                       'Record typing through a phone, earbuds and a video call, and load all three with librosa.',
                       'Compare how sharp each key press looks in time and in spectrum after each audio pipeline.'], ['librosa']),
 'planned-encrypted': (['Read the papers below.',
                        'Download the ISCX VPN-nonVPN data and turn each flow into sizes, timing and direction.',
                        'Train a nearest-profile classifier, then add padding to the flows and measure what it costs to stop it.'], ['vpn', 'wireshark', 'hf']),
 'planned-v2x': (['Read the misbehavior survey and the VeReMi paper below.',
                  'Download a VeReMi dataset and write a plausibility check on position and speed.',
                  'Report detection and false alarms per attack type, then try the same check in a Veins simulation.'], ['veremi', 'veins', 'sumo']),
 'planned-rag': (['Read the papers below and the OWASP list of risks for language-model applications.',
                  'Build a small retrieval chatbot over a few public university pages.',
                  'Plant one page with an instruction and measure how often the answer follows it, then scan with garak.'], ['owasp', 'garak', 'hf']),
 'planned-tinyml': (['Read the papers below.',
                     'Train a small detector on TON_IoT network data in PyTorch and count its weights.',
                     'Quantize it to 8 bits and deploy it to a microcontroller board with Edge Impulse, then measure accuracy and memory.'], ['edge', 'pytorch', 'toniot']),
 'planned-pqc': (['Read FIPS 203 and the papers below.',
                  'Build the Open Quantum Safe library and time key generation, encapsulation and decapsulation on a laptop.',
                  'Repeat on a small board and count the radio frames a handshake needs.'], ['oqs', 'fips203']),
 'planned-blockchain': (['Read our hybrid blockchain review and the papers below.',
                         'Set up the Hyperledger Fabric test network and write a contract that stores a device record.',
                         'Add a traffic fingerprint to the record with Scapy and test a cloned device that has the right credential.'], ['fabric', 'scapy']),
 'planned-federated': (['Read the papers below, starting with federated averaging.',
                        'Run a Flower simulation that splits CICIoT2023 across ten sites.',
                        'Add one client that sends scaled updates, then compare mean and median aggregation.'], ['flower', 'cic23', 'toniot']),
 'planned-adversarial': (['Read the papers below, especially the one on attacks in the problem space.',
                          'Train a detector on CIC-IDS2017 and attack it with the Adversarial Robustness Toolbox.',
                          'Write down which features an attacker can really change, then repeat the attack under those limits.'], ['art', 'cic17', 'scapy']),
 'planned-rf': (['Read the papers below, starting with the radiometric signatures paper.',
                 'Download part of the ORACLE dataset and plot constellations for two radios.',
                 'Train a classifier on one recording session and test it on another to see the channel effect.',
                 'Work through the GNU Radio tutorials to plan your own recordings.'], ['oracle', 'gnuradio']),
 'planned-vprivacy': (['Read the papers below, starting with my dissertation.',
                       'Load GeoLife traces and guess each user\'s home from where their trips start and end.',
                       'Add noise with OpenDP or hide trip ends, and measure re-identification and traffic-count error.'], ['geolife', 'opendp', 'sumo']),
 'planned-ev': (['Read the papers below.',
                 'Load ACN-Data sessions and build a day of charging load.',
                 'Attach that load to a pandapower test feeder and add coordinated switching.',
                 'Read the OCPP overview and list which messages could start or stop many sessions.'], ['acn', 'pandapower', 'ocpp']),
 'planned-llmsoc': (['Read the SOC analyst study and the papers below.',
                     'Load the Boss of the SOC v3 data and pick twenty alerts with known outcomes.',
                     'Rank them by severity and by a language model with retrieved context, and count incidents found in the top five.',
                     'Map each incident to MITRE ATT&amp;CK techniques so your labels are consistent.'], ['bots', 'attack', 'wazuh', 'garak']),
}


def start_here(slug):
    if slug not in STARTS:
        return ''
    steps, res = STARTS[slug]
    out = ('<section class="start">\n<h2>Start here</h2>\n<p class="muted">A concrete first month for a student joining this work. '
           'Each step builds on the one before.</p>\n<ol class="steps">')
    for i, s in enumerate(steps):
        out += f'<li><span class="sn">Step {i + 1}</span>{s}</li>'
    out += '</ol>\n<h3>Tools and data</h3>\n<ul class="res">'
    for k in res:
        n, u, d = RES[k]
        out += f'<li><a href="{u}">{n}</a><span>{d}</span></li>'
    out += ('</ul>\n<p class="note">Writing it up? Follow the <a href="latex-overleaf.html">LaTeX and Overleaf guide</a> '
            'for templates, citations, figures and the checks to run before you submit.</p>\n</section>\n')
    return out


# ---------------------------------------------------------------- student guide: LaTeX and Overleaf for publishing
HERO_OVERRIDE = {'latex-overleaf': ('Student guide · writing for publication', ['For my graduate students', 'IEEE and ACM templates', 'Checklist before you submit'])}

def _code(s):
    return '<pre class="code"><code>' + html.escape(s.strip('\n')) + '</code></pre>'

_L = lambda u, t: f'<a href="{u}">{t}</a>'
OV = 'https://docs.overleaf.com/'
GUIDE_BODY = """
<section>
<h2>Why LaTeX, and why Overleaf</h2>
<p>Almost every computer science and engineering venue we submit to, IEEE and ACM conferences and journals alike, provides an official LaTeX template, and reviewers expect papers to look like it. LaTeX keeps numbering of sections, figures, tables, equations and references automatic, so you can move things around without breaking anything. Overleaf runs LaTeX in the browser: nothing to install, one shared copy of the paper, comments and history built in. In my group every paper lives in one Overleaf project shared with me from day one.</p>
<p class="note">You do not need to know LaTeX before you start. Plan one afternoon for the basics below; you will learn the rest while writing.</p>
</section>
<section>
<h2>Your first afternoon</h2>
<ol class="steps">
<li><span class="sn">Step 1</span>Create a free Overleaf account with your university email and read """ + _L(OV + 'getting-started/your-first-project', 'Your first project') + """.</li>
<li><span class="sn">Step 2</span>Work through """ + _L('https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes', 'Learn LaTeX in 30 minutes') + """, typing the examples rather than copying them.</li>
<li><span class="sn">Step 3</span>Keep """ + _L('https://ctan.org/pkg/lshort', 'The Not So Short Introduction to LaTeX') + """ (on CTAN) open as a reference, and use Overleaf's """ + _L(OV + 'getting-started/latex-tutorials', 'tutorial list') + """ when you want more.</li>
<li><span class="sn">Step 4</span>When something will not compile, read """ + _L(OV + 'troubleshooting-and-support/fixing-latex-errors', 'Fixing LaTeX errors') + """ and fix the first error in the log first; later errors are often caused by it.</li>
</ol>
</section>
<section>
<h2>Start from the official template</h2>
<p>Never start a paper from a blank file or from someone else's paper. Start from the venue's official template, and check the call for papers for the exact version, page limit and whether the review is anonymous.</p>
<div class="grid2">
<div class="card"><h3>IEEE conferences</h3><p>IEEE's """ + _L('https://www.ieee.org/conferences/publishing/templates.html', 'manuscript templates page') + """ links the LaTeX template and its instructions, and IEEE's own templates are in the """ + _L('https://www.overleaf.com/gallery/tagged/ieee-official', 'Overleaf IEEE gallery') + """. The class is """ + _L('https://ctan.org/pkg/ieeetran', 'IEEEtran') + """; use its <code>conference</code> option. IEEE warns that guidance text left over from the template can stop a paper from being published, so delete all of it.</p></div>
<div class="card"><h3>ACM conferences and journals</h3><p>ACM's """ + _L('https://www.acm.org/publications/article-templates/proceedings-template.html', 'Primary Article Template page') + """ describes the """ + _L('https://ctan.org/pkg/acmart', 'acmart') + """ class; most proceedings use its <code>sigconf</code> format. The official versions are in the """ + _L('https://www.overleaf.com/gallery/tagged/acm-official', 'Overleaf ACM gallery') + """. For double-blind review, add the options the call for papers asks for, usually <code>review</code> and <code>anonymous</code>.</p></div>
</div>
""" + _code(r'''
% IEEE conference paper: the first lines of main.tex
\documentclass[conference]{IEEEtran}
\usepackage{graphicx}   % figures
\usepackage{booktabs}   % clean tables
\usepackage{amsmath}    % equations
\usepackage{cite}       % sorted, compressed citations [1]-[4]

% ACM instead:  \documentclass[sigconf,review,anonymous]{acmart}
''') + """
<p>Overleaf explains """ + _L(OV + 'templates/creating-a-project-from-a-template', 'creating a project from a template') + """, and you can """ + _L(OV + 'managing-projects-and-files/uploading-a-project', 'upload a project') + """ as a zip when a venue provides its own files.</p>
</section>
<section>
<h2>Organize the project</h2>
<p>One file per section keeps edits small and makes it easy for two people to work at once.</p>
""" + _code(r'''
main.tex            % preamble, title, \input{...} for each section, bibliography
sections/
  introduction.tex
  related.tex
  method.tex
  evaluation.tex
  conclusion.tex
figures/            % PDF figures exported from your plotting scripts
refs.bib            % every reference, one BibTeX entry each
''') + """
<ul>
<li>Pull each section in with <code>\\input{sections/method}</code>.</li>
<li>Keep the scripts that make figures and tables in your Git repository, not in Overleaf; Overleaf holds the paper.</li>
<li>Write one sentence per line. Changes, comments and history become much easier to read.</li>
<li>Label everything with a prefix, such as <code>fig:</code>, <code>tab:</code>, <code>sec:</code> and <code>eq:</code>, and refer to it with <code>\\ref</code>, never by typing a number.</li>
</ul>
</section>
<section>
<h2>Citations with BibTeX</h2>
<p>Overleaf's guide to """ + _L(OV + 'citing-and-references/creating-a-bibliography', 'creating a bibliography') + """ covers the three steps: a <code>.bib</code> file, a bibliography style, and <code>\\cite</code> commands in the text. See also """ + _L(OV + 'citing-and-references/working-with-.bib-files', 'working with .bib files') + """ and the """ + _L(OV + 'citing-and-references/available-bibtex-styles', 'available styles') + """. For IEEE papers use the IEEEtran style that comes with the template; acmart sets its own.</p>
""" + _code(r'''
@inproceedings{kar2014jammer,
  author    = {Kar, Gorkem and Mustafa, Hossen and Wang, Yan and Chen, Yingying
               and Xu, Wenyuan and Gruteser, Marco and Vu, Tam},
  title     = {Detection of On-Road Vehicles Emanating {GPS} Interference},
  booktitle = {Proceedings of the ACM Conference on Computer and Communications Security (CCS)},
  year      = {2014},
  doi       = {10.1145/2660267.2660336}
}

As shown in prior work~\cite{kar2014jammer}, ...
\bibliographystyle{IEEEtran}
\bibliography{refs}
''') + """
<ul>
<li>Copy BibTeX from the publisher's page (IEEE Xplore, the ACM Digital Library) or from the DOI, then check every field. Search engines often get authors, venues and capitalization wrong.</li>
<li>Protect capitals that must stay capitals with braces, as in <code>{GPS}</code> and <code>{IoT}</code>.</li>
<li>Cite only what you have read, and cite the published version rather than a preprint when one exists.</li>
<li>If you keep references in Zotero, Overleaf can """ + _L(OV + 'integrations-and-add-ons/reference-manager-integrations/zotero', 'link to it') + """ on premium plans; otherwise export a <code>.bib</code> file and upload it.</li>
</ul>
</section>
<section>
<h2>Figures and tables</h2>
<p>Start with Overleaf's pages on """ + _L(OV + 'writing-and-editing/inserting-images', 'inserting images') + """ and """ + _L(OV + 'writing-and-editing/generating-and-inserting-tables', 'tables') + """, then use """ + _L('https://ctan.org/pkg/booktabs', 'booktabs') + """ for tables that look professional.</p>
""" + _code(r'''
\begin{figure}[t]
  \centering
  \includegraphics[width=\columnwidth]{figures/detection-delay.pdf}
  \caption{Detection delay against false alarms per hour for three attack speeds.}
  \label{fig:delay}
\end{figure}

\begin{table}[t]
  \centering
  \caption{Accuracy under random and time-based splits.}
  \label{tab:splits}
  \begin{tabular}{lrr}
    \toprule
    Model & Random split & Time split \\
    \midrule
    k-NN  & --   & --   \\
    \bottomrule
  \end{tabular}
\end{table}
''') + """
<ul>
<li>Export plots as PDF so they stay sharp at any zoom, and set font sizes in the plotting script so the text in a figure matches the paper.</li>
<li>Make figures readable in grayscale and for color-blind readers: vary line style and marker as well as color.</li>
<li>Put <code>\\label</code> after <code>\\caption</code>, or the reference will point to the wrong number.</li>
<li>A caption should say what the reader should notice, not only what is plotted.</li>
<li>Table captions go above the table and figure captions below, as the IEEE and ACM templates do.</li>
</ul>
</section>
<section>
<h2>Writing together</h2>
<ul>
<li><b>Sharing:</b> """ + _L(OV + 'collaborating/sharing-a-project', 'share the project') + """ with me by email invitation, not with a public link. Projects are private by default; keep them that way until the paper is out.</li>
<li><b>Comments:</b> use """ + _L(OV + 'collaborating/commenting', 'comments') + """ for questions and resolve them when they are settled.</li>
<li><b>Track changes:</b> """ + _L(OV + 'collaborating/track-changes', 'track changes') + """ shows every edit for review; it needs a premium plan on the project owner's account, so check what your university provides.</li>
<li><b>History:</b> """ + _L(OV + 'writing-and-editing/history-and-versioning', 'history and versioning') + """ lets you label the version you submitted and go back to it.</li>
<li><b>Git:</b> Overleaf can """ + _L(OV + 'integrations-and-add-ons/git-integration-and-github-synchronization', 'sync with Git and GitHub') + """ on premium plans, which keeps the paper next to its code.</li>
</ul>
</section>
<section>
<h2>Before you submit</h2>
<ol class="check">
<li>Page limit met, counting exactly what the call for papers counts (references often do not count; appendices often do).</li>
<li>For double-blind review: no author names, no acknowledgments, no links to your own repositories, and your own earlier work cited in the third person.</li>
<li>All template guidance text removed.</li>
<li>No warnings about undefined references or citations, and no <code>??</code> anywhere in the PDF.</li>
<li>Every figure and table referenced in the text, in order, and readable when printed.</li>
<li>Every number in the text matches the tables, and every table matches the scripts that produced it.</li>
<li>References complete: authors, title, venue, year, pages or DOI, with capitalization protected.</li>
<li>Spell check run, and the abstract read aloud once.</li>
<li>If the venue asks you to check the PDF with a publisher tool, do it before the deadline day.</li>
<li>For a preprint, work through Overleaf's """ + _L(OV + 'troubleshooting-and-support/checklist-for-arxiv-submissions', 'arXiv checklist') + """, and read Overleaf's notes on """ + _L(OV + 'templates/submitting-to-publishers', 'submitting to publishers') + """.</li>
<li>Send me the PDF at least one week before the deadline. Nothing is submitted without every author's approval.</li>
</ol>
</section>
<section>
<h2>How we write papers in my group</h2>
<ol class="steps">
<li><span class="sn">Week 1</span>Write the title, a five-sentence abstract and the list of figures before any prose. If the figures do not tell the story, the text will not either.</li>
<li><span class="sn">Week 2</span>Fill in method and evaluation, the sections you know best. Introduction and related work come last.</li>
<li><span class="sn">Weekly</span>Each Friday, leave a short comment at the top of main.tex saying what changed and what you are stuck on.</li>
<li><span class="sn">Before review</span>Label the version in Overleaf history, export the PDF and send it for internal review.</li>
</ol>
</section>
"""

COLS = [
 ('Connected vehicles', ['vehicles', 'perception', 'driver-behavior', 'planned-gnss', 'planned-can', 'planned-v2x', 'planned-vprivacy', 'planned-ev']),
 ('Lightweight and quantum detection', ['quantum-ids', 'quantum-spectra', 'planned-quantum', 'planned-tinyml', 'planned-xai', 'planned-federated', 'planned-adversarial']),
 ('Device identity and integrity', ['iot-identity', 'planned-benchmark', 'planned-encrypted', 'planned-blockchain', 'planned-pqc', 'planned-rf']),
 ('Side channels and applied AI', ['side-channels', 'applied-ai', 'wireless-ffr', 'planned-acoustic', 'planned-rag', 'planned-llmsoc']),
]


def _title(slug):
    return (P.get(slug) or PL.get(slug))[0]


def related(slug):
    for name, slugs in COLS:
        if slug in slugs:
            break
    else:
        return ''
    others = [x for x in slugs if x != slug]
    mine = slug.startswith('planned-')
    others.sort(key=lambda x: x.startswith('planned-') == mine)   # the other kind first
    cards = ''
    for x in others[:4]:
        kind = 'Open project' if x.startswith('planned-') else 'Published work'
        cards += (f'<a class="rcard{" planned" if x.startswith("planned-") else ""}" href="{x}.html">'
                  f'<span class="kicker">{kind}</span><span class="rt">{_title(x)}</span><span class="ra" aria-hidden="true">→</span></a>')
    return (f'<section class="related" aria-labelledby="related-h"><h2 id="related-h">More in {name[0].lower() + name[1:]}</h2>'
            f'<div class="rgrid">{cards}</div></section>\n')




# Where the old one-page anchors now live (site split into pages, Nov 27, 2026).
BACK = {'research': 'projects.html#projects-in-depth', 'open-projects': 'projects.html#open-projects',
        'students': 'work-with-me.html#students'}


CRUMB_LD = {'research': ('Projects', 'projects.html'), 'open-projects': ('Projects', 'projects.html'),
            'students': ('Work with me', 'work-with-me.html')}


def crumbs_ld(slug, title, back):
    """Breadcrumb data, so search results show Gorkem Kar > Projects > page instead of a bare address."""
    name, url = CRUMB_LD[back]
    items = [('Gorkem Kar', 'https://gkar87.github.io/'), (name, 'https://gkar87.github.io/' + url),
             (re.sub('<.*?>', '', html.unescape(title)), f'https://gkar87.github.io/research/{slug}.html')]
    ld = {'@context': 'https://schema.org', '@type': 'BreadcrumbList',
          'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}
    return '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>'


def page(slug, title, lead, body, group=None, crumb='Published work', back='research'):
    planned = group is not None
    group = group or PROJECTS
    body = body.replace('<!--CONTRIB-->', ('<h3>Expected contributions</h3><ul class="contrib">'
                        + ''.join(f'<li>{c}</li>' for c in CONTRIB[slug]) + '</ul>') if slug in CONTRIB else '')
    st = start_here_detailed(slug, RES, STARTS, start_here)
    dsc = discussion(slug, planned)
    if not planned:
        oq = dsc + _openq(slug) + st
        m = re.search(r'<section>\s*<h2>(Papers|Paper|Thesis)</h2>', body)
        body = body[:m.start()] + oq + body[m.start():] if m else body + oq
    elif st or dsc:
        k = '<section>\n<h2>Skills you will use'
        body = body.replace(k, dsc + st + k, 1) if k in body else body + dsc + st
    toc = [('live-' + DEMOS[slug][0], 'Try it')] if slug in DEMOS else []
    def _id(m):
        a = _anchor(m.group(1)); toc.append((a, re.sub('<.*?>', '', m.group(1)))); return f'<h2 id="{a}">{m.group(1)}</h2>'
    body = re.sub(r'<h2>(.*?)</h2>', _id, body)
    # On phones the list folds behind one tap; site.js opens it on wide screens, where it is a sidebar.
    tocnav = ('<nav class="toc" aria-label="On this page"><details><summary>On this page</summary><ul>'
              + ''.join(f'<li><a href="#{a}">{t}</a></li>' for a, t in toc) + '</ul></details></nav>')
    i = [p[0] for p in group].index(slug)
    prev = group[i - 1] if i > 0 else None
    nxt = group[i + 1] if i + 1 < len(group) else None
    pn = '<nav class="pnav" aria-label="More projects">'
    pn += f'<a href="{prev[0]}.html">← {prev[1]}</a>' if prev else '<span></span>'
    endl = 'Back to students and mentoring →' if slug in HERO_OVERRIDE else f'All {crumb.lower()} →'
    pn += f'<a href="{nxt[0]}.html">{nxt[1]} →</a>' if nxt else f'<a href="../{BACK[back]}">{endl}</a>'
    pn += '</nav>'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(seo.TITLE.get(slug, re.sub('<.*?>', '', html.unescape(title))))} · Gorkem Kar</title>
<meta name="description" content="{html.escape(seo.DESC.get(slug, lead))}">
<meta property="og:title" content="{html.escape(re.sub('<.*?>', '', title))}">
<meta property="og:description" content="{html.escape(lead)}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://gkar87.github.io/research/{slug}.html">
<link rel="canonical" href="https://gkar87.github.io/research/{slug}.html">
{crumbs_ld(slug, title, back)}
{head_extras('../', 'p-' + slug, html.escape('Share card: ' + re.sub('<.*?>', '', title)))}
<meta name="theme-color" content="#1d4f91">
<script>document.documentElement.classList.add('js');try{{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="stylesheet" href="../style.css?v={V}">
</head>
<body class="proj" id="top">
<a class="skip" href="#main">Skip to content</a>
{header('../', 'work-with-me.html' if back == 'students' else 'projects.html')}
<main id="main" class="wrap">
<p class="crumbs"><a href="../{BACK[back]}">{crumb}</a> / {title}</p>
{_hero(slug, title, lead, body, planned)}
<div class="pgrid">
{tocnav}
<div class="pcontent">
{brief(slug)}{live(slug)}{body}
{related(slug)}<section>{pn}</section>
</div>
</div>
</main>
{footer('../')}
<script src="../site.js?v={V}"></script>
{f'<script src="../live/{DEMOS[slug][0]}.js?v={V}"></script>' if slug in DEMOS else ''}
</body>
</html>
'''


# ---------------------------------------------------------------- figures (SVG)
def car(x, y, cls='svg-box', w=54):
    return f'<rect x="{x}" y="{y}" width="{w}" height="26" rx="7" class="{cls}"/>'

SVG_JAM = '''<svg viewBox="0 0 640 250" role="img" aria-label="Animated highway with cars; one car emits GPS interference rings while two roadside monitoring points with cameras watch the road">
  <rect x="0" y="80" width="640" height="130" fill="var(--line)" opacity=".45"/>
  <line x1="0" y1="123" x2="640" y2="123" class="svg-line dash"/>
  <line x1="0" y1="167" x2="640" y2="167" class="svg-line dash"/>
  <g class="drive s2">''' + car(0, 90) + '''</g>
  <g class="drive">''' + car(0, 134, 'svg-acc2') + '''
    <circle cx="27" cy="147" r="60" class="wave"/><circle cx="27" cy="147" r="60" class="wave d2"/><circle cx="27" cy="147" r="60" class="wave d3"/></g>
  <g class="drive s3">''' + car(0, 178) + '''</g>
  <g><line x1="170" y1="30" x2="170" y2="80" class="svg-line"/><rect x="152" y="14" width="36" height="20" rx="4" class="svg-acc"/>
     <text x="140" y="240" class="svg-s">Monitoring point 1</text></g>
  <g><line x1="470" y1="30" x2="470" y2="80" class="svg-line"/><rect x="452" y="14" width="36" height="20" rx="4" class="svg-acc"/>
     <text x="440" y="240" class="svg-s">Monitoring point 2</text></g>
  <text x="200" y="30" class="svg-s">radio + directional antenna + camera</text>
</svg>'''

SVG_SETS = '''<svg viewBox="0 0 600 240" role="img" aria-label="Two overlapping candidate sets; only the jamming vehicle J is in both">
  <circle cx="230" cy="120" r="95" fill="var(--accent)" opacity=".12" stroke="var(--accent)" stroke-width="2"/>
  <circle cx="370" cy="120" r="95" fill="var(--accent)" opacity=".12" stroke="var(--accent)" stroke-width="2"/>
  <text x="150" y="28" class="svg-t">Near point 1</text><text x="370" y="28" class="svg-t">Near point 2</text>
  <text x="170" y="110" class="svg-s">car A</text><text x="175" y="150" class="svg-s">car B</text>
  <text x="400" y="110" class="svg-s">car C</text><text x="395" y="150" class="svg-s">car D</text>
  <circle cx="300" cy="125" r="24" class="svg-acc2 blink"/><text x="292" y="131" class="svg-t" style="fill:#fff">J</text>
  <text x="95" y="232" class="svg-s">Cars drift apart at different speeds; only J is near the peak twice.</text>
</svg>'''

SVG_TIMELINE = '''<svg viewBox="0 0 640 200" role="img" aria-label="Timeline of pre-trip events: door closes, ignition, shift out of park, seat belt, brake released; gaps between them form a driver fingerprint">
  <line x1="30" y1="100" x2="610" y2="100" class="svg-line"/>
  <g class="pop" style="animation-delay:0s"><circle cx="60" cy="100" r="11" class="svg-acc"/><text x="20" y="70" class="svg-s">door closes</text></g>
  <g class="pop" style="animation-delay:.9s"><circle cx="190" cy="100" r="11" class="svg-acc"/><text x="150" y="140" class="svg-s">ignition on</text></g>
  <g class="pop" style="animation-delay:1.8s"><circle cx="300" cy="100" r="11" class="svg-acc"/><text x="250" y="70" class="svg-s">shift from park</text></g>
  <g class="pop" style="animation-delay:2.7s"><circle cx="420" cy="100" r="11" class="svg-acc"/><text x="380" y="140" class="svg-s">seat belt on</text></g>
  <g class="pop" style="animation-delay:3.6s"><circle cx="560" cy="100" r="11" class="svg-acc2"/><text x="505" y="70" class="svg-s">brake released</text></g>
  <g class="pop" style="animation-delay:4.5s">
    <path d="M60 165 H190 M190 175 H300 M300 165 H420 M420 175 H560" stroke="var(--accent-2)" stroke-width="4" fill="none"/>
    <text x="160" y="196" class="svg-s">time gaps → feature vector → classifier</text></g>
</svg>'''

SVG_CIRCUIT = '''<svg viewBox="0 0 640 200" role="img" aria-label="Two-qubit variational circuit: encoding rotations, entangling CNOT, trainable rotations, measurement; a pulse travels along the wires">
  <text x="10" y="70" class="svg-t">q0</text><text x="10" y="150" class="svg-t">q1</text>
  <line x1="50" y1="64" x2="610" y2="64" class="svg-line"/><line x1="50" y1="144" x2="610" y2="144" class="svg-line"/>
  <line x1="50" y1="64" x2="610" y2="64" stroke="var(--accent)" stroke-width="3" class="dash"/>
  <line x1="50" y1="144" x2="610" y2="144" stroke="var(--accent)" stroke-width="3" class="dash"/>
  <g><rect x="90" y="44" width="70" height="40" rx="6" class="svg-box"/><text x="103" y="70" class="svg-s">H·RY(x)</text>
     <rect x="90" y="124" width="70" height="40" rx="6" class="svg-box"/><text x="103" y="150" class="svg-s">H·RY(x)</text></g>
  <g><circle cx="250" cy="64" r="7" fill="var(--fg)"/><line x1="250" y1="64" x2="250" y2="144" stroke="var(--fg)" stroke-width="2"/>
     <circle cx="250" cy="144" r="14" fill="none" stroke="var(--fg)" stroke-width="2"/><line x1="236" y1="144" x2="264" y2="144" stroke="var(--fg)" stroke-width="2"/></g>
  <g><rect x="320" y="44" width="70" height="40" rx="6" class="svg-acc" opacity=".85"/><text x="337" y="70" class="svg-s" style="fill:#fff">RY(θ)</text>
     <rect x="320" y="124" width="70" height="40" rx="6" class="svg-acc" opacity=".85"/><text x="337" y="150" class="svg-s" style="fill:#fff">RY(θ)</text></g>
  <g><rect x="470" y="44" width="60" height="40" rx="6" class="svg-box"/><path d="M480 76 Q500 52 520 76" class="svg-line"/>
     <rect x="470" y="124" width="60" height="40" rx="6" class="svg-box"/><path d="M480 156 Q500 132 520 156" class="svg-line"/></g>
  <text x="95" y="195" class="svg-s">encode features</text><text x="215" y="195" class="svg-s">entangle</text>
  <text x="310" y="195" class="svg-s">trainable layer</text><text x="465" y="195" class="svg-s">measure</text>
</svg>'''

SVG_GA = '''<svg viewBox="0 0 600 300" role="img" aria-label="Genetic algorithm loop: population of feature subsets, fitness, selection, crossover and mutation, repeated">
  <circle cx="300" cy="150" r="105" fill="none" stroke="var(--line)" stroke-width="10"/>
  <g class="spin"><circle cx="300" cy="45" r="9" class="svg-acc2"/></g>
  <g><rect x="225" y="14" width="150" height="40" rx="8" class="svg-box"/><text x="243" y="40" class="svg-s">population: 50</text></g>
  <g><rect x="410" y="128" width="170" height="44" rx="8" class="svg-box"/><text x="420" y="148" class="svg-s">fitness = 0.7·accuracy</text><text x="420" y="166" class="svg-s">+ 0.3·fewer features</text></g>
  <g><rect x="215" y="246" width="170" height="40" rx="8" class="svg-box"/><text x="230" y="272" class="svg-s">roulette + elitism</text></g>
  <g><rect x="15" y="128" width="175" height="44" rx="8" class="svg-box"/><text x="25" y="148" class="svg-s">uniform crossover 0.5</text><text x="25" y="166" class="svg-s">mutation 0.015</text></g>
  <text x="250" y="145" class="svg-t">up to 100</text><text x="245" y="168" class="svg-t">generations</text>
</svg>'''

SVG_PACKET = '''<svg viewBox="0 0 640 170" role="img" aria-label="Illustration: header fields of one TCP/IP packet, with a few highlighted as the selected fingerprint features">
  <g class="svg-s">
  <rect x="10" y="20" width="110" height="44" rx="6" class="svg-box"/><text x="22" y="47">version</text>
  <rect x="130" y="20" width="110" height="44" rx="6" class="svg-acc2 blink"/><text x="148" y="47" style="fill:#fff">TTL</text>
  <rect x="250" y="20" width="130" height="44" rx="6" class="svg-box"/><text x="262" y="47">total length</text>
  <rect x="390" y="20" width="110" height="44" rx="6" class="svg-acc2 blink" style="animation-delay:.6s"/><text x="402" y="47" style="fill:#fff">protocol</text>
  <rect x="510" y="20" width="120" height="44" rx="6" class="svg-box"/><text x="522" y="47">checksum</text>
  <rect x="10" y="76" width="150" height="44" rx="6" class="svg-box"/><text x="22" y="103">source port</text>
  <rect x="170" y="76" width="150" height="44" rx="6" class="svg-acc2 blink" style="animation-delay:1.2s"/><text x="182" y="103" style="fill:#fff">window size</text>
  <rect x="330" y="76" width="120" height="44" rx="6" class="svg-box"/><text x="342" y="103">seq number</text>
  <rect x="460" y="76" width="170" height="44" rx="6" class="svg-acc2 blink" style="animation-delay:1.8s"/><text x="472" y="103" style="fill:#fff">TCP flags/options</text>
  </g>
  <text x="10" y="155" class="svg-s">Illustration only: which fields matter is what feature selection decides.</text>
</svg>'''

SVG_KEYS = '''<svg viewBox="0 0 640 280" role="img" aria-label="A phone behind a keyboard; a key press sends sound to the phone's two microphones, which arrive at slightly different times">
  <rect x="170" y="10" width="300" height="46" rx="12" class="svg-box"/>
  <circle cx="188" cy="33" r="7" class="svg-acc"/><circle cx="452" cy="33" r="7" class="svg-acc"/>
  <text x="270" y="39" class="svg-s">phone</text>
  <text x="140" y="80" class="svg-s">mic 1</text><text x="455" y="80" class="svg-s">mic 2</text>
  <g>''' + ''.join(
    f'<rect x="{60 + c * 52}" y="{110 + r * 46}" width="44" height="38" rx="5" class="svg-box"/>'
    for r in range(3) for c in range(10)) + '''</g>
  <rect x="216" y="156" width="44" height="38" rx="5" class="svg-acc2 blink"/>
  <circle cx="238" cy="175" r="200" class="wave"/><circle cx="238" cy="175" r="200" class="wave d2"/>
  <path d="M238 175 L188 40" stroke="var(--accent-2)" stroke-width="2" class="dash"/>
  <path d="M238 175 L452 40" stroke="var(--accent-2)" stroke-width="2" class="dash"/>
  <text x="300" y="275" class="svg-s">different path lengths → time difference of arrival</text>
</svg>'''

SVG_XAI = '''<svg viewBox="0 0 640 220" role="img" aria-label="Illustration: data goes into a deep learning model; explanation tools show which inputs drove each prediction">
  <rect x="10" y="80" width="120" height="60" rx="8" class="svg-box"/><text x="30" y="115" class="svg-s">records</text>
  <line x1="130" y1="110" x2="220" y2="110" stroke="var(--accent)" stroke-width="3" class="dash"/>
  <rect x="220" y="60" width="160" height="100" rx="10" class="svg-acc" opacity=".85"/><text x="245" y="105" class="svg-t" style="fill:#fff">deep model</text><text x="245" y="130" class="svg-s" style="fill:#fff">prediction</text>
  <line x1="380" y1="110" x2="440" y2="110" stroke="var(--accent)" stroke-width="3" class="dash"/>
  <text x="450" y="40" class="svg-s">why? (SHAP, LIME, WIT)</text>
  <rect x="450" y="60" width="150" height="18" rx="4" class="svg-acc2 pop" style="animation-delay:0s"/>
  <rect x="450" y="90" width="105" height="18" rx="4" class="svg-acc2 pop" style="animation-delay:.6s"/>
  <rect x="450" y="120" width="70" height="18" rx="4" class="svg-acc2 pop" style="animation-delay:1.2s"/>
  <rect x="450" y="150" width="40" height="18" rx="4" class="svg-acc2 pop" style="animation-delay:1.8s"/>
  <text x="450" y="200" class="svg-s">Illustration, not results</text>
</svg>'''

# ---------------------------------------------------------------- pages
P = {}

P['vehicles'] = ('Connected vehicles: sensing, identity and trust',
 'Cars are rolling sensor platforms. This line of work asks what their data can reveal, who is driving, and how to catch the signals that put everyone on the road at risk.',
 '''
<section>
<h2>Finding the car with the GPS jammer</h2>
<p>Cheap personal GPS jammers, plugged into a car's lighter socket, knock out GPS for everyone nearby, including aircraft and emergency systems. Locating the moving source is hard because the signal is strong only for a few seconds. We built a system that combines roadside monitoring points (a software-defined radio, a directional antenna and a camera) with ordinary smartphones, which already report GPS signal strength.</p>
''' + fig(SVG_JAM, 'The interfering car (red) passes two monitoring points. Each point photographs the cars near the interference peak.') + '''
<p>The key idea: cars drive at different speeds, so the group of cars near the jammer keeps changing. One monitoring point leaves a few suspects; a second point a few miles on leaves only the one car that was near the peak both times.</p>
''' + fig(SVG_SETS, 'Intersecting the suspects seen at two points leaves the jammer (J).') + chart(
 'Identifying the interfering vehicle in highway tests (20 passes per point)',
 [('Point 1 alone', 65, '65%'), ('Point 2 alone', 35, '35%'), ('Both points together', 100, '100%', True)],
 'Data: Kar et al., ACM CCS 2014, field results. The jammer was emulated with a 900 MHz transmitter. Two points combined resolved all 16 passes that were ambiguous at either point.') + stats(
 [('200 h', 'of passive GPS-band monitoring at five sites in New Jersey and South Carolina'), ('2', 'suspicious interference incidents recorded on real highways')],
 'Data: Kar et al., ACM CCS 2014.') + '''
</section>

<section>
<h2>Who is driving? PredriveID and a GM patent</h2>
<p>Before a car even moves, each driver performs the same small ritual in their own rhythm: close the door, start the engine, shift out of park, buckle up, release the brake. Working with General Motors Research, we showed that the time gaps between these events, read from the car's own data bus, identify the driver within seconds, with no camera and nothing the driver has to carry.</p>
''' + fig(SVG_TIMELINE, 'Pre-trip events and the gaps between them form a fingerprint that a classifier (a linear SVM) learns.') + chart(
 'Driver identification accuracy',
 [('Pre-trip data, within 20 s', 90, '&gt;90%'), ('Pre-trip + 10 min driving', 98, '98%', True), ('Five mail vans, 480 trips', 91, '91%'), ('Two-driver household', 85.6, '85.6%')],
 'Data: Kar et al., ACM/IEEE SEC 2017 (PredriveID), Sec. 5.2 and Figs. 13 and 16. Built with an OBD-II dongle and a phone.') + '''
<p>This work led to <a href="https://patents.google.com/patent/US10332020B2/en">U.S. Patent No. 10,332,020</a>, <em>Method and apparatus of differentiating drivers based on driving behaviors</em> (GM Global Technology Operations and Rutgers, 2019).</p>
</section>

<section>
<h2>Traffic from dash cams at the vehicle edge</h2>
<p>Dash-cam video from ordinary cars can estimate traffic in real time: we detect and count the vehicles in view and estimate their speed and lane on the vehicle itself, so the estimate arrives while it is still useful.</p>
''' + stats([('&lt;10%', 'speed estimation error across roads and traffic conditions'), ('&gt;91%', 'lane estimation accuracy, left-most lane'), ('&gt;90%', 'vehicle counting accuracy even at peak hours, left-most lane')],
 'Data: Kar et al., ACM/IEEE SEC 2017 (Real-time traffic estimation at vehicular edge nodes), abstract.') + '''
</section>

<section>
<h2>Distracted driving from cameras and car sensors</h2>
<p>With my M.Sc. student Furkan Omerustaoglu, we detected nine distracted-driving behaviors with a two-stage model: convolutional networks read the driver-facing camera, and LSTM networks combine those image features with in-vehicle sensor data. Adding the sensor data significantly improved detection over images alone.</p>
<h3>Where this is going</h3>
<p>Connected vehicles now trust data from roadside units, other cars and the cloud, and all three can be spoofed. The next step is detecting spoofed, jammed or manipulated sensor and V2X data in real time on the vehicle and roadside hardware itself, where latency and memory are tight.</p>
</section>

<section>
<h2>Papers</h2>
''' + pubs([
 ('Detection of on-road vehicles emanating GPS interference', '<b>G. Kar</b>, H. Mustafa, Y. Wang, Y. Chen, W. Xu, M. Gruteser, T. Vu', 'ACM CCS, 2014', 'https://doi.org/10.1145/2660267.2660336'),
 ('PredriveID: Pre-trip driver identification from in-vehicle data', '<b>G. Kar</b>, S. Jain, M. Gruteser, J. Chen, F. Bai, R. Govindan', 'ACM/IEEE SEC, 2017', 'https://doi.org/10.1145/3132211.3134462'),
 ('Real-time traffic estimation at vehicular edge nodes', '<b>G. Kar</b>, S. Jain, M. Gruteser, F. Bai, R. Govindan', 'ACM/IEEE SEC, 2017', 'https://doi.org/10.1145/3132211.3134461'),
 ('Distracted driver detection by combining in-vehicle and image data using deep learning', 'F. Omerustaoglu, C. O. Sakar, <b>G. Kar</b>', 'Applied Soft Computing, 2020', 'https://doi.org/10.1016/j.asoc.2020.106657'),
 ('Scotto: Real-time driver behavior scoring using in-vehicle data', '<b>G. Kar</b>, B. Asiroglu, F. S. Bir', 'IEEE VTC2019-Spring, 2019', 'https://doi.org/10.1109/VTCSpring.2019.8746461'),
 ('Augmented vehicular reality: Enabling extended vision for future vehicles', 'H. Qiu, F. Ahmad, R. Govindan, M. Gruteser, F. Bai, <b>G. Kar</b>', 'HotMobile, 2017', 'https://doi.org/10.1145/3032970.3032976'),
]) + '</section>')

P['quantum-ids'] = ('Hybrid quantum-classical intrusion detection',
 'Can a small quantum circuit, paired with classical deep learning, help catch network attacks and mobile malware? We built one framework that does both.',
 '''
<section>
<h2>One framework for DDoS and Android malware</h2>
<p>Intrusion detectors for software-defined networks and malware classifiers for phones are usually separate systems. We designed a single hybrid quantum-classical neural network (HQCNN) that handles both: binary detection of DDoS traffic, and multiclass classification of Android malware families. Signals are turned into images with wavelets, a convolutional network extracts features, and a compact quantum layer makes the final decision.</p>
''' + flow([('Normalize', 'min–max scaling'), ('Wavelet transform', 'discrete wavelet denoising'), ('Scaleogram', 'continuous wavelet → image'),
            ('2D CNN', 'feature extraction'), ('LDA', 'reduce to n−1 features'), ('Quantum layer', '2-qubit variational circuit'), ('Decision', 'classical output layer')], 'HQCNN pipeline') + fig(
 SVG_CIRCUIT, 'The quantum layer: features are encoded as rotations, entangled, passed through a trainable layer and measured. One layer and 500 shots worked best.') + chart(
 'DDoS detection, SDN DDoS dataset (104,345 records)',
 [('Hybrid quantum-classical', 99.86, '99.86%', True), ('Classical 2D CNN', 86.80, '86.80%')],
 'Data: EPJ Quantum Technology 12, 77 (2025): HQCNN average accuracy (abstract) and 2D CNN 10-fold mean (Table 8 discussion). Simulated with PennyLane Lightning.') + chart(
 'Android malware, 12 classes, 10-fold mean accuracy',
 [('Hybrid quantum-classical', 95.33, '95.33%', True), ('Classical CNN', 78.94, '78.94%')],
 'Data: EPJ Quantum Technology 12, 77 (2025), Fig. 13 discussion. CCCS-CIC-AndMal2020 static features, balanced to 800 samples per class.') + chart(
 'Android malware accuracy as classes are added',
 [('12 classes', 95.13, '95.13%'), ('14 classes', 94.38, '94.38%'), ('15 classes', 93.56, '93.56%')],
 'Data: EPJ Quantum Technology 12, 77 (2025), abstract and Table 11.') + '''
<p class="note">These results come from quantum simulators. The appeal for security is size: the quantum layer has very few parameters, which matters for detectors that must run on IoT gateways and phones.</p>
</section>

<section>
<h2>The same idea in spectroscopy</h2>
<p>The wavelet-to-quantum pipeline also works on light. In <em>IEEE Access</em> (2025) we turned Raman spectra of human serum into wavelet scaleograms and classified COVID-19 with a quanvolutional neural network, comparing it with classical CNNs. In <em>AVS Quantum Science</em> (2026), a classical-quantum network with dual-channel feature extraction ran on an IonQ quantum processor to classify weathered microplastics from their Raman spectra. The <a href="quantum-spectra.html">spectroscopy page</a> has more, with a live quanvolution demo.</p>
<h3>Where this is going</h3>
<p>Moving hybrid and compact deep models from offline benchmarks to deployable detectors for IoT gateways and mobile devices, with explanations a network operator can act on.</p>
</section>

<section>
<h2>Papers</h2>
''' + pubs([
 ('Unified hybrid quantum classical neural network framework for detecting distributed denial of service and Android mobile malware attacks', 'S. Sridevi, B. Indira, S. Geetha, S. Balachandran, <b>G. Kar</b>, S. Kharbanda', 'EPJ Quantum Technology, 2025 (open access)', 'https://doi.org/10.1140/epjqt/s40507-025-00380-z'),
 ('Novel quanvolutional neural network-based COVID-19 diagnosis from Raman spectroscopic signals of human serum', 'S. S. Dutta, S. Sandeep, S. Sridevi, R. Mistry, J. Ortega, <b>G. Kar</b>', 'IEEE Access, 2025 (open access)', 'https://doi.org/10.1109/ACCESS.2025.3580316'),
 ('A classical quantum neural network with dual-channel feature extraction on IonQ QPU for classifying weathered microplastics from Raman spectra', 'H. G. Kulkarni, A. R. Banerjee, T. Mandloi, S. Sridevi, S. Geetha, <b>G. Kar</b>', 'AVS Quantum Science, 2026', SC + '5nxA0vEk-isC'),
]) + '</section>')

P['iot-identity'] = ('IoT device identity and network incidents',
 'A network that cannot tell which device sent a packet, or whether that device was tampered with, cannot defend itself. We identify devices and attacks from packet headers alone.',
 '''
<section>
<h2>Fingerprinting IoT devices from a single packet</h2>
<p>With Dr. Ahmet Aksoy and UCM students, we identify an IoT device's vendor and type from the header fields of just one TCP/IP packet, so vulnerable devices can be found and isolated quickly. We compared feature selection methods from four families (filter, wrapper, embedded and search optimization) to learn which header fields carry the fingerprint.</p>
''' + fig(SVG_PACKET, 'A single packet header is the fingerprint; feature selection picks the fields that matter.') + chart(
 'Device identification with decision trees, IoT Sentinel dataset (126,209 packets)',
 [('Weighted accuracy', 95.3, '95.3%', True), ('Macro F1 across vendors', 88.7, '88.7%')],
 'Data: Aksoy et al., ICISSP 2024, abstract.') + '''
</section>

<section>
<h2>Identifying network attacks with a genetic algorithm</h2>
<p>Instead of experts hand-picking traffic features, a genetic algorithm evolves the feature subset: each candidate is scored on how accurately a classifier separates attack from normal traffic and on how few features it needs. The result detects DNS botnets, two kinds of denial-of-service floods and NMAP OS scanning. The code and data are public.</p>
''' + fig(SVG_GA, 'The genetic algorithm loop, with the settings used in the paper.') + chart(
 'Detection accuracy by attack type',
 [('DoS HULK', 100, '100%', True), ('DoS GoldenEye', 100, '100%', True), ('DNS botnet', 95, '≈95%'), ('NMAP OS scanning', 95, '≈95%')],
 'Data: Aksoy, Valle and Kar, Electronics 13(2), 293 (2024), abstract ("mid 95%" for DNS botnet and OS scanning).') + chart(
 'Malicious packets in each dataset',
 [('DoS HULK', 100, '241,991'), ('DNS botnet (9 botnets)', 75.5, '182,720'), ('DoS GoldenEye', 74.3, '179,906'), ('NMAP OS scanning', 27.1, '65,700')],
 'Data: Electronics 13(2), 293 (2024), dataset description. Bars scaled to the largest set.') + '''
</section>

<section>
<h2>Hybrid blockchains for IoT</h2>
<p>With my M.Sc. student Ahmed Alkhateeb, we systematically reviewed how hybrid blockchain platforms secure IoT data. Ethereum dominates, and most systems pair the ledger with cloud or fog computing.</p>
''' + chart('Screening the literature', [('Search results', 100, '985'), ('After filtering', 29.9, '295'), ('Primary studies', 3.9, '38', True)],
 'Data: Alkhateeb et al., Sensors 22(4), 1304 (2022).') + chart('Computing paradigm used with the blockchain',
 [('Cloud', 44.4, '44.4%', True), ('Fog', 22.2, '22.2%'), ('Telecom', 16.7, '16.7%'), ('Edge', 11.1, '11.1%')],
 'Data: Sensors 22(4), 1304 (2022). Ethereum was used in 77.8% of the studies.') + '''
<h3>Where this is going</h3>
<p>Combining traffic fingerprints with ledger-based attestation, so a network knows which devices are present and whether any has been tampered with, cheaply enough for resource-constrained IoT deployments.</p>
</section>

<section>
<h2>Papers</h2>
''' + pubs([
 ('Comparative analysis of feature selection algorithms for automated IoT device fingerprinting', 'A. Aksoy, S. Varma, G. Moorthy, E. Pan, <b>G. Kar</b>', 'ICISSP, 2024', 'https://doi.org/10.5220/0012379100003648'),
 ('Automated network incident identification through genetic algorithm-driven feature selection', 'A. Aksoy, L. Valle, <b>G. Kar</b>', 'Electronics, 2024 (open access)', 'https://doi.org/10.3390/electronics13020293'),
 ('Hybrid blockchain platforms for the Internet of Things (IoT): A systematic literature review', 'A. Alkhateeb, C. Catal, <b>G. Kar</b>, A. Mishra', 'Sensors, 2022 (open access)', 'https://doi.org/10.3390/s22041304'),
]) + '</section>')

P['side-channels'] = ('Acoustic side channels on phones',
 'A phone lying behind your keyboard can hear which keys you press. We showed how, with no training data and no language model, which means it works on random passwords too.',
 '''
<section>
<h2>Snooping keystrokes with millimeter-level audio ranging</h2>
<p>Every key sits at a slightly different distance from a phone's two microphones, so its sound reaches them a fraction of a millisecond apart. Measuring that time difference of arrival places the keystroke on the keyboard. Sound features then separate keys that sit at similar distances.</p>
''' + fig(SVG_KEYS, 'A key press reaches the two microphones over different path lengths.') + flow([
 ('Detect', 'find each keystroke by its sound energy'), ('Time difference', 'cross-correlate the two microphones'),
 ('Group', 'keys with similar time differences'), ('Cluster', 'by sound features within each group'), ('Label', 'match clusters to key positions')], 'Keystroke recovery steps') + stats(
 [('7.15 mm', 'distance resolution at 48 kHz sampling'), ('1.8 mm', 'at 192 kHz'), ('3,640', 'keystrokes on three keyboards')],
 'Data: Liu, Wang, Kar et al., ACM MobiCom 2015, Sec. 2.3 and 6.1.') + chart(
 'Share of keystrokes recovered, phone behind the keyboard',
 [('Top-1 guess, 48 kHz', 85.5, '85.5%'), ('Top-2 guesses, 48 kHz', 94.9, '94.9%'), ('Top-3 guesses, 48 kHz', 97.6, '97.6%'), ('Top-1 guess, 192 kHz', 94.2, '94.2%', True)],
 'Data: MobiCom 2015, Figs. 10a and 12a (192 kHz on the Microsoft keyboard).') + '''
<p>The lesson for defenders: sensors a system does not treat as security-relevant can leak secrets. The same thinking now drives my work on vehicle and network signals.</p>
</section>

<section>
<h2>Paper</h2>
''' + pubs([('Snooping keystrokes with mm-level audio ranging on a single phone', 'J. Liu, Y. Wang, <b>G. Kar</b>, Y. Chen, J. Yang, M. Gruteser', 'ACM MobiCom, 2015', 'https://doi.org/10.1145/2789168.2790122')]) + '</section>')

P['applied-ai'] = ('Explainable and applied AI',
 'The methods behind my security work also answer questions in food safety, public safety, language and the workplace, with an emphasis on explaining why a model decides what it does.',
 '''
<section>
<h2>Explaining the model, not just scoring it</h2>
''' + fig(SVG_XAI, 'Explainable AI tools show which inputs pushed a model toward its prediction.') + '''
<div class="grid2">
  <div class="card"><h3>Food fraud detection</h3><p>A deep learning model predicts food fraud risk from European rapid-alert notifications and an adulteration database, and three explanation tools (LIME, SHAP and Google's What-If Tool) are compared on it, showing what each can and cannot tell a food-safety analyst. Led by my M.Sc. student Okan Buyuktepe.</p><p class="pl"><a href="https://doi.org/10.1111/exsy.13387">Expert Systems, 2025</a></p></div>
  <div class="card"><h3>Employee attrition</h3><p>Explainable AI used to uncover which factors drive employees to leave, so HR decisions rest on reasons rather than a black-box score.</p><p class="pl"><a href="''' + SC + '''0EnyYjriUFMC">IEEE LA-CCI, 2025</a></p></div>
  <div class="card"><h3>Crime prediction</h3><p>A systematic review of 68 studies (2010 to 2022) that use machine learning to predict crime. Most rely on supervised learning, which needs labeled data that real deployments often lack.</p><p class="pl"><a href="https://doi.org/10.1007/s12652-023-04530-y">J. Ambient Intelligence and Humanized Computing, 2023</a></p></div>
  <div class="card"><h3>Turkish scientific texts</h3><p>A fine-tuned Turkish BERT model (BERTurk) sorts Turkish scientific articles into five fields, from AI to signal processing, with 96% accuracy. Led by my M.Sc. student Mustafa Özkan.</p><p class="pl"><a href="https://doi.org/10.21923/jesd.973181">J. Engineering Sciences and Design, 2022</a></p></div>
  <div class="card"><h3>Technology investment and resilience</h3><p>How strategic investment in technological innovation helps organizations stay resilient through digital transformation.</p><p class="pl"><a href="''' + SC + '''LkGwnXOMwfcC">J. Innovative Digital Transformation, 2025</a></p></div>
</div>
</section>

<section>
<h2>Results: sorting Turkish scientific texts</h2>
<p>For the Turkish text classifier, what the model reads matters most: a title alone is too short, while the abstract carries most of the signal.</p>
''' + chart('F1 score by what the model reads (higher is better)',
 [('Title only', 76.2, '0.762'), ('Abstract only', 94.0, '0.940'), ('Title and abstract', 96.1, '0.961', True)],
 'Reported results: Özkan and Kar, J. Engineering Sciences and Design 10(2), 2022, Table 10 (85/15 train/validation split, after preprocessing). 1,560 Turkish theses and patents in five fields.') + chart(
 'Accuracy in each field',
 [('Communication and signal processing', 97, '0.97'), ('Internet of Things', 97, '0.97'), ('Augmented and virtual reality', 96, '0.96'),
  ('AI and machine learning', 95, '0.95'), ('Image processing', 94, '0.94')],
 'Reported results: same paper, Table 7.') + '''
</section>
''')


# ---------------------------------------------------------------- planned projects for new students
PLANNED = [
    ('planned-gnss', 'Catching GNSS spoofing with the car\'s own sensors'),
    ('planned-benchmark', 'Leak-free benchmarks for IoT traffic classifiers'),
    ('planned-quantum', 'Does a quantum layer really help? Honest benchmarks for quantum intrusion detection'),
    ('planned-xai', 'Explanations you can check: explainable intrusion and malware detection'),
]

BADGE = ''  # status now shown in the page hero


def reading(items):
    out = '<ol class="pubs reading">'
    for t, a, v, link, why in items:
        out += (f'<li><div class="pt">{t}</div><div class="pa">{a}</div><div class="pv">{v}</div>'
                f'<div class="why">{why}</div><div class="pl"><a href="{link}">Read</a></div></li>')
    return out + '</ol>'




# ---------------------------------------------------------------- research questions as cards
# Each planned research question gets a working hypothesis and an evaluation plan. These are
# plans for projects that have not started: no results, numbers or target venues are claimed.
_RQX = [
 # planned-gnss
 ('How quickly can wheel-speed, steering and yaw-rate data expose',
  'Crude position jumps show up within seconds; slow drift is caught only once it outgrows the dead-reckoning error, which itself grows with distance driven.',
  'Replay recorded drives with injected attacks of graded speed, and plot detection delay against false alarms per hour for each attack type.'),
 ('Can the detector run on a phone or an in-vehicle processor',
  'A Kalman-filter residual test is cheap; any learned component is what has to be sized carefully.',
  'Replay drives in real time on a phone and an embedded board, and profile latency, memory and energy per fix.'),
 ('How does a careful attacker who drifts the position slowly',
  'To stay under the alarm, a road-following attacker has to mirror the car\'s real turns, which limits how far it can take the car.',
  'Build an adaptive attacker that knows the detector, and measure how far off route it gets before the alarm.'),
 # planned-benchmark
 ('Which packet and flow features act as shortcuts in popular IoT',
  'Fields that describe the capture setup (addresses, ports, timestamps, TTL artifacts) explain much of the accuracy reported on some public datasets.',
  'Train on each field alone; any field that predicts the label without carrying device behavior is flagged and audited.'),
 ('How much accuracy do published-style pipelines keep under time-based',
  'Accuracy falls most for unseen networks, then unseen devices, and least for later traffic from the same network.',
  'Re-run representative pipelines under random, time, network and device splits with the same tuning budget, and report the gap for each split.'),
 ('Which features stay useful after the audit, and can a model',
  'A small set of protocol-behavior features survives the audit and fits on a home or campus gateway.',
  'Select features on audited data only, then measure accuracy, latency and memory on router-class hardware.'),
 # planned-quantum
 ('Against classical twins with matched parameter counts and the same',
  'Once size, tuning budget and preprocessing are matched, most of the gap between quantum and classical layers falls within test-set noise.',
  'Paired comparisons over many random seeds, with confidence intervals and McNemar\'s test, and the classical twin tuned as hard as the quantum model.'),
 ('How do the data encoding, the circuit depth and the number of qubits',
  'The encoding matters more than depth; deeper circuits run into flat training landscapes (barren plateaus) before they help.',
  'Sweep encodings, depths and qubit counts, and track gradient variance during training next to accuracy.'),
 ('How much of the simulator result survives real hardware noise',
  'Shallow circuits keep most of their simulated accuracy on current hardware, but cost and queue time rule out frequent retraining.',
  'Run the same trained circuits on an ideal simulator, a noisy simulator and a quantum processor, and report accuracy, shots, wall time and cost.'),
 # planned-xai
 ('For the same intrusion or malware detector, how often do LIME, SHA',
  'Explainers agree on the top reason far more often than on the full ranking, and how faithful they are depends on the model family.',
  'Measure rank agreement across explainers, and faithfulness with deletion and insertion tests, on several detectors and datasets.'),
 ('Can explanations reliably expose shortcuts, such as a detector keyin',
  'Faithful explainers surface a planted shortcut reliably; unfaithful ones can hide it.',
  'Plant known shortcuts in training data and count how often each explainer names them as a top reason.'),
 ('Where does a small interpretable model (rules or a shallow tree) mat',
  'On header-level features, a shallow tree or rule list matches the black box on most traffic types.',
  'Distill each detector into trees and rule lists, and report fidelity to the original, accuracy and model size.'),
 ('Do explanations help analysts triage alerts faster and more accurat',
  'Explanations speed up triage but can also make analysts more confident in wrong alerts.',
  'A controlled study with students and practitioners triaging alerts with and without explanations, measuring time, accuracy and confidence.'),
 # planned-can
 ('How well do timing-based, content-based and learning-based detector',
  'Timing detectors catch flooding and most injections cheaply; impersonation that keeps the rhythm needs content or sender features.',
  'Benchmark the three families on public in-vehicle datasets with one common split and per-attack metrics.'),
 ('Do detectors trained on one car still work on another model, or aft',
  'Learned detectors transfer poorly across vehicles; timing baselines recover after recalibrating on a short drive.',
  'Train on one vehicle or software version, test on another, and measure how much clean driving each detector needs to recover.'),
 ('Can a detector small enough for an in-vehicle gateway also say whic',
  'Timing and electrical traits together can point to the sending control unit for many attacks.',
  'Add sender attribution and test it on data with known sources, then profile it on gateway-class hardware.'),
 # planned-acoustic
 ('How accurately can keystrokes be recovered from audio captured by ea',
  'Call compression and lower sample rates remove much of the timing detail ranging needs; attacks on spectral features degrade less.',
  'Record the same typing sessions through each device and app, and run ranging and learning attacks on identical keyboards and typists.'),
 ('Which parts of each pipeline (compression, noise suppression, echo c',
  'Noise suppression and resampling remove the most; mixing down to mono removes ranging entirely.',
  'Switch each processing stage on and off in an open audio pipeline and measure attack accuracy after each.'),
 ('Which cheap defenses, such as masking sounds or app settings, cut le',
  'Quiet masking noise in the keystroke band cuts leakage with little cost to call quality.',
  'Measure attack accuracy and a standard speech-quality score with each defense on.'),
 # planned-rag
 ('How easily can a planted page, or a crafted question, make a campus',
  'When nothing checks retrieved text, one planted page that matches a common question is enough to change the answer.',
  'Red-team a copy of the campus chatbot with planted pages and crafted questions, and measure attack success by question type.'),
 ('Does hybrid retrieval (keyword plus vector search, with query rewrit',
  'Keyword search favors keyword-stuffed pages while query rewriting spreads retrieval over more passages, so the net effect depends on the attack.',
  'Run identical attacks against vector-only and hybrid retrieval with the same language model and prompts.'),
 ('Which defenses (filtering retrieved text, requiring citations, a sec',
  'Source allowlists block most attacks but drop useful unofficial answers; a checker model catches contradictions at a latency cost.',
  'For each defense and combination, measure attack success, answer quality on clean questions and response time.'),
 # planned-tinyml
 ('How small can a packet-header detector get, through feature selectio',
  'Header-level detectors keep their detection rate down to a few kilobytes, and quantization costs less than pruning.',
  'Compress step by step and plot detection rate and false alarms against model size on fixed test sets.'),
 ('Which model families (small trees, tiny neural networks, autoencoder',
  'Small trees give the best accuracy per kilobyte on header features; tiny networks win only when timing patterns matter.',
  'Compare families at matched memory budgets on a microcontroller, measuring energy per inference.'),
 ('Can an on-device detector keep learning normal traffic without being',
  'Unguarded online updates can be poisoned by a slow attack; gating updates on confidence prevents most of it.',
  'Simulate slow poisoning during online learning and compare gated and ungated update rules.'),
 # planned-pqc
 ('What do ML-KEM and ML-DSA cost on common IoT boards in a real protoc',
  'Post-quantum key exchange is affordable on mid-range boards; signatures and certificate chains dominate the bytes on the air.',
  'Measure TLS and MQTT-over-TLS handshakes on several boards with an energy meter, alone and in hybrid mode.'),
 ('Which devices and protocols cannot make the move without hardware ch',
  'For the smallest radios, protocol changes such as cached or compressed certificates matter more than faster cryptography.',
  'Map device classes against measured costs and test cheaper protocol options on the hardest cases.'),
 ('Do larger post-quantum handshakes confuse traffic-based tools, such',
  'Fingerprinting and intrusion models trained on today\'s handshakes misread post-quantum ones until retrained.',
  'Run trained models on traffic captured before and after the switch, and measure the drop and the retraining needed.'),
 # planned-blockchain
 ('Does combining a ledger credential with a traffic fingerprint catch',
  'The two checks fail in different ways, so together they catch clones that pass either one alone.',
  'Stage cloning, spoofing and tampering attacks in an IoT testbed and compare detection by each check and by both.'),
 ('How many devices and identity checks per second can a permissioned',
  'Edge identity checks fit within a permissioned ledger\'s capacity if fingerprint baselines are updated in batches.',
  'Load-test the ledger on fog-class hardware with growing device counts and update rates.'),
 ('Which attacks on the smart contracts and on the gateways themselves',
  'A compromised gateway, not the ledger, is the weak point.',
  'Threat-model the system, run known contract and gateway attacks, and turn what succeeds into design rules.'),
 # planned-encrypted
 ('Which flow metadata (packet sizes, timing, direction, handshake fiel',
  'A small, evolved subset of size and timing features identifies most apps, as feature selection did for device fingerprints.',
  'Run evolutionary feature selection on labeled encrypted captures and compare accuracy and feature count with using every feature.'),
 ('Can explanations and language models fine-tuned on traffic make thes',
  'Explanations show which flow traits drive each decision, and fine-tuned language models help most on apps not seen in training.',
  'Compare classical, sequence and fine-tuned language models on the same splits, auditing each one\'s top features with explanations.'),
 ('Which defenses (padding, timing changes, traffic shaping) protect us',
  'Padding alone leaves timing leaks; combined defenses cut accuracy sharply but cost bandwidth and delay.',
  'Apply each defense to captured traffic, retrain the classifier on defended traffic, and report accuracy against overhead.'),
 # planned-v2x
 ('Which plausibility checks on position, speed and heading catch fake',
  'Simple physical checks catch crude ghosts; attackers who obey physics can only be caught with evidence from independent sensors.',
  'Evaluate checks on public misbehavior datasets and on simulated attacks of rising sophistication.'),
 ('How much do roadside cameras, radar and other cars\' reports add, an',
  'Fusing independent sensors closes most gaps, and the remaining risk sits where no independent sensor looks.',
  'Simulate traffic with roadside and on-board sensor coverage, place attacks inside and outside it, and measure detection.'),
 ('Can misbehavior detection run within the latency and memory budget',
  'Single-message checks fit easily on board; fusing several sensors is the costly step and belongs on roadside edge computers.',
  'Profile each detector on embedded boards at realistic message rates.'),
]
RQX = {}
for _q, _h, _t in _RQX:
    assert _q[:40] not in RQX, _q
    RQX[_q[:40]] = (_h, _t)


def rqs(items):
    out = '<ol class="rqx">'
    for q in items:
        h, t = RQX.get(q[:40], (None, None))
        out += f'<li class="reveal"><p class="q">{q}</p>'
        if h:
            out += f'<dl><dt>Hypothesis</dt><dd>{h}</dd><dt>How we would test it</dt><dd>{t}</dd></dl>'
        out += '</li>'
    return out + '</ol><!--CONTRIB-->'


CONTRIB = {
 'planned-gnss': ['A spoofing detector that uses only data the car already has, with its code.', 'A set of recorded drives with simulated attacks, from crude jumps to road-following drift, for others to test against.', 'Measured detection delay, false alarms and phone run time for each attack type.'],
 'planned-benchmark': ['An audit tool that flags shortcut fields in traffic datasets.', 'Re-measured accuracy for representative pipelines under honest splits.', 'A checklist for building leak-free IoT traffic benchmarks.'],
 'planned-quantum': ['A fair comparison protocol for quantum and classical detectors, with matched budgets and statistics.', 'An open benchmark that runs on simulators and real quantum hardware.', 'Practical guidance on when a quantum layer is worth its cost.'],
 'planned-xai': ['A faithfulness test suite for explanations of security models.', 'Evidence on whether explanations reveal shortcuts.', 'Small, readable detectors that match black boxes where they can, and a user study on analyst triage.'],
 'planned-can': ['A common benchmark of in-vehicle intrusion detectors across attack types.', 'Measurements of how detectors transfer across vehicles and software updates.', 'A gateway-sized detector that also points to the sending control unit.'],
 'planned-acoustic': ['A side-by-side measurement of keystroke leakage through earbuds, smart speakers and call apps.', 'An account of which audio-processing stages remove the leak.', 'Cheap defenses with their cost to call quality.'],
 'planned-rag': ['A red-team test set for campus chatbots.', 'A measured comparison of retrieval designs under attack.', 'Defenses tuned so that they block attacks without breaking good answers.'],
 'planned-tinyml': ['Detectors compressed to microcontroller size, with code.', 'Accuracy per kilobyte and per millijoule across model families.', 'An update rule that keeps learning without being poisoned.'],
 'planned-pqc': ['Measured post-quantum handshake costs on common IoT boards.', 'A map of which devices can move now and which need protocol changes.', 'A test of how traffic-based security tools cope with post-quantum traffic.'],
 'planned-blockchain': ['A prototype that pairs ledger credentials with traffic fingerprints.', 'Capacity measurements on fog-class hardware.', 'Design rules from attacks on the contracts and gateways.'],
 'planned-encrypted': ['A traffic classifier that never decrypts payloads, built on evolved features.', 'An explanation-based audit of what such classifiers rely on.', 'A measured privacy-versus-overhead trade-off for padding and shaping defenses.'],
 'planned-v2x': ['A layered ghost-vehicle detector combining plausibility checks with roadside and on-board sensors.', 'A coverage analysis showing where attacks can still hide.', 'Run-time profiles on roadside and on-board hardware.'],
}

# Open questions on published-work pages: from the research statement and each page's own
# "where this is going" text, with the planned project that takes each one up.
OPENQ = {
 'vehicles': [
  ('Can a vehicle catch spoofed, jammed or manipulated sensor and V2X data in real time, on hardware where latency and memory are tight?',
   'Cars now trust data from roadside units, other vehicles and the cloud, and every one of those channels can be spoofed.',
   [('planned-gnss', 'GNSS spoofing'), ('planned-v2x', 'ghost vehicles in V2X'), ('planned-can', 'in-vehicle network')]),
  ('Can behavioral signatures in raw sensor streams, like the pre-trip rhythm that identifies a driver, serve as trust anchors for the data a car relies on?',
   'PredriveID showed that bus signals carry a stable signature of who is driving. Whether the same kind of signature can vouch for the data itself is open.',
   [('planned-gnss', 'GNSS spoofing'), ('planned-can', 'in-vehicle network')]),
 ],
 'perception': [
  ('When cars share what their sensors see, how does the receiving car know the shared view is real?',
   'Sharing views extends vision past the truck ahead, but every shared view is also a new channel an attacker can fake.',
   [('planned-v2x', 'ghost vehicles in V2X')]),
 ],
 'driver-behavior': [
  ('Can driver scoring and identification run on the vehicle\'s own edge hardware, so raw driving data never has to leave the car?',
   'My dissertation work asked how to make vehicle data available while keeping it private; on-vehicle scoring is one way to do both.',
   [('planned-tinyml', 'on-device models')]),
 ],
 'quantum-ids': [
  ('Where, if anywhere, does a quantum layer beat a classical model of the same size and tuning budget?',
   'The case for hybrid models today is comparable accuracy at a very small parameter budget. A claim of advantage needs matched classical baselines and statistics.',
   [('planned-quantum', 'honest quantum benchmarks')]),
  ('Can compact hybrid detectors run on IoT gateways and phones, with explanations an operator can act on?',
   'Offline benchmarks do not show whether a detector fits a gateway\'s budget or whether its alerts can be trusted.',
   [('planned-tinyml', 'on-device detection'), ('planned-xai', 'checkable explanations')]),
 ],
 'quantum-spectra': [
  ('How much of a hybrid model\'s accuracy on spectra survives real quantum hardware, and what does each run cost?',
   'One of these studies already ran on an IonQ processor. Separating what the quantum part adds from what the classical pipeline does needs matched baselines.',
   [('planned-quantum', 'honest quantum benchmarks')]),
 ],
 'iot-identity': [
  ('How can traffic-fingerprint baselines be kept current cheaply enough for resource-constrained IoT deployments?',
   'Device behavior drifts with firmware updates and usage, and constrained networks cannot afford constant retraining.',
   [('planned-blockchain', 'ledger identity'), ('planned-benchmark', 'leak-free benchmarks')]),
  ('Can devices and applications be identified from encrypted-flow metadata alone, without decrypting payloads?',
   'Most traffic is now encrypted, so sizes, timing and handshakes are what a privacy-respecting network can still use.',
   [('planned-encrypted', 'encrypted traffic')]),
 ],
 'side-channels': [
  ('Do earbuds, smart speakers and video-call apps still leak keystrokes after compression and noise suppression?',
   'The original attack used a phone recording at a high sample rate. Today\'s microphones sit in very different audio pipelines.',
   [('planned-acoustic', 'keystrokes over calls')]),
 ],
 'applied-ai': [
  ('Are explanations faithful to what a model really uses, and do they help people decide better?',
   'Our food-fraud work compared what LIME, SHAP and the What-If Tool can and cannot tell an analyst. Whether an explanation is faithful to the model is a separate test.',
   [('planned-xai', 'checkable explanations')]),
  ('Can a retrieval-augmented chatbot be made robust to poisoned or misleading sources?',
   'Our UCM chatbot answers from university pages; anyone who can get a page retrieved can try to steer it.',
   [('planned-rag', 'campus chatbot security')]),
 ],
}


def skills(items):
    return '<ul class="chips" aria-label="Skills">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'


JOIN = '''<section class="join">
<h2>Interested?</h2>
<p>This project is planned and not yet staffed. If you are a UCM graduate student, or joining UCM soon, and it fits your interests, email me at <a href="mailto:kar@ucmo.edu">kar@ucmo.edu</a> with your CV, the project's name and a few lines on which research question you would start with. Reading two of the papers on this page first will make that conversation much better.</p>
</section>'''

SVG_SPOOF = '''<svg viewBox="0 0 640 260" role="img" aria-label="A car drives along a road; satellites send real signals while a spoofer sends fake ones; the GPS position (dashed) drifts away from where the wheel-speed and steering data say the car really is, and an alarm lights up">
  <text x="20" y="28" class="svg-s">satellites</text>
  <circle cx="120" cy="22" r="9" class="svg-acc"/><circle cx="300" cy="14" r="9" class="svg-acc"/><circle cx="480" cy="22" r="9" class="svg-acc"/>
  <line x1="120" y1="32" x2="300" y2="150" class="svg-line dash"/><line x1="300" y1="24" x2="300" y2="150" class="svg-line dash"/><line x1="480" y1="32" x2="300" y2="150" class="svg-line dash"/>
  <rect x="0" y="150" width="640" height="60" fill="var(--line)" opacity=".45"/>
  <line x1="0" y1="180" x2="640" y2="180" class="svg-line dash"/>
  <path d="M20 180 L620 180" stroke="var(--accent)" stroke-width="4" fill="none"/>
  <path d="M20 180 C200 180 330 172 430 150 S580 104 620 96" stroke="var(--accent-2)" stroke-width="4" stroke-dasharray="10 8" fill="none" class="dash"/>
  <g class="drive">''' + car(0, 167) + '''</g>
  <g><rect x="560" y="214" width="58" height="30" rx="6" class="svg-box"/><circle cx="589" cy="229" r="10" class="wave"/><circle cx="589" cy="229" r="10" class="wave d2"/>
     <text x="490" y="236" class="svg-s">spoofer</text></g>
  <text x="20" y="236" class="svg-s"><tspan fill="var(--accent)">solid</tspan>: path from wheel speed and steering</text>
  <text x="20" y="256" class="svg-s"><tspan fill="var(--accent-2)">dashed</tspan>: position the spoofed GPS reports</text>
  <g class="blink"><rect x="470" y="40" width="150" height="34" rx="8" class="svg-acc2"/><text x="486" y="63" class="svg-t" style="fill:#fff">mismatch!</text></g>
</svg>'''

SVG_LEAK = '''<svg viewBox="0 0 640 250" role="img" aria-label="Packet header fields; fields that identify the capture session rather than the device, such as IP address, port and timestamp, are struck out; data is split by time so the test set comes from later traffic">
  <text x="20" y="28" class="svg-t">One packet's fields</text>
  <rect x="20" y="42" width="110" height="40" rx="6" class="svg-box"/><text x="38" y="68" class="svg-s">source IP</text>
  <rect x="136" y="42" width="90" height="40" rx="6" class="svg-box"/><text x="160" y="68" class="svg-s">port</text>
  <rect x="232" y="42" width="110" height="40" rx="6" class="svg-box"/><text x="248" y="68" class="svg-s">timestamp</text>
  <rect x="348" y="42" width="80" height="40" rx="6" class="svg-acc" opacity=".85"/><text x="366" y="68" class="svg-s" style="fill:#fff">TTL</text>
  <rect x="434" y="42" width="90" height="40" rx="6" class="svg-acc" opacity=".85"/><text x="447" y="68" class="svg-s" style="fill:#fff">window</text>
  <rect x="530" y="42" width="90" height="40" rx="6" class="svg-acc" opacity=".85"/><text x="543" y="68" class="svg-s" style="fill:#fff">options</text>
  <g class="pop"><line x1="20" y1="62" x2="342" y2="62" stroke="var(--accent-2)" stroke-width="4"/>
     <text x="40" y="106" class="svg-s" fill="var(--accent-2)">shortcuts: identify the capture, not the device</text></g>
  <text x="20" y="150" class="svg-t">Split by time, not at random</text>
  <rect x="20" y="166" width="420" height="34" rx="6" fill="var(--accent)" opacity=".18" stroke="var(--accent)"/>
  <text x="34" y="189" class="svg-s">train: weeks 1 to 3</text>
  <rect x="446" y="166" width="174" height="34" rx="6" fill="var(--accent-2)" opacity=".18" stroke="var(--accent-2)"/>
  <text x="460" y="189" class="svg-s">test: week 4</text>
  <line x1="20" y1="222" x2="620" y2="222" class="svg-line"/><circle cx="20" cy="222" r="6" class="svg-acc drive s2"/>
  <text x="20" y="246" class="svg-s">Illustration: which fields count as shortcuts is part of the research.</text>
</svg>'''

SVG_TWINS = '''<svg viewBox="0 0 640 250" role="img" aria-label="The same traffic features go into two models: one with a small quantum circuit layer and one with a classical layer of the same size; the two are compared on simulator and on real quantum hardware">
  <rect x="20" y="95" width="110" height="56" rx="8" class="svg-box"/><text x="38" y="120" class="svg-t">traffic</text><text x="38" y="140" class="svg-s">features</text>
  <path d="M130 112 L230 62" class="svg-line dash"/><path d="M130 134 L230 184" class="svg-line dash"/>
  <rect x="230" y="30" width="190" height="66" rx="8" class="svg-box"/>
  <line x1="250" y1="52" x2="400" y2="52" class="svg-line"/><line x1="250" y1="76" x2="400" y2="76" class="svg-line"/>
  <rect x="272" y="44" width="18" height="16" class="svg-acc"/><rect x="272" y="68" width="18" height="16" class="svg-acc"/>
  <line x1="320" y1="52" x2="320" y2="76" stroke="var(--accent)" stroke-width="3"/><circle cx="320" cy="76" r="7" fill="none" stroke="var(--accent)" stroke-width="3"/>
  <rect x="350" y="44" width="18" height="16" class="svg-acc2"/><rect x="350" y="68" width="18" height="16" class="svg-acc2"/>
  <circle cx="250" cy="52" r="5" class="svg-acc2 drive s3"/>
  <text x="240" y="116" class="svg-s">quantum circuit layer</text>
  <rect x="230" y="152" width="190" height="66" rx="8" class="svg-box"/>
  <circle cx="270" cy="185" r="9" class="svg-acc"/><circle cx="310" cy="172" r="9" class="svg-acc"/><circle cx="310" cy="198" r="9" class="svg-acc"/><circle cx="350" cy="185" r="9" class="svg-acc"/><circle cx="390" cy="185" r="9" class="svg-acc2"/>
  <text x="236" y="240" class="svg-s">classical twin, same parameter count</text>
  <path d="M420 62 L510 112" class="svg-line dash"/><path d="M420 184 L510 134" class="svg-line dash"/>
  <g class="blink"><rect x="510" y="96" width="112" height="56" rx="8" class="svg-acc2"/><text x="528" y="122" class="svg-t" style="fill:#fff">compare</text><text x="524" y="142" class="svg-s" style="fill:#fff">sim vs QPU</text></g>
</svg>'''

PL = {}
PL['planned-gnss'] = ('Catching GNSS spoofing with the car\'s own sensors',
 'Can a car notice that its GPS is lying, using only the data it already has? This project builds a lightweight spoofing detector from the vehicle\'s own motion data.',
 BADGE + '''
<section>
<h2>Why this matters</h2>
<p>A GPS jammer blocks satellite signals; a spoofer is worse, because it feeds the receiver fake signals and quietly moves the car to the wrong place. Researchers have shown that spoofed routes can fool location tracking on real roads and can take over the sensor-fusion localization used in autonomous driving. Meanwhile every modern car already measures how it actually moves: wheel speeds, steering angle and yaw rate travel on its internal data bus.</p>
<p>My earlier work located cars that jam GPS from the roadside (ACM CCS 2014) and read in-vehicle data to identify drivers (ACM/IEEE SEC 2017). This project joins the two: check every GPS fix against the car's own motion, on hardware cheap enough to ship.</p>
''' + fig(SVG_SPOOF, 'The idea: the path computed from wheel speed and steering keeps going straight while the spoofed GPS position drifts away. When the gap grows faster than normal sensor error explains, raise an alarm.') + '''
</section>
<section>
<h2>Research questions</h2>
''' + rqs([
 'How quickly can wheel-speed, steering and yaw-rate data expose a GPS position that disagrees with how the car really moved, and at what false-alarm rate?',
 'Can the detector run on a phone or an in-vehicle processor in real time, with a memory and power budget an automaker would accept?',
 'How does a careful attacker who drifts the position slowly, or follows the real road network, evade it, and what does it take to catch them?',
]) + '''
</section>
<section>
<h2>Approach</h2>
''' + flow([
 ('Collect drives', 'Log GNSS fixes and bus data with an OBD-II dongle and a phone, as in PredriveID.'),
 ('Simulate attacks', 'Replay recorded traces with injected spoofing paths, from crude jumps to slow, road-following drift.'),
 ('Model motion', 'Dead reckoning and a Kalman filter turn bus data into an independent path.'),
 ('Detect', 'Compare the two paths with a residual test and a small learned model.'),
 ('Measure', 'Time to detect, false alarms per hour, and run time on a phone.'),
], 'Project steps') + '''
<p class="note">All spoofing is simulated in recorded data or in a shielded lab. Transmitting on GPS frequencies on the road is illegal and is never part of this project.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
''' + skills(['Python', 'Signal processing', 'Kalman filtering', 'Machine learning', 'Vehicle data (CAN, OBD-II)', 'Android, optional']) + '''
</section>
<section>
<h2>Papers to read first</h2>
''' + reading([
 ('GNSS spoofing and detection', 'M. L. Psiaki, T. E. Humphreys', 'Proceedings of the IEEE, 2016', 'https://doi.org/10.1109/JPROC.2016.2526658', 'The standard survey: how spoofing works and the families of defenses.'),
 ('On the requirements for successful GPS spoofing attacks', 'N. O. Tippenhauer, C. Pöpper, K. B. Rasmussen, S. Capkun', 'ACM CCS, 2011', 'https://doi.org/10.1145/2046707.2046719', 'What an attacker must control to move a victim, and why that is hard.'),
 ('Security of GPS/INS based on-road location tracking systems', 'S. Narain, A. Ranganathan, G. Noubir', 'IEEE Symposium on Security and Privacy, 2019', 'https://doi.org/10.1109/SP.2019.00068', 'Spoofing that follows the road network, the attacker this project must beat.'),
 ('Drift with Devil: Security of multi-sensor fusion based localization in high-level autonomous driving under GPS spoofing', 'J. Shen, J. Y. Won, Z. Chen, Q. A. Chen', 'USENIX Security Symposium, 2020', 'https://www.usenix.org/conference/usenixsecurity20/presentation/shen', 'Shows sensor fusion alone is not a defense, so detection has to be designed in.'),
 ('Detection of on-road vehicles emanating GPS interference', '<b>G. Kar</b>, H. Mustafa, Y. Wang, Y. Chen, W. Xu, M. Gruteser, T. Vu', 'ACM CCS, 2014', 'https://doi.org/10.1145/2660267.2660336', 'Our earlier work on GPS interference from vehicles.'),
 ('PredriveID: Pre-trip driver identification from in-vehicle data', '<b>G. Kar</b>, S. Jain, M. Gruteser, J. Chen, F. Bai, R. Govindan', 'ACM/IEEE SEC, 2017', 'https://doi.org/10.1145/3132211.3134462', 'How we collected and used in-vehicle bus data with low-cost hardware.'),
]) + '</section>' + JOIN)

PL['planned-benchmark'] = ('Leak-free benchmarks for IoT traffic classifiers',
 'Many intrusion-detection and device-fingerprinting papers report near-perfect accuracy. This project measures how much of it survives once shortcuts in the data are removed.',
 BADGE + '''
<section>
<h2>Why this matters</h2>
<p>Machine learning on network traffic often learns the wrong thing. A model can score 99% because a field such as an IP address or a timestamp tells it which capture a packet came from, not because it understands the device or the attack. Security researchers have documented such pitfalls across top venues, and the widely used CICIDS2017 dataset turned out to contain labeling and feature-extraction errors.</p>
<p>My group has published device fingerprinting from packet headers (ICISSP 2024) and genetic-algorithm feature selection for incident detection (Electronics 2024). This project turns the same critical eye on that kind of work, our own included, and produces a benchmark that other groups can trust.</p>
''' + fig(SVG_LEAK, 'Two ideas behind a leak-free benchmark: drop fields that identify the capture rather than the behavior, and test on traffic recorded after the training traffic.') + '''
</section>
<section>
<h2>Research questions</h2>
''' + rqs([
 'Which packet and flow features act as shortcuts in popular IoT and intrusion datasets, and how can they be found automatically?',
 'How much accuracy do published-style pipelines keep under time-based splits, unseen networks and unseen devices?',
 'Which features stay useful after the audit, and can a model built on them run on a home or campus gateway?',
]) + '''
</section>
<section>
<h2>Approach</h2>
''' + flow([
 ('Reproduce', 'Re-run our fingerprinting and feature-selection pipelines on public datasets.'),
 ('Audit', 'Search for shortcut features with ablation and simple one-feature models.'),
 ('Re-split', 'Evaluate with time-based, network-based and device-based splits.'),
 ('Rebuild', 'Select features again under the strict protocol and size a gateway model.'),
 ('Release', 'Publish the protocol, code and cleaned splits for others to use.'),
], 'Project steps') + '''
</section>
<section>
<h2>Skills you will use and learn</h2>
''' + skills(['Python, pandas, scikit-learn', 'Wireshark and Scapy', 'Experiment design', 'Feature selection', 'Reproducible research']) + '''
</section>
<section>
<h2>Papers to read first</h2>
''' + reading([
 ('Outside the closed world: On using machine learning for network intrusion detection', 'R. Sommer, V. Paxson', 'IEEE Symposium on Security and Privacy, 2010', 'https://doi.org/10.1109/SP.2010.25', 'The classic argument for why intrusion detection is harder for ML than it looks.'),
 ('Dos and don\'ts of machine learning in computer security', 'D. Arp, E. Quiring, F. Pendlebury, A. Warnecke, F. Pierazzi, C. Wressnegger, L. Cavallaro, K. Rieck', 'USENIX Security Symposium, 2022', 'https://www.usenix.org/conference/usenixsecurity22/presentation/arp', 'A checklist of pitfalls, with evidence that they are common.'),
 ('Troubleshooting an intrusion detection dataset: the CICIDS2017 case study', 'G. Engelen, V. Rimmer, W. Joosen', 'IEEE Security and Privacy Workshops, 2021', 'https://doi.org/10.1109/SPW53761.2021.00009', 'What went wrong inside a dataset everyone uses.'),
 ('Toward generating a new intrusion detection dataset and intrusion traffic characterization', 'I. Sharafaldin, A. Habibi Lashkari, A. A. Ghorbani', 'ICISSP, 2018', 'https://doi.org/10.5220/0006639801080116', 'The CICIDS2017 paper itself, to read alongside the critique.'),
 ('N-BaIoT: Network-based detection of IoT botnet attacks using deep autoencoders', 'Y. Meidan, M. Bohadana, Y. Mathov, Y. Mirsky, A. Shabtai, D. Breitenbacher, Y. Elovici', 'IEEE Pervasive Computing, 2018', 'https://doi.org/10.1109/MPRV.2018.03367731', 'A widely used IoT botnet dataset that the benchmark will cover.'),
 ('Comparative analysis of feature selection algorithms for automated IoT device fingerprinting', 'A. Aksoy, S. Varma, G. Moorthy, E. Pan, <b>G. Kar</b>', 'ICISSP, 2024', 'https://doi.org/10.5220/0012379100003648', 'Our own fingerprinting pipeline, the first one to audit.'),
]) + '</section>' + JOIN)

PL['planned-quantum'] = ('Does a quantum layer really help? Honest benchmarks for quantum intrusion detection',
 'Hybrid quantum-classical models have reported strong intrusion-detection results in simulation. This project asks which part of that comes from the quantum layer, and what survives on real quantum hardware.',
 BADGE + '''
<section>
<h2>Why this matters</h2>
<p>Our hybrid quantum-classical framework (EPJ Quantum Technology, 2025) detected DDoS traffic and classified Android malware with high accuracy in simulation, and a 2026 paper I co-authored ran a hybrid model on an IonQ quantum processor. A large 2024 benchmark study found that, on the small tasks it tested, out-of-the-box classical models outperformed the quantum classifiers overall, and that removing entanglement often did not hurt. Those findings set a high bar, and meeting it honestly is what makes a quantum security result credible.</p>
''' + fig(SVG_TWINS, 'The core experiment: give a quantum circuit layer and a classical layer with the same number of trainable parameters the same features, then compare them in simulation and on a real quantum processor.') + '''
</section>
<section>
<h2>Research questions</h2>
''' + rqs([
 'Against classical twins with matched parameter counts and the same tuning budget, where does the quantum layer change detection accuracy, if anywhere?',
 'How do the data encoding, the circuit depth and the number of qubits affect what the model can learn and whether it still trains?',
 'How much of the simulator result survives real hardware noise, and what does a run cost in time and money?',
]) + '''
</section>
<section>
<h2>Approach</h2>
''' + flow([
 ('Reproduce', 'Rebuild our EPJ QT pipeline and its datasets in PennyLane or Qiskit.'),
 ('Twin models', 'Swap the quantum layer for classical layers of equal size; remove entanglement.'),
 ('Sweep', 'Vary encodings, depth and qubit count; watch for vanishing gradients.'),
 ('Add noise', 'Use hardware noise models, then run the best settings on a cloud QPU.'),
 ('Report', 'Accuracy, variance across seeds, wall-clock time and cost.'),
], 'Project steps') + '''
</section>
<section>
<h2>Skills you will use and learn</h2>
''' + skills(['Python, PyTorch', 'PennyLane or Qiskit', 'Linear algebra', 'Experiment design and statistics', 'Network security datasets']) + '''
</section>
<section>
<h2>Papers to read first</h2>
''' + reading([
 ('Supervised learning with quantum-enhanced feature spaces', 'V. Havlíček, A. D. Córcoles, K. Temme, A. W. Harrow, A. Kandala, J. M. Chow, J. M. Gambetta', 'Nature, 2019', 'https://doi.org/10.1038/s41586-019-0980-2', 'The paper that started quantum kernel and feature-map classifiers on real hardware.'),
 ('Quanvolutional neural networks: powering image recognition with quantum circuits', 'M. Henderson, S. Shakya, S. Pradhan, T. Cook', 'Quantum Machine Intelligence, 2020', 'https://doi.org/10.1007/s42484-020-00012-y', 'The quanvolutional layer, a building block of hybrid models like ours.'),
 ('Effect of data encoding on the expressive power of variational quantum machine-learning models', 'M. Schuld, R. Sweke, J. J. Meyer', 'Physical Review A, 2021', 'https://doi.org/10.1103/PhysRevA.103.032430', 'Why the way you load data into qubits limits what the model can learn.'),
 ('Barren plateaus in quantum neural network training landscapes', 'J. R. McClean, S. Boixo, V. N. Smelyanskiy, R. Babbush, H. Neven', 'Nature Communications, 2018', 'https://doi.org/10.1038/s41467-018-07090-4', 'Why gradients vanish as circuits grow, and what that means for scaling.'),
 ('Variational quantum algorithms', 'M. Cerezo, A. Arrasmith, R. Babbush, S. C. Benjamin, S. Endo, K. Fujii, J. R. McClean, K. Mitarai, X. Yuan, L. Cincio, P. J. Coles', 'Nature Reviews Physics, 2021', 'https://doi.org/10.1038/s42254-021-00348-9', 'A readable overview of the model family this project uses.'),
 ('Better than classical? The subtle art of benchmarking quantum machine learning models', 'J. Bowles, S. Ahmed, M. Schuld', 'arXiv preprint, 2024', 'https://arxiv.org/abs/2403.07059', 'The benchmark study whose standard this project adopts.'),
 ('Unified hybrid quantum classical neural network framework for detecting distributed denial of service and Android mobile malware attacks', 'S. Sridevi, B. Indira, S. Geetha, S. Balachandran, <b>G. Kar</b>, S. Kharbanda', 'EPJ Quantum Technology, 2025', 'https://doi.org/10.1140/epjqt/s40507-025-00380-z', 'Our framework, the starting point of the project.'),
]) + '</section>' + JOIN)


SVG_XAI = """<svg viewBox="0 0 640 260" role="img" aria-label="A network flow enters a detector, which raises an alert; an explanation then shows how much each feature pushed the decision as growing bars; the top bar is a capture timestamp, flagged as a possible shortcut rather than real attack behavior">
  <rect x="20" y="96" width="110" height="60" rx="8" class="svg-box"/><text x="40" y="122" class="svg-t">flow</text><text x="40" y="142" class="svg-s">features</text>
  <path d="M130 126 L190 126" class="svg-line dash"/>
  <rect x="190" y="86" width="120" height="80" rx="10" fill="var(--fg)" opacity=".85"/>
  <text x="212" y="122" class="svg-t" style="fill:var(--bg)">detector</text><text x="240" y="148" class="svg-t" style="fill:var(--bg)">?</text>
  <path d="M310 126 L350 126" class="svg-line dash"/>
  <g class="blink"><rect x="196" y="186" width="108" height="34" rx="8" class="svg-acc2"/><text x="216" y="209" class="svg-s" style="fill:#fff">ALERT</text></g>
  <text x="360" y="30" class="svg-t">Why this alert?</text>
  <text x="360" y="64" class="svg-s">capture time</text><rect x="470" y="50" width="150" height="20" rx="4" class="svg-acc2 grow"/>
  <text x="360" y="102" class="svg-s">SYN rate</text><rect x="470" y="88" width="118" height="20" rx="4" class="svg-acc grow g2"/>
  <text x="360" y="140" class="svg-s">dest. port</text><rect x="470" y="126" width="74" height="20" rx="4" class="svg-acc grow g3"/>
  <text x="360" y="178" class="svg-s">packet size</text><rect x="470" y="164" width="40" height="20" rx="4" class="svg-acc grow g4"/>
  <g class="pop"><text x="360" y="222" class="svg-s" fill="var(--accent-2)">top reason is a shortcut, not attack behavior</text></g>
</svg>"""

PL['planned-xai'] = ('Explanations you can check: explainable intrusion and malware detection',
 'Security analysts are asked to act on alerts from models they cannot see inside. This project tests whether today\'s explanation methods tell them the truth about why a detector fired, and builds explanations an analyst can check.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Explainability already runs through my applied AI work: our food fraud study (Expert Systems, 2025) compared LIME, SHAP and Google's What-If Tool on one model and showed what each can and cannot tell a food-safety analyst, and our employee attrition paper (LA-CCI, 2025) used explanations to find the factors behind people leaving. Security raises the stakes. An intrusion or malware alert has to be acted on quickly, different explanation methods can disagree about the same alert, and an explanation that looks convincing can still be wrong about what the model actually used. An honest explanation can also expose a detector that learned a shortcut, which links this project to the leak-free benchmark project.</p>
""" + fig(SVG_XAI, 'The idea: for each alert, show how much each input pushed the decision, then check whether the top reasons are real attack behavior or artifacts of how the data was collected. Illustration, not results.') + """
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'For the same intrusion or malware detector, how often do LIME, SHAP and gradient-based explanations agree on the top reasons for an alert, and which of them are faithful to what the model really uses?',
 'Can explanations reliably expose shortcuts, such as a detector keying on capture artifacts instead of attack behavior?',
 'Where does a small interpretable model (rules or a shallow tree) match a black-box detector closely enough to replace it?',
 'Do explanations help analysts triage alerts faster and more accurately, or only make them more confident?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Detectors', 'Train intrusion and Android malware detectors on public datasets from our earlier work.'),
 ('Explain', 'Generate LIME, SHAP and gradient-based explanations for the same alerts.'),
 ('Measure', 'Score faithfulness by removing top features, plus stability and sparsity.'),
 ('Shortcut hunt', 'Plant known artifacts in the data and see which methods find them.'),
 ('Analyst study', 'A small, IRB-approved study with student analysts triaging alerts.'),
], 'Project steps') + """
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python, scikit-learn, PyTorch', 'SHAP and LIME libraries', 'Network and malware datasets', 'Experiment design and statistics', 'Basic user-study methods']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('"Why should I trust you?" Explaining the predictions of any classifier', 'M. T. Ribeiro, S. Singh, C. Guestrin', 'ACM SIGKDD (KDD), 2016', 'https://doi.org/10.1145/2939672.2939778', 'LIME: explain one prediction by fitting a simple model around it.'),
 ('A unified approach to interpreting model predictions', 'S. M. Lundberg, S.-I. Lee', 'NeurIPS (NIPS), 2017', 'https://arxiv.org/abs/1705.07874', 'SHAP: feature contributions grounded in Shapley values.'),
 ('Peeking inside the black-box: a survey on explainable artificial intelligence (XAI)', 'A. Adadi, M. Berrada', 'IEEE Access, 2018', 'https://doi.org/10.1109/ACCESS.2018.2870052', 'A broad map of the field and its vocabulary.'),
 ('LEMNA: explaining deep learning based security applications', 'W. Guo, D. Mu, J. Xu, P. Su, G. Wang, X. Xing', 'ACM CCS, 2018', 'https://doi.org/10.1145/3243734.3243792', 'An explanation method designed for security models such as binary analysis.'),
 ('Evaluating explanation methods for deep learning in security', 'A. Warnecke, D. Arp, C. Wressnegger, K. Rieck', 'IEEE EuroS&amp;P, 2020', 'https://doi.org/10.1109/EuroSP48549.2020.00018', 'How to judge whether an explanation is any good for security; the yardstick this project starts from.'),
 ('Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead', 'C. Rudin', 'Nature Machine Intelligence, 2019', 'https://doi.org/10.1038/s42256-019-0048-x', 'The case for interpretable models, behind research question 3.'),
 ('Food fraud detection using explainable artificial intelligence', 'O. Buyuktepe, C. Catal, <b>G. Kar</b>, Y. Bouzembrak, H. Marvin, A. Gavai', 'Expert Systems, 2025', 'https://doi.org/10.1111/exsy.13387', 'Our comparison of LIME, SHAP and the What-If Tool on one model.'),
]) + '</section>' + JOIN)


# ---------------------------------------------------------------- six more planned projects (round 7)
BADGE_NEW = ''

PLANNED_CORE_MORE = [
    ('planned-can', 'Spotting intruders on the car\'s internal network'),
    ('planned-acoustic', 'Do earbuds, smart speakers and video calls leak what you type?'),
]
PLANNED_NEW = [
    ('planned-rag', 'Attacking and defending a campus chatbot'),
    ('planned-tinyml', 'Intrusion detection that fits on the device'),
    ('planned-pqc', 'Is the Internet of Things ready for post-quantum cryptography?'),
    ('planned-blockchain', 'Tamper-evident identity for IoT devices on a blockchain'),
]

SVG_CAN = '''<svg viewBox="0 0 640 240" role="img" aria-label="Electronic control units for the engine, brakes and steering share one in-vehicle bus; their messages travel along it on a steady rhythm; a rogue device plugged into the diagnostic port injects extra messages, which break the rhythm and trigger an alert">
  <line x1="20" y1="120" x2="620" y2="120" stroke="var(--fg)" stroke-width="4"/>
  <line x1="20" y1="132" x2="620" y2="132" stroke="var(--fg)" stroke-width="4" opacity=".5"/>
  <text x="20" y="160" class="svg-s">in-vehicle bus (CAN)</text>
  <rect x="60" y="40" width="100" height="44" rx="8" class="svg-box"/><text x="82" y="68" class="svg-s">engine</text><line x1="110" y1="84" x2="110" y2="120" class="svg-line"/>
  <rect x="200" y="40" width="100" height="44" rx="8" class="svg-box"/><text x="226" y="68" class="svg-s">brakes</text><line x1="250" y1="84" x2="250" y2="120" class="svg-line"/>
  <rect x="340" y="40" width="100" height="44" rx="8" class="svg-box"/><text x="356" y="68" class="svg-s">steering</text><line x1="390" y1="84" x2="390" y2="120" class="svg-line"/>
  <g class="drive"><circle cx="0" cy="126" r="6" class="svg-acc"/></g>
  <g class="drive s3"><circle cx="0" cy="126" r="6" class="svg-acc"/></g>
  <g class="blink"><rect x="490" y="176" width="110" height="44" rx="8" class="svg-acc2"/><text x="506" y="203" class="svg-s" style="fill:#fff">OBD dongle</text><line x1="545" y1="176" x2="545" y2="132" stroke="var(--accent-2)" stroke-width="3"/></g>
  <g class="pop"><rect x="470" y="40" width="150" height="44" rx="8" fill="none" stroke="var(--accent-2)" stroke-width="3"/><text x="484" y="68" class="svg-s" fill="var(--accent-2)">rhythm broken!</text></g>
  <text x="20" y="226" class="svg-s">Illustration: which timing and content features work best is part of the research.</text>
</svg>'''

SVG_ACOUSTIC = '''<svg viewBox="0 0 640 240" role="img" aria-label="Fingers press keys on a keyboard; sound waves spread from the pressed key to nearby devices: earbuds, a smart speaker and a laptop on a video call; each device picks up the sound">
  <rect x="40" y="130" width="300" height="80" rx="10" class="svg-box"/>
  <rect x="58" y="146" width="34" height="22" rx="4" class="svg-box"/><rect x="100" y="146" width="34" height="22" rx="4" class="svg-box"/><rect x="142" y="146" width="34" height="22" rx="4" class="svg-acc blink"/><rect x="184" y="146" width="34" height="22" rx="4" class="svg-box"/><rect x="226" y="146" width="34" height="22" rx="4" class="svg-box"/><rect x="268" y="146" width="34" height="22" rx="4" class="svg-box"/>
  <rect x="58" y="176" width="244" height="22" rx="4" class="svg-box"/>
  <circle cx="159" cy="150" r="70" class="wave"/><circle cx="159" cy="150" r="70" class="wave d2"/><circle cx="159" cy="150" r="70" class="wave d3"/>
  <rect x="400" y="30" width="80" height="50" rx="25" class="svg-box"/><text x="410" y="100" class="svg-s">earbuds</text>
  <rect x="520" y="26" width="64" height="80" rx="14" class="svg-box"/><circle cx="552" cy="66" r="14" class="svg-acc"/><text x="500" y="126" class="svg-s">smart speaker</text>
  <rect x="420" y="150" width="150" height="70" rx="6" class="svg-box"/><circle cx="495" cy="185" r="12" class="svg-acc2"/><text x="440" y="236" class="svg-s">video call</text>
  <path d="M220 110 L400 60" class="svg-line dash"/><path d="M230 120 L520 70" class="svg-line dash"/><path d="M240 160 L420 180" class="svg-line dash"/>
</svg>'''

SVG_RAG = '''<svg viewBox="0 0 640 240" role="img" aria-label="A student's question goes to a retriever, which pulls passages from the university's pages; one passage has been planted by an attacker and carries a hidden instruction; the language model reads the passages and answers; a guard step checks passages and the answer">
  <rect x="20" y="96" width="110" height="52" rx="8" class="svg-box"/><text x="36" y="128" class="svg-s">question</text>
  <path d="M130 122 L170 122" class="svg-line dash"/>
  <rect x="170" y="96" width="110" height="52" rx="8" class="svg-box"/><text x="186" y="128" class="svg-s">retriever</text>
  <rect x="190" y="20" width="60" height="40" rx="4" class="svg-box"/><rect x="256" y="20" width="60" height="40" rx="4" class="svg-box"/>
  <g class="blink"><rect x="322" y="20" width="60" height="40" rx="4" class="svg-acc2"/><text x="338" y="46" class="svg-s" style="fill:#fff">!</text></g>
  <text x="190" y="80" class="svg-s">campus pages (one planted)</text>
  <path d="M280 122 L330 122" class="svg-line dash"/>
  <rect x="330" y="90" width="120" height="64" rx="10" fill="var(--fg)" opacity=".85"/><text x="360" y="128" class="svg-t" style="fill:var(--bg)">LLM</text>
  <path d="M450 122 L500 122" class="svg-line dash"/>
  <rect x="500" y="96" width="120" height="52" rx="8" class="svg-box"/><text x="520" y="128" class="svg-s">answer</text>
  <g class="pop"><rect x="300" y="176" width="200" height="40" rx="8" fill="none" stroke="var(--accent)" stroke-width="3"/><text x="318" y="202" class="svg-s" fill="var(--accent)">guard: check and cite</text></g>
</svg>'''

SVG_TINY = '''<svg viewBox="0 0 640 240" role="img" aria-label="A large intrusion-detection model is pruned and quantized into a small one that fits on a microcontroller inside an IoT camera; network packets stream into the device and are checked on the spot">
  <g class="pop"><rect x="20" y="40" width="170" height="130" rx="10" class="svg-box"/>
  <circle cx="60" cy="80" r="9" class="svg-acc"/><circle cx="60" cy="110" r="9" class="svg-acc"/><circle cx="60" cy="140" r="9" class="svg-acc"/>
  <circle cx="105" cy="70" r="9" class="svg-acc"/><circle cx="105" cy="95" r="9" class="svg-acc"/><circle cx="105" cy="120" r="9" class="svg-acc"/><circle cx="105" cy="145" r="9" class="svg-acc"/>
  <circle cx="150" cy="95" r="9" class="svg-acc"/><circle cx="150" cy="125" r="9" class="svg-acc"/>
  <text x="36" y="196" class="svg-s">full model</text></g>
  <path d="M200 105 L270 105" class="svg-line dash"/><text x="204" y="94" class="svg-s">prune</text><text x="204" y="130" class="svg-s">quantize</text>
  <rect x="290" y="60" width="100" height="90" rx="8" fill="var(--fg)" opacity=".85"/>
  <circle cx="320" cy="90" r="7" class="svg-acc2"/><circle cx="360" cy="90" r="7" class="svg-acc2"/><circle cx="340" cy="120" r="7" class="svg-acc2"/>
  <line x1="300" y1="60" x2="300" y2="48" class="svg-line"/><line x1="320" y1="60" x2="320" y2="48" class="svg-line"/><line x1="340" y1="60" x2="340" y2="48" class="svg-line"/><line x1="360" y1="60" x2="360" y2="48" class="svg-line"/><line x1="380" y1="60" x2="380" y2="48" class="svg-line"/>
  <line x1="300" y1="150" x2="300" y2="162" class="svg-line"/><line x1="320" y1="150" x2="320" y2="162" class="svg-line"/><line x1="340" y1="150" x2="340" y2="162" class="svg-line"/><line x1="360" y1="150" x2="360" y2="162" class="svg-line"/><line x1="380" y1="150" x2="380" y2="162" class="svg-line"/>
  <text x="290" y="190" class="svg-s">microcontroller</text>
  <line x1="400" y1="105" x2="620" y2="105" class="svg-line"/>
  <g class="drive s3"><rect x="0" y="98" width="16" height="14" rx="3" class="svg-acc"/></g>
  <text x="440" y="140" class="svg-s">packets checked on the device</text>
</svg>'''



PL['planned-can'] = ('Spotting intruders on the car\'s internal network',
 'Inside every car, dozens of computers talk over one shared bus with no sender authentication. This project builds detectors that notice when a message on that bus does not belong there.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Researchers have shown that an attacker who reaches a car's internal network can control brakes, engine and locks. Messages on that network carry no proof of who sent them, so detection has to come from patterns: when messages arrive, what they contain and which control unit produced them. My PredriveID work with General Motors Research read exactly this kind of bus data to tell drivers apart, using low-cost hardware. This project turns the same skills toward catching intrusions.</p>
""" + fig(SVG_CAN, 'Normal messages repeat on a steady rhythm; injected ones break it. Illustration, not results.') + """
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'How well do timing-based, content-based and learning-based detectors catch injection, flooding and impersonation attacks on public in-vehicle datasets?',
 'Do detectors trained on one car still work on another model, or after a software update changes the message rhythm?',
 'Can a detector small enough for an in-vehicle gateway also say which control unit sent the bad message?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Datasets', 'Start from public in-vehicle attack datasets, then log our own drives with an OBD-II interface.'),
 ('Baselines', 'Reimplement entropy, clock-skew and neural detectors from the reading list.'),
 ('Cross-car tests', 'Train on one vehicle or time period, test on another.'),
 ('Lightweight model', 'Shrink the best detector for a low-cost embedded board.'),
 ('Report', 'Detection rate, false alarms per hour of driving and attribution accuracy.'),
], 'Project steps') + """
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python, pandas, PyTorch', 'CAN bus and OBD-II basics', 'Time-series anomaly detection', 'Embedded boards (Raspberry Pi or similar)', 'Careful experiment design']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Experimental security analysis of a modern automobile', 'K. Koscher, A. Czeskis, F. Roesner, S. Patel, T. Kohno, S. Checkoway, D. McCoy, B. Kantor, D. Anderson, H. Shacham, S. Savage', 'IEEE S&amp;P, 2010', 'https://doi.org/10.1109/SP.2010.34', 'The paper that showed what an attacker on the car\'s network can do.'),
 ('Entropy-based anomaly detection for in-vehicle networks', 'M. Müter, N. Asaj', 'IEEE Intelligent Vehicles Symposium, 2011', 'https://doi.org/10.1109/IVS.2011.5940552', 'An early, simple detector that is still a useful baseline.'),
 ('Fingerprinting electronic control units for vehicle intrusion detection', 'K.-T. Cho, K. G. Shin', 'USENIX Security, 2016', 'https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/cho', 'Uses the timing of periodic messages to fingerprint the sender.'),
 ('GIDS: GAN based intrusion detection system for in-vehicle network', 'E. Seo, H. M. Song, H. K. Kim', 'PST, 2018', 'https://doi.org/10.1109/PST.2018.8514157', 'A learning-based detector that can flag attacks it never saw.'),
 ('In-vehicle network intrusion detection using deep convolutional neural network', 'H. M. Song, J. Woo, H. K. Kim', 'Vehicular Communications, 2020', 'https://doi.org/10.1016/j.vehcom.2019.100198', 'A deep detector evaluated on a widely used public dataset.'),
 ('PredriveID: Pre-trip driver identification from in-vehicle data', '<b>G. Kar</b>, S. Jain, M. Gruteser, J. Chen, F. Bai, R. Govindan', 'ACM/IEEE SEC, 2017', 'https://doi.org/10.1145/3132211.3134462', 'How we collected and used in-vehicle bus data.'),
]) + '</section>' + JOIN)

PL['planned-acoustic'] = ('Do earbuds, smart speakers and video calls leak what you type?',
 'We showed in 2015 that one phone can tell which keys you press from their sound. Microphones are now in earbuds, speakers and every video call. This project measures how much they leak, and what stops it.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Our MobiCom 2015 attack placed each keystroke by the tiny difference in when its sound reached a phone's two microphones, with no training data. Since then, deep learning has made keystroke recognition from recorded audio much easier, and the microphones around a keyboard have multiplied: wireless earbuds, smart speakers, laptops on video calls. Each of these processes sound differently, and some of that processing may blur or preserve the clues an attacker needs. Knowing which settings leak, and which simple defenses work, matters for anyone typing a password on a call.</p>
""" + fig(SVG_ACOUSTIC, 'Every key press makes a sound that reaches the microphones around it. Illustration.') + """
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'How accurately can keystrokes be recovered from audio captured by earbuds, smart speakers and common video-call apps, compared with a phone next to the keyboard?',
 'Which parts of each pipeline (compression, noise suppression, echo cancellation, stereo or mono) remove the clues that ranging and learning attacks need?',
 'Which cheap defenses, such as masking sounds or app settings, cut leakage without hurting the call?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Record', 'Collect typing sounds on several keyboards with consenting volunteers and an IRB-approved protocol.'),
 ('Pipelines', 'Capture the same typing through earbuds, a smart speaker and video-call software.'),
 ('Attacks', 'Run a ranging attack like ours and a deep learning attack from the reading list.'),
 ('Defenses', 'Test masking noise and app settings.'),
 ('Report', 'Recovery rates per device and setting, with clear advice for users.'),
], 'Project steps') + """
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python, NumPy, librosa', 'Signal processing basics', 'Deep learning for audio', 'Human-subjects research (IRB)', 'Responsible disclosure']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Keyboard acoustic emanations', 'D. Asonov, R. Agrawal', 'IEEE S&amp;P, 2004', 'https://doi.org/10.1109/SECPRI.2004.1301311', 'The first paper to show keys can be told apart by sound.'),
 ('Keyboard acoustic emanations revisited', 'L. Zhuang, F. Zhou, J. D. Tygar', 'ACM CCS, 2005', 'https://doi.org/10.1145/1102120.1102169', 'Recovers typed text without labeled training data, using language patterns.'),
 ('Context-free attacks using keyboard acoustic emanations', 'T. Zhu, Q. Ma, S. Zhang, Y. Liu', 'ACM CCS, 2014', 'https://doi.org/10.1145/2660267.2660296', 'Uses several phones and timing differences, a close cousin of our work.'),
 ('Snooping keystrokes with mm-level audio ranging on a single phone', 'J. Liu, Y. Wang, <b>G. Kar</b>, Y. Chen, J. Yang, M. Gruteser', 'ACM MobiCom, 2015', 'https://doi.org/10.1145/2789168.2790122', 'Our single-phone ranging attack, the starting point.'),
 ('A practical deep learning-based acoustic side channel attack on keyboards', 'J. Harrison, E. Toreini, M. Mehrnezhad', 'IEEE EuroS&amp;P Workshops, 2023', 'https://doi.org/10.1109/EuroSPW59978.2023.00034', 'A recent attack that includes audio recorded over a video call.'),
]) + '</section>' + JOIN)

PL['planned-rag'] = ('Attacking and defending a campus chatbot',
 'Chatbots that answer from a university\'s own pages are spreading fast. This project red-teams one: can a planted page or a crafted question make it give wrong or harmful answers, and which defenses hold up?',
 BADGE_NEW + """
<section>
<h2>Why this matters</h2>
<p>My students and I recently built a retrieval-augmented chatbot for UCM from the university's own web pages (manuscript submitted). Systems like it read whatever their retriever finds, which opens two doors for an attacker: instructions hidden in a page the bot retrieves (indirect prompt injection), and pages written to be retrieved for a target question so the bot repeats a false answer (knowledge poisoning). Universities are deploying these chatbots for admissions, financial aid and IT help, so getting the security right early matters.</p>
""" + fig(SVG_RAG, 'Where attacks enter a retrieval-augmented chatbot, and where a guard can check. Illustration.') + """
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'How easily can a planted page, or a crafted question, make a campus chatbot give a wrong answer, leak its instructions or follow hidden commands?',
 'Does hybrid retrieval (keyword plus vector search, with query rewriting) make poisoning easier or harder than vector search alone?',
 'Which defenses (filtering retrieved text, requiring citations, a second model as a checker) reduce attacks without making answers worse?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Sandbox', 'Rebuild our chatbot on a private copy of public pages; nothing touches live systems.'),
 ('Attack suite', 'Prompt injection and poisoning attacks from the reading list, adapted to campus questions.'),
 ('Measure', 'Attack success, answer quality and cost for each retrieval setting.'),
 ('Defend', 'Add and compare guards.'),
 ('Share', 'Publish the benchmark questions and a deployment checklist for universities.'),
], 'Project steps') + """
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python, LangChain or LlamaIndex', 'Vector databases and BM25', 'LLM APIs and open models', 'Security evaluation and red-teaming ethics', 'Writing clear guidance for practitioners']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Retrieval-augmented generation for knowledge-intensive NLP tasks', 'P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W. Yih, T. Rocktäschel, S. Riedel, D. Kiela', 'NeurIPS, 2020', 'https://arxiv.org/abs/2005.11401', 'Where retrieval-augmented generation comes from.'),
 ('Ignore previous prompt: attack techniques for language models', 'F. Perez, I. Ribeiro', 'NeurIPS ML Safety Workshop, 2022', 'https://arxiv.org/abs/2211.09527', 'Goal hijacking and prompt leaking, the simplest attacks to start with.'),
 ('Not what you\'ve signed up for: compromising real-world LLM-integrated applications with indirect prompt injection', 'K. Greshake, S. Abdelnabi, S. Mishra, C. Endres, T. Holz, M. Fritz', 'ACM AISec, 2023', 'https://doi.org/10.1145/3605764.3623985', 'How instructions hidden in retrieved content take over an app.'),
 ('Formalizing and benchmarking prompt injection attacks and defenses', 'Y. Liu, Y. Jia, R. Geng, J. Jia, N. Z. Gong', 'USENIX Security, 2024', 'https://arxiv.org/abs/2310.12815', 'A common benchmark of attacks and defenses we can build on.'),
 ('PoisonedRAG: knowledge corruption attacks to retrieval-augmented generation of large language models', 'W. Zou, R. Geng, B. Wang, J. Jia', 'USENIX Security, 2025', 'https://arxiv.org/abs/2402.07867', 'Shows a handful of planted texts can steer a RAG system\'s answers.'),
]) + '</section>' + JOIN)

PL['planned-tinyml'] = ('Intrusion detection that fits on the device',
 'Most IoT devices cannot run a full intrusion detector. This project shrinks detectors until they run on a microcontroller, and measures what accuracy that costs.',
 BADGE_NEW + """
<section>
<h2>Why this matters</h2>
<p>My group identifies IoT devices and attacks from packet headers alone, which keeps the input small. Today such detectors run on a server or gateway. Running them on the device itself, or on a cheap board beside it, would catch attacks even when the gateway is bypassed and would keep traffic data local. TinyML techniques such as pruning and 8-bit quantization now fit useful models into a few hundred kilobytes, but security detectors have their own needs: few false alarms, and robustness to traffic the model has not seen.</p>
""" + fig(SVG_TINY, 'Shrink a detector until it fits on a microcontroller, then check packets on the spot. Illustration.') + """
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'How small can a packet-header detector get, through feature selection, pruning and quantization, before detection accuracy or false-alarm rate degrades?',
 'Which model families (small trees, tiny neural networks, autoencoders) give the best accuracy per kilobyte and per millijoule?',
 'Can an on-device detector keep learning normal traffic without being taught to accept an attack?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Baseline', 'Train detectors on public IoT attack datasets with our feature selection pipeline.'),
 ('Compress', 'Prune, quantize to 8 bits and distill into small models.'),
 ('Deploy', 'Run them on boards such as an ESP32 or an Arm Cortex-M with TensorFlow Lite Micro.'),
 ('Measure', 'Accuracy, false alarms, memory, latency and energy on the board.'),
 ('Report', 'An accuracy-per-kilobyte table that others can reproduce.'),
], 'Project steps') + """
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python, scikit-learn, TensorFlow', 'TensorFlow Lite Micro', 'C on microcontrollers', 'Network traffic features', 'Energy and latency measurement']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Kitsune: an ensemble of autoencoders for online network intrusion detection', 'Y. Mirsky, T. Doitshman, Y. Elovici, A. Shabtai', 'NDSS, 2018', 'https://doi.org/10.14722/ndss.2018.23204', 'A lightweight online detector designed to run near the network edge.'),
 ('N-BaIoT: Network-based detection of IoT botnet attacks using deep autoencoders', 'Y. Meidan, M. Bohadana, Y. Mathov, Y. Mirsky, A. Shabtai, D. Breitenbacher, Y. Elovici', 'IEEE Pervasive Computing, 2018', 'https://doi.org/10.1109/MPRV.2018.03367731', 'A widely used IoT botnet dataset to start from.'),
 ('Deep compression: compressing deep neural networks with pruning, trained quantization and Huffman coding', 'S. Han, H. Mao, W. J. Dally', 'ICLR, 2016', 'https://arxiv.org/abs/1510.00149', 'The classic recipe for making models small.'),
 ('Quantization and training of neural networks for efficient integer-arithmetic-only inference', 'B. Jacob, S. Kligys, B. Chen, M. Zhu, M. Tang, A. Howard, H. Adam, D. Kalenichenko', 'IEEE/CVF CVPR, 2018', 'https://doi.org/10.1109/CVPR.2018.00286', 'The 8-bit integer approach behind most microcontroller deployments.'),
 ('MCUNet: tiny deep learning on IoT devices', 'J. Lin, W.-M. Chen, Y. Lin, J. Cohn, C. Gan, S. Han', 'NeurIPS, 2020', 'https://arxiv.org/abs/2007.10319', 'Shows how far careful design can push models on microcontrollers.'),
 ('MLPerf Tiny benchmark', 'C. Banbury, V. J. Reddi, P. Torelli, et al.', 'arXiv preprint, 2021', 'https://arxiv.org/abs/2106.07597', 'How to measure accuracy, latency and energy fairly on tiny devices.'),
 ('Comparative analysis of feature selection algorithms for automated IoT device fingerprinting', 'A. Aksoy, S. Varma, G. Moorthy, E. Pan, <b>G. Kar</b>', 'ICISSP, 2024', 'https://doi.org/10.5220/0012379100003648', 'Our header-only features, a natural fit for tiny models.'),
]) + '</section>' + JOIN)

SVG_PQC = '''<svg viewBox="0 0 640 240" role="img" aria-label="An IoT sensor and a server perform a key exchange; today's small elliptic-curve key crosses quickly, while the post-quantum key is several times larger; an eavesdropper records the traffic to decrypt later with a future quantum computer">
  <rect x="20" y="70" width="110" height="70" rx="10" class="svg-box"/><text x="42" y="102" class="svg-t">sensor</text><text x="40" y="124" class="svg-s">few KB RAM</text>
  <rect x="510" y="70" width="110" height="70" rx="10" class="svg-box"/><text x="534" y="110" class="svg-t">server</text>
  <line x1="130" y1="92" x2="510" y2="92" class="svg-line"/><line x1="130" y1="122" x2="510" y2="122" class="svg-line"/>
  <text x="150" y="84" class="svg-s">classic key</text><text x="150" y="146" class="svg-s">post-quantum key</text>
  <g class="drive s3"><rect x="0" y="86" width="16" height="12" rx="3" class="svg-acc"/></g>
  <g class="drive"><rect x="0" y="114" width="60" height="16" rx="3" class="svg-acc2"/></g>
  <line x1="320" y1="122" x2="320" y2="176" class="svg-line dash"/>
  <rect x="260" y="176" width="120" height="44" rx="8" class="svg-box"/><text x="276" y="203" class="svg-s">recorder</text>
  <g class="blink"><circle cx="430" cy="198" r="16" fill="none" stroke="var(--accent-2)" stroke-width="3"/><circle cx="430" cy="198" r="5" class="svg-acc2"/><text x="456" y="204" class="svg-s" fill="var(--accent-2)">decrypt later?</text></g>
  <text x="20" y="30" class="svg-t">Harvest now, decrypt later</text>
</svg>'''

SVG_CHAIN = '''<svg viewBox="0 0 640 240" role="img" aria-label="A chain of blocks records each IoT device's identity: its packet fingerprint and firmware hash; a new block is added; below, three devices talk to a gateway that checks them against the ledger, and a cloned camera whose fingerprint does not match is flagged">
  <rect x="30" y="24" width="110" height="56" rx="8" class="svg-box"/><text x="46" y="50" class="svg-s">block 41</text><text x="46" y="70" class="svg-s">thermostat</text>
  <rect x="180" y="24" width="110" height="56" rx="8" class="svg-box"/><text x="196" y="50" class="svg-s">block 42</text><text x="196" y="70" class="svg-s">camera</text>
  <rect x="330" y="24" width="110" height="56" rx="8" class="svg-box"/><text x="346" y="50" class="svg-s">block 43</text><text x="346" y="70" class="svg-s">door lock</text>
  <line x1="140" y1="52" x2="180" y2="52" stroke="var(--fg)" stroke-width="3"/><line x1="290" y1="52" x2="330" y2="52" stroke="var(--fg)" stroke-width="3"/>
  <g class="pop"><line x1="440" y1="52" x2="480" y2="52" stroke="var(--fg)" stroke-width="3"/><rect x="480" y="24" width="130" height="56" rx="8" class="svg-acc"/><text x="496" y="50" class="svg-s" style="fill:#fff">block 44</text><text x="496" y="70" class="svg-s" style="fill:#fff">revoke clone</text></g>
  <rect x="250" y="110" width="140" height="44" rx="8" fill="var(--fg)" opacity=".85"/><text x="282" y="138" class="svg-s" style="fill:var(--bg)">gateway</text>
  <line x1="320" y1="80" x2="320" y2="110" class="svg-line dash"/>
  <rect x="60" y="186" width="100" height="36" rx="8" class="svg-box"/><text x="72" y="209" class="svg-s">thermostat</text>
  <rect x="270" y="186" width="100" height="36" rx="8" class="svg-box"/><text x="290" y="209" class="svg-s">camera</text>
  <rect x="480" y="186" width="120" height="36" rx="8" class="svg-acc2 blink"/><text x="492" y="209" class="svg-s" style="fill:#fff">camera (clone)</text>
  <path d="M110 186 L290 154" class="svg-line dash"/><path d="M320 186 L320 154" class="svg-line dash"/><path d="M540 186 L350 154" stroke="var(--accent-2)" stroke-width="2" fill="none" class="dash"/>
</svg>'''

PL['planned-pqc'] = ('Is the Internet of Things ready for post-quantum cryptography?',
 'NIST published its first post-quantum cryptography standards in 2024. This project measures what moving to them costs on small IoT devices, and whether it quietly breaks the security tools that watch their traffic.',
 BADGE_NEW + """
<section>
<h2>Why this matters</h2>
<p>A large enough quantum computer running Shor's algorithm would break the RSA and elliptic-curve cryptography that protects almost all device traffic today. Because traffic can be recorded now and decrypted later, data with a long shelf life is already at risk. NIST's new standards, ML-KEM for key exchange (FIPS 203) and ML-DSA for signatures (FIPS 204), are built on lattices and use much larger keys and signatures. Servers and browsers can absorb that. Battery-powered sensors with a few hundred kilobytes of memory may not. My group works on both sides of this question: quantum machine learning for security, and identifying IoT devices and attacks from their packet headers, which change when handshakes grow.</p>
""" + fig(SVG_PQC, 'Post-quantum keys are larger, and recorded traffic can be attacked later. Illustration, sizes not to scale.') + """
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'What do ML-KEM and ML-DSA cost on common IoT boards in a real protocol (TLS or MQTT over TLS): handshake time, memory, energy and bytes on the air, alone and in hybrid with today\'s algorithms?',
 'Which devices and protocols cannot make the move without hardware changes, and what is the cheapest workable path for them?',
 'Do larger post-quantum handshakes confuse traffic-based tools, such as device fingerprinting and intrusion detectors trained on today\'s traffic?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Testbed', 'Set up ESP32 and Arm Cortex-M boards and a Raspberry Pi gateway running MQTT over TLS.'),
 ('Integrate', 'Add ML-KEM and ML-DSA with open libraries such as liboqs and pqm4, alone and in hybrid mode.'),
 ('Measure', 'Handshake time, memory, energy and packet sizes per device.'),
 ('Check the watchers', 'Rerun our fingerprinting and intrusion detectors on post-quantum traffic.'),
 ('Report', 'A migration guide for IoT deployments, with open measurements.'),
], 'Project steps') + """
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['C on microcontrollers', 'Applied cryptography and TLS', 'Python for analysis', 'Energy and timing measurement', 'Network traffic analysis']) + """
</section>
<section>
<h2>Papers and standards to read first</h2>
""" + reading([
 ('Polynomial-time algorithms for prime factorization and discrete logarithms on a quantum computer', 'P. W. Shor', 'SIAM Journal on Computing, 1997', 'https://doi.org/10.1137/S0097539795293172', 'Why quantum computers threaten today\'s public-key cryptography.'),
 ('Post-quantum cryptography', 'D. J. Bernstein, T. Lange', 'Nature, 2017', 'https://doi.org/10.1038/nature23461', 'A short, readable overview of the replacement families.'),
 ('CRYSTALS-Kyber: a CCA-secure module-lattice-based KEM', 'J. Bos, L. Ducas, E. Kiltz, T. Lepoint, V. Lyubashevsky, J. M. Schanck, P. Schwabe, G. Seiler, D. Stehlé', 'IEEE EuroS&amp;P, 2018', 'https://doi.org/10.1109/EuroSP.2018.00032', 'The scheme that became ML-KEM.'),
 ('Module-lattice-based key-encapsulation mechanism standard (FIPS 203)', 'National Institute of Standards and Technology', 'NIST, 2024', 'https://doi.org/10.6028/NIST.FIPS.203', 'The key-exchange standard this project deploys.'),
 ('Module-lattice-based digital signature standard (FIPS 204)', 'National Institute of Standards and Technology', 'NIST, 2024', 'https://doi.org/10.6028/NIST.FIPS.204', 'The signature standard, which matters for firmware updates.'),
 ('pqm4: testing and benchmarking NIST PQC on ARM Cortex-M4', 'M. J. Kannwischer, J. Rijneveld, P. Schwabe, K. Stoffelen', 'IACR Cryptology ePrint Archive, 2019', 'https://eprint.iacr.org/2019/844', 'How to benchmark post-quantum schemes on a microcontroller.'),
 ('Benchmarking post-quantum cryptography in TLS', 'C. Paquin, D. Stebila, G. Tamvada', 'PQCrypto, 2020', 'https://doi.org/10.1007/978-3-030-44223-1_5', 'How network conditions change the cost of post-quantum TLS.'),
]) + '</section>' + JOIN)

PL['planned-blockchain'] = ('Tamper-evident identity for IoT devices on a blockchain',
 'A network should know which devices are allowed on it and notice when one is cloned or tampered with. This project records device identities on a permissioned blockchain and checks live traffic against them.',
 BADGE_NEW + """
<section>
<h2>Why this matters</h2>
<p>Our systematic review of hybrid blockchain platforms for IoT (Sensors, 2022) found a fast-growing field in which most systems pair the ledger with cloud or fog computing, but few test how identity checks hold up against real attacks. Separately, my group identifies an IoT device's vendor and type from a single packet header. Putting the two together gives a concrete idea: a ledger that every gateway can read records each device's credential, firmware hash and expected traffic fingerprint, so a device that claims the right name but behaves like something else can be caught and revoked network-wide.</p>
""" + fig(SVG_CHAIN, 'The ledger records who each device is; the gateway checks behavior against it and flags a clone. Illustration.') + """
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'Does combining a ledger credential with a traffic fingerprint catch cloned, spoofed or tampered devices better than either check alone?',
 'How many devices and identity checks per second can a permissioned ledger on fog nodes handle before it becomes the bottleneck?',
 'Which attacks on the smart contracts and on the gateways themselves undermine the scheme, and which design rules prevent them?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Design', 'Choose what goes on the ledger: credential, firmware hash, fingerprint summary.'),
 ('Build', 'Smart contracts on Hyperledger Fabric, with Raspberry Pi gateways and real IoT devices.'),
 ('Attack', 'Clone, spoof and reflash devices; attack the contracts.'),
 ('Measure', 'Detection rate, false alarms, latency and throughput as devices scale.'),
 ('Report', 'Open code and a threat model others can reuse.'),
], 'Project steps') + """
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Go or JavaScript smart contracts', 'Hyperledger Fabric', 'Python for traffic analysis', 'Networking and IoT devices', 'Threat modeling']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Blockchains and smart contracts for the Internet of Things', 'K. Christidis, M. Devetsikiotis', 'IEEE Access, 2016', 'https://doi.org/10.1109/ACCESS.2016.2566339', 'The early case for combining the two.'),
 ('Blockchain for IoT security and privacy: the case study of a smart home', 'A. Dorri, S. S. Kanhere, R. Jurdak, P. Gauravaram', 'IEEE PerCom Workshops, 2017', 'https://doi.org/10.1109/PERCOMW.2017.7917634', 'A lightweight design for resource-limited home devices.'),
 ('Hyperledger Fabric: a distributed operating system for permissioned blockchains', 'E. Androulaki, A. Barger, V. Bortnikov, C. Cachin, et al.', 'ACM EuroSys, 2018', 'https://doi.org/10.1145/3190508.3190538', 'The permissioned platform this project builds on.'),
 ('A survey of attacks on Ethereum smart contracts (SoK)', 'N. Atzei, M. Bartoletti, T. Cimoli', 'POST, 2017', 'https://doi.org/10.1007/978-3-662-54455-6_8', 'The classic catalog of smart-contract mistakes to avoid.'),
 ('Hybrid blockchain platforms for the Internet of Things (IoT): a systematic literature review', 'A. Alkhateeb, C. Catal, <b>G. Kar</b>, A. Mishra', 'Sensors, 2022', 'https://doi.org/10.3390/s22041304', 'Our review of the field; start here.'),
 ('Comparative analysis of feature selection algorithms for automated IoT device fingerprinting', 'A. Aksoy, S. Varma, G. Moorthy, E. Pan, <b>G. Kar</b>', 'ICISSP, 2024', 'https://doi.org/10.5220/0012379100003648', 'Our single-packet fingerprints, the behavior side of the check.'),
]) + '</section>' + JOIN)



# ---------------------------------------------------------------- more published-work pages (round 14)
P['perception'] = ('Extending what a car can see and sense',
 'A car\'s own sensors stop at the truck in front of it, and the phone in the cabin knows more about the road than it seems. This work shares views between vehicles and turns phone and car sensors into a picture of the road.',
 '''
<section>
<h2>Seeing past line of sight: augmented vehicular reality</h2>
<p>A camera or lidar sees only what is in its line of sight, so a stopped car or a pedestrian hidden behind a truck stays invisible until it is too late. In <em>Augmented vehicular reality</em> (HotMobile 2017), with Hang Qiu, Fawad Ahmad, Ramesh Govindan, Marco Gruteser and Fan Bai, nearby vehicles share what their sensors see, so a car can effectively look through the vehicle in front of it.</p>
''' + flow([('Sense', 'each car builds a view of its surroundings'), ('Share', 'nearby cars exchange views over a wireless link'),
            ('Align', 'place the other car\'s view in your own frame'), ('Extend', 'objects hidden from you appear in your view')], 'Extended vision steps') + '''
<p>Making this work means sending enough sensor data quickly over a wireless link and placing another car's view correctly in your own. The live figure above shows only the geometry: what is hidden behind the truck and what the truck's sensors can add.</p>
</section>

<section>
<h2>Sensing the road from phones and cars</h2>
<p>In <em>Towards robust vehicular context sensing</em> (IEEE Transactions on Vehicular Technology, 2018), we detected lane changes, potholes, road grade and stop signs from sensors that are already in the car and in the driver's phone, and compared what phone sensors and the car's own sensors can each deliver. Combining many drives over the same road (crowd-sensing) makes the hard cases more reliable.</p>
''' + stats([('&gt;90%', 'accuracy of lane-change determinations'), ('+35%', 'recall for lane changes on curves when many drives are combined')],
 'Data: Qiu et al., IEEE TVT 2018, abstract.') + chart(
 'Lane changes on curvy roads, car sensors: share of lane changes found',
 [('One drive', 47.58, '47.58%'), ('Many drives combined', 83.70, '83.70%', True)],
 'Reported results: Qiu et al., IEEE TVT 2018, Sec. IV-A (lane change). Precision rose from 87.50% to 93.38% at the same time. Numbers read from the authors\' copy of the paper.') + chart(
 'Stop sign detection: the car\'s sensors versus a phone',
 [('Car sensors, precision', 93.24, '93.24%'), ('Car sensors, recall', 83.78, '83.78%'),
  ('Phone sensors, precision', 90.32, '90.32%'), ('Phone sensors, recall', 85.71, '85.71%')],
 'Reported results: Qiu et al., IEEE TVT 2018, Sec. IV-A and Fig. 15. A phone alone did about as well as the car\'s own sensors.') + '''
</section>

<section>
<h2>Papers</h2>
''' + pubs([
 ('Augmented vehicular reality: Enabling extended vision for future vehicles', 'H. Qiu, F. Ahmad, R. Govindan, M. Gruteser, F. Bai, <b>G. Kar</b>', 'HotMobile, 2017', 'https://doi.org/10.1145/3032970.3032976'),
 ('Towards robust vehicular context sensing', 'H. Qiu, J. Chen, S. Jain, Y. Jiang, M. McCartney, <b>G. Kar</b>, F. Bai, D. Grimm, M. Gruteser, R. Govindan', 'IEEE Transactions on Vehicular Technology, 2018', 'https://doi.org/10.1109/TVT.2017.2771623'),
]) + '</section>')

P['driver-behavior'] = ('Scoring and coaching drivers from in-vehicle data',
 'The same in-vehicle data that identifies a driver can also score how they drive, as they drive, and turn that score into feedback people act on.',
 '''
<section>
<h2>Scotto: scoring driving in real time</h2>
<p>Insurers and fleet operators score drivers, but often from coarse data, after the trip. <em>Scotto</em> (IEEE VTC2019-Spring), with B. Asiroglu and F. S. Bir, scores driver behavior in real time from the car's own in-vehicle data, so feedback can arrive while it still matters. The live figure above shows the basic idea with made-up thresholds: flag harsh braking and harsh starts from acceleration, and turn them into a score.</p>
</section>

<section>
<h2>Gamification: making the score matter</h2>
<p>A score alone rarely changes how someone drives. In <em>Improving driver behavior using gamification</em> (MobiWIS 2018), with S. Helvaci, A. Senova and S. Gören, we read in-vehicle data, scored driving errors on several criteria, and wrapped the score in achievements and leaderboards, with a feature that points out nearby places of interest. We tested it on two real-world trips and compared them with simulated ones.</p>
''' + flow([('Read', 'in-vehicle data during the trip'), ('Score', 'driving errors on several criteria'), ('Reward', 'achievements and leaderboards'), ('Engage', 'nearby points of interest')], 'Gamified feedback loop') + stats(
 [('2', 'real-world trips used to test the system'), ('&gt;95%', 'agreement between real-world and simulated results')],
 'Data: Helvaci et al., MobiWIS 2018, abstract.') + '''
<p>Distracted-driving detection, which combines driver-facing cameras with in-vehicle sensor data, is on the <a href="vehicles.html">connected vehicles</a> page.</p>
</section>

<section>
<h2>Papers</h2>
''' + pubs([
 ('Scotto: Real-time driver behavior scoring using in-vehicle data', '<b>G. Kar</b>, B. Asiroglu, F. S. Bir', 'IEEE VTC2019-Spring, 2019', 'https://doi.org/10.1109/VTCSpring.2019.8746461'),
 ('Improving driver behavior using gamification', 'S. Helvaci, A. Senova, <b>G. Kar</b>, S. Gören', 'MobiWIS, 2018', 'https://doi.org/10.1007/978-3-319-97163-6_16'),
 ('Distracted driver detection by combining in-vehicle and image data using deep learning', 'F. Omerustaoglu, C. O. Sakar, <b>G. Kar</b>', 'Applied Soft Computing, 2020', 'https://doi.org/10.1016/j.asoc.2020.106657'),
]) + '</section>')

P['quantum-spectra'] = ('Quantum machine learning for Raman spectroscopy',
 'Hybrid quantum-classical models are not only for network traffic. Raman spectra, the light fingerprints of molecules, are a natural test bed: one-dimensional, noisy and costly to label.',
 '''
<section>
<h2>What a quanvolution layer does</h2>
<p>A classical convolution slides a small filter over its input. A quanvolution layer slides a small quantum circuit instead: each window of input values is encoded as rotations of a few qubits, the circuit entangles them, and the measured expectation values become a new feature map that a classical network then reads. The live figure above computes one such feature exactly for a toy circuit.</p>
''' + flow([('Window', 'a few neighboring spectrum values'), ('Encode', 'each value rotates one qubit'), ('Entangle', 'a small fixed or trained circuit'),
            ('Measure', 'expectation values become features'), ('Classify', 'a classical network reads the feature map')], 'Quanvolution steps') + '''
</section>

<section>
<h2>COVID-19 from the Raman spectra of serum</h2>
<p>In <em>IEEE Access</em> (2025), with S. S. Dutta, S. Sandeep, S. Sridevi, R. Mistry and J. Ortega, we turned Raman spectra of human serum into wavelet scaleograms and classified COVID-19 with a quanvolutional neural network, comparing it with classical CNNs. It is the same wavelet-to-quantum pipeline we use for <a href="quantum-ids.html">intrusion detection</a>, applied to light instead of traffic.</p>
''' + chart('COVID-19 versus healthy serum: test accuracy by model',
 [('Our quanvolutional network', 98.92, '98.92%', True), ('Earlier quanvolutional network', 97.85, '97.85%'),
  ('MobileNet', 96.77, '96.77%'), ('Vanilla CNN', 94.62, '94.62%'), ('Xception', 94.62, '94.62%'), ('VGG-16', 80.65, '80.65%')],
 'Reported results: Dutta et al., IEEE Access 13 (2025), Table 5. Both quantum models use one layer and 1,000 shots. The data set has 309 Raman spectra (150 healthy, 159 SARS-CoV-2) split 70/30, so the test set is small.') + stats(
 [('100%', 'precision of our network: no healthy sample was flagged'), ('97.73%', 'recall: share of COVID-19 samples found')],
 'Data: IEEE Access 13 (2025), abstract and Table 5.') + '''
</section>

<section>
<h2>Weathered microplastics on a real quantum processor</h2>
<p>In <em>AVS Quantum Science</em> (2026), with H. G. Kulkarni, A. R. Banerjee, T. Mandloi, S. Sridevi and S. Geetha, a classical-quantum neural network with dual-channel feature extraction ran on an IonQ quantum processor to classify weathered microplastics from their Raman spectra. Running on hardware, not only a simulator, is what makes the results a test of today's machines.</p>
</section>

<section>
<h2>Papers</h2>
''' + pubs([
 ('Novel quanvolutional neural network-based COVID-19 diagnosis from Raman spectroscopic signals of human serum', 'S. S. Dutta, S. Sandeep, S. Sridevi, R. Mistry, J. Ortega, <b>G. Kar</b>', 'IEEE Access, 2025 (open access)', 'https://doi.org/10.1109/ACCESS.2025.3580316'),
 ('A classical quantum neural network with dual-channel feature extraction on IonQ QPU for classifying weathered microplastics from Raman spectra', 'H. G. Kulkarni, A. R. Banerjee, T. Mandloi, S. Sridevi, S. Geetha, <b>G. Kar</b>', 'AVS Quantum Science, 2026', SC + '5nxA0vEk-isC'),
]) + '</section>')

P['wireless-ffr'] = ('Sharing spectrum fairly: fractional frequency reuse',
 'Before security, I worked on how cellular networks share spectrum. My M.S. thesis at Bilkent asked how to split a cell\'s subcarriers between users near the base station and users at the edge, so the network is both fast and fair.',
 '''
<section>
<h2>The trade-off</h2>
<p>Users near a base station have strong signals and can share the whole band with neighboring cells. Users at the cell edge hear the neighbors' interference too, so in fractional frequency reuse they are served on parts of the band that adjacent cells do not use at the same time. Every subcarrier given to the inner region raises total throughput but leaves less for edge users, so fairness falls.</p>
<p>The thesis measured both sides, cell throughput and Jain's fairness index, and used their product as one score for the trade-off. It compared static splits with adaptive ones that follow where users actually are.</p>
''' + flow([('Place users', 'inner region or cell edge'), ('Split subcarriers', 'inner share versus edge share'), ('Schedule', 'serve each region on its part of the band'),
            ('Measure', 'cell throughput and Jain\'s fairness'), ('Adapt', 'move the split as users move')], 'Thesis method') + stats(
 [('≈5%', 'higher throughput × fairness from adapting the split to the user distribution, over the best fixed split')],
 'Data: Kar, M.S. thesis, Bilkent University, 2011, abstract.') + chart(
 'Throughput × fairness, averaged over the simulation (higher is better)',
 [('Adaptive split', 100, '0.2504', True), ('Fixed split, 90% inner', round(0.2390/0.2504*100, 1), '0.2390'),
  ('Fixed split, 50% inner', round(0.2163/0.2504*100, 1), '0.2163')],
 'Reported results: Kar, M.S. thesis, Bilkent 2011, Table 4.8. "90% inner" means 90% of the subcarriers go to the inner region. Unitless; bars scaled to the best value. The adaptive scheme switched between 90% and 50% inner as users moved (Table 4.7): lower throughput than fixed 90% (0.4321 vs 0.4735) but higher fairness (0.580 vs 0.505).') + chart(
 'Throughput × fairness, reuse patterns compared',
 [('FFR, split by user locations', round(0.2080/0.2504*100, 1), '0.2080', True),
  ('FFR, split by sector area', round(0.1853/0.2504*100, 1), '0.1853'),
  ('Reuse 3x3x1', round(0.0819/0.2504*100, 1), '0.0819'), ('Reuse 1x3x3', round(0.0513/0.2504*100, 1), '0.0513')],
 'Reported results: same thesis, Table 4.4. FFR is fractional frequency reuse, shown at an inner radius of 0.8 of the cell (the best setting for each). Unitless; bars on the same scale as the chart above.') + '''
<p>The same physical-layer facts, shared spectrum and interference, sit under my later security work on <a href="vehicles.html">GPS jamming</a> and <a href="planned-v2x.html">V2X messages</a>.</p>
</section>

<section>
<h2>Thesis</h2>
''' + pubs([('Performance of static and adaptive subchannel allocation schemes for fractional frequency reuse in WiMAX networks', '<b>G. Kar</b> (advisor: E. Karaşan)', 'M.S. thesis, Bilkent University, 2011', 'https://hdl.handle.net/11693/15261')]) + '</section>')


# ---------------------------------------------------------------- two more planned projects (core area)
PLANNED_CORE_MORE += [
    ('planned-encrypted', 'Naming the app without reading the traffic'),
    ('planned-v2x', 'Catching ghost vehicles in V2X messages'),
]

PL['planned-encrypted'] = ('Naming the app without reading the traffic',
 'Encryption hides what is inside a packet, but not its size, its timing or its direction. This project asks how much that metadata reveals, how to use it to manage and secure networks without decrypting anything, and how to protect users from the same leak.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Almost all traffic is now encrypted. Network operators still need to know which applications and devices are on their network to manage and secure it, and they should not have to break encryption to find out. The same metadata that helps them is also a privacy risk: earlier work has shown that packet sizes and timing can identify apps and websites behind encryption.</p>
<p>My group already identifies IoT devices from single packet headers (ICISSP 2024) and evolves compact feature sets with a genetic algorithm (Electronics 2024). This project extends that line to encrypted flows, adding explainable AI and language models fine-tuned on traffic, and it studies defenses as seriously as attacks.</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'Which flow metadata (packet sizes, timing, direction, handshake fields) identifies an app or service from encrypted traffic, and how few features are needed?',
 'Can explanations and language models fine-tuned on traffic make these classifiers more accurate on unseen apps, or easier to audit, and at what cost?',
 'Which defenses (padding, timing changes, traffic shaping) protect users against these classifiers, and what do they cost in bandwidth and delay?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Capture', 'Record labeled encrypted traffic from phones, laptops and IoT devices in a lab network we control.'),
 ('Extract', 'Turn each flow into sizes, timing, direction and handshake fields; never read payloads.'),
 ('Evolve', 'Select compact feature sets with a genetic algorithm, as in our incident-identification work.'),
 ('Model and explain', 'Compare classical models, sequence models and fine-tuned language models, and audit each with explanations.'),
 ('Defend', 'Apply padding and shaping, retrain the classifier, and measure accuracy against overhead.'),
], 'Project steps') + """
<p class="note">Only traffic from our own lab devices or from public datasets is used. The project never decrypts other people's traffic.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'Network traffic analysis (Wireshark, flow tools)', 'Machine learning', 'Genetic algorithms', 'Explainable AI', 'Transformers, optional']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('AppScanner: Automatic fingerprinting of smartphone apps from encrypted network traffic', 'V. F. Taylor, R. Spolaor, M. Conti, I. Martinovic', 'IEEE EuroS&amp;P, 2016', 'https://doi.org/10.1109/EuroSP.2016.40', 'App identification from encrypted flows without payloads: the starting point.'),
 ('Peek-a-Boo, I still see you: Why efficient traffic analysis countermeasures fail', 'K. P. Dyer, S. E. Coull, T. Ristenpart, T. Shrimpton', 'IEEE Symposium on Security and Privacy, 2012', 'https://doi.org/10.1109/SP.2012.28', 'Why cheap padding defenses fail against coarse features.'),
 ('Deep fingerprinting: Undermining website fingerprinting defenses with deep learning', 'P. Sirinam, M. Imani, M. Juarez, M. Wright', 'ACM CCS, 2018', 'https://doi.org/10.1145/3243734.3243768', 'Deep learning against defended traffic, the bar any defense must clear.'),
 ('ET-BERT: A contextualized datagram representation with pre-training transformers for encrypted traffic classification', 'X. Lin, G. Xiong, G. Gou, Z. Li, J. Shi, J. Yu', 'The Web Conference (WWW), 2022', 'https://doi.org/10.1145/3485447.3512217', 'Pre-trained transformers for encrypted traffic, the language-model side of this project.'),
 ('Automated network incident identification through genetic algorithm-driven feature selection', 'A. Aksoy, L. Valle, <b>G. Kar</b>', 'Electronics, 2024', 'https://doi.org/10.3390/electronics13020293', 'Our evolutionary feature selection, which this project reuses.'),
 ('Comparative analysis of feature selection algorithms for automated IoT device fingerprinting', 'A. Aksoy, S. Varma, G. Moorthy, E. Pan, <b>G. Kar</b>', 'ICISSP, 2024', 'https://doi.org/10.5220/0012379100003648', 'Our single-packet device fingerprints.'),
]) + '</section>' + JOIN)

PL['planned-v2x'] = ('Catching ghost vehicles in V2X messages',
 'Connected cars broadcast their position and speed many times a second, and other cars act on those messages. This project detects messages that describe cars that are not there.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Vehicle-to-everything (V2X) messages are signed, so a receiver can tell that a message came from a certified sender. A signature cannot tell whether the message is true. A compromised unit, or an insider with valid credentials, can report a ghost car braking hard ahead and trigger emergency braking behind it. Detecting that kind of misbehavior has to look at what the messages say and check it against physics and against independent sensors.</p>
<p>My research statement's first direction is exactly this: detecting spoofed, jammed or manipulated sensor and V2X data on vehicle and roadside hardware. It builds on our roadside detection of GPS jammers (ACM CCS 2014) and on traffic estimation at vehicular edge nodes (ACM/IEEE SEC 2017).</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'Which plausibility checks on position, speed and heading catch fake vehicles in V2X messages, and how do they trade detection against false alarms?',
 'How much do roadside cameras, radar and other cars\' reports add, and where are the coverage gaps an attacker can use?',
 'Can misbehavior detection run within the latency and memory budget of roadside and on-board units?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Start from data', 'Use public misbehavior datasets with labeled attacks.'),
 ('Simulate', 'Add ghost vehicles of rising sophistication in a traffic and network simulator.'),
 ('Check plausibility', 'Test each message against physics and the sender\'s own history.'),
 ('Fuse sensors', 'Cross-check against simulated roadside cameras and on-board radar.'),
 ('Deploy', 'Profile the detectors on embedded boards at realistic message rates.'),
], 'Project steps') + """
<p class="note">All attacks run in simulation or on recorded data. Nothing is broadcast on real V2X channels.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'Traffic and network simulation', 'Sensor fusion', 'Machine learning', 'Embedded profiling', 'Vehicular networking']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Survey on misbehavior detection in cooperative intelligent transportation systems', 'R. W. van der Heijden, S. Dietzel, T. Leinmüller, F. Kargl', 'IEEE Communications Surveys &amp; Tutorials, 2019', 'https://doi.org/10.1109/COMST.2018.2873088', 'The map of the field: why signatures are not enough and which checks exist.'),
 ('VeReMi: A dataset for comparable evaluation of misbehavior detection in VANETs', 'R. W. van der Heijden, T. Lukaseder, F. Kargl', 'SecureComm, 2018', 'https://doi.org/10.1007/978-3-030-01701-9_18', 'The public dataset to start from.'),
 ('Drift with Devil: Security of multi-sensor fusion based localization in high-level autonomous driving under GPS spoofing', 'J. Shen, J. Y. Won, Z. Chen, Q. A. Chen', 'USENIX Security Symposium, 2020', 'https://www.usenix.org/conference/usenixsecurity20/presentation/shen', 'Shows that fusing sensors does not defend by itself; detection has to be designed in.'),
 ('Detection of on-road vehicles emanating GPS interference', '<b>G. Kar</b>, H. Mustafa, Y. Wang, Y. Chen, W. Xu, M. Gruteser, T. Vu', 'ACM CCS, 2014', 'https://doi.org/10.1145/2660267.2660336', 'Our roadside detection of a misbehaving vehicle.'),
 ('Real-time traffic estimation at vehicular edge nodes', '<b>G. Kar</b>, S. Jain, M. Gruteser, F. Bai, R. Govindan', 'ACM/IEEE SEC, 2017', 'https://doi.org/10.1145/3132211.3134461', 'Our edge processing of vehicle sensor data, the roadside half of this project.'),
]) + '</section>' + JOIN)

# ---------------------------------------------------------------- six more planned projects (round 15)
PLANNED_CORE_MORE += [
    ('planned-federated', 'Training intrusion detectors without pooling the data'),
    ('planned-adversarial', 'Can an attacker slip past the intrusion detector?'),
    ('planned-rf', 'Telling radios apart by their imperfections'),
    ('planned-vprivacy', 'Sharing car data without giving away where you have been'),
]
PLANNED_NEW += [
    ('planned-ev', 'Securing the EV charging network'),
    ('planned-llmsoc', 'Can a language model help triage security alerts?'),
]
NEWDIR |= {'planned-ev', 'planned-llmsoc'}

for _q, _h, _t in [
 # planned-federated
 ('Does a federated intrusion detector trained across many gateways',
  'With mildly skewed data the federated model comes close to one trained on pooled data; as each site\'s traffic becomes more distinct, the gap widens unless each site keeps a small local layer.',
  'Split public IoT intrusion datasets across simulated gateways with controlled skew, and compare federated, local-only and pooled models on held-out sites and held-out attack types.'),
 ('How few poisoned clients does it take to plant a backdoor',
  'A single client that scales its update can steer plain averaging; median-style rules resist it, but they also drift away from minority sites whose normal traffic looks unusual.',
  'Run poisoning and backdoor attacks with a growing share of malicious clients, and measure attack success and clean accuracy for each aggregation rule, including on minority sites.'),
 ('Can federated training fit the bandwidth and compute of real IoT gateways',
  'Compressed updates and fewer, larger local steps keep traffic small enough for gateway uplinks with little loss in detection.',
  'Profile training rounds on gateway-class boards and measure upload size, round time and energy against detection quality.'),
 # planned-adversarial
 ('How much of the reported weakness of network intrusion detectors',
  'Many feature-space attacks that look successful break the traffic they describe; once packets must stay valid and the attack must still work, far fewer evasions remain.',
  'Attack the same detectors twice, once in feature space and once with constraints that keep the traffic valid and the attack functional, and compare evasion rates.'),
 ('Which defenses survive realistic attackers',
  'Training on realistic adversarial traffic hardens a detector against the attacks it saw at a modest cost in false alarms; adaptive attackers will still find gaps.',
  'Train detectors with and without adversarial examples, then attack them with adaptive attacks they did not see, reporting evasion and false-alarm rates together.'),
 ('Do compact and hybrid quantum-classical detectors resist evasion',
  'Our hybrid quantum work measured a robustness advantage against adversarial perturbation; part of it may come from model size and input encoding rather than the quantum layer.',
  'Compare hybrid models against classical models with matched parameter counts and encodings under the same realistic attacks.'),
 # planned-rf
 ('Which radio imperfections give a stable fingerprint',
  'Frequency offset and IQ imbalance give the most stable cues, but some of them shift with temperature and supply voltage.',
  'Record the same devices over days, temperatures and battery levels, and measure how far each feature drifts compared with the gap between devices.'),
 ('Does a fingerprint learned in one place still work after the radio moves',
  'Classifiers trained in a single environment partly learn the channel; training across channels, or removing the channel first, keeps more accuracy after a move.',
  'Train in one room or day and test in another, with and without channel equalization and augmentation, and report the drop in accuracy.'),
 ('Can RF fingerprints and traffic fingerprints check each other',
  'Requiring both the radio signature and the packet-level behavior to match makes cloning a device much harder than either check alone.',
  'Build both fingerprints for the same devices, then stage cloning and replay attacks that fake one of them and measure detection.'),
 # planned-vprivacy
 ('How identifying are the traces that connected cars share',
  'A few points near the start and end of a trip are enough to link most traces to a home or workplace, even when names are removed.',
  'Re-identify pseudonymous traces in public mobility datasets with simple home-and-work linking attacks, and report how the success rate grows with the number of points.'),
 ('Which protections keep traffic estimates useful while blocking re-identification',
  'Hiding trip ends and adding calibrated noise lowers re-identification sharply while road-level traffic estimates degrade only slowly.',
  'Apply noise, cloaking, trip-end suppression and pseudonym changes at several strengths, and plot re-identification against the error of the traffic estimates built from the same data.'),
 ('Can the protection run on the car or at the roadside edge',
  'Privacy filtering at the vehicle or roadside unit costs little compute and removes the need to trust a central collector with raw traces.',
  'Implement the filters on embedded boards and measure delay and memory at realistic message rates.'),
 # planned-ev
 ('How much can a coordinated attack on many chargers move the load on a local grid',
  'Switching a modest share of chargers at once produces load swings large enough to matter for a local feeder, and the timing of the switching matters more than its size.',
  'Simulate charging stations on standard distribution test feeders with realistic charging sessions, and measure voltage and load violations as the share of compromised chargers grows.'),
 ('Can anomaly detection on charging sessions and load data catch such attacks early',
  'Coordinated switching leaves sharp, synchronized steps that normal charging does not; a detector on per-station session data catches them sooner than one on total load alone.',
  'Train detectors on simulated normal days and test them on graded attacks, reporting detection delay and false alarms per day.'),
 ('Where are the weak points in the protocol stack between charger, operator and vehicle',
  'The management link between charger and operator is the easiest place to start a coordinated attack, because one compromised server reaches many chargers.',
  'Model the charger management protocol in a lab test bed with open-source charger and server software, and run a structured threat analysis with attack trees.'),
 # planned-llmsoc
 ('Does retrieving context for each alert make a language model rank alerts better',
  'Adding asset records, recent tickets and related alerts lets the model separate real incidents from noisy rule hits better than severity labels alone.',
  'Replay labeled alerts from public datasets and lab attacks, rank them with rules, a model without context and a model with retrieved context, and compare how many real incidents fall within a fixed analyst budget.'),
 ('How often does the model invent or misread context, and can a check catch it',
  'Most errors come from context the model claims but the records do not contain; checking each claim against the retrieved records catches many of them.',
  'Label every factual claim in the model\'s triage notes against the source records, then measure how many unsupported claims a second-pass checker flags.'),
 ('Can an attacker steer the triage model through the alert data itself',
  'Text an attacker controls, such as a file name or a log message, can carry instructions into the model; isolating untrusted fields reduces this.',
  'Plant instruction-like strings in log fields and measure how often alerts are wrongly closed, with and without input isolation.'),
]:
    assert _q[:40] not in RQX, _q
    RQX[_q[:40]] = (_h, _t)

CONTRIB.update({
 'planned-federated': ['A federated intrusion-detection benchmark with controlled data skew across sites.', 'A measured comparison of aggregation rules under poisoning and backdoor attacks, including their cost to minority sites.', 'Gateway-level profiles of training traffic, time and energy.'],
 'planned-adversarial': ['A library of realistic, constraint-respecting evasion attacks on network traffic.', 'Re-measured robustness of common detectors when attacks must keep traffic valid.', 'Evidence on which defenses hold against adaptive attackers, and at what false-alarm cost.'],
 'planned-rf': ['A multi-day, multi-place RF fingerprint dataset from low-cost IoT radios.', 'Measurements of which radio features stay stable as conditions change.', 'A joint radio-and-traffic identity check, tested against cloning.'],
 'planned-vprivacy': ['A re-identification test for shared vehicle traces.', 'A privacy-versus-utility map for common protections on traffic estimation tasks.', 'Edge implementations of the protections with run-time profiles.'],
 'planned-ev': ['A simulation test bed that couples charging stations with a distribution feeder model.', 'Detectors for coordinated charging attacks, with detection delay and false alarms.', 'A threat analysis of the charger management link with concrete hardening steps.'],
 'planned-llmsoc': ['An alert-triage test set with labeled incidents and analyst-style context records.', 'A measured comparison of rule, model and retrieval-based triage at fixed analyst budgets.', 'A claim checker for triage notes, and tests of prompt injection through alert fields.'],
})

DEMOS.update({
    'planned-federated': ('fed', 'Train together, without sharing data', 720, 300,
        'Six sites each train on their own traffic and send only model updates. One site can be malicious. Plain averaging lets it pull the shared model toward its target; a median resists it, but drifts when sites differ a lot.',
        'Left: each site\'s preferred model as a dot, the malicious update in red, and the shared model\'s path. Right: distance of the shared model from the clean result over rounds', DISC_PLANNED + ' The sites and updates are invented.'),
    'planned-adversarial': ('adv', 'Slip past the detector', 720, 300,
        'A toy detector draws a line between normal traffic and a flood. The attacker nudges one flood flow until it looks normal. With realistic rules it may only pad packets and must keep the flood fast enough to work.',
        'Scatter of normal and attack flows by packet size and rate, the detector boundary, and the path of one attack flow trying to cross it', DISC_PLANNED + ' The flows and detector are invented.'),
    'planned-rf': ('rfp', 'Tell four radios apart', 720, 300,
        'Four radios send the same symbols, but each has small hardware flaws that bend its constellation. A simple classifier names the radio from a short burst. Lower the signal quality, shorten the burst, or change the channel.',
        'IQ constellation points from four radios in four colors, and bars for how often each radio is named correctly', DISC_PLANNED + ' The radio flaws are invented.'),
    'planned-vprivacy': ('vpriv', 'Hide the trip, keep the traffic map', 720, 300,
        'Twelve cars drive from home to work and report their positions. An attacker links each trace to the nearest home. Add noise or hide trip ends, and watch re-identification fall while the traffic counts get less accurate.',
        'A street map with homes and noisy reported positions, and two curves of re-identification and traffic count error against the noise level', DISC_PLANNED + ' The city and trips are invented.'),
    'planned-ev': ('evc', 'Switch the chargers', 720, 290,
        'A day of charging load on a neighborhood feeder. An attacker who controls some chargers switches them on and off together in the evening peak. Raise the share they control, and set how big a jump the detector treats as suspicious.',
        'Charging load over 24 hours against the feeder limit, with attack switching in the evening and flagged intervals marked', DISC_PLANNED + ' The load profile and limit are invented.'),
    'planned-llmsoc': ('soc', 'Triage the alert queue', 720, 330,
        'Twelve alerts, two of them real incidents. The analyst has time for only a few. Rank by rule severity, by a model\'s score, or by a model that also reads related records, and see which incidents get looked at.',
        'A ranked list of twelve alerts with severity tags and scores; the ones the analyst reviews are highlighted and the real incidents are marked', DISC_PLANNED + ' The alerts and scores are invented.'),
})

OPENQ['quantum-ids'].append(
  ('Does the robustness of hybrid models hold up against attackers who must keep traffic valid?',
   'Our hybrid quantum work measured a robustness advantage against adversarial perturbation. Whether it survives realistic, problem-space attacks is open.',
   [('planned-adversarial', 'realistic evasion attacks')]))
OPENQ['iot-identity'].append(
  ('Can a device\'s radio signature back up its traffic fingerprint, so that a clone has to fake both?',
   'Header fingerprints identify a device\'s type from its packets. A cloned device can copy packets more easily than it can copy the flaws of another radio.',
   [('planned-rf', 'RF fingerprinting')]))
OPENQ['vehicles'].append(
  ('How can cars share location data for traffic services without revealing where their drivers live and work?',
   'My dissertation addressed data availability and privacy for connected cars. Location traces remain one of the most identifying kinds of data a car produces.',
   [('planned-vprivacy', 'vehicle location privacy'), ('planned-ev', 'EV charging security')]))
OPENQ['applied-ai'].append(
  ('Can a language model help analysts triage security alerts without inventing facts?',
   'Our chatbot work showed how a model grounded in retrieved pages answers questions. Security triage raises the cost of a confident wrong answer.',
   [('planned-llmsoc', 'alert triage with language models')]))
OPENQ['quantum-ids'].append(
  ('Can intrusion detectors be trained across many sites without pooling their traffic?',
   'Gateways see different traffic and often cannot share it. Federated training keeps data local, but it opens a new door to poisoned updates.',
   [('planned-federated', 'federated intrusion detection')]))

PL['planned-federated'] = ('Training intrusion detectors without pooling the data',
 'Every gateway sees different traffic, and most cannot share it. This project trains a shared intrusion detector across many sites while the data stays where it was collected, and asks what happens when one of those sites is malicious.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>An intrusion detector learns best from many networks, but traffic is private and often cannot leave the site that recorded it. Federated learning trains one model across sites by sending model updates instead of data. It brings two new problems. Sites see very different traffic, so one shared model may serve some of them badly, and any site can send a poisoned update that plants a backdoor in everyone's detector.</p>
<p>My group's detectors are built to be small enough for IoT gateways (EPJ Quantum Technology, 2025; ICISSP 2024). Gateways are also the natural places to train federated models, so this project connects the lightweight-detection line with the device-identity line: who sends an update matters as much as what is in it.</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'Does a federated intrusion detector trained across many gateways match one trained on pooled data, and how does that change as sites see more different traffic?',
 'How few poisoned clients does it take to plant a backdoor in a federated detector, and which aggregation rules stop it without hurting honest sites that look unusual?',
 'Can federated training fit the bandwidth and compute of real IoT gateways?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Split', 'Divide public IoT intrusion datasets across simulated sites with controlled skew.'),
 ('Train', 'Run federated averaging and robust aggregation rules in an open-source framework.'),
 ('Attack', 'Add poisoning and backdoor clients with growing share and stealth.'),
 ('Defend', 'Compare robust aggregation, update checks and client reputation.'),
 ('Deploy', 'Profile rounds on gateway-class boards.'),
], 'Project steps') + """
<p class="note">Attacks run only inside our own simulations and lab devices.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'PyTorch', 'Federated learning frameworks', 'Intrusion detection datasets', 'Adversarial machine learning', 'Embedded profiling']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Communication-efficient learning of deep networks from decentralized data', 'H. B. McMahan, E. Moore, D. Ramage, S. Hampson, B. Agüera y Arcas', 'AISTATS, 2017', 'https://arxiv.org/abs/1602.05629', 'Federated averaging, the method everything else modifies.'),
 ('DÏoT: A federated self-learning anomaly detection system for IoT', 'T. D. Nguyen, S. Marchal, M. Miettinen, H. Fereidooni, N. Asokan, A.-R. Sadeghi', 'IEEE ICDCS, 2019', 'https://arxiv.org/abs/1804.07474', 'An early federated detector for IoT devices, close to our setting.'),
 ('How to backdoor federated learning', 'E. Bagdasaryan, A. Veit, Y. Hua, D. Estrin, V. Shmatikov', 'AISTATS, 2020', 'https://proceedings.mlr.press/v108/bagdasaryan20a.html', 'Why one malicious client is enough against plain averaging.'),
 ('Machine learning with adversaries: Byzantine tolerant gradient descent', 'P. Blanchard, E. M. El Mhamdi, R. Guerraoui, J. Stainer', 'NeurIPS, 2017', 'https://proceedings.neurips.cc/paper/2017/hash/f4b9ec30ad9f68f89b29639786cb62ef-Abstract.html', 'Robust aggregation, the first line of defense.'),
 ('Evaluating federated learning for intrusion detection in Internet of Things: Review and challenges', 'E. M. Campos et al.', 'Computer Networks, 2022', 'https://doi.org/10.1016/j.comnet.2021.108661', 'What has been tried for federated IoT intrusion detection, and the open gaps.'),
 ('Comparative analysis of feature selection algorithms for automated IoT device fingerprinting', 'A. Aksoy, S. Varma, G. Moorthy, E. Pan, <b>G. Kar</b>', 'ICISSP, 2024', 'https://doi.org/10.5220/0012379100003648', 'Our compact header features, a good input for models trained at the gateway.'),
]) + '</section>' + JOIN)

PL['planned-adversarial'] = ('Can an attacker slip past the intrusion detector?',
 'Machine-learning detectors can be fooled by small changes to their input. For network traffic, the attacker cannot change just anything: packets must stay valid and the attack must still work. This project measures how robust detectors really are against attackers who play by those rules.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Much of the work on adversarial attacks against intrusion detectors changes feature values freely, as if traffic were an image. Real traffic is not like that. A flood that is slowed down to evade a detector may no longer be a flood, and a packet field cannot take any value it likes. Results from unconstrained attacks can overstate the risk, and defenses tested only against them can give false comfort.</p>
<p>Our hybrid quantum-classical detector (EPJ Quantum Technology, 2025) showed a measured robustness advantage against adversarial perturbation. This project asks how much of that, and of the robustness claimed for other detectors, holds once attacks must respect what traffic can actually look like.</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'How much of the reported weakness of network intrusion detectors survives when attacks must keep the traffic valid and the attack working?',
 'Which defenses survive realistic attackers who adapt to them, and what do they cost in false alarms?',
 'Do compact and hybrid quantum-classical detectors resist evasion better than classical models of the same size?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Detectors', 'Train representative detectors on public intrusion datasets, including our hybrid models.'),
 ('Constraints', 'Write down what an attacker can change in each feature without breaking the traffic or the attack.'),
 ('Attack', 'Run feature-space and constrained attacks side by side.'),
 ('Defend', 'Retrain with adversarial examples and test against adaptive attacks.'),
 ('Replay', 'Turn the strongest attacks into real packets in a lab network and confirm they still work.'),
], 'Project steps') + """
<p class="note">All attack traffic stays inside an isolated lab network.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'Adversarial machine learning', 'Network traffic generation', 'Intrusion detection', 'Statistics', 'PennyLane, optional']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Evasion attacks against machine learning at test time', 'B. Biggio, I. Corona, D. Maiorca, B. Nelson, N. Šrndić, P. Laskov, G. Giacinto, F. Roli', 'ECML PKDD, 2013', 'https://doi.org/10.1007/978-3-642-40994-3_25', 'The classic formulation of evasion attacks.'),
 ('Intriguing properties of adversarial ML attacks in the problem space', 'F. Pierazzi, F. Pendlebury, J. Cortellazzi, L. Cavallaro', 'IEEE Symposium on Security and Privacy, 2020', 'https://arxiv.org/abs/1911.02142', 'Why attacks must respect what real inputs can look like.'),
 ('Modeling realistic adversarial attacks against network intrusion detection systems', 'G. Apruzzese, M. Andreolini, L. Ferretti, M. Marchetti, M. Colajanni', 'Digital Threats: Research and Practice, 2022', 'https://doi.org/10.1145/3469659', 'A framework for realistic attackers against network detectors.'),
 ('Outside the closed world: On using machine learning for network intrusion detection', 'R. Sommer, V. Paxson', 'IEEE Symposium on Security and Privacy, 2010', 'https://doi.org/10.1109/SP.2010.25', 'Why network detection is harder for machine learning than it looks.'),
 ('Unified hybrid quantum classical neural network framework for detecting distributed denial of service and Android mobile malware attacks', 'S. Sridevi, B. Indira, S. Geetha, S. Balachandran, <b>G. Kar</b>, S. Kharbanda', 'EPJ Quantum Technology, 2025', 'https://doi.org/10.1140/epjqt/s40507-025-00380-z', 'Our hybrid detector, one of the models to test.'),
]) + '</section>' + JOIN)

PL['planned-rf'] = ('Telling radios apart by their imperfections',
 'No two radios are built exactly alike. Tiny flaws in each transmitter leave a signature in every signal it sends. This project asks whether those signatures can identify IoT devices reliably, even as the radio moves and conditions change.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>A device's address and certificates can be copied; the small analog flaws of its radio are much harder to copy. Radiometric fingerprinting uses those flaws to tell transmitters apart, and deep learning has made it far more accurate. It also made it fragile: a classifier can quietly learn the wireless channel instead of the radio, and fail as soon as the device moves.</p>
<p>My work on device identity reads fingerprints from packet headers (ICISSP 2024), and my wireless background goes back to resource allocation in cellular networks (M.S. thesis, Bilkent University) and physical-layer security in vehicles (ACM CCS 2014). This project adds the radio layer to device identity, with low-cost software-defined radios.</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'Which radio imperfections give a stable fingerprint for low-cost IoT radios over days and changing conditions?',
 'Does a fingerprint learned in one place still work after the radio moves to another, and how can the channel be kept out of it?',
 'Can RF fingerprints and traffic fingerprints check each other, so that a cloned device must fake both?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Record', 'Capture signals from many identical IoT radios with software-defined receivers.'),
 ('Vary', 'Repeat across days, rooms, distances, temperatures and battery levels.'),
 ('Model', 'Compare hand-made impairment features with deep models on raw IQ samples.'),
 ('Separate', 'Test channel equalization and augmentation to keep the channel out of the fingerprint.'),
 ('Combine', 'Pair the radio fingerprint with the device\'s traffic fingerprint and test against clones.'),
], 'Project steps') + """
<p class="note">Receivers only listen to our own lab devices on unlicensed bands, within the rules for those bands.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'Software-defined radio (GNU Radio)', 'Digital signal processing', 'Deep learning', 'Experimental design']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Wireless device identification with radiometric signatures', 'V. Brik, S. Banerjee, M. Gruteser, S. Oh', 'ACM MobiCom, 2008', 'https://www.winlab.rutgers.edu/~gruteser/papers/brik-paradis08.pdf', 'The founding paper on radiometric fingerprints.'),
 ('ORACLE: Optimized radio classification through convolutional neural networks', 'K. Sankhe, M. Belgiovine, F. Zhou, S. Riyaz, S. Ioannidis, K. Chowdhury', 'IEEE INFOCOM, 2019', 'https://arxiv.org/abs/1812.01124', 'Deep learning on raw IQ samples from identical radios.'),
 ('Exposing the fingerprint: Dissecting the impact of the wireless channel on radio fingerprinting', 'A. Al-Shawabka, F. Restuccia et al.', 'IEEE INFOCOM, 2020', 'https://doi.org/10.1109/INFOCOM41043.2020.9155259', 'How the channel fools fingerprint classifiers, the central problem here.'),
 ('Comparative analysis of feature selection algorithms for automated IoT device fingerprinting', 'A. Aksoy, S. Varma, G. Moorthy, E. Pan, <b>G. Kar</b>', 'ICISSP, 2024', 'https://doi.org/10.5220/0012379100003648', 'Our packet-level fingerprints, the other half of the joint check.'),
 ('Performance of static and adaptive subchannel allocation schemes for fractional frequency reuse in WiMAX networks', '<b>G. Kar</b> (advisor: E. Karaşan)', 'M.S. thesis, Bilkent University, 2011', 'https://hdl.handle.net/11693/15261', 'My wireless background, for the physical-layer side.'),
]) + '</section>' + JOIN)

PL['planned-vprivacy'] = ('Sharing car data without giving away where you have been',
 'Connected cars share their position to make traffic maps and safety services work. A handful of those points can reveal where a driver lives and works. This project measures that risk and tests protections that keep the shared data useful.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Location traces are among the most identifying data there is: a few points in space and time are enough to single out most people in a large mobility dataset. Connected cars report their position constantly, to traffic services, to automakers and to other cars. Removing names does not help much when every morning trace starts at the same house.</p>
<p>My dissertation at Rutgers was about making vehicle data available while keeping it private, in the group where my advisor, Marco Gruteser, had earlier introduced spatial and temporal cloaking for location privacy. Real-time traffic estimation at vehicular edge nodes (ACM/IEEE SEC 2017) showed what useful services need from the data. This project asks how little they can get by with.</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'How identifying are the traces that connected cars share, and how many points does an attacker need to link one to a home or workplace?',
 'Which protections keep traffic estimates useful while blocking re-identification: noise, cloaking, hiding trip ends or changing pseudonyms?',
 'Can the protection run on the car or at the roadside edge, so no central collector ever holds raw traces?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Data', 'Start from public vehicle and mobility trace datasets.'),
 ('Attack', 'Link pseudonymous traces to homes and workplaces with simple, realistic attacks.'),
 ('Protect', 'Apply each protection at several strengths.'),
 ('Measure utility', 'Rebuild traffic estimates from the protected data and measure their error.'),
 ('Edge', 'Run the best protections on embedded boards at realistic message rates.'),
], 'Project steps') + """
<p class="note">The project uses public datasets and simulated traces only, never data that could identify a real person.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'Geospatial data (pandas, GeoPandas)', 'Differential privacy', 'Traffic simulation', 'Embedded profiling']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('Unique in the crowd: The privacy bounds of human mobility', 'Y.-A. de Montjoye, C. A. Hidalgo, M. Verleysen, V. D. Blondel', 'Scientific Reports, 2013', 'https://doi.org/10.1038/srep01376', 'How few points it takes to single someone out.'),
 ('Anonymous usage of location-based services through spatial and temporal cloaking', 'M. Gruteser, D. Grunwald', 'ACM MobiSys, 2003', 'https://usenix.org/legacy/events/mobisys03/tech/gruteser.html', 'Cloaking, the classic protection.'),
 ('Geo-indistinguishability: Differential privacy for location-based systems', 'M. E. Andrés, N. E. Bordenabe, K. Chatzikokolakis, C. Palamidessi', 'ACM CCS, 2013', 'https://arxiv.org/abs/1212.1984', 'Noise with a formal privacy guarantee.'),
 ('Pseudonym schemes in vehicular networks: A survey', 'J. Petit, F. Schaub, M. Feiri, F. Kargl', 'IEEE Communications Surveys &amp; Tutorials, 2015', 'https://doi.org/10.1109/COMST.2014.2345420', 'How cars change identities, and how attackers link them anyway.'),
 ('Enhancing vehicle data availability and privacy for connected cars', '<b>G. Kar</b>', 'Ph.D. dissertation, Rutgers University, 2017', 'https://doi.org/10.7282/T3SB48MK', 'My dissertation, the starting point.'),
 ('Real-time traffic estimation at vehicular edge nodes', '<b>G. Kar</b>, S. Jain, M. Gruteser, F. Bai, R. Govindan', 'ACM/IEEE SEC, 2017', 'https://doi.org/10.1145/3132211.3134461', 'What traffic estimation needs from vehicle data.'),
]) + '</section>' + JOIN)

PL['planned-ev'] = ('Securing the EV charging network',
 'Electric-vehicle chargers are networked computers connected to the power grid. If an attacker controls many of them at once, switching them together could stress the local grid. This project studies those attacks and how to detect them early.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Public chargers talk to the car, to the operator's servers and to payment systems, and the operator can start and stop charging remotely. Security reviews of this ecosystem have found weaknesses at each of those links. The grid side is what makes it more than a data breach: one compromised management server can reach thousands of chargers, and switching them together changes the load on a neighborhood feeder in seconds.</p>
<p>This is a new direction for my group that joins two existing lines: vehicles as networked systems (my dissertation and the GM driver-identification work) and machine-learning detection of anomalies in network and sensor data (Electronics 2024; EPJ Quantum Technology 2025).</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'How much can a coordinated attack on many chargers move the load on a local grid, and which attack patterns matter most?',
 'Can anomaly detection on charging sessions and load data catch such attacks early, with few false alarms?',
 'Where are the weak points in the protocol stack between charger, operator and vehicle, and which hardening steps matter most?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Model the grid', 'Attach simulated charging stations to standard distribution test feeders.'),
 ('Model charging', 'Generate realistic sessions from public charging datasets.'),
 ('Attack', 'Simulate coordinated switching and data-manipulation attacks of growing scale.'),
 ('Detect', 'Train detectors on station and feeder data and measure delay and false alarms.'),
 ('Harden', 'Build a lab test bed with open-source charger and server software and analyze the management link.'),
], 'Project steps') + """
<p class="note">All attacks run in simulation or in an isolated lab test bed, never on real chargers or grids.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'Power distribution simulation', 'Time-series anomaly detection', 'Protocol analysis', 'Threat modeling']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('A detailed security assessment of the EV charging ecosystem', 'J. Antoun, M. E. Kabir, B. Moussa, R. Atallah, C. Assi', 'IEEE Network, 2020', 'https://doi.org/10.1109/MNET.001.1900348', 'A map of the ecosystem and its weak links.'),
 ('Public plug-in electric vehicles + grid data: Is a new cyberattack vector viable?', 'S. Acharya, Y. Dvorkin, R. Karri', 'IEEE Transactions on Smart Grid', 'https://arxiv.org/abs/1907.08283', 'How public charging data could be used to plan grid attacks.'),
 ('Review of electric vehicle charger cybersecurity vulnerabilities, potential impacts, and defenses', 'J. Johnson, T. Berg, B. Anderson, B. Wright', 'Energies, 2022', 'https://doi.org/10.3390/en15113931', 'A review of vulnerabilities, impacts and defenses.'),
 ('Automated network incident identification through genetic algorithm-driven feature selection', 'A. Aksoy, L. Valle, <b>G. Kar</b>', 'Electronics, 2024', 'https://doi.org/10.3390/electronics13020293', 'Our feature selection for incident detection, adaptable to charging data.'),
]) + '</section>' + JOIN)

PL['planned-llmsoc'] = ('Can a language model help triage security alerts?',
 'Security teams face far more alerts than they can read, and most turn out to be harmless. This project tests whether a language model that reads the context around each alert can put the real incidents first, and how to catch it when it gets the facts wrong.',
 BADGE + """
<section>
<h2>Why this matters</h2>
<p>Analysts in security operations centers report being buried in false positives, and rule-based severity labels are a weak guide to what matters. Language models can read an alert together with asset records, recent tickets and related events, which is what an experienced analyst does. They can also state context that is not there, and an attacker who controls a log field can try to talk to them.</p>
<p>Our university chatbot answers questions from retrieved university pages, and the planned chatbot-security project studies how retrieval can be poisoned. This project moves the same ideas into security operations, where a confident wrong answer can close a real incident.</p>
</section>
<section>
<h2>Research questions</h2>
""" + rqs([
 'Does retrieving context for each alert make a language model rank alerts better than rule severity, within a fixed analyst budget?',
 'How often does the model invent or misread context, and can a check against the source records catch it?',
 'Can an attacker steer the triage model through the alert data itself, and how well does isolating untrusted fields defend against it?',
]) + """
</section>
<section>
<h2>Approach</h2>
""" + flow([
 ('Alerts', 'Build a labeled alert set from public datasets and attacks staged in our lab.'),
 ('Context', 'Add the records an analyst would check: assets, tickets, related alerts.'),
 ('Rank', 'Compare rules, a model alone and a model with retrieved context.'),
 ('Check', 'Verify every claim in the model\'s notes against the records.'),
 ('Attack', 'Plant instruction-like text in log fields and measure the effect.'),
], 'Project steps') + """
<p class="note">The project uses lab and public data only; no real organization's alerts or logs.</p>
</section>
<section>
<h2>Skills you will use and learn</h2>
""" + skills(['Python', 'Language models and retrieval', 'Security monitoring (SIEM) data', 'Evaluation design', 'Prompt-injection testing']) + """
</section>
<section>
<h2>Papers to read first</h2>
""" + reading([
 ('99% false positives: A qualitative study of SOC analysts\' perspectives on security alarms', 'B. A. Alahmadi, L. Axon, I. Martinovic', 'USENIX Security Symposium, 2022', 'https://www.usenix.org/conference/usenixsecurity22/presentation/alahmadi', 'What analysts actually face, in their own words.'),
 ('Large language models for cyber security: A systematic literature review', 'H. Xu et al.', 'arXiv preprint, 2024', 'https://arxiv.org/abs/2405.04760', 'A survey of where language models are being tried in security.'),
 ('Retrieval-augmented generation for knowledge-intensive NLP tasks', 'P. Lewis et al.', 'NeurIPS, 2020', 'https://arxiv.org/abs/2005.11401', 'The retrieval idea behind adding context to each alert.'),
 ('Not what you\'ve signed up for: Compromising real-world LLM-integrated applications with indirect prompt injection', 'K. Greshake, S. Abdelnabi, S. Mishra, C. Endres, T. Holz, M. Fritz', 'ACM AISec, 2023', 'https://doi.org/10.1145/3605764.3623985', 'How text in the data can steer a model.'),
 ('Automated network incident identification through genetic algorithm-driven feature selection', 'A. Aksoy, L. Valle, <b>G. Kar</b>', 'Electronics, 2024', 'https://doi.org/10.3390/electronics13020293', 'Our incident identification, the classical baseline to beat.'),
]) + '</section>' + JOIN)

PLANNED = PLANNED + PLANNED_CORE_MORE + PLANNED_NEW


def main():
    os.makedirs(OUT, exist_ok=True)
    for slug, (title, lead, body) in P.items():
        with open(os.path.join(OUT, slug + '.html'), 'w') as f:
            f.write(page(slug, title, lead, body))
    for slug, (title, lead, body) in PL.items():
        with open(os.path.join(OUT, slug + '.html'), 'w') as f:
            f.write(page(slug, title, lead, body, group=PLANNED, crumb='Open projects', back='open-projects'))
    GT = 'LaTeX and Overleaf for your first paper'
    GL = 'A practical guide for my students: start from the official IEEE or ACM template, organize the project, cite with BibTeX, make clean figures and tables, write together on Overleaf, and check everything before you submit.'
    with open(os.path.join(OUT, 'latex-overleaf.html'), 'w') as f:
        f.write(page('latex-overleaf', GT, GL, GUIDE_BODY, group=[('latex-overleaf', GT)], crumb='Students', back='students'))
    idx = [{'t': 'Research', 'd': 'Four research directions and how the work fits together.', 'u': 'research.html', 'k': 'Page'},
           {'t': 'Projects', 'd': 'All published projects and open projects, by direction.', 'u': 'projects.html', 'k': 'Page'},
           {'t': 'Open projects for new students', 'd': 'Planned projects with research questions, papers to read and live demos.', 'u': 'projects.html#open-projects', 'k': 'Section'},
           {'t': 'Publications', 'd': 'Journal articles, conference papers, theses and patent, with filters.', 'u': 'publications.html', 'k': 'Page'},
           {'t': 'Teaching', 'd': 'Courses at the University of Central Missouri.', 'u': 'teaching.html', 'k': 'Page'},
           {'t': 'About', 'd': 'Background, appointments, education, honors and service.', 'u': 'index.html#about', 'k': 'Section'},
           {'t': 'Work with me', 'd': 'For students, employers and collaborators: first-semester steps, track record and expertise with evidence.', 'u': 'work-with-me.html', 'k': 'Page'},
           {'t': 'How I work', 'd': 'Five steps every project follows: sense, fingerprint, decide, deploy, stress-test.', 'u': 'research.html#method', 'k': 'Section'},
           {'t': 'Contact', 'd': 'Email, office and profiles.', 'u': 'index.html#contact', 'k': 'Section'}]
    idx.append({'t': 'LaTeX and Overleaf for your first paper', 'd': 'Student guide: templates, BibTeX, figures, collaboration and a checklist before you submit.', 'u': 'research/latex-overleaf.html', 'k': 'Student guide'})
    for slug, (title, lead, body) in P.items():
        idx.append({'t': re.sub('<.*?>', '', html.unescape(title)), 'd': html.unescape(re.sub('<.*?>', '', lead)), 'u': 'research/' + slug + '.html', 'k': 'Published work'})
    for slug, (title, lead, body) in PL.items():
        idx.append({'t': re.sub('<.*?>', '', html.unescape(title)), 'd': html.unescape(re.sub('<.*?>', '', lead)), 'u': 'research/' + slug + '.html', 'k': 'Open project'})
    import json
    with open(os.path.join(OUT, '..', 'pages.json'), 'w') as f:
        json.dump(idx, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', len(P) + len(PL), 'pages to', os.path.normpath(OUT), 'and', len(idx), 'search entries')


if __name__ == '__main__':
    main()
