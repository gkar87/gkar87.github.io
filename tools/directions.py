# Detailed "Start here" directions for every project page on GK's personal website.
# Written for the owner of the site files to fold into personal-website-tools/build_projects.py.
#
# How to use (see NOTES.md):
#   from directions import start_here_detailed
#   ...and in the page builder replace   st = start_here(slug)
#   with                                 st = start_here_detailed(slug, RES, STARTS, start_here)
# Slugs without an entry here fall back to the old start_here(slug).
#
# Text style: plain words, one action per bullet, every step ends with a concrete
# "You are done when" check. `backticks` render as <code>. No new numbers or claims
# about results; tools and datasets are the ones already listed (and link-checked) in RES.

import html
import re

# Shared block shown once on every project page, above the steps.
SETUP = [
    ('Set up a workspace',
     'Create a private Git repository for the project with folders for `data/`, `src/`, `figures/` and `notes/`. '
     'Make a Python virtual environment (`python -m venv .venv`) and record every package you install in `requirements.txt`.'),
    ('Keep a lab notebook',
     'Add a dated entry to `notes/log.md` each time you work: what you ran (the exact command), what came out, and what surprised you. '
     'This log is the first thing to share when you ask for help, and most of your paper\'s method section comes from it.'),
    ('Make every number reproducible',
     'Fix random seeds, write down the dataset version and how you split it, and keep the script that produced each figure next to the figure. '
     'If you cannot regenerate a number with one command, it is not finished.'),
    ('Stay legal and ethical',
     'Work only with public datasets, data you recorded yourself with everyone\'s consent, or systems you own. '
     'Never test an attack on a network, car, radio band or service that is not yours, and follow the safety note on this page.'),
    ('When you get stuck',
     'Spend about an hour, then write down what you tried, what you expected and the exact error or plot, and ask. '
     'A precise question is much easier to answer than "it does not work".'),
]

# Per project: goal for the month, then steps as (title, when, [actions], done_when).
DIRECTIONS = {
 # ------------------------------------------------------------------ published work
 'vehicles': {
  'goal': 'A one-page research plan for one open question on this page, backed by a real drive and a simulated road you have looked at yourself.',
  'steps': [
   ('Read with a purpose', 'Week 1',
    ['Read the GPS-jammer (ACM CCS 2014) and PredriveID (ACM/IEEE SEC 2017) papers in the list below.',
     'For each, write one paragraph: who the attacker or subject is, what they can and cannot do, and what data the system needs.'],
    'you have two paragraphs that name each paper\'s assumptions in your own words.'),
   ('Look at real vehicle data', 'Week 2',
    ['Download the example segment from the comma2k19 repository and load its logs in Python.',
     'Plot GNSS speed and wheel speed for the same minute of driving on one chart, with time on the x-axis.',
     'Note where the two disagree and suggest why (sampling rate, lag, tire size, GNSS dropouts).'],
    'your chart is in `figures/` with a two-sentence caption explaining the gap.'),
   ('Simulate a road', 'Week 3',
    ['Install Eclipse SUMO and build a short highway in its network editor, or use one of its tutorial networks.',
     'Run it with `--fcd-output` so every vehicle\'s position and speed is logged at each time step.',
     'Plot two vehicles\' tracks from the log. This is the raw material a roadside detector would work from.'],
    'you can regenerate the log and the plot with one command.'),
   ('Write a one-page plan', 'Week 4',
    ['Pick one open question at the bottom of this page.',
     'Write one page: the question, the data you will use, the method, the baseline you will compare against, and the number that will tell you it worked.'],
    'the plan fits on one page and someone else could start from it.'),
  ]},
 'perception': {
  'goal': 'A simulated occlusion scene and a first measurement of how much a shared view helps and what it costs.',
  'steps': [
   ('Understand the geometry', 'Week 1',
    ['Read the papers below.',
     'Draw one occlusion case by hand: a car, a truck in front of it, and a pedestrian or car hidden behind the truck. Mark what each car\'s sensors can and cannot see.'],
    'your sketch shows the blind zone and the extra area a second car would reveal.'),
   ('Build the scene in a simulator', 'Weeks 2 and 3',
    ['Install CARLA on a machine with a recent graphics card, and run one of its example scripts.',
     'Place two cars behind a truck and attach a camera or LiDAR sensor to each.',
     'Record a few seconds from both cars and save the sensor output with timestamps.'],
    'you can replay the recording and see the hidden object only in the second car\'s view.'),
   ('Measure benefit and cost', 'Week 4',
    ['Estimate how much of the blind zone the shared view removes, for example the share of hidden objects that become visible.',
     'Estimate the data each car would have to send per second to share that view, raw and in a compressed or object-list form.'],
    'you have one table with blind-zone coverage and bandwidth for each sharing option.'),
  ]},
 'driver-behavior': {
  'goal': 'A working harsh-event detector on real driving data, compared against a small learned model.',
  'steps': [
   ('List what gets scored', 'Week 1',
    ['Read the papers below.',
     'Make a table of the events each scoring rule counts (hard braking, sharp turns, speeding) and the thresholds it uses, where the paper gives them.'],
    'your table covers every paper and notes where they disagree.'),
   ('Detect events with a threshold', 'Weeks 2 and 3',
    ['Load several comma2k19 drives and extract speed, and compute acceleration from it.',
     'Flag harsh braking and acceleration with a simple threshold, and plot each drive with its events marked.',
     'Check a handful of flagged events by eye: are they real, or noise from the signal?'],
    'you have a plot per drive and a short note on false events you found.'),
   ('Compare with a classifier', 'Week 4',
    ['Label a small set of events by hand and train a small scikit-learn classifier on windows of speed and acceleration.',
     'Score every drive with both methods and report how much the score changes from drive to drive under each.'],
    'one table compares the two methods, with the labeled set saved so the result can be reproduced.'),
  ]},
 'quantum-ids': {
  'goal': 'A fair classical baseline for our quantum intrusion detection results, run on the same data with the same budget.',
  'steps': [
   ('Read our paper as a reviewer', 'Week 1',
    ['Read our EPJ Quantum Technology paper.',
     'Write down every dataset, preprocessing step, model size (number of trainable parameters) and metric it reports.'],
    'you have a table someone could use to rebuild the experiments.'),
   ('Learn the quantum tools', 'Week 2',
    ['Work through PennyLane\'s variational classifier tutorials until you can train one on a toy dataset.',
     'Count its trainable parameters and time one training run.'],
    'your notebook trains a variational classifier and prints its parameter count.'),
   ('Build the baseline every claim must beat', 'Weeks 3 and 4',
    ['Take CICIoT2023 or CIC-AndMal2020 with the paper\'s preprocessing.',
     'Train a classical model (small neural network or tree model) with about the same number of parameters as the quantum model.',
     'Run both over several random splits and report the mean and spread, not one number.'],
    'you have one table: quantum vs classical, same data, same parameter budget, several runs.'),
  ]},
 'quantum-spectra': {
  'goal': 'A rebuilt quanvolution filter that runs on a simulator and, if possible, on real quantum hardware.',
  'steps': [
   ('Redraw the pipeline', 'Week 1',
    ['Read the papers below.',
     'Redraw the quanvolution pipeline by hand: input spectrum, how a window becomes qubit rotations, the circuit, the measured outputs, and the classifier.'],
    'your drawing names every step and the size of the data between steps.'),
   ('Rebuild the filter', 'Weeks 2 and 3',
    ['In PennyLane, write a one-dimensional quanvolution filter that slides over a spectrum.',
     'Apply it to a public spectrum and plot the input next to the filter\'s outputs.'],
    'the filter runs on the default simulator and your plot shows its outputs.'),
   ('Simulator vs hardware', 'Week 4',
    ['Make a free IBM Quantum account and run the same small circuit there through Qiskit.',
     'Compare the hardware outputs with the simulator for the same input, and note the queue time and number of shots.'],
    'you have a side-by-side plot and a paragraph on where noise changed the result.'),
  ]},
 'iot-identity': {
  'goal': 'A device classifier that names IoT devices from packet headers, and a list of the header fields it depends on.',
  'steps': [
   ('Read our two papers', 'Week 1',
    ['Read our ICISSP 2024 and Electronics 2024 papers below.',
     'List which header fields each one uses and why those fields differ between devices.'],
    'your list maps each field to a reason it identifies a device.'),
   ('Capture your own traffic', 'Week 2',
    ['Capture a few minutes of traffic from two devices you own (a phone and a smart plug, for example) with Wireshark.',
     'Load the capture with Scapy and pull out the header fields from your list into a table, one row per packet.'],
    'you have a CSV of header fields from your own two devices.'),
   ('Classify and inspect', 'Weeks 3 and 4',
    ['Train a nearest-profile classifier on the header fields of CICIoT2023 devices.',
     'Measure accuracy per device, then remove one field at a time and record the drop.'],
    'one chart shows which fields the classifier leans on most.'),
  ]},
 'side-channels': {
  'goal': 'Measured time differences for real key presses, checked against the geometry from our keystroke paper.',
  'steps': [
   ('Work the geometry', 'Week 1',
    ['Read the keystroke ranging paper below (ACM MobiCom 2015).',
     'For one key on a real keyboard, measure its distance to two microphone positions and compute the expected time difference at the speed of sound.'],
    'you have the expected time difference for one key, with your measurements shown.'),
   ('Find key presses in audio', 'Week 2',
    ['Record yourself pressing a few keys with a phone placed next to the keyboard.',
     'Load the audio with librosa, detect each press (for example with onset detection), and plot the waveform with the presses marked.'],
    'every press you made is marked on the plot, and no extra ones are.'),
   ('Measure and compare', 'Weeks 3 and 4',
    ['Record the same keys with two microphones at once (for example a phone with two microphones or two synchronized recorders).',
     'Measure the time difference for each press by cross-correlation and compare it with the geometry from week 1.'],
    'one table lists expected vs measured time difference for each key, with the error.'),
  ]},
 'applied-ai': {
  'goal': 'An explained model on a public tabular dataset, and a short note on where two explanation methods disagree.',
  'steps': [
   ('Read the applied papers', 'Week 1',
    ['Read the food-fraud and attrition papers linked on this page.',
     'For each, note the question, the data, the model, and how the authors justified trusting it.'],
    'you have a half page per paper.'),
   ('Train and explain', 'Weeks 2 and 3',
    ['Pick a public tabular dataset and train a small scikit-learn model (a tree ensemble is a good start).',
     'Explain ten individual predictions with SHAP and save the plots.'],
    'each of the ten predictions has an explanation you can describe in one sentence.'),
   ('Compare explanations', 'Week 4',
    ['Explain the same ten predictions with a second method (for example a gradient method from Captum on a small neural network, or a different SHAP explainer).',
     'Mark where the two methods rank features differently, and suggest why.'],
    'one table lists, for each prediction, the top features from both methods and whether they agree.'),
  ]},
 'wireless-ffr': {
  'goal': 'An ns-3 run that reproduces the fairness trade-off of fractional frequency reuse from the thesis.',
  'steps': [
   ('Redraw the cell plan', 'Week 1',
    ['Read the thesis below.',
     'Draw one cell with its inner and outer region and mark which part of the band each region uses.'],
    'your drawing matches the thesis description and names the parameters you can change.'),
   ('Run the simulator', 'Weeks 2 and 3',
    ['Install ns-3 and run one of its LTE examples with several cells (the LTE module includes a frequency-reuse example).',
     'Find where the example sets the reuse scheme and the share of the band for cell centers.'],
    'you can run the example from the command line and collect its throughput output.'),
   ('Sweep and plot', 'Week 4',
    ['Vary the share of the band used in cell centers over several values.',
     'For each value, compute total throughput and Jain\'s fairness index across users, and plot both on one chart.'],
    'your chart shows the trade-off and is produced by one script.'),
  ]},

 # ------------------------------------------------------------------ open projects
 'planned-gnss': {
  'goal': 'A first spoofing detector: a dead-reckoned path from the car\'s own sensors, a simulated drift, and a measured detection delay.',
  'steps': [
   ('Read the five key papers', 'Week 1',
    ['Read the papers below, starting with ours (ACM CCS 2014 and PredriveID).',
     'For each, write two sentences: what the spoofer can do, and what the defense assumes it cannot.'],
    'you can explain why sensor fusion alone does not stop a careful spoofer.'),
   ('Rebuild the path from the car\'s sensors', 'Week 2',
    ['Download the comma2k19 example segment and load wheel speed, steering angle and GNSS position.',
     'Integrate wheel speed with heading from steering (a simple bicycle model) or yaw rate to get a dead-reckoned path.',
     'Plot it on top of the GNSS track.'],
    'the two paths overlap closely for the first stretch of the drive, and you can say how fast they drift apart.'),
   ('Simulate a spoofer', 'Week 3',
    ['Add a synthetic drift to the GNSS track: start with a sudden jump, then a slow drift of a few meters per second.',
     'Plot the gap between the GNSS path and the dead-reckoned path over time, with and without the attack.'],
    'your plot shows the gap with no attack and under both attacks.'),
   ('Set an alarm and measure it', 'Week 4',
    ['Choose an alarm threshold from normal driving only (for example a high percentile of the no-attack gap).',
     'Report how many seconds after the attack starts the alarm fires, for each attack.'],
    'you have one table of detection delay per attack and the false alarms on clean driving.'),
  ]},
 'planned-benchmark': {
  'goal': 'Evidence of how much a random split inflates IoT traffic classifier scores, and which fields leak the answer.',
  'steps': [
   ('Read about pitfalls', 'Week 1',
    ['Read the papers below, especially the dos and don\'ts of machine learning in security.',
     'List the pitfalls that apply to traffic classification (data snooping, spurious correlations, unfair splits).'],
    'your list has one example of each pitfall you could test on CICIoT2023.'),
   ('Train with two splits', 'Weeks 2 and 3',
    ['Load CICIoT2023 and train the same classifier twice: once with a random split, once with a split by time or by capture.',
     'Report accuracy and macro F1 for both, over several runs.'],
    'one table shows the drop from the random split to the honest split.'),
   ('Find the leaks', 'Week 4',
    ['Drop fields that identify the capture rather than the device (addresses, timestamps, flow IDs) and retrain.',
     'Measure the change under both splits.'],
    'you can name the fields that inflated the score and by how much.'),
  ]},
 'planned-quantum': {
  'goal': 'A hybrid quantum model and its classical twin, compared fairly with confidence intervals.',
  'steps': [
   ('Read the benchmark study', 'Week 1',
    ['Read the papers below, including the study that found classical models hard to beat.',
     'Write down the rules that study used to make comparisons fair.'],
    'your rules list is short enough to check against any paper.'),
   ('Build both models', 'Weeks 2 and 3',
    ['Rebuild one hybrid model in PennyLane on CIC-IDS2017 features.',
     'Build a classical twin with the same number of trainable parameters and the same preprocessing.'],
    'both models train from one script and print their parameter counts.'),
   ('Compare honestly', 'Week 4',
    ['Run both over repeated random splits (at least five) with fixed seeds.',
     'Report mean scores with confidence intervals, plus training time for each.'],
    'one table shows whether the quantum model is better, worse or not distinguishable.'),
  ]},
 'planned-xai': {
  'goal': 'A security detector with explanations, and a deletion test showing whether those explanations can be trusted.',
  'steps': [
   ('Read the explanation papers', 'Week 1',
    ['Read the papers below.',
     'Note how each one decides whether an explanation is faithful to the model.'],
    'you can describe at least two ways to test an explanation.'),
   ('Train and explain', 'Weeks 2 and 3',
    ['Train a malware detector on CIC-AndMal2020 features, or an intrusion detector.',
     'Explain twenty alerts with SHAP and with a gradient method from Captum, and save both rankings.'],
    'each alert has two feature rankings saved to disk.'),
   ('Run the deletion test', 'Week 4',
    ['For each alert, remove the top features in ranked order and watch the model\'s score fall.',
     'Repeat with features removed in random order, and compare the two curves for each method.'],
    'one chart per method shows ranked vs random deletion, averaged over the twenty alerts.'),
  ]},
 'planned-can': {
  'goal': 'A timing-based intrusion detector for the car\'s internal network, tested offline and on a live virtual bus.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below.',
     'Write down which attacks each detector catches and which it misses.'],
    'you have a table of attacks vs detectors.'),
   ('Look at message timing', 'Week 2',
    ['Download the HCRL Car-Hacking dataset.',
     'For each CAN identifier in the normal data, plot the time between consecutive frames.'],
    'you can see that most identifiers repeat at a steady period.'),
   ('Write the detector', 'Week 3',
    ['Flag a frame when its identifier arrives much sooner than its normal period.',
     'Report detection rate and false alarms for each attack type in the dataset (DoS, fuzzy, spoofing).'],
    'one table gives results per attack type.'),
   ('Test it live', 'Week 4',
    ['Set up a virtual CAN interface on Linux and replay a log onto it with can-utils.',
     'Run your detector on the live stream and confirm it raises the same alarms as offline.'],
    'live and offline alarms match on the same log.'),
  ]},
 'planned-acoustic': {
  'goal': 'A comparison of how much keystroke detail survives a phone, earbuds and a video call.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below, including our keystroke ranging paper.',
     'Note what each attack needs from the audio: timing, spectrum, or both.'],
    'you can say which audio features each attack depends on.'),
   ('Record three ways', 'Week 2',
    ['Type the same short text and record it through a phone, through earbuds, and through a video call you record on both ends.',
     'Load all three with librosa and line them up in time.'],
    'you have three aligned recordings of the same typing.'),
   ('Compare what survives', 'Weeks 3 and 4',
    ['For each recording, measure how sharp each key press is in time and plot its spectrum.',
     'Note which pipeline removes the most detail (noise suppression and compression are the usual suspects).'],
    'one figure compares the three pipelines for the same key presses.'),
  ]},
 'planned-encrypted': {
  'goal': 'An encrypted-traffic classifier built from sizes and timing only, and a measured cost for padding that defeats it.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below.',
     'List the features each attack uses: packet sizes, timing, direction, or bursts.'],
    'your list covers every paper.'),
   ('Turn flows into features', 'Week 2',
    ['Download the ISCX VPN-nonVPN data.',
     'Split it into flows and compute, per flow, packet sizes, inter-arrival times and directions.'],
    'you have one feature table, one row per flow, with its application label.'),
   ('Classify, then defend', 'Weeks 3 and 4',
    ['Train a nearest-profile classifier and report accuracy per application category.',
     'Pad packets to fixed sizes (or add dummy packets), retrain, and measure both the new accuracy and the extra bytes sent.'],
    'one chart shows accuracy against padding overhead.'),
  ]},
 'planned-v2x': {
  'goal': 'A plausibility check that catches falsified V2X positions, tested on a public dataset and in simulation.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the misbehavior detection survey and the VeReMi paper below.',
     'List the attack types in VeReMi and what a simple check could catch.'],
    'each attack type has a check you could write.'),
   ('Write a plausibility check', 'Weeks 2 and 3',
    ['Download one VeReMi dataset and parse the received messages with their ground truth.',
     'Flag a message when the claimed position or speed is impossible given the sender\'s previous message.'],
    'your check runs over the whole dataset in one script.'),
   ('Measure and move to simulation', 'Week 4',
    ['Report detection and false alarms per attack type.',
     'Follow the Veins tutorial to run a small simulation and plan how you would run your check inside it.'],
    'you have a results table and a running Veins example.'),
  ]},
 'planned-rag': {
  'goal': 'A small campus chatbot and a measured rate of planted instructions it follows.',
  'steps': [
   ('Read the risks', 'Week 1',
    ['Read the papers below and the OWASP Top 10 for LLM applications.',
     'Pick the two risks that matter most for a university chatbot and write why.'],
    'you can explain indirect prompt injection with one example.'),
   ('Build the chatbot', 'Week 2',
    ['Save a few public university web pages as text.',
     'Build a small retrieval chatbot over them: split the pages into chunks, embed them, retrieve the closest chunks, and answer with a language model.'],
    'the chatbot answers ten test questions from the pages, with the source chunk shown.'),
   ('Plant and measure', 'Weeks 3 and 4',
    ['Add one page that contains a hidden instruction, in your local copy only.',
     'Ask questions that retrieve it and count how often the answer follows the instruction.',
     'Scan the chatbot with garak and compare its findings with yours.'],
    'one table gives the follow rate for your planted page and garak\'s results.'),
  ]},
 'planned-tinyml': {
  'goal': 'An intrusion detector small enough for a microcontroller, with measured accuracy and memory before and after shrinking it.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below.',
     'Note the memory and speed limits of the boards they use.'],
    'you know the memory budget your model must fit.'),
   ('Train a small model', 'Weeks 2 and 3',
    ['Train a small detector in PyTorch on TON_IoT network data.',
     'Count its weights and estimate its size in memory.'],
    'your model trains from one script and prints accuracy and size.'),
   ('Shrink and deploy', 'Week 4',
    ['Quantize the model to 8 bits and measure the accuracy change.',
     'Deploy it to a microcontroller board with Edge Impulse and record accuracy, memory and time per prediction on the board.'],
    'one table compares full-size, quantized, and on-board results.'),
  ]},
 'planned-pqc': {
  'goal': 'Timing and message-size measurements of post-quantum key exchange on a laptop and on a small board.',
  'steps': [
   ('Read the standard', 'Week 1',
    ['Read the overview of NIST FIPS 203 (ML-KEM) and the papers below.',
     'Write down the three ML-KEM parameter sets and their key and ciphertext sizes.'],
    'you have a table of sizes from the standard.'),
   ('Time it on a laptop', 'Weeks 2 and 3',
    ['Build the Open Quantum Safe library (liboqs) and run its speed tests for ML-KEM.',
     'Record key generation, encapsulation and decapsulation times for each parameter set.'],
    'your laptop timings are in a table with the machine described.'),
   ('Repeat on a small board', 'Week 4',
    ['Build the same tests on a small board (for example a Raspberry Pi) and record the same timings.',
     'Count how many radio frames a key exchange needs at a typical IoT frame size.'],
    'one table compares laptop, board and frame counts.'),
  ]},
 'planned-blockchain': {
  'goal': 'A device registry on a permissioned blockchain, and a test of whether a traffic fingerprint catches a cloned device.',
  'steps': [
   ('Read the review', 'Week 1',
    ['Read our hybrid blockchain review and the papers below.',
     'Write down what a blockchain adds for device identity and what it does not solve.'],
    'you can explain why a valid credential alone does not prove the device is genuine.'),
   ('Set up the network', 'Weeks 2 and 3',
    ['Install Hyperledger Fabric and bring up its test network following the official tutorial.',
     'Write a smart contract (chaincode) that stores and reads a device record.'],
    'you can add a device record and read it back from the command line.'),
   ('Add a fingerprint and test a clone', 'Week 4',
    ['Extract a small traffic fingerprint with Scapy and store it in the device record.',
     'Simulate a cloned device that has the right credential but different traffic, and check whether your contract flags it.'],
    'one test shows the real device accepted and the clone flagged.'),
  ]},
 'planned-federated': {
  'goal': 'A federated intrusion detector across simulated sites, and a measured effect of one poisoned client.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below, starting with federated averaging.',
     'Write down how averaging works and how one bad client can pull the model.'],
    'you can describe a poisoning attack in two sentences.'),
   ('Simulate ten sites', 'Weeks 2 and 3',
    ['Follow the Flower quickstart, then switch it to simulation.',
     'Split CICIoT2023 across ten simulated sites and train a shared detector.'],
    'your federated model reaches a score close to one trained on all the data.'),
   ('Add a bad client', 'Week 4',
    ['Make one client send scaled or flipped updates.',
     'Compare mean and median aggregation with and without the bad client.'],
    'one chart shows accuracy over rounds for the four cases.'),
  ]},
 'planned-adversarial': {
  'goal': 'An attacked intrusion detector, and a comparison of what the attack achieves with and without realistic limits.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below, especially the one on attacks in the problem space.',
     'Explain in your own words why changing features freely is not a real attack.'],
    'you have a paragraph on feature space vs problem space.'),
   ('Train and attack', 'Weeks 2 and 3',
    ['Train a detector on CIC-IDS2017.',
     'Attack it with the Adversarial Robustness Toolbox (for example fast gradient or projected gradient methods) and record how many attacks are missed.'],
    'you have detection rate before and after the unconstrained attack.'),
   ('Attack under real limits', 'Week 4',
    ['List which features an attacker can really change (packet sizes and timing) and which follow from them.',
     'Repeat the attack changing only those, and compare.'],
    'one table compares no attack, unconstrained attack and realistic attack.'),
  ]},
 'planned-rf': {
  'goal': 'A radio fingerprinting classifier and a measured drop when it meets a new recording session.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below, starting with the radiometric signatures paper.',
     'Write down which hardware flaws make two radios of the same model look different.'],
    'you can name at least three such flaws.'),
   ('Look at the signals', 'Week 2',
    ['Download part of the ORACLE dataset.',
     'Plot constellations for two radios and compare them.'],
    'your plot shows a visible difference, or a note on why there is none.'),
   ('Train and test across sessions', 'Week 3',
    ['Train a classifier on one recording session and test it on the same session and on another.',
     'Record both accuracies.'],
    'one table shows same-session vs new-session accuracy.'),
   ('Plan your own recordings', 'Week 4',
    ['Work through the GNU Radio tutorials.',
     'Write a short plan for recording your own radios, cabled or in a shielded setup, without transmitting on licensed bands.'],
    'you have a one-page recording plan.'),
  ]},
 'planned-vprivacy': {
  'goal': 'A measured home-inference attack on public GPS traces, and the privacy and accuracy cost of two defenses.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below, starting with my dissertation.',
     'Note how each paper measures re-identification.'],
    'you have one definition of success for the attack.'),
   ('Guess homes', 'Weeks 2 and 3',
    ['Load GeoLife traces and split them into trips.',
     'GeoLife has no home labels, so define a reference for each user: the place where they spend the most night-time hours.',
     'Guess each user\'s home from trip start and end points alone, and check it against the reference.'],
    'you report how often the guess lands within a set distance of the reference, and you chose that distance before looking at the results.'),
   ('Defend and measure', 'Week 4',
    ['Add noise with OpenDP, or hide the first and last part of each trip.',
     'Measure how often the home guess still succeeds, and how much a simple traffic count changes.'],
    'one chart shows privacy against usefulness for each defense.'),
  ]},
 'planned-ev': {
  'goal': 'A simulated feeder under real charging load, a coordinated switching attack, and a list of the protocol messages that could trigger it.',
  'steps': [
   ('Read the papers', 'Week 1',
    ['Read the papers below.',
     'Note how large a coordinated load change has to be to matter for a distribution feeder.'],
    'you can explain the attack in three sentences.'),
   ('Build a day of charging load', 'Week 2',
    ['Download sessions for one site from ACN-Data (the site may ask you to register).',
     'Add up the power of overlapping sessions to build one day of charging load.'],
    'your plot shows load over the day.'),
   ('Put it on a feeder', 'Week 3',
    ['Attach that load to a pandapower test network.',
     'Run a power flow, then switch many chargers on or off at once and record voltages.'],
    'one chart shows voltages with normal and coordinated switching.'),
   ('Map the protocol', 'Week 4',
    ['Read the OCPP overview.',
     'List the messages that could start or stop many charging sessions at once, and who is allowed to send them.'],
    'you have a table of messages, senders and safeguards.'),
  ]},
 'planned-llmsoc': {
  'goal': 'A first test of whether a language model with context ranks security alerts better than severity alone.',
  'steps': [
   ('Read the studies', 'Week 1',
    ['Read the SOC analyst study and the papers below.',
     'Write down how analysts decide which alert to look at first.'],
    'you have a short list of what analysts weigh.'),
   ('Pick the alerts', 'Week 2',
    ['Set up the Boss of the SOC v3 data following its repository instructions.',
     'Pick twenty alerts whose outcome is known (real incident or not).'],
    'you have twenty alerts with labels in one file.'),
   ('Rank two ways', 'Week 3',
    ['Rank the alerts by severity.',
     'Rank them again with a language model that also sees retrieved context (related logs and asset notes).',
     'Count the real incidents in the top five of each ranking.'],
    'one table compares the two rankings.'),
   ('Label consistently', 'Week 4',
    ['Map each real incident to MITRE ATT&CK techniques.',
     'Check that the model\'s explanations name techniques that match your labels.'],
    'every incident has ATT&CK labels and a note on whether the model agreed.'),
  ]},
}


def _fmt(s):
    """Escape text, then turn `code` into <code>code</code>."""
    s = html.escape(s, quote=False)
    return re.sub(r'`([^`]+)`', r'<code>\1</code>', s)


def setup_html():
    out = ('<details class="setup">\n<summary>Before you start: setup for every project</summary>\n<ol class="setup-list">')
    for title, text in SETUP:
        out += f'<li><strong>{_fmt(title)}.</strong> {_fmt(text)}</li>'
    return out + '</ol>\n</details>\n'


def start_here_detailed(slug, RES, STARTS, fallback):
    """Drop-in for build_projects.start_here(slug). Keeps the existing Tools and data list."""
    d = DIRECTIONS.get(slug)
    if not d:
        return fallback(slug)
    res = STARTS[slug][1] if slug in STARTS else []
    n = len(d['steps'])
    out = ('<section class="start">\n<h2>Start here</h2>\n'
           f'<p class="muted">A first month for a student joining this work, in {n} steps. '
           'Do them in order: each one uses what the one before produced.</p>\n'
           f'<p class="goal"><strong>Goal for the month:</strong> {_fmt(d["goal"])}</p>\n')
    out += setup_html()
    out += '<ol class="steps steps-detailed">'
    for i, (title, when, actions, done) in enumerate(d['steps']):
        out += (f'<li><span class="sn">Step {i + 1} · {_fmt(when)}</span>'
                f'<strong class="st">{_fmt(title)}</strong><ul class="do">')
        out += ''.join(f'<li>{_fmt(a)}</li>' for a in actions)
        out += f'</ul><p class="done"><span>You are done when</span> {_fmt(done)}</p></li>'
    out += '</ol>\n'
    if res:
        out += '<h3>Tools and data</h3>\n<ul class="res">'
        for k in res:
            name, url, desc = RES[k]
            out += f'<li><a href="{url}">{name}</a><span>{desc}</span></li>'
        out += '</ul>\n'
    out += ('<p class="note">Finished the month? Email me your log, your figures and one paragraph on what you would do next. '
            'Writing it up? Follow the <a href="latex-overleaf.html">LaTeX and Overleaf guide</a> '
            'for templates, citations, figures and the checks to run before you submit.</p>\n</section>\n')
    return out
