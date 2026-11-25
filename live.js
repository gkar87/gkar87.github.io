// Live, interactive illustrations for the research pages.
// Each <figure class="live" data-demo="..."> gets a canvas demo. These are simplified
// teaching models of each idea; none of them reproduces data or results from a paper.
(() => {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = () => {
    const s = getComputedStyle(document.documentElement), g = k => s.getPropertyValue(k).trim();
    return { fg: g('--fg'), mu: g('--muted'), line: g('--line'), soft: g('--soft'), bg: g('--surface') || g('--bg'),
             a: g('--accent'), b: g('--accent-2'), c: g('--accent-3') };
  };
  let C = css();
  document.addEventListener('themechange', () => { C = css(); all.forEach(d => d.draw && d.draw()); });

  // ---------- small helpers
  function setup(fig) {
    const cv = fig.querySelector('canvas');
    const W = +cv.getAttribute('width'), H = +cv.getAttribute('height');
    const d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * d; cv.height = H * d;
    const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    const ctrl = fig.querySelector('.ctrl');
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
    return { cv, ctx, W, H, ctrl, pos };
  }
  function button(ctrl, text, fn) { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click', fn); ctrl.appendChild(b); return b; }
  function slider(ctrl, text, min, max, step, val, fn) {
    const l = document.createElement('label'); l.textContent = text + ' ';
    const i = document.createElement('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val;
    i.addEventListener('input', () => fn(+i.value)); l.appendChild(i); ctrl.appendChild(l); return i;
  }
  function readout(ctrl) { const p = document.createElement('span'); p.className = 'read'; p.setAttribute('aria-live', 'polite'); ctrl.appendChild(p); return p; }
  function txt(ctx, s, x, y, o = {}) {
    ctx.font = `${o.w || 500} ${o.size || 13}px ${o.mono ? 'ui-monospace,SFMono-Regular,Menlo,monospace' : 'system-ui,-apple-system,Segoe UI,sans-serif'}`;
    ctx.fillStyle = o.color || C.fg; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic'; ctx.fillText(s, x, y);
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  // a play/pause pair for demos that move on their own (moving content must be pausable)
  function loop(demo, ctrl) {
    let on = !reduce, raf = 0, vis = true, inView = true;
    const b = button(ctrl, on ? 'Pause' : 'Play', () => { on = !on; b.textContent = on ? 'Pause' : 'Play'; kick(); });
    const tick = () => { raf = 0; if (!on || !vis) return; demo.step(); demo.draw(); raf = requestAnimationFrame(tick); };
    const kick = () => { if (!raf && on && vis) raf = requestAnimationFrame(tick); };
    const sync = () => { vis = inView && !document.hidden; kick(); };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; sync(); }).observe(demo.cv);
    document.addEventListener('visibilitychange', sync);
    kick();
    return { kick, playing: () => on };
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  const demos = {};

  // ======================================================================
  // 1. Find the jammer: two checkpoints, intersect the cars each one saw
  demos.jam = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const A = 200, B = 540, ZONE = 70, lanes = [110, 150, 190];
    let cars = [], jam = 0, seenA = null, seenB = null, n = 10, rings = 0;
    const reset = () => {
      cars = Array.from({ length: n }, (_, i) => ({ id: i + 1, x: rnd(-200, W - 60), lane: i % 3, v: rnd(.7, 1.7) }));
      jam = Math.floor(Math.random() * n); cars[jam].x = rnd(-120, 40); seenA = seenB = null;
    };
    const inView = cp => cars.filter(c => Math.abs(c.x - cp) < ZONE).map(c => c.id);
    const demo = {
      cv: D.cv,
      step() {
        rings = (rings + 1) % 60;
        for (const c of cars) { c.x += c.v; if (c.x > W + 40) { c.x = -60; if (c === cars[jam]) { seenA = seenB = null; } } }
        const j = cars[jam];
        if (!seenA && Math.abs(j.x - A) < 8) seenA = inView(A);
        if (!seenB && Math.abs(j.x - B) < 8) seenB = inView(B);
      },
      draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = C.line; ctx.fillRect(0, 88, W, 124);
        ctx.strokeStyle = C.bg; ctx.setLineDash([14, 12]); ctx.lineWidth = 2;
        for (const y of [130, 170]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        ctx.setLineDash([]);
        for (const [cp, name, seen] of [[A, 'Checkpoint A', seenA], [B, 'Checkpoint B', seenB]]) {
          ctx.fillStyle = seen ? C.b : C.a; ctx.globalAlpha = .1; ctx.fillRect(cp - ZONE, 88, 2 * ZONE, 124); ctx.globalAlpha = 1;
          ctx.fillStyle = seen ? C.b : C.a; ctx.fillRect(cp - 3, 40, 6, 48);
          ctx.beginPath(); ctx.arc(cp, 36, 9, 0, 7); ctx.fill();
          txt(ctx, name, cp, 22, { align: 'center', w: 600 });
          txt(ctx, seen ? 'saw: ' + seen.join(', ') : 'listening…', cp, 238, { align: 'center', mono: 1, color: seen ? C.b : C.mu });
        }
        for (const c of cars) {
          const y = lanes[c.lane], isJ = c === cars[jam];
          if (isJ) {
            ctx.strokeStyle = C.b;
            for (const k of [0, 20, 40]) { const r = ((rings + k) % 60) / 60; ctx.globalAlpha = 1 - r; ctx.beginPath(); ctx.arc(c.x, y, 10 + r * 60, 0, 7); ctx.stroke(); }
            ctx.globalAlpha = 1;
          }
          rr(ctx, c.x - 20, y - 11, 40, 22, 6); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.mu; ctx.lineWidth = 1.5; ctx.stroke();
          txt(ctx, String(c.id), c.x, y + 4, { align: 'center', w: 700, size: 12 });
        }
        let msg;
        if (seenA && seenB) {
          const both = seenA.filter(x => seenB.includes(x));
          msg = both.length === 1 ? `Seen by both: car ${both[0]}. That is the jammer.`
              : `Seen by both: cars ${both.join(', ')}. They drove together; a third checkpoint would separate them.`;
        } else msg = seenA ? 'Checkpoint A heard interference. Waiting for B…' : 'Waiting for interference at checkpoint A…';
        txt(ctx, msg, W / 2, H - 22, { align: 'center', w: 600, color: seenA && seenB ? C.b : C.fg });
        out.textContent = msg;
      }
    };
    const L = loop(demo, D.ctrl);
    button(D.ctrl, 'New traffic', () => { reset(); demo.draw(); L.kick(); });
    slider(D.ctrl, 'Cars', 4, 18, 1, n, v => { n = v; reset(); demo.draw(); });
    const out = readout(D.ctrl);
    reset(); demo.draw();
    return demo;
  };

  // ======================================================================
  // 2. Keystroke ranging: time difference between a phone's two microphones
  demos.tdoa = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'], P = 19, S = 2.3; // key pitch in mm, pixels per mm
    const offs = [0, 4.75, 14.25];                                       // row stagger in mm
    const keys = [];
    rows.forEach((r, i) => [...r].forEach((k, j) => keys.push({ k, x: offs[i] + j * P + P / 2, y: i * P + P / 2 })));
    const kbW = 10 * P, ox = (W - kbW * S) / 2, oy = 34;
    const phone = { x0: kbW / 2 - 70, x1: kbW / 2 + 70, y: 3 * P + 42 };    // two mics 140 mm apart, 42 mm below the keys
    const m1 = { x: phone.x0, y: phone.y }, m2 = { x: phone.x1, y: phone.y };
    const dd = k => Math.hypot(k.x - m1.x, k.y - m1.y) - Math.hypot(k.x - m2.x, k.y - m2.y);
    let sel = null, t = 1, tol = 3;
    const px = (x, y) => [ox + x * S, oy + y * S];
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const target = sel ? dd(sel) : null;
        for (const k of keys) {
          const [x, y] = px(k.x - P / 2 + 1, k.y - P / 2 + 1);
          const same = sel && Math.abs(dd(k) - target) <= tol;
          rr(ctx, x, y, (P - 2) * S, (P - 2) * S, 6);
          ctx.fillStyle = k === sel ? C.b : same ? C.c : C.bg; ctx.globalAlpha = same && k !== sel ? .35 : 1; ctx.fill(); ctx.globalAlpha = 1;
          ctx.strokeStyle = C.line; ctx.lineWidth = 1.2; ctx.stroke();
          txt(ctx, k.k, x + (P - 2) * S / 2, y + (P - 2) * S / 2 + 5, { align: 'center', w: 600, color: k === sel ? C.bg : C.fg });
        }
        const [p0x, py] = px(phone.x0 - 8, phone.y - 6), pw = (140 + 16) * S;
        rr(ctx, p0x, py, pw, 12 * S, 10); ctx.fillStyle = C.soft; ctx.fill(); ctx.strokeStyle = C.mu; ctx.stroke();
        txt(ctx, 'phone', p0x + pw / 2, py + 6 * S + 5, { align: 'center', color: C.mu });
        for (const [m, name] of [[m1, 'mic 1'], [m2, 'mic 2']]) {
          const [x, y] = px(m.x, m.y); ctx.fillStyle = C.a; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
          txt(ctx, name, x, y + 30, { align: 'center', size: 12, color: C.mu });
        }
        if (sel) {
          const [sx, sy] = px(sel.x, sel.y), R = t * 220 * S;
          ctx.strokeStyle = C.b; ctx.lineWidth = 2;
          for (const k of [0, .12, .24]) { const r = Math.max(0, R - k * 220 * S); if (r > 0) { ctx.globalAlpha = Math.max(0, 1 - t); ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke(); } }
          ctx.globalAlpha = 1;
          const d1 = Math.hypot(sel.x - m1.x, sel.y - m1.y), d2 = Math.hypot(sel.x - m2.x, sel.y - m2.y);
          const us = (d1 - d2) / 343 * 1000;                     // mm / (mm per µs): speed of sound 343 m/s = 0.343 mm/µs
          const same = keys.filter(k => k !== sel && Math.abs(dd(k) - target) <= tol).map(k => k.k);
          out.textContent = `Key ${sel.k}: ${d1.toFixed(0)} mm to mic 1, ${d2.toFixed(0)} mm to mic 2, so the sound reaches mic ${us < 0 ? 1 : 2} first by ${Math.abs(us).toFixed(0)} µs (${(Math.abs(us) / 20.83).toFixed(1)} samples at 48 kHz). ` +
            (same.length ? `Keys with nearly the same difference: ${same.join(' ')}.` : 'No other key has nearly the same difference.');
        } else out.textContent = 'Click a key, or type while this figure has focus.';
      },
      step() { t = Math.min(1, t + .02); }
    };
    const press = k => { sel = k; t = 0; animate(); };
    let raf = 0;
    const animate = () => { if (reduce) { t = 1; demo.draw(); return; } cancelAnimationFrame(raf); const f = () => { demo.step(); demo.draw(); if (t < 1) raf = requestAnimationFrame(f); }; f(); };
    D.cv.tabIndex = 0;
    D.cv.addEventListener('click', e => { const p = D.pos(e); const k = keys.find(k => { const [x, y] = px(k.x - P / 2, k.y - P / 2); return p.x >= x && p.x <= x + P * S && p.y >= y && p.y <= y + P * S; }); if (k) press(k); });
    D.cv.addEventListener('keydown', e => { const k = keys.find(k => k.k === e.key.toUpperCase()); if (k) { e.preventDefault(); press(k); } });
    slider(D.ctrl, 'Timing error the attacker can tolerate (mm)', 1, 8, 1, tol, v => { tol = v; demo.draw(); });
    const out = readout(D.ctrl);
    demo.draw();
    return demo;
  };

  // ======================================================================
  // 3. One packet, which device? Nearest-centroid on four header fields
  demos.packet = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    // illustrative header profiles, not measurements from any dataset
    const devs = [
      { n: 'Camera', f: [64, 29200, 1400, 1] },
      { n: 'Thermostat', f: [255, 4096, 120, 0] },
      { n: 'Smart plug', f: [128, 8192, 90, 0] },
      { n: 'Speaker', f: [64, 65535, 600, 1] }
    ];
    const F = ['TTL', 'TCP window', 'Length', 'DF flag'], scale = [255, 65535, 1500, 1];
    let noise = .08, pkt = null, guess = null, truth = null, ok = 0, tot = 0, dist = [];
    const send = i => {
      truth = i ?? Math.floor(Math.random() * devs.length);
      pkt = devs[truth].f.map((v, k) => k === 3 ? (Math.random() < noise * 2 ? 1 - v : v)
        : Math.max(0, Math.min(scale[k], Math.round(v + gauss() * noise * scale[k]))));
      dist = devs.map(d => Math.sqrt(d.f.reduce((s, v, k) => s + ((v - pkt[k]) / scale[k]) ** 2, 0)));
      guess = dist.indexOf(Math.min(...dist)); tot++; if (guess === truth) ok++;
      demo.draw();
    };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        txt(ctx, 'Packet header', 24, 30, { w: 700 });
        F.forEach((f, k) => {
          const x = 24 + k * 118; rr(ctx, x, 44, 108, 58, 8); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
          txt(ctx, f, x + 54, 64, { align: 'center', size: 12, color: C.mu });
          txt(ctx, pkt ? String(pkt[k]) : '–', x + 54, 90, { align: 'center', mono: 1, w: 700, size: 15, color: C.a });
        });
        txt(ctx, 'Distance to each device profile (shorter is a better match)', 24, 136, { w: 700 });
        const max = Math.max(.001, ...dist, .5);
        devs.forEach((d, i) => {
          const y = 152 + i * 34;
          txt(ctx, d.n, 24, y + 16, { size: 13 });
          ctx.fillStyle = C.line; rr(ctx, 120, y + 4, 330, 16, 8); ctx.fill();
          if (pkt) { ctx.fillStyle = i === guess ? (guess === truth ? C.c : C.b) : C.a; ctx.globalAlpha = i === guess ? 1 : .45; rr(ctx, 120, y + 4, Math.max(8, 330 * dist[i] / max), 16, 8); ctx.fill(); ctx.globalAlpha = 1; }
          if (pkt && i === truth) txt(ctx, 'sent it', 462, y + 16, { size: 12, color: C.mu });
        });
        const msg = pkt ? `${devs[truth].n} sent the packet; the classifier says ${devs[guess].n}${guess === truth ? ' (right)' : ' (wrong)'}. Running score: ${ok} of ${tot} correct.`
                        : 'Pick a device to send one packet.';
        txt(ctx, pkt ? (guess === truth ? 'Identified' : 'Confused') : '', W - 24, 30, { align: 'right', w: 700, color: guess === truth ? C.c : C.b });
        out.textContent = msg;
      }
    };
    devs.forEach((d, i) => button(D.ctrl, d.n, () => send(i)));
    button(D.ctrl, 'Random device', () => send());
    slider(D.ctrl, 'Network noise', 0, .3, .01, noise, v => { noise = v; ok = tot = 0; });
    const out = readout(D.ctrl);
    demo.draw();
    return demo;
  };

  // ======================================================================
  // 4. Angle encoding on one qubit: a feature becomes a rotation, measurement gives probabilities
  demos.qubit = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    let x = .3, phi = 0, shots = null, anim = 0;
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const th = Math.PI * x + phi, cx = 150, cy = 150, R = 105;
        ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
        ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, '|0⟩', cx, cy - R - 10, { align: 'center', w: 700 }); txt(ctx, '|1⟩', cx, cy + R + 22, { align: 'center', w: 700 });
        const ex = cx + R * Math.sin(th), ey = cy - R * Math.cos(th);
        ctx.strokeStyle = C.b; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(ex, ey, 7, 0, 7); ctx.fill();
        ctx.strokeStyle = C.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + th, th < 0); ctx.stroke();
        txt(ctx, 'θ = ' + (th * 180 / Math.PI).toFixed(0) + '°', cx + 36, cy - 8, { color: C.a, w: 600 });
        const p0 = Math.cos(th / 2) ** 2, p1 = 1 - p0;
        txt(ctx, 'Probability of each measurement', 330, 46, { w: 700 });
        [[p0, '|0⟩ benign'], [p1, '|1⟩ attack']].forEach(([p, l], i) => {
          const y = 70 + i * 48; txt(ctx, l, 330, y + 16, { size: 13 });
          ctx.fillStyle = C.line; rr(ctx, 430, y + 2, 250, 20, 10); ctx.fill();
          ctx.fillStyle = i ? C.b : C.a; rr(ctx, 430, y + 2, Math.max(4, 250 * p), 20, 10); ctx.fill();
          txt(ctx, (p * 100).toFixed(1) + '%', 690, y + 17, { mono: 1, w: 700, size: 13 });
        });
        txt(ctx, `P(|0⟩) = cos²(θ/2) = ${p0.toFixed(3)}`, 330, 190, { mono: 1, size: 13, color: C.mu });
        if (shots) {
          const k = Math.round(shots.k * Math.min(1, anim));
          txt(ctx, `${shots.n} shots on a simulated qubit: ${k} read |1⟩`, 330, 226, { w: 600, size: 13 });
          ctx.fillStyle = C.line; rr(ctx, 330, 238, 360, 14, 7); ctx.fill();
          ctx.fillStyle = C.b; rr(ctx, 330, 238, Math.max(4, 360 * k / shots.n), 14, 7); ctx.fill();
        }
        out.textContent = `Feature ${x.toFixed(2)} becomes a rotation of ${(th * 180 / Math.PI).toFixed(0)} degrees; the qubit reads |1⟩ with probability ${(p1 * 100).toFixed(1)}%.` +
          (shots ? ` In ${shots.n} shots it read |1⟩ ${shots.k} times.` : '');
      }
    };
    slider(D.ctrl, 'Input feature (scaled 0 to 1)', 0, 1, .01, x, v => { x = v; shots = null; demo.draw(); });
    slider(D.ctrl, 'Trainable rotation', -1.57, 1.57, .01, phi, v => { phi = v; shots = null; demo.draw(); });
    button(D.ctrl, 'Measure 200 shots', () => {
      const p1 = Math.sin((Math.PI * x + phi) / 2) ** 2; let k = 0; for (let i = 0; i < 200; i++) if (Math.random() < p1) k++;
      shots = { n: 200, k }; anim = reduce ? 1 : 0;
      const f = () => { anim += .05; demo.draw(); if (anim < 1) requestAnimationFrame(f); }; f();
    });
    const out = readout(D.ctrl);
    demo.draw();
    return demo;
  };

  // ======================================================================
  // 5. Explaining one prediction: exact additive contributions of a toy linear (logistic) model
  demos.shap = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    // toy model with invented weights; for a linear model with independent features each
    // feature's SHAP value in log-odds is w * (x - mean), which is what the bars show
    const f = [
      { n: 'Overtime hours per week', min: 0, max: 20, step: 1, mean: 5, w: .16, v: 12 },
      { n: 'Years at the company', min: 0, max: 20, step: 1, mean: 6, w: -.11, v: 2 },
      { n: 'Job satisfaction (1 to 4)', min: 1, max: 4, step: 1, mean: 2.7, w: -.7, v: 2 },
      { n: 'Commute (km)', min: 0, max: 50, step: 1, mean: 15, w: .03, v: 30 }
    ];
    const base = -1.6, sig = z => 1 / (1 + Math.exp(-z));
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const contrib = f.map(q => q.w * (q.v - q.mean));
        const z = base + contrib.reduce((a, b) => a + b, 0);
        txt(ctx, 'How much each input pushed this prediction (log-odds)', 24, 28, { w: 700 });
        const mid = 470, sc = 70;
        ctx.strokeStyle = C.mu; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(mid, 40); ctx.lineTo(mid, 40 + f.length * 40); ctx.stroke(); ctx.setLineDash([]);
        const order = contrib.map((c, i) => i).sort((a, b) => Math.abs(contrib[b]) - Math.abs(contrib[a]));
        order.forEach((i, r) => {
          const y = 46 + r * 40, c = contrib[i];
          txt(ctx, `${f[i].n} = ${f[i].v}`, 24, y + 18, { size: 13 });
          ctx.fillStyle = c > 0 ? C.b : C.a; rr(ctx, c > 0 ? mid : mid + c * sc, y + 4, Math.max(2, Math.abs(c) * sc), 20, 5); ctx.fill();
          txt(ctx, (c > 0 ? '+' : '') + c.toFixed(2), c > 0 ? mid + c * sc + 6 : mid + c * sc - 6, y + 19, { align: c > 0 ? 'left' : 'right', mono: 1, size: 12 });
        });
        const p = sig(z), pb = sig(base);
        txt(ctx, `Average employee: ${(pb * 100).toFixed(0)}% risk.  This employee: ${(p * 100).toFixed(0)}% risk of leaving.`, 24, H - 20, { w: 700, color: p > .5 ? C.b : C.fg });
        out.textContent = `Predicted risk ${(p * 100).toFixed(0)}% against an average of ${(pb * 100).toFixed(0)}%. Largest push: ${f[order[0]].n} (${contrib[order[0]] > 0 ? 'raises' : 'lowers'} the risk).`;
      }
    };
    f.forEach(q => slider(D.ctrl, q.n, q.min, q.max, q.step, q.v, v => { q.v = v; demo.draw(); }));
    const out = readout(D.ctrl);
    demo.draw();
    return demo;
  };

  // ======================================================================
  // 6. GNSS spoofing: compare GPS with dead reckoning from wheel speed and steering
  demos.gnss = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    let t = 0, track = [], drift = 0, spoof = false, rate = .25, thr = 12, over = 0, alarm = false, falseAlarm = 0;
    const road = s => ({ x: 30 + s * 4.4, y: 110 + 50 * Math.sin(s / 22) });
    const reset = () => { t = 0; track = []; drift = 0; over = 0; alarm = false; falseAlarm = 0; };
    const demo = {
      cv: D.cv,
      step() {
        t += .5; if (t > 150) reset();
        const truth = road(t);
        const dr = { x: truth.x + gauss() * 1.2 + t * .02, y: truth.y + gauss() * 1.2 };  // dead reckoning: small noise and slow drift
        if (spoof) drift += rate;
        const gps = { x: truth.x + gauss() * 2.2, y: truth.y + gauss() * 2.2 + drift };
        const res = Math.hypot(gps.x - dr.x, gps.y - dr.y);
        over = res > thr ? over + 1 : 0;
        const nowAlarm = over >= 6;
        if (nowAlarm && !alarm && !spoof) falseAlarm++;
        alarm = nowAlarm;
        track.push({ truth, dr, gps, res, alarm });
      },
      draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = C.line; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
        for (let s = 0; s <= 150; s += 2) { const p = road(s); s ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); ctx.lineCap = 'butt';
        const path = (k, col, dash) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash || []); ctx.beginPath(); track.forEach((q, i) => i ? ctx.lineTo(q[k].x, q[k].y) : ctx.moveTo(q[k].x, q[k].y)); ctx.stroke(); ctx.setLineDash([]); };
        path('dr', C.a); path('gps', C.b, [5, 4]);
        const last = track[track.length - 1];
        if (last) { ctx.fillStyle = C.a; ctx.beginPath(); ctx.arc(last.dr.x, last.dr.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(last.gps.x, last.gps.y, 5, 0, 7); ctx.fill(); }
        txt(ctx, '— wheel speed + steering', 24, 24, { color: C.a, size: 12, w: 600 }); txt(ctx, '- - GPS', 200, 24, { color: C.b, size: 12, w: 600 });
        // residual plot
        const y0 = 210, h = 70; ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.strokeRect(24, y0, W - 48, h);
        const ymax = 60, Y = r => y0 + h - Math.min(r, ymax) / ymax * h;
        ctx.strokeStyle = C.mu; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(24, Y(thr)); ctx.lineTo(W - 24, Y(thr)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = C.c; ctx.lineWidth = 1.6; ctx.beginPath(); track.forEach((q, i) => { const x = 24 + i / 300 * (W - 48); i ? ctx.lineTo(x, Y(q.res)) : ctx.moveTo(x, Y(q.res)); }); ctx.stroke();
        txt(ctx, 'gap between the two (m)', 30, y0 + 14, { size: 11, color: C.mu }); txt(ctx, 'alarm threshold', W - 30, Y(thr) - 4, { size: 11, color: C.mu, align: 'right' });
        txt(ctx, alarm ? 'SPOOFING ALARM' : 'consistent', W - 24, 24, { align: 'right', w: 700, color: alarm ? C.b : C.c });
        out.textContent = (spoof ? 'Spoofer active: the GPS fix is being pulled away. ' : 'No spoofer. ') +
          (alarm ? 'Alarm raised.' : 'No alarm.') + (falseAlarm ? ` False alarms so far: ${falseAlarm}.` : '');
      }
    };
    loop(demo, D.ctrl);
    const sb = button(D.ctrl, 'Start spoofing', () => { spoof = !spoof; if (!spoof) drift = 0; sb.textContent = spoof ? 'Stop spoofing' : 'Start spoofing'; sb.classList.toggle('on', spoof); demo.draw(); });
    slider(D.ctrl, 'Spoofer pull', .05, .8, .05, rate, v => { rate = v; });
    slider(D.ctrl, 'Alarm threshold (m)', 4, 40, 1, thr, v => { thr = v; demo.draw(); });
    const out = readout(D.ctrl);
    for (let i = 0; i < 40; i++) demo.step();
    demo.draw();
    return demo;
  };

  // ======================================================================
  // 7. In-vehicle bus: periodic frames, an injector breaks the rhythm
  demos.can = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    // illustrative identifiers and periods (milliseconds), not taken from any real vehicle
    const ids = [{ id: '0x0C9', n: 'engine', p: 10 }, { id: '0x0F1', n: 'brakes', p: 20 }, { id: '0x1E5', n: 'steering', p: 25 }, { id: '0x3C1', n: 'body', p: 50 }];
    let now = 0, frames = [], last = {}, inject = false, flagged = 0, total = 0, win = 300;
    ids.forEach(q => { last[q.id] = -q.p; q.next = Math.random() * q.p; });
    const demo = {
      cv: D.cv,
      step() {
        now += 1;
        for (const q of ids) if (now >= q.next) { push(q.id, false); q.next = now + q.p * (1 + (Math.random() - .5) * .06); }
        if (inject && Math.random() < .5) push('0x0C9', true);
        frames = frames.filter(f => now - f.t < win);
      },
      draw() {
        ctx.clearRect(0, 0, W, H);
        const x0 = 110, x1 = W - 20, rowH = 44, X = t => x1 - (now - t) / win * (x1 - x0);
        ids.forEach((q, i) => {
          const y = 34 + i * rowH; txt(ctx, q.id, 20, y + 6, { mono: 1, w: 700, size: 13 }); txt(ctx, q.n, 20, y + 22, { size: 11, color: C.mu });
          ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(x0, y + 8); ctx.lineTo(x1, y + 8); ctx.stroke();
        });
        for (const f of frames) {
          const i = ids.findIndex(q => q.id === f.id), y = 34 + i * rowH;
          ctx.fillStyle = f.bad ? C.b : C.a; ctx.globalAlpha = f.bad ? 1 : .75; rr(ctx, X(f.t) - 3, y - 2, 6, 20, 2); ctx.fill(); ctx.globalAlpha = 1;
        }
        txt(ctx, `${win} ms of bus traffic, newest on the right`, x0, H - 14, { size: 11, color: C.mu });
        const recent = frames.filter(f => f.bad).length;
        txt(ctx, recent ? 'INTRUSION: messages arriving too fast' : 'timing normal', W - 20, H - 14, { align: 'right', w: 700, color: recent ? C.b : C.c });
        out.textContent = `Frames checked: ${total}. Flagged as arriving faster than their usual period: ${flagged}.`;
      }
    };
    function push(id, injected) {
      const q = ids.find(q => q.id === id), gap = now - last[id];
      const bad = gap < q.p * .5;                 // the detector: much faster than this identifier's usual period
      last[id] = now; total++; if (bad) flagged++;
      frames.push({ id, t: now, bad, injected });
    }
    loop(demo, D.ctrl);
    const ib = button(D.ctrl, 'Plug in an injector', () => { inject = !inject; ib.textContent = inject ? 'Unplug the injector' : 'Plug in an injector'; ib.classList.toggle('on', inject); });
    button(D.ctrl, 'Reset counts', () => { flagged = total = 0; demo.draw(); });
    const out = readout(D.ctrl);
    for (let i = 0; i < win; i++) demo.step();
    demo.draw();
    return demo;
  };

  // ---------- start every demo on the page
  const all = [];
  document.querySelectorAll('figure.live[data-demo]').forEach(fig => {
    const make = demos[fig.dataset.demo];
    if (!make || !fig.querySelector('canvas').getContext) return;
    try { all.push(make(fig)); } catch (e) { fig.querySelector('.ctrl').textContent = 'This illustration could not start in your browser.'; }
  });
})();
