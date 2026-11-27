// Live illustration "leak", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 14. A shortcut in the data: random split vs split by time
  demos.leak = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const ND = 4, PER = 40;
    let bunch = .9, bytime = false, data = [];
    const make = () => {
      data = [];
      for (let d = 0; d < ND; d++) for (let i = 0; i < PER; i++) {
        const day = Math.random() < bunch ? d * 7 + Math.random() * 7 : Math.random() * 28;
        data.push({ d, day, beh: d + gauss() * 1.1 });
      }
      data.forEach(p => { p.rtest = Math.random() < .3; });
    };
    const split = () => data.map(p => ({ ...p, test: bytime ? p.day >= 21 : p.rtest }));
    const acc = (pts, key) => {
      const tr = pts.filter(p => !p.test), te = pts.filter(p => p.test); let ok = 0;
      for (const q of te) { let b = null, bd = 1e9; for (const p of tr) { const dd = Math.abs(p[key] - q[key]); if (dd < bd) { bd = dd; b = p; } } if (b && b.d === q.d) ok++; }
      return te.length ? ok / te.length : 0;
    };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const pts = split(), px = 40, pw = 400, py = 30, ph = 220;
        axes(ctx, px, py, pw, ph);
        if (bytime) { ctx.fillStyle = C.b; ctx.globalAlpha = .08; ctx.fillRect(px + 21 / 28 * pw, py, 7 / 28 * pw, ph); ctx.globalAlpha = 1; txt(ctx, 'test', px + 24.5 / 28 * pw, py + 14, { align: 'center', size: 12, color: C.b, w: 600 }); }
        for (const p of pts) {
          const x = px + p.day / 28 * pw, y = py + ph - (p.beh + 3) / (ND + 5) * ph;
          ctx.strokeStyle = ctx.fillStyle = pal()[p.d]; ctx.beginPath(); ctx.arc(x, clamp(y, py + 3, py + ph - 3), 3.6, 0, 7); p.test ? (ctx.lineWidth = 1.5, ctx.stroke()) : ctx.fill();
        }
        txt(ctx, 'capture day →', px + pw, py + ph + 18, { align: 'right', size: 12, color: C.mu });
        txt(ctx, 'behavior feature', px, py - 10, { size: 12, color: C.mu });
        txt(ctx, 'filled: train, hollow: test, color: device', px, H - 6, { size: 12, color: C.mu });
        const a1 = acc(pts, 'day'), a2 = acc(pts, 'beh'), bx = 480, bw = 210;
        txt(ctx, 'test accuracy of a 1-nearest-neighbor model', bx, 40, { size: 12, color: C.mu });
        for (const [i, lab, a, col] of [[0, 'using only capture day', a1, C.b], [1, 'using the behavior feature', a2, C.a]]) {
          const y = 70 + i * 74;
          txt(ctx, lab, bx, y, { size: 13 });
          ctx.fillStyle = C.line; ctx.fillRect(bx, y + 10, bw, 18); ctx.fillStyle = col; ctx.fillRect(bx, y + 10, bw * a, 18);
          txt(ctx, Math.round(a * 100) + '%', bx + bw + 6, y + 24, { size: 13, w: 700, mono: 1 });
        }
        ctx.strokeStyle = C.mu; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(bx + bw / ND, 74); ctx.lineTo(bx + bw / ND, 222); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, 'chance', bx + bw / ND, 236, { align: 'center', size: 11, color: C.mu });
        const msg = !bytime && a1 > a2 + .15 ? `Random split: the capture day alone scores ${Math.round(a1 * 100)}%. That is a shortcut, not device behavior.`
          : bytime && a1 < a2 ? `Split by time: the capture-day shortcut falls to ${Math.round(a1 * 100)}%; behavior holds at ${Math.round(a2 * 100)}%.`
          : `${bytime ? 'Split by time' : 'Random split'}: day ${Math.round(a1 * 100)}%, behavior ${Math.round(a2 * 100)}%.`;
        para(ctx, msg, bx, 258, W - bx - 10, 16, { size: 12, w: 600 });
        out.textContent = msg;
      }
    };
    choice(D.ctrl, 'Split', ['Random', 'By time'], 0, i => { bytime = i === 1; demo.draw(); });
    slider(D.ctrl, 'How bunched captures are in time', 0, 1, .05, bunch, v => { bunch = v; make(); demo.draw(); });
    button(D.ctrl, 'New dataset', () => { make(); demo.draw(); });
    const out = readout(D.ctrl);
    make(); demo.draw();
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
