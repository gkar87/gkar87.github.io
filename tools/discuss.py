# Discussion sections for every project page: where the work sits in the
# shared method, what it shows (or would show), its limits, and what it means.
# Interpretation only; every number quoted here already appears on the page.

STAGES = [
    ('Sense', 'a signal the system ignores'),
    ('Fingerprint', 'the behavior inside it'),
    ('Decide', 'with a small model'),
    ('Deploy', 'at the edge or on real hardware'),
    ('Stress-test', 'attack it, explain it, benchmark it fairly'),
]
S, F, D, P, T = range(5)


def pipe(on, cap, examples=None):
    lis = []
    for i, (n, d) in enumerate(STAGES):
        cls = ' class="on"' if i in on else ''
        ex = f'<em>{examples[i]}</em>' if examples else ''
        lis.append(f'<li{cls} style="--i:{sum(1 for j in on if j < i)}"><small>0{i + 1}</small><b>{n}</b><span>{d}</span>{ex}</li>')
    return (f'<figure class="pipe" aria-label="Where this work sits in the method: {", ".join(STAGES[i][0] for i in on)}">'
            f'<ol>{"".join(lis)}</ol><figcaption>{cap}</figcaption></figure>')


# slug: (stages, caption, a, b-list, c)
# published pages: a = what it shows, b = where it falls short, c = what it means
# planned pages:   a = if it works,    b = where it could fail,   c = how we will know
D_ = {
 'vehicles': ({S, F, D, P}, 'The jammer and driver work start from signals cars and phones already produce, and run where the car is: at the roadside and on the vehicle.',
  'Signals that are already there, from GPS signal strength on phones to the rhythm of a door, an ignition and a seat belt, were enough to single out a jamming car and to recognize a driver. No new sensor had to be built into the car.',
  ['The field tests were modest: highway passes with an emulated jammer, and a few hundred trips for driver identification. Bigger and more varied fleets would show how far the results carry.',
   'A driver who knows about the system can change their routine, so pre-trip identification is a strong hint, not proof of identity.',
   'Roadside cameras that photograph suspects raise privacy questions of their own.'],
  'For automakers and fleets, cheap signals that are already present can carry security value before new hardware is added. The open projects test the same idea against an attacker who is trying to fool the car.'),
 'perception': ({S, P}, 'Both studies are about sensing more: borrowing other cars\' views and reading the phone and car sensors already in the cabin.',
  'Sharing sensor views lets a car see what is hidden behind the vehicle in front, and phone and car sensors together recognized lane changes, potholes, road grade and stop signs, more reliably when many drives were combined.',
  ['Shared views only help if they arrive quickly and are placed correctly in the receiving car\'s frame.',
   'Every shared view is also a new input that an attacker could fake.',
   'Where the phone sits in the cabin changes what its sensors can see.'],
  'Cooperative perception needs a trust check before a car acts on another car\'s view. Catching ghost vehicles in V2X messages is that check.'),
 'driver-behavior': ({S, F, D, P}, 'Scoring reads the car\'s own data during the trip and gives feedback while it still matters.',
  'In-vehicle data can score driving as it happens, and simulated trips agreed closely with real ones. Wrapping the score in achievements gives drivers a reason to act on it.',
  ['The gamification study tested two real-world trips, so lasting behavior change needs longer field studies.',
   'What counts as safe driving depends on the road and the traffic, so thresholds need care.',
   'Driving data is personal, which makes it matter where the scoring runs.'],
  'Insurers and fleets already want driver scores. Computing them on the vehicle keeps the raw data in the car.'),
 'quantum-ids': ({F, D, T}, 'Wavelets turn traffic into images, a CNN extracts features, and a two-qubit circuit makes the final call.',
  'A very small quantum circuit can sit inside a classical deep-learning pipeline and reach high accuracy on two different security tasks, DDoS detection and Android malware classification.',
  ['These results come from quantum simulators, which have no hardware noise and no cost per run.',
   'Public benchmark datasets can contain shortcuts that inflate accuracy for any model, quantum or not.',
   'Showing that the quantum layer itself is responsible needs classical models of the same size and tuning budget.'],
  'A quantum advantage is a hypothesis to test, not a result to assume. That is exactly what the honest quantum benchmarks project sets out to do.'),
 'quantum-spectra': ({F, D, P}, 'Spectra become scaleograms or dual-channel features, and one hybrid model ran on a real IonQ quantum processor.',
  'Raman spectra are a natural test bed for small quantum models, and the microplastics study ran its hybrid network on real quantum hardware, not only in simulation.',
  ['Spectral datasets are small, so results depend on careful validation.',
   'Time on quantum hardware is limited and costly, so the number of runs is small.',
   'The classical parts of the pipeline do much of the work; isolating what the quantum part adds needs matched baselines.'],
  'Real-hardware runs are where the field needs evidence, and they are now part of how my group works.'),
 'iot-identity': ({S, F, D}, 'Header fields that the network already sees become a device fingerprint, and a genetic algorithm picks the few that name each attack.',
  'One packet\'s header fields carried enough of a device\'s habits to name it most of the time (95.3% in our study), and a genetic algorithm found the small set of features that tell network attacks apart.',
  ['Header fingerprints can pick up details of the capture, such as addresses and timestamps, instead of the device itself.',
   'Devices change with firmware updates, so a fingerprint learned once drifts.',
   'More traffic is encrypted every year, which limits what headers alone can say.'],
  'Network operators can build a device inventory from traffic they already collect, with no software on the devices. The leak-free benchmark and encrypted-traffic projects test how far that holds.'),
 'side-channels': ({S, F, D, T}, 'Sound reaches the phone\'s two microphones a fraction of a millisecond apart, and that difference places each key.',
  'An ordinary phone\'s two microphones located keystrokes precisely enough to recover what was typed, with no training on the victim and no language model, so random passwords leak too.',
  ['The attack assumed a phone close to the keyboard and a clean, high-rate recording.',
   'Keyboard model, typing style and background noise all change accuracy.',
   'Calls and earbuds compress audio and suppress noise, which may remove the cues or keep them. That is still open.'],
  'Any microphone near a keyboard is a possible leak, and sensors a system does not treat as security-relevant deserve a threat model too.'),
 'applied-ai': ({D, T}, 'The same modeling habits applied to new domains, with explanation tools showing which inputs drove each prediction.',
  'The methods carry across food fraud, employee attrition, crime prediction and Turkish scientific text, and comparing LIME, SHAP and the What-If Tool showed what each can tell an analyst.',
  ['Explanation tools can disagree with each other and with what the model really relies on.',
   'Each model was built on the data studied, and new data needs new validation.',
   'Predictions about people, such as attrition or crime, raise fairness questions that accuracy does not answer.'],
  'An explanation should be checked before anyone acts on it. The checkable-explanations project turns that into a test.'),
 'wireless-ffr': ({D}, 'The decision here is how to split a cell\'s subcarriers between the center and the edge.',
  'Adaptive splits between the cell center and the cell edge improved the product of throughput and fairness by about 5% over fixed splits.',
  ['The results come from simulation of WiMAX networks, a standard later replaced by LTE and 5G.',
   'Real traffic and interference are less regular than the models.'],
  'The trade-off between speed for most users and fairness for the worst-served returns in 5G scheduling, and in fairness work on machine learning today.'),

 'planned-gnss': ({S, D, P, T}, 'The car\'s own motion data is the signal; the check has to run on in-vehicle hardware and survive a careful spoofer.',
  'A car could flag a spoofed position with data it already has, on cheap hardware, before navigation or driver assistance acts on it.',
  ['A patient spoofer can drift the position slowly enough to stay inside normal sensor error.',
   'Wheel-speed and steering data drift too, on wet roads or with tire wear, which can cause false alarms.'],
  'Detection rate and time to detect against spoofing of rising subtlety, false alarms per hour of normal driving, and run time on in-vehicle-class hardware.'),
 'planned-benchmark': ({F, T}, 'This project stress-tests the fingerprints themselves: what is the model really learning?',
  'Others get a benchmark they can trust, and the field gets a clear account of how much reported accuracy came from shortcuts.',
  ['Removing every shortcut may also remove real signal and make the task look harder than it is.',
   'Some public datasets lack the metadata needed to split cleanly by time or by device.'],
  'The accuracy of standard models before and after leak removal, on the same data, with the splits published.'),
 'planned-quantum': ({D, P, T}, 'Matched hybrid and classical models, run in simulation and on real quantum hardware.',
  'A clear answer, whichever way it goes, on whether a quantum layer earns its place in intrusion detection.',
  ['A null result is likely, and it is still worth publishing clearly.',
   'Hardware noise and a small number of runs make comparisons statistically weak.'],
  'Matched classical and hybrid models compared with confidence intervals, in simulation and on hardware.'),
 'planned-xai': ({D, T}, 'Explanations are put to the test the same way detectors are.',
  'Analysts get explanations they can verify, and learn when not to trust one.',
  ['Faithfulness is hard to measure without ground truth; planted features help but are artificial.',
   'A faithful explanation can still be too complex to act on.'],
  'Whether explanations recover planted features, how far different methods agree, and whether they help an analyst decide.'),
 'planned-can': ({S, F, D, P}, 'Message timing on the bus is the signal, and the detector must fit the car\'s gateway.',
  'A detector small enough for a car\'s gateway catches injected messages quickly.',
  ['Public bus datasets cover few cars and simple attacks, and a careful attacker can copy normal timing.',
   'A false alarm in a car is costly, so thresholds have to be conservative.'],
  'Detection and false-alarm rates across attack types, and latency on embedded hardware.'),
 'planned-acoustic': ({S, F, T}, 'The 2015 attack, rerun against the audio pipelines people use today.',
  'A measured answer to whether everyday audio leaks typing, and which settings stop it.',
  ['Compression and noise suppression may remove the cues entirely, which would itself be good news.',
   'Experiments must use consenting volunteers and made-up text.'],
  'Keystroke recovery across devices, codecs and noise settings, next to the original phone attack.'),
 'planned-rag': ({D, T}, 'A retrieval chatbot is the model; red-teaming it is the stress test.',
  'A tested set of defenses for campus chatbots, and a red-team checklist others can reuse.',
  ['Attacks change quickly, so a defense that holds today may not hold next year.',
   'Testing must stay on a copy of the chatbot, never the live service.'],
  'Attack success before and after each defense, and what each defense costs in answer quality.'),
 'planned-tinyml': ({D, P}, 'The same detector, made small enough to run on the device it protects.',
  'Even small networks get intrusion detection that runs on the devices themselves.',
  ['Compression can hide a drop in accuracy on rare attacks, which are often the ones that matter.',
   'Microcontrollers differ widely, so results on one board may not transfer.'],
  'Accuracy for each attack class, plus memory, energy and latency on real microcontrollers.'),
 'planned-pqc': ({P, T}, 'New cryptography on small devices, and its side effects on the tools that watch them.',
  'IoT makers get concrete numbers on what moving to the post-quantum standards costs, and which monitoring tools need updating.',
  ['Library implementations change fast, so measurements age.',
   'Larger keys and messages may break traffic fingerprints in ways that are hard to predict.'],
  'Handshake time, energy, memory and message sizes on real devices, and the accuracy of traffic-based tools before and after.'),
 'planned-blockchain': ({F, P, T}, 'Device fingerprints anchored in a tamper-evident record that the network checks.',
  'The network notices a cloned or tampered device by checking its behavior against a record nobody can quietly change.',
  ['Ledger overhead may be too high for small networks.',
   'Fingerprints drift, so updates must be authorized without opening a door for attackers.'],
  'How often clones are caught, ledger latency, and the cost per device.'),
 'planned-encrypted': ({S, F, D, T}, 'Sizes, timing and direction of encrypted packets are the signal.',
  'Networks can be managed and secured from metadata alone, and users can be protected from the same leak.',
  ['Padding and newer protocols may hide most of the signal.',
   'The same methods could be used for surveillance, so defenses are part of the project.'],
  'Identification accuracy from encrypted flows, with and without padding defenses, and the bandwidth each defense costs.'),
 'planned-v2x': ({S, D, T}, 'Broadcast positions and speeds are the signal; the check is whether they describe a car that is really there.',
  'Cars can ignore messages about vehicles that do not exist, before acting on them.',
  ['Simulated traffic is cleaner than real roads.',
   'Several coordinated fake senders are much harder to catch than one.'],
  'Detection rate and time to detect across traffic densities and attack types, with false alarms on honest traffic.'),
 'planned-federated': ({D, P, T}, 'One shared detector, trained where the data lives, and attacked by a dishonest site.',
  'Sites share what they learn without sharing their traffic.',
  ['Sites see very different traffic, which can stall training.',
   'A malicious site can poison the shared model.'],
  'Accuracy against a model trained on pooled data, robustness with poisoned sites, and communication cost.'),
 'planned-adversarial': ({D, T}, 'The detector is attacked by someone who has to keep the traffic valid.',
  'Intrusion detectors get an honest robustness number under realistic attacker rules.',
  ['The rules that keep traffic valid are hard to encode completely.',
   'Training for robustness can lower accuracy on normal traffic.'],
  'Evasion success under constrained attacks, before and after defenses, and what each defense costs in accuracy.'),
 'planned-rf': ({S, F, D}, 'Tiny flaws in each transmitter are the signal, read below the software layer.',
  'Devices are recognized by their radios, which a cloned software identity cannot copy.',
  ['Signatures shift with temperature, movement and receiver, so models may not transfer.',
   'Collecting labeled signals needs radio hardware and a careful setup.'],
  'Identification accuracy across days, positions and receivers, not only within one recording.'),
 'planned-vprivacy': ({S, T}, 'Shared positions are the signal; the stress test is how much they reveal.',
  'Shared car data stays useful for traffic and safety while protecting where drivers go.',
  ['Every privacy protection costs some usefulness, and the right balance depends on the use.',
   'Re-identification attacks keep improving.'],
  'Re-identification risk and usefulness for traffic tasks, for each protection setting.'),
 'planned-ev': ({S, D, T}, 'Charger behavior is the signal; the danger is many chargers acting together.',
  'An early warning when many chargers act together in a way that could stress the grid.',
  ['Real charger data is hard to obtain, so the work relies on simulation and public data.',
   'Legitimate demand spikes can look like attacks.'],
  'Time to detect and false alarms in grid simulations with coordinated and normal charging.'),
 'planned-llmsoc': ({D, T}, 'A language model ranks alerts; the stress test is catching it when it gets facts wrong.',
  'Analysts read the real incidents first, and the model\'s mistakes are caught before they matter.',
  ['Language models can state wrong facts with confidence.',
   'Alert data is sensitive, so models may need to run locally.'],
  'How high real incidents rank, how often the model\'s stated facts are wrong, and analyst time saved in a simulated queue.'),
}


def discussion(slug, planned):
    if slug not in D_:
        return ''
    on, cap, a, b, c = D_[slug]
    h = ('If it works', 'Where it could fail', 'How we will know') if planned else ('What it shows', 'Where it falls short', 'What it means')
    return ('<section class="discussion">\n<h2>Discussion</h2>\n'
            + pipe(sorted(on), cap)
            + '<div class="disc">'
            + f'<div class="dc d-a reveal"><h3>{h[0]}</h3><p>{a}</p></div>'
            + f'<div class="dc d-b reveal"><h3>{h[1]}</h3><ul>' + ''.join(f'<li>{x}</li>' for x in b) + '</ul></div>'
            + f'<div class="dc d-c reveal"><h3>{h[2]}</h3><p>{c}</p></div>'
            + '</div>\n</section>\n')
