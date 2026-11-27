// Live illustration "shap", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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

  // ======================================================================
  // 5. Explaining one prediction: exact additive contributions of a toy linear (logistic) model
  demos.shap = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    // toy model with invented weights; for a linear model with independent features each
    // feature's SHAP value in log-odds is w * (x - mean); the waterfall adds them up step by step
    const f = [
      { n: 'Overtime hours per week', min: 0, max: 20, step: 1, mean: 5, w: .16, v: 12 },
      { n: 'Years at the company', min: 0, max: 20, step: 1, mean: 6, w: -.11, v: 2 },
      { n: 'Job satisfaction (1 to 4)', min: 1, max: 4, step: 1, mean: 2.7, w: -.7, v: 2 },
      { n: 'Commute (km)', min: 0, max: 50, step: 1, mean: 15, w: .03, v: 30 }
    ];
    const base = -1.6, sig = z => 1 / (1 + Math.exp(-z)), logit = p => Math.log(p / (1 - p));
    const pct = z => Math.round(sig(z) * 100) + '%';
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const contrib = f.map(q => q.w * (q.v - q.mean));
        const order = contrib.map((c, i) => i).sort((a, b) => Math.abs(contrib[b]) - Math.abs(contrib[a]));
        const z = base + contrib.reduce((a, b) => a + b, 0);
        const L = 300, R = 696, lo = logit(.01), hi = logit(.99), top = 20, rh = 38, bottom = top + rh * (f.length + 2);
        const X = v => L + (clamp(v, lo, hi) - lo) / (hi - lo) * (R - L);
        for (const p of [.02, .1, .25, .5, .75, .9, .98]) {
          const x = X(logit(p)); ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
          txt(ctx, Math.round(p * 100) + '%', x, bottom + 16, { align: 'center', size: 11, color: C.mu, mono: 1 });
        }
        txt(ctx, 'risk of leaving →', R, bottom + 34, { align: 'right', size: 12, color: C.mu });
        const lab = (s, x, y, right, o) => txt(ctx, s, right ? x + 7 : x - 7, y, { align: right ? 'left' : 'right', size: 12, mono: 1, ...o });
        let cur = base, y = top;
        txt(ctx, 'Average employee', 20, y + 23, { w: 700 });
        ctx.fillStyle = C.mu; rr(ctx, X(base) - 4, y + 6, 8, 24, 4); ctx.fill();
        lab(pct(base), X(base) + 4, y + 23, true, { color: C.mu });
        y += rh;
        for (const i of order) {
          const c = contrib[i], nx = cur + c, a = X(cur), b = X(nx);
          txt(ctx, `${f[i].n} = ${f[i].v}`, 20, y + 23, { size: 13 });
          ctx.strokeStyle = C.mu; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(a, y - rh + 30); ctx.lineTo(a, y + 6); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = c > 0 ? C.b : C.a; rr(ctx, Math.min(a, b), y + 6, Math.max(3, Math.abs(b - a)), 24, 5); ctx.fill();
          const right = c > 0 ? b < R - 44 : b < L + 44;
          lab((c > 0 ? 'up to ' : 'down to ') + pct(nx), right ? Math.max(a, b) : Math.min(a, b), y + 23, right, { color: c > 0 ? C.b : C.a });
          cur = nx; y += rh;
        }
        ctx.strokeStyle = C.mu; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(z), y - rh + 30); ctx.lineTo(X(z), y + 6); ctx.stroke(); ctx.setLineDash([]);
        const p = sig(z);
        txt(ctx, 'This employee', 20, y + 23, { w: 700 });
        ctx.fillStyle = p > .5 ? C.b : C.c; rr(ctx, X(z) - 5, y + 4, 10, 28, 5); ctx.fill();
        lab(pct(z), X(z) + 5, y + 23, X(z) < R - 44, { w: 700, size: 14, color: p > .5 ? C.b : C.c });
        out.textContent = `Predicted risk ${pct(z)} against an average of ${pct(base)}. Largest push: ${f[order[0]].n} (${contrib[order[0]] > 0 ? 'raises' : 'lowers'} the risk).`;
      }
    };
    f.forEach(q => slider(D.ctrl, q.n, q.min, q.max, q.step, q.v, v => { q.v = v; demo.draw(); }));
    const out = readout(D.ctrl);
    demo.draw();
    return demo;
  };

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

  // ---------- start every demo on the page
  const all = [];
  document.querySelectorAll('figure.live[data-demo]').forEach(fig => {
    const make = demos[fig.dataset.demo];
    if (!make || !fig.querySelector('canvas').getContext) return;
    try { all.push(make(fig)); } catch (e) { fig.querySelector('.ctrl').textContent = 'This illustration could not start in your browser.'; }
  });
})();
