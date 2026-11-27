// Live illustration "vpriv", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 25. Location privacy: noise and hidden trip ends against home linking and traffic counts
  demos.vpriv = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const MX = [20, 420], MY = [20, 270], G = 50, NC = 12;
    let seed = 11; const sr = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const homes = Array.from({ length: NC }, (_, i) => [MX[0] + 25 + (i % 4) * 34 + sr() * 10, MY[0] + 150 + Math.floor(i / 4) * 30 + sr() * 8]);
    const works = Array.from({ length: NC }, () => [MX[0] + 260 + sr() * 120, MY[0] + 20 + sr() * 90]);
    const routes = homes.map((h, i) => { const w = works[i], pts = []; const n1 = Math.ceil(Math.abs(w[0] - h[0]) / 12), n2 = Math.ceil(Math.abs(w[1] - h[1]) / 12);
      for (let k = 0; k <= n1; k++) pts.push([h[0] + (w[0] - h[0]) * k / n1, h[1]]); for (let k = 1; k <= n2; k++) pts.push([w[0], h[1] + (w[1] - h[1]) * k / n2]); return pts; });
    let sigma = 0, hide = false, curve = [], show = [];
    const report = (r, s) => { const out = []; r.forEach((p, k) => { if (hide && (Math.hypot(p[0] - r[0][0], p[1] - r[0][1]) < 40 || Math.hypot(p[0] - r[r.length - 1][0], p[1] - r[r.length - 1][1]) < 40)) return; out.push([p[0] + s * gauss(), p[1] + s * gauss()]); }); return out; };
    const cell = p => Math.floor((p[0] - MX[0]) / G) + 100 * Math.floor((p[1] - MY[0]) / G);
    const measure = s => {
      let link = 0, err = 0, tot = 0;
      for (let t = 0; t < 12; t++) {
        const truth = {}, seen = {};
        routes.forEach((r, i) => {
          r.forEach(p => { const c = cell(p); truth[c] = (truth[c] || 0) + 1; });
          const rep = report(r, s); rep.forEach(p => { const c = cell(p); seen[c] = (seen[c] || 0) + 1; });
          if (rep.length) { let b = -1, bd = 1e9; homes.forEach((h, j) => { const d = Math.hypot(h[0] - rep[0][0], h[1] - rep[0][1]); if (d < bd) { bd = d; b = j; } }); if (b === i) link++; }
        });
        for (const c of new Set([...Object.keys(truth), ...Object.keys(seen)])) { err += Math.abs((truth[c] || 0) - (seen[c] || 0)); tot += truth[c] || 0; }
      }
      return [link / (12 * NC), err / tot];
    };
    const recompute = () => { curve = []; for (let s = 0; s <= 60; s += 6) curve.push([s, ...measure(s)]); show = routes.map(r => report(r, sigma)); };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        rr(ctx, MX[0], MY[0], MX[1] - MX[0], MY[1] - MY[0], 8); ctx.fillStyle = C.soft; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1;
        for (let x = MX[0] + G; x < MX[1]; x += G) { ctx.beginPath(); ctx.moveTo(x, MY[0]); ctx.lineTo(x, MY[1]); ctx.stroke(); }
        for (let y = MY[0] + G; y < MY[1]; y += G) { ctx.beginPath(); ctx.moveTo(MX[0], y); ctx.lineTo(MX[1], y); ctx.stroke(); }
        txt(ctx, 'homes', MX[0] + 8, MY[1] - 8, { size: 11, color: C.mu }); txt(ctx, 'offices', MX[1] - 8, MY[0] + 14, { size: 11, color: C.mu, align: 'right' });
        ctx.strokeStyle = C.mu; ctx.globalAlpha = .35; ctx.lineWidth = 1.5; ctx.beginPath(); routes[0].forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.globalAlpha = 1;
        for (const h of homes) { ctx.fillStyle = C.c; ctx.beginPath(); ctx.moveTo(h[0], h[1] - 7); ctx.lineTo(h[0] + 6, h[1] - 1); ctx.lineTo(h[0] + 6, h[1] + 5); ctx.lineTo(h[0] - 6, h[1] + 5); ctx.lineTo(h[0] - 6, h[1] - 1); ctx.closePath(); ctx.fill(); }
        show.forEach((rep, i) => { ctx.fillStyle = i === 0 ? C.b : C.a; ctx.globalAlpha = i === 0 ? .95 : .45; for (const p of rep) { if (p[0] < MX[0] || p[0] > MX[1] || p[1] < MY[0] || p[1] > MY[1]) continue; ctx.beginPath(); ctx.arc(p[0], p[1], i === 0 ? 3 : 2.2, 0, 7); ctx.fill(); } }); ctx.globalAlpha = 1;
        // trade-off chart
        const X0 = 470, X1 = 700, Y0 = 34, Y1 = 214;
        txt(ctx, 'As the noise grows', X0, 22, { size: 12, color: C.mu });
        axes(ctx, X0, Y0, X1 - X0, Y1 - Y0);
        const xs = s => X0 + s / 60 * (X1 - X0), ys = v => Y1 - clamp(v, 0, 1) * (Y1 - Y0);
        for (const [k, col] of [[1, C.b], [2, C.a]]) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); curve.forEach((c, i) => i ? ctx.lineTo(xs(c[0]), ys(c[k])) : ctx.moveTo(xs(c[0]), ys(c[k]))); ctx.stroke(); }
        ctx.strokeStyle = C.fg; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(xs(sigma), Y0); ctx.lineTo(xs(sigma), Y1); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, '100%', X0 - 4, Y0 + 4, { size: 10, color: C.mu, align: 'right' }); txt(ctx, '0', X0 - 4, Y1 + 4, { size: 10, color: C.mu, align: 'right' });
        txt(ctx, 'noise (map units) →', X1, Y1 + 16, { size: 11, color: C.mu, align: 'right' });
        const cur = curve[Math.round(sigma / 6)];
        txt(ctx, `Trips linked to the right home: ${Math.round(cur[1] * 100)}%`, X0 - 20, Y1 + 40, { size: 12, w: 700, color: C.b });
        txt(ctx, `Traffic count error: ${Math.round(cur[2] * 100)}%`, X0 - 20, Y1 + 60, { size: 12, w: 700, color: C.a });
        out.textContent = `Noise ${sigma}${hide ? ', trip ends hidden' : ''}: ${Math.round(cur[1] * 100)}% of trips linked to the right home; traffic count error ${Math.round(cur[2] * 100)}%.`;
      }
    };
    slider(D.ctrl, 'Location noise', 0, 60, 6, sigma, v => { sigma = v; show = routes.map(r => report(r, sigma)); demo.draw(); });
    toggle(D.ctrl, 'Hide trip ends', hide, v => { hide = v; recompute(); demo.draw(); });
    button(D.ctrl, 'Resample', () => { recompute(); demo.draw(); });
    const out = readout(D.ctrl);
    recompute(); demo.draw();
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
