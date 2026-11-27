// Live illustration "adv", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
    // steps run on a clock, not per screen frame, so a 120 Hz screen does not play twice as fast;
    // demo.speed (default 1) sets steps per second as a share of 60
    let last = 0, acc = 0;
    const tick = ts => {
      raf = 0; if (!on || !vis) { last = 0; return; }
      const hz = 60 * (demo.speed || 1);
      if (last) acc += Math.min(.1, (ts - last) / 1000); last = ts;
      let n = 0; while (acc >= 1 / hz && n < 4) { demo.step(); acc -= 1 / hz; n++; }
      if (n) demo.draw();
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && on && vis) { last = 0; raf = requestAnimationFrame(tick); } };
    const sync = () => { vis = inView && !document.hidden; kick(); };
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; sync(); }).observe(demo.cv);
    document.addEventListener('visibilitychange', sync);
    kick();
    return { kick, playing: () => on };
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  const demos = {};

  // ---------- more helpers for the second set of demos
  function setOn(b, on) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function toggle(ctrl, text, on, fn) { const b = button(ctrl, text, () => { on = !on; setOn(b, on); fn(on); }); setOn(b, on); return b; }
  function choice(ctrl, label, opts, idx, fn) {
    const g = document.createElement('span'); g.className = 'seg'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', label);
    const t = document.createElement('span'); t.className = 'segl'; t.textContent = label; g.appendChild(t); ctrl.appendChild(g);
    const bs = opts.map((o, i) => button(g, o, () => { bs.forEach((b, j) => setOn(b, j === i)); fn(i); }));
    bs.forEach((b, j) => setOn(b, j === idx)); return bs;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pal = () => [C.a, C.b, C.c, C.mu];
  // wrap text by an estimated character width (canvas measureText is avoided so the demos stay cheap)
  function para(ctx, s, x, y, maxW, lh, o = {}) {
    const per = Math.max(8, Math.floor(maxW / ((o.size || 13) * .56))); let line = '', yy = y;
    for (const w of s.split(' ')) { if (line && (line + w).length > per) { txt(ctx, line.trim(), x, yy, o); line = ''; yy += lh; } line += w + ' '; }
    if (line) txt(ctx, line.trim(), x, yy, o); return yy;
  }
  function axes(ctx, x, y, w, h) { ctx.strokeStyle = C.mu; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke(); }

  // ======================================================================
  // 23. Evasion: move one attack flow across a linear detector, with or without realistic constraints
  demos.adv = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const PX = [56, 396], PY = [24, 252];
    let seed = 7; const sr = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const sg = () => { let u = sr() || .5, v = sr(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const benign = Array.from({ length: 40 }, () => [clamp(.56 + .13 * sg(), .02, .98), clamp(.3 + .11 * sg(), .02, .98)]);
    const flood = Array.from({ length: 22 }, () => [clamp(.24 + .07 * sg(), .02, .98), clamp(.76 + .07 * sg(), .02, .98)]);
    const DET = [{ w: [-1, 1.4], b: -.15, name: 'standard detector' }, { w: [-.6, 1.6], b: -.3, name: 'adversarially trained detector' }];
    const MINRATE = .6, X0P = [.25, .72];
    let real = true, hard = false, p = X0P.slice(), path = [p.slice()], state = 'idle', raf = 0;
    const det = () => DET[hard ? 1 : 0];
    const score = q => { const d = det(); return d.w[0] * q[0] + d.w[1] * q[1] + d.b; };
    const P = q => [PX[0] + q[0] * (PX[1] - PX[0]), PY[1] - q[1] * (PY[1] - PY[0])];
    const stepOnce = () => {
      const d = det(), n = Math.hypot(d.w[0], d.w[1]);
      let q = [p[0] - .012 * d.w[0] / n, p[1] - .012 * d.w[1] / n];
      if (real) q = [clamp(Math.max(q[0], p[0]), 0, 1), clamp(Math.max(q[1], MINRATE), 0, 1)];
      else q = [clamp(q[0], 0, 1), clamp(q[1], 0, 1)];
      const moved = Math.hypot(q[0] - p[0], q[1] - p[1]);
      p = q; path.push(p.slice());
      if (score(p) < -.02) state = 'evaded'; else if (moved < 1e-4 || path.length > 150) state = 'held';
    };
    const run = () => {
      p = X0P.slice(); path = [p.slice()]; state = 'running';
      if (reduce) { while (state === 'running') stepOnce(); demo.draw(); return; }
      let lt = 0; const t = ts => { raf = 0; if (ts - lt >= 40) { lt = ts; stepOnce(); demo.draw(); } if (state === 'running') raf = requestAnimationFrame(t); };
      if (!raf) raf = requestAnimationFrame(t);
    };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        rr(ctx, PX[0], PY[0], PX[1] - PX[0], PY[1] - PY[0], 6); ctx.fillStyle = C.soft; ctx.fill();
        if (real) { const a = P([X0P[0], 1]), b = P([1, MINRATE]); ctx.fillStyle = C.c; ctx.globalAlpha = .12; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.globalAlpha = 1;
          txt(ctx, 'still a working flood', b[0] - 6, b[1] - 6, { size: 11, color: C.c, align: 'right', w: 600 }); }
        // boundary: w0 x + w1 y + b = 0
        const d = det(), yAt = x => -(d.w[0] * x + d.b) / d.w[1];
        const a = P([0, yAt(0)]), b = P([1, yAt(1)]);
        ctx.save(); ctx.beginPath(); ctx.rect(PX[0], PY[0], PX[1] - PX[0], PY[1] - PY[0]); ctx.clip();
        ctx.strokeStyle = C.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
        txt(ctx, 'flagged as attack', PX[0] + 8, PY[0] + 16, { size: 11, color: C.b, w: 600 });
        txt(ctx, 'passed as normal', PX[1] - 8, PY[1] - 8, { size: 11, color: C.a, w: 600, align: 'right' });
        let fa = 0;
        for (const q of benign) { const s = P(q), f = score(q) > 0; if (f) fa++; ctx.fillStyle = C.a; ctx.globalAlpha = .75; ctx.beginPath(); ctx.arc(s[0], s[1], 4, 0, 7); ctx.fill(); ctx.globalAlpha = 1; if (f) { ctx.strokeStyle = C.b; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s[0], s[1], 7, 0, 7); ctx.stroke(); } }
        for (const q of flood) { const s = P(q); ctx.fillStyle = C.b; ctx.globalAlpha = .55; ctx.fillRect(s[0] - 3.5, s[1] - 3.5, 7, 7); ctx.globalAlpha = 1; }
        ctx.strokeStyle = C.b; ctx.lineWidth = 2; ctx.beginPath(); path.forEach((q, i) => { const s = P(q); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke();
        const s = P(p); ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(s[0], s[1], 8, 0, 7); ctx.fill(); ctx.strokeStyle = C.bg; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, 'packet size →', PX[1], PY[1] + 20, { size: 11, color: C.mu, align: 'right' });
        ctx.save(); ctx.translate(PX[0] - 12, PY[0]); ctx.rotate(-Math.PI / 2); txt(ctx, 'packets per second →', 0, 0, { size: 11, color: C.mu, align: 'right' }); ctx.restore();
        // panel
        const bx = 420; let y = 40;
        txt(ctx, det().name[0].toUpperCase() + det().name.slice(1), bx, y, { w: 700 }); y += 22;
        txt(ctx, `Normal flows flagged: ${fa} of ${benign.length}`, bx, y, { size: 12, color: fa > 2 ? C.b : C.mu }); y += 20;
        y = para(ctx, real ? 'Attacker may only pad packets and must keep the rate high.' : 'Attacker may change any feature.', bx, y, W - bx - 16, 17, { size: 12, color: C.mu }) + 32;
        let msg;
        if (state === 'idle') msg = 'Press "Attacker tries to evade" to move the red flow toward the normal side.';
        else if (state === 'running') msg = 'Searching for a way across…';
        else if (state === 'evaded') msg = p[1] < MINRATE ? 'It crossed, but only by slowing down below what the flood needs. The attack would no longer work, so this evasion overstates the risk.' : 'It crossed with padding alone, and the flood still works. A real evasion.';
        else msg = 'It could not cross while staying a working flood. The detector held.';
        para(ctx, msg, bx, y, W - bx - 16, 19, { size: 13, w: 600, color: state === 'evaded' && p[1] >= MINRATE ? C.b : C.fg });
        out.textContent = msg + ` ${fa} of ${benign.length} normal flows flagged.`;
      }
    };
    button(D.ctrl, 'Attacker tries to evade', run);
    toggle(D.ctrl, 'Realistic constraints', real, v => { real = v; p = X0P.slice(); path = [p.slice()]; state = 'idle'; demo.draw(); });
    toggle(D.ctrl, 'Adversarial training', hard, v => { hard = v; p = X0P.slice(); path = [p.slice()]; state = 'idle'; demo.draw(); });
    const out = readout(D.ctrl);
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
