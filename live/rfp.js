// Live illustration "rfp", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 24. RF fingerprinting: four radios with small hardware flaws, named from a short burst
  demos.rfp = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const DEV = [{ e: .07, ph: .06, dc: [.05, -.03] }, { e: -.05, ph: -.08, dc: [-.04, .05] }, { e: .02, ph: .11, dc: [.06, .06] }, { e: -.08, ph: .01, dc: [-.06, -.05] }];
    const SYM = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(s => [s[0] / Math.SQRT2, s[1] / Math.SQRT2]);
    let snr = 20, N = 16, drift = false, acc = [], pts = [];
    const tx = (d, s) => [(1 + d.e) * s[0] + d.dc[0], (1 - d.e) * (s[1] + d.ph * s[0]) + d.dc[1]];
    const chan = (r, th, a) => [a * (r[0] * Math.cos(th) - r[1] * Math.sin(th)), a * (r[0] * Math.sin(th) + r[1] * Math.cos(th))];
    const enrol = DEV.map(d => SYM.map(s => tx(d, s)));
    const burst = (d, keep) => {
      const sig = Math.pow(10, -snr / 20) / Math.SQRT2, th = drift ? rnd(-.3, .3) : 0, a = drift ? rnd(.88, 1.12) : 1;
      const sum = SYM.map(() => [0, 0]), cnt = SYM.map(() => 0);
      for (let k = 0; k < N; k++) {
        const j = k % 4, r = chan(tx(d, SYM[j]), th, a), q = [r[0] + sig * gauss(), r[1] + sig * gauss()];
        sum[j][0] += q[0]; sum[j][1] += q[1]; cnt[j]++; if (keep) keep.push(q);
      }
      return sum.map((s, j) => [s[0] / cnt[j], s[1] / cnt[j]]);
    };
    const classify = f => { let best = 0, bd = 1e9; enrol.forEach((e, i) => { let dd = 0; e.forEach((c, j) => { dd += (c[0] - f[j][0]) ** 2 + (c[1] - f[j][1]) ** 2; }); if (dd < bd) { bd = dd; best = i; } }); return best; };
    const evaluate = () => {
      acc = DEV.map((d, i) => { let ok = 0; for (let t = 0; t < 40; t++) if (classify(burst(d)) === i) ok++; return ok / 40; });
      pts = DEV.map(d => { const k = []; for (let t = 0; t < 3; t++) burst(d, k); return k; });
    };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const cx = 150, cy = 150, S = 92, col = pal();
        rr(ctx, cx - 130, cy - 130, 260, 260, 8); ctx.fillStyle = C.soft; ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 125, cy); ctx.lineTo(cx + 125, cy); ctx.moveTo(cx, cy - 125); ctx.lineTo(cx, cy + 125); ctx.stroke();
        txt(ctx, 'I', cx + 118, cy - 6, { size: 11, color: C.mu }); txt(ctx, 'Q', cx + 6, cy - 116, { size: 11, color: C.mu });
        pts.forEach((k, i) => { ctx.fillStyle = col[i]; ctx.globalAlpha = .6; for (const q of k) { ctx.beginPath(); ctx.arc(cx + q[0] * S, cy - q[1] * S, 2.4, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; });
        enrol.forEach((e, i) => { ctx.strokeStyle = col[i]; ctx.lineWidth = 2; for (const c of e) { const x = cx + c[0] * S, y = cy - c[1] * S; ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke(); } });
        txt(ctx, 'crosses: enrolled fingerprint · dots: received now', cx, H - 4, { size: 11, color: C.mu, align: 'center' });
        const bx = 330, mean = acc.reduce((a, b) => a + b, 0) / 4;
        txt(ctx, 'Radio named correctly (40 bursts each)', bx, 30, { w: 700 });
        acc.forEach((v, i) => {
          const y = 52 + i * 38;
          txt(ctx, 'radio ' + (i + 1), bx, y + 15, { size: 12, color: col[i], w: 700 });
          rr(ctx, bx + 64, y, 260, 20, 5); ctx.fillStyle = C.soft; ctx.fill();
          rr(ctx, bx + 64, y, Math.max(2, 260 * v), 20, 5); ctx.fillStyle = col[i]; ctx.fill();
          txt(ctx, Math.round(v * 100) + '%', bx + 334, y + 15, { size: 12, mono: 1 });
        });
        const x25 = bx + 64 + 260 * .25; ctx.strokeStyle = C.mu; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x25, 46); ctx.lineTo(x25, 202); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, 'chance', x25, 214, { size: 11, color: C.mu, align: 'center' });
        const msg = `Average ${Math.round(mean * 100)}% at ${snr} dB with ${N}-symbol bursts.` + (drift ? ' The channel changed since enrollment, so the fingerprints blur together.' : mean > .9 ? ' The flaws are clear enough to tell the radios apart.' : ' Noise is starting to hide the flaws.');
        para(ctx, msg, bx, 242, W - bx - 16, 18, { size: 12, w: 600, color: drift || mean < .6 ? C.b : C.fg });
        out.textContent = msg;
      }
    };
    slider(D.ctrl, 'Signal quality (dB)', 0, 30, 1, snr, v => { snr = v; evaluate(); demo.draw(); });
    slider(D.ctrl, 'Symbols per burst', 4, 64, 4, N, v => { N = v; evaluate(); demo.draw(); });
    toggle(D.ctrl, 'Channel changed since enrollment', drift, v => { drift = v; evaluate(); demo.draw(); });
    button(D.ctrl, 'New bursts', () => { evaluate(); demo.draw(); });
    const out = readout(D.ctrl);
    evaluate(); demo.draw();
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
