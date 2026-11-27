// Live illustration "ci", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 15. Is a one-point gap real? Confidence intervals vs test-set size
  demos.ci = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const P = [.91, .90], NAMES = ['hybrid quantum model', 'classical twin'];
    let lg = Math.log10(500), runs = [];
    const n = () => Math.round(10 ** lg);
    const wilson = (p, m) => { const z = 1.96, d = 1 + z * z / m, c = (p + z * z / (2 * m)) / d, h = z * Math.sqrt(p * (1 - p) / m + z * z / (4 * m * m)) / d; return [c - h, c + h]; };
    const run = () => { const m = n(); runs.push(P.map(p => { let k = 0; for (let i = 0; i < m; i++) if (Math.random() < p) k++; return k / m; })); if (runs.length > 14) runs.shift(); };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const lo = .82, hi = .99, px = 200, pw = 480, X = v => px + (clamp(v, lo, hi) - lo) / (hi - lo) * pw;
        for (let v = .84; v <= .985; v += .02) { ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(X(v), 36); ctx.lineTo(X(v), 200); ctx.stroke(); txt(ctx, Math.round(v * 100) + '%', X(v), 218, { align: 'center', size: 11, color: C.mu }); }
        const last = runs[runs.length - 1], m = n();
        P.forEach((p, i) => {
          const y = 70 + i * 80, col = i ? C.a : C.b;
          txt(ctx, NAMES[i], px - 12, y + 4, { align: 'right', size: 13, w: 600, color: col });
          for (const r of runs) { ctx.fillStyle = col; ctx.globalAlpha = .3; ctx.beginPath(); ctx.arc(X(r[i]), y + 26, 4, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
          if (last) { const [a, b] = wilson(last[i], m); ctx.fillStyle = col; ctx.globalAlpha = .25; rr(ctx, X(a), y - 8, X(b) - X(a), 16, 8); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(X(last[i]), y, 6, 0, 7); ctx.fillStyle = col; ctx.fill(); }
        });
        txt(ctx, 'bar: 95% interval for the latest run · faint dots: earlier runs', px, 24, { size: 12, color: C.mu });
        let msg = 'Run a test to measure both models.';
        if (last) {
          const [a0, b0] = wilson(last[0], m), [a1, b1] = wilson(last[1], m), over = a0 < b1 && a1 < b0;
          msg = over ? `With ${m.toLocaleString()} test samples the intervals overlap: this test cannot tell the two models apart.`
                     : `With ${m.toLocaleString()} test samples the intervals separate.`;
        }
        const need = Math.ceil(1.96 * 1.96 * (P[0] * (1 - P[0]) + P[1] * (1 - P[1])) / (P[0] - P[1]) ** 2);
        txt(ctx, msg, W / 2, 248, { align: 'center', size: 12, w: 600 });
        txt(ctx, `Rough test size for a 1-point gap to clear a 95% interval: about ${need.toLocaleString()} samples per model.`, W / 2, 270, { align: 'center', size: 12, color: C.mu });
        out.textContent = msg;
      }
    };
    button(D.ctrl, 'Run a new test', () => { run(); demo.draw(); });
    slider(D.ctrl, 'Test-set size (log scale)', 2, 4.3, .05, lg, v => { lg = v; runs = []; run(); demo.draw(); });
    const out = readout(D.ctrl);
    run(); demo.draw();
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
