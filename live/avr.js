// Live illustration "avr", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 8. Seeing past the truck: share another car's sensor view
  demos.avr = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const top = 120, bot = 250, lane = [152, 218], ex = 100, ey = lane[1];
    let gap = 70, share = false, ob = { x: 560, y: lane[1] };
    const RANGE = 560, HALF = .42, TR = 260, THALF = .5;
    const truck = () => ({ x: ex + 34 + gap, y: lane[1] - 19, w: 110, h: 38 });
    const shadowed = (p, T) => {
      if (p.x <= T.x) return false;
      const a1 = Math.atan2(T.y - ey, T.x - ex), a2 = Math.atan2(T.y + T.h - ey, T.x - ex), a = Math.atan2(p.y - ey, p.x - ex);
      return a > a1 && a < a2;
    };
    const inCone = (p, ox, oy, r, half) => { const dx = p.x - ox, dy = p.y - oy; return dx > 0 && Math.hypot(dx, dy) < r && Math.abs(Math.atan2(dy, dx)) < half; };
    const state = () => {
      const T = truck(), own = inCone(ob, ex, ey, RANGE, HALF) && !shadowed(ob, T) && !(ob.x > T.x && ob.x < T.x + T.w && Math.abs(ob.y - ey) < 20);
      const viaT = inCone(ob, T.x + T.w, ey, TR, THALF);
      return { T, own, viaT, seen: own || (share && viaT) };
    };
    const demo = {
      cv: D.cv,
      draw() {
        const s = state(), T = s.T;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = C.line; ctx.fillRect(0, top, W, bot - top);
        ctx.strokeStyle = C.bg; ctx.lineWidth = 2; ctx.setLineDash([16, 12]); ctx.beginPath(); ctx.moveTo(0, 185); ctx.lineTo(W, 185); ctx.stroke(); ctx.setLineDash([]);
        // own sensor cone
        ctx.fillStyle = C.a; ctx.globalAlpha = .1; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.arc(ex, ey, RANGE, -HALF, HALF); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        // shadow behind the truck
        const far = W + 40, k1 = (T.y - ey) / (T.x - ex), k2 = (T.y + T.h - ey) / (T.x - ex);
        ctx.fillStyle = C.fg; ctx.globalAlpha = .16; ctx.beginPath(); ctx.moveTo(T.x, T.y); ctx.lineTo(far, ey + k1 * (far - ex)); ctx.lineTo(far, ey + k2 * (far - ex)); ctx.lineTo(T.x, T.y + T.h); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        if (share) { ctx.fillStyle = C.c; ctx.globalAlpha = .16; ctx.beginPath(); ctx.moveTo(T.x + T.w, ey); ctx.arc(T.x + T.w, ey, TR, -THALF, THALF); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
        // vehicles
        rr(ctx, ex - 26, ey - 13, 52, 26, 7); ctx.fillStyle = C.a; ctx.fill(); txt(ctx, 'you', ex, ey + 4, { align: 'center', w: 700, size: 12, color: C.bg });
        rr(ctx, T.x, T.y, T.w, T.h, 6); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.mu; ctx.lineWidth = 2; ctx.stroke();
        txt(ctx, 'truck', T.x + T.w / 2, ey + 5, { align: 'center', w: 700 });
        if (share) { ctx.strokeStyle = C.c; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(T.x + 20, T.y); ctx.quadraticCurveTo((ex + T.x) / 2, top - 30, ex, ey - 14); ctx.stroke(); ctx.setLineDash([]); txt(ctx, 'shared view', (ex + T.x) / 2 + 10, top - 14, { align: 'center', size: 12, color: C.c, w: 600 }); }
        rr(ctx, ob.x - 22, ob.y - 12, 44, 24, 6); ctx.fillStyle = s.seen ? C.b : C.bg; ctx.fill(); ctx.strokeStyle = C.b; ctx.lineWidth = 2; ctx.setLineDash(s.seen ? [] : [4, 4]); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, 'stopped', ob.x, ob.y + 4, { align: 'center', size: 11, w: 700, color: s.seen ? C.bg : C.b });
        let msg;
        if (s.own) msg = 'Your own sensors see the stopped car.';
        else if (s.seen) msg = 'Hidden from you, but seen through the truck\'s shared sensors.';
        else if (s.viaT) msg = 'Hidden behind the truck. Its sensors can see it: turn on sharing.';
        else msg = 'Nobody\'s sensors cover the stopped car from here.';
        txt(ctx, msg, W / 2, 40, { align: 'center', w: 600, color: s.seen ? C.fg : C.b });
        txt(ctx, 'Click the road to move the stopped car.', W / 2, 66, { align: 'center', size: 12, color: C.mu });
        txt(ctx, 'shaded: blocked from your view', 14, H - 14, { size: 12, color: C.mu });
        out.textContent = msg;
      }
    };
    slider(D.ctrl, 'Gap to the truck', 20, 220, 1, gap, v => { gap = v; demo.draw(); });
    toggle(D.ctrl, 'Share the truck\'s view', share, v => { share = v; demo.draw(); });
    D.cv.addEventListener('click', e => { const p = D.pos(e); ob = { x: clamp(p.x, 160, W - 26), y: p.y < 185 ? lane[0] : lane[1] }; demo.draw(); });
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
