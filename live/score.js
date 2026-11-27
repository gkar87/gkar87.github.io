// Live illustration "score", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 9. Score a trip: harsh events from in-vehicle acceleration
  demos.score = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const N = 240, DT = .5, PX = 20, PW = 500;
    let style = .35, thr = 3, sp = [], ac = [], cur = 0, hold = 0;
    const trip = () => {
      sp = []; ac = []; let v = 0, a = 1.5;
      for (let i = 0; i < N; i++) {
        a += -a * .15 + gauss() * (.25 + style * .9);
        if (Math.random() < .015 + style * .05) a = (Math.random() < .55 ? -1 : 1) * (2 + style * 3 + Math.random());
        if (v < 4 && a < 0) a = Math.abs(a) * .5;
        if (v > 33 && a > 0) a = -.3;
        v = clamp(v + a * DT, 0, 36); ac.push(a); sp.push(v);
      }
      cur = 0; hold = 0;
    };
    const events = upto => { const ev = []; for (let i = 1; i < upto; i++) if (Math.abs(ac[i]) > thr && Math.abs(ac[i - 1]) <= thr) ev.push(i); return ev; };
    const demo = {
      cv: D.cv,
      step() { if (cur < N) cur++; else if (++hold > 120) trip(); },
      draw() {
        ctx.clearRect(0, 0, W, H);
        const ev = events(cur), score = Math.max(0, 100 - 8 * ev.length), xs = i => PX + i * PW / (N - 1);
        // speed panel
        txt(ctx, 'speed', PX, 22, { size: 12, color: C.mu });
        axes(ctx, PX, 28, PW, 90);
        ctx.strokeStyle = C.a; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < cur; i++) { const y = 118 - sp[i] / 36 * 86; i ? ctx.lineTo(xs(i), y) : ctx.moveTo(xs(i), y); } ctx.stroke();
        // acceleration panel
        const ay = 205, sc = 14;
        txt(ctx, 'acceleration (m/s²)', PX, 140, { size: 12, color: C.mu });
        ctx.fillStyle = C.b; ctx.globalAlpha = .1; ctx.fillRect(PX, 148, PW, ay - thr * sc - 148); ctx.fillRect(PX, ay + thr * sc, PW, 262 - ay - thr * sc); ctx.globalAlpha = 1;
        ctx.strokeStyle = C.mu; ctx.setLineDash([5, 5]); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(PX, ay - s * thr * sc); ctx.lineTo(PX + PW, ay - s * thr * sc); ctx.stroke(); } ctx.setLineDash([]);
        ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(PX, ay); ctx.lineTo(PX + PW, ay); ctx.stroke();
        ctx.strokeStyle = C.fg; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let i = 0; i < cur; i++) { const y = clamp(ay - ac[i] * sc, 150, 260); i ? ctx.lineTo(xs(i), y) : ctx.moveTo(xs(i), y); } ctx.stroke();
        for (const i of ev) { ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(xs(i), clamp(ay - ac[i] * sc, 150, 260), 6, 0, 7); ctx.fill(); }
        txt(ctx, `harsh-event line: ±${thr.toFixed(1)} m/s²`, PX + PW, 140, { size: 12, color: C.mu, align: 'right' });
        txt(ctx, 'time →', PX + PW, H - 12, { size: 12, color: C.mu, align: 'right' });
        // score ring
        const cx = 620, cy = 112, r = 58;
        ctx.lineWidth = 12; ctx.strokeStyle = C.line; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
        ctx.strokeStyle = score > 70 ? C.c : score > 40 ? C.a : C.b; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + score / 100 * 2 * Math.PI); ctx.stroke();
        txt(ctx, String(score), cx, cy + 10, { align: 'center', size: 32, w: 700 });
        txt(ctx, 'trip score', cx, cy + 30, { align: 'center', size: 12, color: C.mu });
        const brakes = ev.filter(i => ac[i] < 0).length;
        txt(ctx, `${brakes} harsh brake${brakes === 1 ? '' : 's'}`, cx, 210, { align: 'center', size: 13 });
        txt(ctx, `${ev.length - brakes} harsh start${ev.length - brakes === 1 ? '' : 's'}`, cx, 230, { align: 'center', size: 13 });
        if (cur >= N) {
          const badge = ev.length === 0 ? 'Badge: smooth trip' : ev.length <= 2 ? 'Badge: nearly smooth' : 'Tip: ease off the pedals';
          rr(ctx, cx - 78, 246, 156, 28, 14); ctx.fillStyle = ev.length <= 2 ? C.c : C.soft; ctx.fill();
          txt(ctx, badge, cx, 265, { align: 'center', size: 12, w: 700, color: ev.length <= 2 ? C.bg : C.fg });
        }
        out.textContent = `${cur >= N ? 'Trip over' : 'Driving'}: ${ev.length} harsh event${ev.length === 1 ? '' : 's'}, score ${score}`;
      }
    };
    demo.speed = 0.5;   // calm, readable pace
    const L = loop(demo, D.ctrl);
    button(D.ctrl, 'New trip', () => { trip(); demo.draw(); L.kick(); });
    slider(D.ctrl, 'Driving style: calm to aggressive', 0, 1, .05, style, v => { style = v; trip(); demo.draw(); L.kick(); });
    slider(D.ctrl, 'Harsh-event line', 1.5, 5, .1, thr, v => { thr = v; demo.draw(); });
    const out = readout(D.ctrl);
    trip(); cur = reduce ? N : 0; demo.draw();
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
