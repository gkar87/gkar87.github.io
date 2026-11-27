// Live illustration "fed", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 22. Federated learning: six sites, one possibly malicious, mean vs median
  demos.fed = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const PX = [24, 300], PY = [34, 262], MAXR = 30;
    const T = [-0.25, 0.15], A = [0.8, -0.75], START = [-0.85, 0.85];
    const dirs = [[1, .2], [-.6, .9], [-.9, -.5], [.3, -1], [.9, .7], [-.2, -.3]];
    let spread = .35, bad = true, rule = 0, g, hist, rnd0;
    const opt = i => [T[0] + spread * dirs[i][0], T[1] + spread * dirs[i][1]];
    const clean = () => { let x = 0, y = 0; for (let i = 0; i < 5; i++) { const o = opt(i); x += o[0]; y += o[1]; } return [x / 5, y / 5]; };
    const reset = () => { g = START.slice(); hist = [g.slice()]; rnd0 = 0; };
    const agg = us => {
      const med = k => { const v = us.map(u => u[k]).sort((a, b) => a - b); return (v[2] + v[3]) / 2; };
      const trim = k => { const v = us.map(u => u[k]).sort((a, b) => a - b); return (v[1] + v[2] + v[3] + v[4]) / 4; };
      if (rule === 1) return [med(0), med(1)];
      if (rule === 2) return [trim(0), trim(1)];
      return [us.reduce((s, u) => s + u[0], 0) / 6, us.reduce((s, u) => s + u[1], 0) / 6];
    };
    let last = [];
    const round = () => {
      if (rnd0 >= MAXR) return;
      last = [];
      for (let i = 0; i < 6; i++) {
        if (i === 5 && bad) last.push([2.2 * (A[0] - g[0]), 2.2 * (A[1] - g[1])]);
        else { const o = i === 5 ? [T[0] + spread * dirs[5][0], T[1] + spread * dirs[5][1]] : opt(i); last.push([.5 * (o[0] - g[0]), .5 * (o[1] - g[1])]); }
      }
      const d = agg(last); g = [g[0] + d[0], g[1] + d[1]]; hist.push(g.slice()); rnd0++;
    };
    const P = p => [PX[0] + (p[0] + 1) / 2 * (PX[1] - PX[0]), PY[0] + (1 - p[1]) / 2 * (PY[1] - PY[0])];
    const ref = () => { if (!bad) { const o = opt(5); const c = clean(); return [(c[0] * 5 + o[0]) / 6, (c[1] * 5 + o[1]) / 6]; } return clean(); };
    const dist = p => { const r = ref(); return Math.hypot(p[0] - r[0], p[1] - r[1]); };
    let tick = 0;
    const demo = {
      cv: D.cv,
      step() { if (++tick % 48 === 0) { if (rnd0 >= MAXR) reset(); else round(); } },
      draw() {
        ctx.clearRect(0, 0, W, H);
        rr(ctx, PX[0], PY[0], PX[1] - PX[0], PY[1] - PY[0], 8); ctx.fillStyle = C.soft; ctx.fill();
        txt(ctx, 'Model space (each dot: what one site would learn alone)', PX[0], 22, { size: 12, color: C.mu });
        const r = P(ref());
        for (let i = 0; i < 6; i++) {
          const isBad = i === 5 && bad, p = P(isBad ? A : (i === 5 ? [T[0] + spread * dirs[5][0], T[1] + spread * dirs[5][1]] : opt(i)));
          ctx.fillStyle = isBad ? C.b : C.a; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7); ctx.fill();
          if (isBad) txt(ctx, 'malicious site', p[0] - 11, p[1] + 4, { size: 11, color: C.b, align: 'right' });
          else txt(ctx, 'site ' + (i + 1), p[0] + 10, p[1] + 4, { size: 11, color: C.mu });
        }
        ctx.strokeStyle = C.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r[0] - 8, r[1]); ctx.lineTo(r[0] + 8, r[1]); ctx.moveTo(r[0], r[1] - 8); ctx.lineTo(r[0], r[1] + 8); ctx.stroke();
        rr(ctx, r[0] + 7, r[1] - 26, 78, 16, 4); ctx.fillStyle = C.soft; ctx.globalAlpha = .92; ctx.fill(); ctx.globalAlpha = 1;
        txt(ctx, 'clean result', r[0] + 11, r[1] - 14, { size: 11, w: 700, color: C.c });
        ctx.strokeStyle = C.fg; ctx.lineWidth = 1.5; ctx.beginPath();
        hist.forEach((h, i) => { const p = P(h); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
        const gp = P(g); ctx.fillStyle = C.fg; ctx.beginPath(); ctx.arc(gp[0], gp[1], 6, 0, 7); ctx.fill();
        txt(ctx, 'shared model', gp[0] + 9, gp[1] + 16, { size: 11, w: 700 });
        if (bad && last.length) { const u = last[5]; ctx.strokeStyle = C.b; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(gp[0], gp[1]); const q = P([g[0] - hist[hist.length - 1][0] + hist[hist.length - 2 >= 0 ? hist.length - 2 : 0][0] + u[0] * .35, hist[hist.length - 2 >= 0 ? hist.length - 2 : 0][1] + u[1] * .35]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.setLineDash([]); }
        // distance chart
        const X0 = 360, X1 = 700, Y0 = 40, Y1 = 230, M = 2;
        txt(ctx, 'Distance of the shared model from the clean result', X0, 22, { size: 12, color: C.mu });
        axes(ctx, X0, Y0, X1 - X0, Y1 - Y0);
        txt(ctx, 'round', X1, Y1 + 18, { size: 11, color: C.mu, align: 'right' });
        txt(ctx, '0', X0 - 6, Y1 + 4, { size: 11, color: C.mu, align: 'right' });
        ctx.strokeStyle = bad && rule === 0 ? C.b : C.a; ctx.lineWidth = 2.5; ctx.beginPath();
        hist.forEach((h, i) => { const x = X0 + i / MAXR * (X1 - X0), y = Y1 - clamp(dist(h) / M, 0, 1) * (Y1 - Y0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
        const dnow = dist(g);
        const names = ['Mean', 'Median', 'Trimmed mean'];
        let msg = `Round ${rnd0} of ${MAXR} · ${names[rule]} · distance ${dnow.toFixed(2)}. `;
        if (rnd0 < 3) msg += 'Training is starting.';
        else if (bad && rule === 0) msg += 'The malicious site pulls the averaged model toward its own target.';
        else if (bad) msg += dnow > .12 ? 'The attack is blunted, but differences between sites leave a gap.' : 'The robust rule ignores the malicious update.';
        else msg += dnow > .12 ? 'No attacker, but the robust rule drifts because the sites differ.' : 'No attacker: the shared model settles on the clean result.';
        para(ctx, msg, X0, Y1 + 40, X1 - X0, 17, { size: 12, w: 600, color: bad && rule === 0 && rnd0 >= 3 ? C.b : C.fg });
        out.textContent = msg;
      }
    };
    const L = loop(demo, D.ctrl);
    button(D.ctrl, 'Next round', () => { round(); demo.draw(); });
    button(D.ctrl, 'Restart', () => { reset(); last = []; demo.draw(); L.kick(); });
    toggle(D.ctrl, 'One site is malicious', bad, v => { bad = v; reset(); last = []; demo.draw(); });
    choice(D.ctrl, 'Combine updates by', ['Mean', 'Median', 'Trimmed mean'], rule, i => { rule = i; reset(); last = []; demo.draw(); });
    slider(D.ctrl, 'How different the sites are', 0, .6, .05, spread, v => { spread = v; reset(); last = []; demo.draw(); });
    const out = readout(D.ctrl);
    reset(); demo.draw();
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
