// Live illustration "qubit", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 4. Angle encoding on one qubit: a feature becomes a rotation, measurement gives probabilities
  demos.qubit = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    let x = .3, phi = 0, shots = null, anim = 0;
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const th = Math.PI * x + phi, cx = 150, cy = 150, R = 105;
        ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
        ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, '|0⟩', cx, cy - R - 10, { align: 'center', w: 700 }); txt(ctx, '|1⟩', cx, cy + R + 22, { align: 'center', w: 700 });
        const ex = cx + R * Math.sin(th), ey = cy - R * Math.cos(th);
        ctx.strokeStyle = C.b; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(ex, ey, 7, 0, 7); ctx.fill();
        ctx.strokeStyle = C.a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + th, th < 0); ctx.stroke();
        txt(ctx, 'θ = ' + (th * 180 / Math.PI).toFixed(0) + '°', cx + 36, cy - 8, { color: C.a, w: 600 });
        const p0 = Math.cos(th / 2) ** 2, p1 = 1 - p0;
        txt(ctx, 'Probability of each measurement', 330, 46, { w: 700 });
        [[p0, '|0⟩ benign'], [p1, '|1⟩ attack']].forEach(([p, l], i) => {
          const y = 70 + i * 48; txt(ctx, l, 330, y + 16, { size: 13 });
          ctx.fillStyle = C.line; rr(ctx, 430, y + 2, 250, 20, 10); ctx.fill();
          ctx.fillStyle = i ? C.b : C.a; rr(ctx, 430, y + 2, Math.max(4, 250 * p), 20, 10); ctx.fill();
          txt(ctx, (p * 100).toFixed(1) + '%', 690, y + 17, { mono: 1, w: 700, size: 13 });
        });
        txt(ctx, `P(|0⟩) = cos²(θ/2) = ${p0.toFixed(3)}`, 330, 190, { mono: 1, size: 13, color: C.mu });
        if (shots) {
          const k = Math.round(shots.k * Math.min(1, anim));
          txt(ctx, `${shots.n} shots on a simulated qubit: ${k} read |1⟩`, 330, 226, { w: 600, size: 13 });
          ctx.fillStyle = C.line; rr(ctx, 330, 238, 360, 14, 7); ctx.fill();
          ctx.fillStyle = C.b; rr(ctx, 330, 238, Math.max(4, 360 * k / shots.n), 14, 7); ctx.fill();
        }
        out.textContent = `Feature ${x.toFixed(2)} becomes a rotation of ${(th * 180 / Math.PI).toFixed(0)} degrees; the qubit reads |1⟩ with probability ${(p1 * 100).toFixed(1)}%.` +
          (shots ? ` In ${shots.n} shots it read |1⟩ ${shots.k} times.` : '');
      }
    };
    slider(D.ctrl, 'Input feature (scaled 0 to 1)', 0, 1, .01, x, v => { x = v; shots = null; demo.draw(); });
    slider(D.ctrl, 'Trainable rotation', -1.57, 1.57, .01, phi, v => { phi = v; shots = null; demo.draw(); });
    button(D.ctrl, 'Measure 200 shots', () => {
      const p1 = Math.sin((Math.PI * x + phi) / 2) ** 2; let k = 0; for (let i = 0; i < 200; i++) if (Math.random() < p1) k++;
      shots = { n: 200, k }; anim = reduce ? 1 : 0;
      const a0 = performance.now(), f = () => { anim = reduce ? 1 : Math.min(1, (performance.now() - a0) / 900); demo.draw(); if (anim < 1) requestAnimationFrame(f); }; f();
    });
    const out = readout(D.ctrl);
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
