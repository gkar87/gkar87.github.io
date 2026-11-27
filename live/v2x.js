// Live illustration "v2x", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 13. A ghost vehicle in V2X messages, and three ways to catch it
  demos.v2x = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const lane = [120, 165, 210], CAM = [330, 520], RADAR = 170;
    let cars = [], ego, ghost, crude = true, chk = { phys: true, cam: true, radar: false }, t = 0, flags = new Set(), lastG = null;
    const reset = () => {
      ego = { x: 60, l: 1, v: 1 };
      cars = [{ x: 260, l: 0, v: 1.15 }, { x: 480, l: 2, v: .8 }, { x: 640, l: 0, v: .95 }];
      ghost = { off: 230 }; flags = new Set(); lastG = null; t = 0;
    };
    const wrap = x => ((x % (W + 80)) + W + 80) % (W + 80) - 40;
    const demo = {
      cv: D.cv,
      step() {
        t++; ego.x = wrap(ego.x + ego.v); for (const c of cars) c.x = wrap(c.x + c.v);
        ghost.off = Math.max(60, 230 - (t % 560) * .32);                   // claims to brake hard in front of you
        if (crude && t % 50 === 0) ghost.jump = (Math.random() < .5 ? -1 : 1) * rnd(60, 110);
        if (!crude || t % 50 === 6) ghost.jump = 0;
        const rel = ghost.off + (ghost.jump || 0), gx = wrap(ego.x + rel);            // reported position, relative to you
        if (lastG !== null && chk.phys && Math.abs(rel - lastG) > 12) flags.add('motion check');
        if (chk.cam && gx > CAM[0] && gx < CAM[1]) flags.add('roadside camera');
        if (chk.radar && rel < RADAR) flags.add('your radar');
        lastG = rel; ghost.x = gx;
        if (t % 560 === 0) { flags = new Set(); lastG = null; }
      },
      draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = C.line; ctx.fillRect(0, 96, W, 138);
        ctx.strokeStyle = C.bg; ctx.lineWidth = 2; ctx.setLineDash([14, 12]); for (const y of [142, 188]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.setLineDash([]);
        if (chk.cam) { ctx.fillStyle = C.c; ctx.globalAlpha = .13; ctx.fillRect(CAM[0], 96, CAM[1] - CAM[0], 138); ctx.globalAlpha = 1; }
        ctx.fillStyle = C.c; ctx.fillRect((CAM[0] + CAM[1]) / 2 - 3, 50, 6, 46); rr(ctx, (CAM[0] + CAM[1]) / 2 - 16, 38, 32, 18, 4); ctx.fill();
        txt(ctx, 'roadside unit with camera', (CAM[0] + CAM[1]) / 2, 30, { align: 'center', size: 12, color: chk.cam ? C.c : C.mu, w: 600 });
        if (chk.radar) { ctx.fillStyle = C.a; ctx.globalAlpha = .14; ctx.beginPath(); ctx.moveTo(ego.x + 26, lane[1]); ctx.arc(ego.x + 26, lane[1], RADAR, -.25, .25); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
        for (const c of cars) { rr(ctx, c.x - 24, lane[c.l] - 12, 48, 24, 6); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.mu; ctx.lineWidth = 1.5; ctx.stroke(); }
        rr(ctx, ego.x - 26, lane[1] - 13, 52, 26, 7); ctx.fillStyle = C.a; ctx.fill(); txt(ctx, 'you', ego.x, lane[1] + 4, { align: 'center', w: 700, size: 12, color: C.bg });
        if (ghost.x !== undefined) {
          const caught = flags.size > 0;
          rr(ctx, ghost.x - 24, lane[1] - 12, 48, 24, 6); ctx.setLineDash([5, 4]); ctx.strokeStyle = C.b; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, caught ? 'fake' : 'ghost?', ghost.x, lane[1] + 4, { align: 'center', size: 11, w: 700, color: C.b });
          ctx.strokeStyle = C.b; ctx.globalAlpha = .5; for (const r of [14, 26]) { ctx.beginPath(); ctx.arc(ghost.x, lane[1] - 18, r, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); } ctx.globalAlpha = 1;
        }
        const msg = flags.size ? 'Ghost caught by: ' + [...flags].join(', ') + '.'
          : 'A broadcast says a car ahead is braking hard. Nothing has flagged it yet.';
        txt(ctx, msg, W / 2, H - 34, { align: 'center', w: 600, color: flags.size ? C.fg : C.b });
        txt(ctx, crude ? 'Crude ghost: its reported position jumps.' : 'Careful ghost: smooth, physically plausible motion.', W / 2, H - 12, { align: 'center', size: 12, color: C.mu });
        out.textContent = msg;
      }
    };
    const L = loop(demo, D.ctrl);
    choice(D.ctrl, 'Attacker', ['Crude', 'Careful'], 0, i => { crude = i === 0; reset(); demo.draw(); L.kick(); });
    toggle(D.ctrl, 'Motion check', chk.phys, v => { chk.phys = v; flags = new Set(); demo.draw(); });
    toggle(D.ctrl, 'Roadside camera', chk.cam, v => { chk.cam = v; flags = new Set(); demo.draw(); });
    toggle(D.ctrl, 'Your radar', chk.radar, v => { chk.radar = v; flags = new Set(); demo.draw(); });
    const out = readout(D.ctrl);
    reset(); for (let i = 0; i < 5; i++) demo.step(); demo.draw();
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
