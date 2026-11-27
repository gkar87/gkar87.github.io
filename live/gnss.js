// Live illustration "gnss", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 6. GNSS spoofing: compare GPS with dead reckoning from wheel speed and steering
  demos.gnss = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    let t = 0, track = [], drift = 0, spoof = false, rate = .25, thr = 12, over = 0, alarm = false, falseAlarm = 0;
    const road = s => ({ x: 30 + s * 4.4, y: 110 + 50 * Math.sin(s / 22) });
    const reset = () => { t = 0; track = []; drift = 0; over = 0; alarm = false; falseAlarm = 0; };
    const demo = {
      cv: D.cv,
      step() {
        t += .5; if (t > 150) reset();
        const truth = road(t);
        const dr = { x: truth.x + gauss() * 1.2 + t * .02, y: truth.y + gauss() * 1.2 };  // dead reckoning: small noise and slow drift
        if (spoof) drift += rate;
        const gps = { x: truth.x + gauss() * 2.2, y: truth.y + gauss() * 2.2 + drift };
        const res = Math.hypot(gps.x - dr.x, gps.y - dr.y);
        over = res > thr ? over + 1 : 0;
        const nowAlarm = over >= 6;
        if (nowAlarm && !alarm && !spoof) falseAlarm++;
        alarm = nowAlarm;
        track.push({ truth, dr, gps, res, alarm });
      },
      draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = C.line; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
        for (let s = 0; s <= 150; s += 2) { const p = road(s); s ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); ctx.lineCap = 'butt';
        const path = (k, col, dash) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash || []); ctx.beginPath(); track.forEach((q, i) => i ? ctx.lineTo(q[k].x, q[k].y) : ctx.moveTo(q[k].x, q[k].y)); ctx.stroke(); ctx.setLineDash([]); };
        path('dr', C.a); path('gps', C.b, [5, 4]);
        const last = track[track.length - 1];
        if (last) { ctx.fillStyle = C.a; ctx.beginPath(); ctx.arc(last.dr.x, last.dr.y, 6, 0, 7); ctx.fill(); ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(last.gps.x, last.gps.y, 5, 0, 7); ctx.fill(); }
        txt(ctx, '— wheel speed + steering', 24, 24, { color: C.a, size: 12, w: 600 }); txt(ctx, '- - GPS', 200, 24, { color: C.b, size: 12, w: 600 });
        // residual plot
        const y0 = 210, h = 70; ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.strokeRect(24, y0, W - 48, h);
        const ymax = 60, Y = r => y0 + h - Math.min(r, ymax) / ymax * h;
        ctx.strokeStyle = C.mu; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(24, Y(thr)); ctx.lineTo(W - 24, Y(thr)); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = C.c; ctx.lineWidth = 1.6; ctx.beginPath(); track.forEach((q, i) => { const x = 24 + i / 300 * (W - 48); i ? ctx.lineTo(x, Y(q.res)) : ctx.moveTo(x, Y(q.res)); }); ctx.stroke();
        txt(ctx, 'gap between the two (m)', 30, y0 + 14, { size: 11, color: C.mu }); txt(ctx, 'alarm threshold', W - 30, Y(thr) - 4, { size: 11, color: C.mu, align: 'right' });
        txt(ctx, alarm ? 'SPOOFING ALARM' : 'consistent', W - 24, 24, { align: 'right', w: 700, color: alarm ? C.b : C.c });
        out.textContent = (spoof ? 'Spoofer active: the GPS fix is being pulled away. ' : 'No spoofer. ') +
          (alarm ? 'Alarm raised.' : 'No alarm.') + (falseAlarm ? ` False alarms so far: ${falseAlarm}.` : '');
      }
    };
    demo.speed = 0.6;   // calm, readable pace
    loop(demo, D.ctrl);
    const sb = button(D.ctrl, 'Start spoofing', () => { spoof = !spoof; if (!spoof) drift = 0; sb.textContent = spoof ? 'Stop spoofing' : 'Start spoofing'; sb.classList.toggle('on', spoof); demo.draw(); });
    slider(D.ctrl, 'Spoofer pull', .05, .8, .05, rate, v => { rate = v; });
    slider(D.ctrl, 'Alarm threshold (m)', 4, 40, 1, thr, v => { thr = v; demo.draw(); });
    const out = readout(D.ctrl);
    for (let i = 0; i < 40; i++) demo.step();
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
