// Live illustration "evc", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 26. EV charging: coordinated switching against a feeder, and a step detector
  demos.evc = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const N = 96, X0 = 56, X1 = 700, Y0 = 28, Y1 = 220;
    let share = .3, thr = .12, attack = true, base = [], load = [];
    const makeBase = () => { base = []; for (let i = 0; i < N; i++) { const h = i / 4; base.push(.18 + .1 * Math.exp(-((h - 8.5) ** 2) / 3) + .42 * Math.exp(-((h - 19) ** 2) / 5) + .02 * gauss()); } };
    const compute = () => { load = base.map((v, i) => { const h = i / 4; let a = 0; if (attack && h >= 17 && h < 20) a = (i % 2 ? 1 : -.5) * share * .9; return Math.max(0, v + a); }); };
    const flags = () => { const f = []; for (let i = 1; i < N; i++) if (Math.abs(load[i] - load[i - 1]) > thr) f.push(i); return f; };
    const xs = i => X0 + i / (N - 1) * (X1 - X0), ys = v => Y1 - clamp(v / 1.4, 0, 1) * (Y1 - Y0);
    const hh = i => { const m = i * 15; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        axes(ctx, X0, Y0, X1 - X0, Y1 - Y0);
        if (attack) { ctx.fillStyle = C.b; ctx.globalAlpha = .08; ctx.fillRect(xs(68), Y0, xs(80) - xs(68), Y1 - Y0); ctx.globalAlpha = 1; txt(ctx, 'attack window', xs(74), Y0 + 12, { size: 11, color: C.b, align: 'center' }); }
        ctx.strokeStyle = C.b; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, ys(1)); ctx.lineTo(X1, ys(1)); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, 'feeder limit', X0 + 6, ys(1) - 5, { size: 11, color: C.b });
        for (const t of [0, 6, 12, 18, 24]) txt(ctx, t + ':00', xs(Math.min(N - 1, t * 4)), Y1 + 16, { size: 11, color: C.mu, align: 'center' });
        ctx.save(); ctx.translate(X0 - 12, Y1); ctx.rotate(-Math.PI / 2); txt(ctx, 'charging load', 0, 0, { size: 11, color: C.mu }); ctx.restore();
        ctx.strokeStyle = C.a; ctx.lineWidth = 2.2; ctx.beginPath(); load.forEach((v, i) => i ? ctx.lineTo(xs(i), ys(v)) : ctx.moveTo(xs(i), ys(v))); ctx.stroke();
        const f = flags(); let over = 0, first = -1, fa = 0;
        load.forEach((v, i) => { if (v > 1) over++; });
        for (const i of f) { const inA = attack && i >= 68 && i <= 80; if (inA && first < 0) first = i; if (!inA) fa++;
          ctx.fillStyle = inA ? C.b : C.c; ctx.beginPath(); ctx.arc(xs(i), ys(load[i]), 5, 0, 7); ctx.fill(); }
        let msg = attack ? `Attacker switches ${Math.round(share * 100)}% of chargers together from 17:00. ` : 'A normal day. ';
        msg += over ? `Load is over the feeder limit in ${over} quarter-hours. ` : 'Load stays under the feeder limit. ';
        msg += attack ? (first >= 0 ? `Detector flags it at ${hh(first)}` : 'Detector misses the attack') : '';
        msg += (attack ? ', with ' : 'Detector raises ') + `${fa} false alarm${fa === 1 ? '' : 's'}${attack ? '' : ''}.`;
        para(ctx, msg, X0, Y1 + 40, X1 - X0, 17, { size: 12, w: 600, color: attack && first < 0 ? C.b : C.fg });
        out.textContent = msg;
      }
    };
    toggle(D.ctrl, 'Attack', attack, v => { attack = v; compute(); demo.draw(); });
    slider(D.ctrl, 'Chargers controlled', 0, .6, .05, share, v => { share = v; compute(); demo.draw(); });
    slider(D.ctrl, 'Alarm on a jump bigger than', .02, .4, .02, thr, v => { thr = v; demo.draw(); });
    button(D.ctrl, 'Another day', () => { makeBase(); compute(); demo.draw(); });
    const out = readout(D.ctrl);
    makeBase(); compute(); demo.draw();
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
