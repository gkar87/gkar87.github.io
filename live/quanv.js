// Live illustration "quanv", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 10. A quanvolution window sliding over a spectrum
  demos.quanv = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const M = 64, PX = 30, PW = 660;
    let k = 4, cls = 0, noise = false, pos = 0, raw = [], v = [], vr = [], feat = [];
    const make = () => {
      const peaks = cls ? [[.18, .5], [.44, .9], [.62, .35], [.8, .6]] : [[.18, .5], [.38, .7], [.62, .8], [.86, .45]];
      raw = Array.from({ length: 320 }, (_, i) => { const x = i / 319; let y = .08 + .1 * x; for (const [c, h] of peaks) y += h * Math.exp(-((x - c) ** 2) / .0004); return y + (noise ? gauss() * .05 : 0); });
      vr = Array.from({ length: M }, (_, j) => { let s = 0; for (let q = 0; q < 5; q++) s += raw[j * 5 + q] || 0; return s / 5; });
      const mx = Math.max(...vr), mn = Math.min(...vr); v = vr.map(y => (y - mn) / (mx - mn || 1));
      feat = []; for (let j = 0; j + k <= M; j++) feat.push(v.slice(j, j + k).reduce((p, y) => p * Math.cos(Math.PI * y), 1));
      pos = pos % feat.length;
    };
    const demo = {
      cv: D.cv,
      step() { pos = (pos + 1) % feat.length; },
      draw() {
        ctx.clearRect(0, 0, W, H);
        const xs = j => PX + (j * 5 + 2) * PW / 319;
        txt(ctx, `Raman spectrum, sample ${cls ? 'B' : 'A'} (made up)`, PX, 20, { size: 12, color: C.mu });
        ctx.fillStyle = C.a; ctx.globalAlpha = .14; ctx.fillRect(xs(pos) - 5, 28, xs(pos + k - 1) - xs(pos) + 10, 110); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.a; ctx.lineWidth = 2; ctx.beginPath();
        raw.forEach((y, i) => { const X = PX + i * PW / 319, Y = 136 - clamp(y, 0, 1.2) * 88; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
        for (let q = 0; q < k; q++) { ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(xs(pos + q), 136 - clamp(vr[pos + q], 0, 1.2) * 88, 3.5, 0, 7); ctx.fill(); }
        txt(ctx, '400', PX, 152, { size: 11, color: C.mu }); txt(ctx, 'Raman shift (cm⁻¹)', PX + PW / 2, 152, { size: 11, color: C.mu, align: 'center' }); txt(ctx, '1800', PX + PW, 152, { size: 11, color: C.mu, align: 'right' });
        // qubit dials
        const dx = 70, d0 = 40;
        txt(ctx, 'each point → one qubit, rotated by π × value', d0 - 10, 176, { size: 12, color: C.mu });
        for (let q = 0; q < k; q++) {
          const cx = d0 + q * dx + 14, cy = 214, th = Math.PI * v[pos + q];
          ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.stroke();
          ctx.strokeStyle = C.b; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 20 * Math.sin(th), cy - 20 * Math.cos(th)); ctx.stroke();
          txt(ctx, 'q' + q, cx, cy + 36, { align: 'center', size: 11, color: C.mu, mono: 1 });
        }
        // feature map
        const fx = 390, fw = 300, bw = fw / feat.length;
        txt(ctx, 'quanvolution output ⟨Z⊗…⊗Z⟩ per window', fx, 176, { size: 12, color: C.mu });
        ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(fx, 226); ctx.lineTo(fx + fw, 226); ctx.stroke();
        feat.forEach((f, j) => { ctx.fillStyle = j === pos ? C.b : C.a; ctx.globalAlpha = j === pos ? 1 : .55; ctx.fillRect(fx + j * bw, 226 - Math.max(0, f) * 40, Math.max(1, bw - 1), Math.abs(f) * 40); ctx.globalAlpha = 1; });
        const f = feat[pos];
        txt(ctx, `window ${pos + 1} of ${feat.length}: output ${f.toFixed(2)}`, fx, 290, { size: 12, mono: 1 });
        txt(ctx, 'product of cos(π·value) over the window', d0 - 10, 290, { size: 12, color: C.mu });
        out.textContent = `Window ${pos + 1}: output ${f.toFixed(2)}`;
      }
    };
    const L = loop(demo, D.ctrl);
    choice(D.ctrl, 'Sample', ['A', 'B'], 0, i => { cls = i; make(); demo.draw(); });
    slider(D.ctrl, 'Window (points)', 2, 6, 1, k, x => { k = x; make(); demo.draw(); });
    toggle(D.ctrl, 'Add measurement noise', noise, x => { noise = x; make(); demo.draw(); });
    const out = readout(D.ctrl);
    make(); demo.draw();
    // slow the sweep to a readable pace
    const st = demo.step; let t = 0; demo.step = () => { if (++t % 22 === 0) st(); };
    L.kick();
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
