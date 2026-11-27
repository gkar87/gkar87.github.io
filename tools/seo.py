"""Search-result titles and descriptions for the project pages.

Google shows about 60 characters of a title and about 155 of a description, and cuts
the rest. The page's own heading and lead stay as they are; these only go in <title>
and <meta name="description">. A page that is not listed uses its heading and lead.
Keep every title here at 46 characters or fewer (the page adds " · Gorkem Kar") and every
description at 155 or fewer; tools/check_site.py warns when a page is longer.
"""

TITLE = {
    'vehicles': 'Connected vehicles: sensing, identity, trust',
    'driver-behavior': 'Scoring drivers from in-vehicle data',
    'quantum-spectra': 'Quantum machine learning for Raman spectra',
    'wireless-ffr': 'Sharing spectrum fairly in cellular networks',
    'planned-gnss': 'Catching GNSS spoofing with car sensors',
    'planned-benchmark': 'Leak-free benchmarks for IoT classifiers',
    'planned-quantum': 'Does a quantum layer help intrusion detection?',
    'planned-xai': 'Explanations you can check for detectors',
    'planned-can': "Spotting intruders on a car's internal network",
    'planned-acoustic': 'Do earbuds and video calls leak your typing?',
    'planned-pqc': 'Post-quantum cryptography on IoT devices',
    'planned-blockchain': 'Tamper-evident IoT identity on a blockchain',
    'planned-federated': 'Training intrusion detectors without pooling',
    'planned-adversarial': 'Can attackers slip past intrusion detectors?',
    'planned-vprivacy': 'Location privacy for connected cars',
    'planned-llmsoc': 'Can a language model triage security alerts?',
}

DESC = {
    'vehicles': 'Cars are rolling sensor platforms. This work asks what their data reveals, who is driving, and how to catch signals that put everyone on the road at risk.',
    'iot-identity': 'A network that cannot tell which device sent a packet, or whether it was tampered with, cannot defend itself. We identify devices and attacks from headers.',
    'side-channels': 'A phone behind your keyboard can hear which keys you press. We showed how, with no training data or language model, so it works on random passwords too.',
    'applied-ai': 'The methods behind my security work applied to food safety, public safety, language and the workplace, with an emphasis on explaining why a model decides.',
    'perception': "A car's sensors stop at the truck in front of it. This work shares views between vehicles and turns phone and car sensors into a picture of the road.",
    'quantum-spectra': 'Hybrid quantum-classical models tested on Raman spectra, the light fingerprints of molecules: one-dimensional, noisy and costly to label.',
    'wireless-ffr': "My M.S. thesis at Bilkent: how to split a cell's subcarriers between users near the base station and users at the edge, so the network is fast and fair.",
    'planned-gnss': 'Can a car notice that its GPS is lying, using only data it already has? An open project building a lightweight spoofing detector from vehicle motion data.',
    'planned-benchmark': 'Many IoT intrusion-detection and fingerprinting papers report near-perfect accuracy. How much survives once shortcuts in the data are removed?',
    'planned-quantum': 'Quantum-classical intrusion detectors look strong in simulation. How much comes from the quantum layer, and what survives on real quantum hardware?',
    'planned-xai': 'Do explanation methods tell security analysts the truth about why a detector fired? An open project testing them and building checkable ones.',
    'planned-can': 'Dozens of computers in every car talk over one shared bus with no sender authentication. An open project detecting messages that do not belong.',
    'planned-acoustic': 'One phone can tell which keys you press from their sound. Microphones are now in earbuds, speakers and video calls. How much do they leak?',
    'planned-rag': 'Can a planted page or a crafted question make a campus chatbot give wrong or harmful answers, and which defenses hold up? An open red-teaming project.',
    'planned-tinyml': 'Most IoT devices cannot run a full intrusion detector. An open project shrinking detectors to fit a microcontroller and measuring the accuracy cost.',
    'planned-pqc': 'What does moving to NIST post-quantum cryptography cost on small IoT devices, and does it quietly break the security tools that watch their traffic?',
    'planned-blockchain': 'Recording IoT device identities on a permissioned blockchain and checking live traffic against them, to notice when a device is cloned or tampered with.',
    'planned-encrypted': 'Encryption hides what is inside a packet, but not its size, timing or direction. How much does that metadata reveal, and how can networks use or hide it?',
    'planned-v2x': 'Connected cars broadcast position and speed many times a second; other cars act on them. An open project catching messages about cars that are not there.',
    'planned-federated': 'Training a shared intrusion detector across many sites while the data stays where it was collected, and asking what happens when one site is malicious.',
    'planned-adversarial': 'How robust are network intrusion detectors against attackers who must keep packets valid and the attack working? An open project measuring it.',
    'planned-rf': 'Tiny flaws in every radio transmitter leave a signature in its signals. Can they identify IoT devices reliably as radios move and conditions change?',
    'planned-vprivacy': 'A handful of shared location points can reveal where a driver lives and works. An open project measuring that risk and testing protections.',
    'planned-ev': 'EV chargers are networked computers on the power grid. An open project on attacks that switch many at once to stress the grid, and on catching them early.',
    'planned-llmsoc': 'Can a language model that reads the context around each security alert put real incidents first, and how do we catch it when it gets the facts wrong?',
    'latex-overleaf': 'A guide for my students: start from the IEEE or ACM template, cite with BibTeX, make clean figures, write on Overleaf and check before you submit.',
}
