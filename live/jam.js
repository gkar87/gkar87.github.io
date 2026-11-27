// Live illustration "jam", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 1. Find the jammer: two checkpoints, intersect the cars each one saw
  demos.jam = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const A = 200, B = 540, ZONE = 70, lanes = [110, 150, 190];
    let cars = [], jam = 0, seenA = null, seenB = null, n = 10, rings = 0;
    const reset = () => {
      cars = Array.from({ length: n }, (_, i) => ({ id: i + 1, x: rnd(-200, W - 60), lane: i % 3, v: rnd(.45, 1.05) }));
      jam = Math.floor(Math.random() * n); cars[jam].x = rnd(-120, 40); seenA = seenB = null;
    };
    const inView = cp => cars.filter(c => Math.abs(c.x - cp) < ZONE).map(c => c.id);
    const demo = {
      cv: D.cv,
      step() {
        rings = (rings + 1) % 100;
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
            for (const k of [0, 33, 66]) { const r = ((rings + k) % 100) / 100; ctx.globalAlpha = 1 - r; ctx.beginPath(); ctx.arc(c.x, y, 10 + r * 60, 0, 7); ctx.stroke(); }
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
