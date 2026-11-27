// Live illustration "tdoa", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 2. Keystroke ranging: time difference between a phone's two microphones
  demos.tdoa = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'], P = 19, S = 2.2; // key pitch in mm, pixels per mm
    const offs = [0, 4.75, 14.25];                                       // row stagger in mm
    const keys = [];
    rows.forEach((r, i) => [...r].forEach((k, j) => keys.push({ k, x: offs[i] + j * P + P / 2, y: i * P + P / 2 })));
    const kbW = 10 * P, ox = 22, oy = 44;
    const phone = { x0: kbW / 2 - 70, x1: kbW / 2 + 70, y: 3 * P + 42 };    // two mics 140 mm apart, 42 mm below the keys
    const m1 = { x: phone.x0, y: phone.y }, m2 = { x: phone.x1, y: phone.y };
    const d1f = k => Math.hypot(k.x - m1.x, k.y - m1.y), d2f = k => Math.hypot(k.x - m2.x, k.y - m2.y);
    const dd = k => d1f(k) - d2f(k);
    let sel = keys.find(k => k.k === 'F'), t = 1, tol = 3;
    const px = (x, y) => [ox + x * S, oy + y * S];
    const pulse = tt => tt < 0 ? 0 : Math.exp(-tt / 45) * Math.sin(2 * Math.PI * tt / 26);
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const target = dd(sel);
        const same = keys.filter(k => k !== sel && Math.abs(dd(k) - target) <= tol);
        txt(ctx, 'Keyboard and phone, seen from above', ox, 24, { size: 12, color: C.mu, w: 600 });
        for (const k of keys) {
          const [x, y] = px(k.x - P / 2 + 1, k.y - P / 2 + 1), on = same.includes(k);
          rr(ctx, x, y, (P - 2) * S, (P - 2) * S, 6);
          ctx.fillStyle = k === sel ? C.b : C.bg; ctx.fill();
          ctx.strokeStyle = on ? C.c : C.line; ctx.lineWidth = on ? 2.4 : 1.2; ctx.stroke();
          txt(ctx, k.k, x + (P - 2) * S / 2, y + (P - 2) * S / 2 + 5, { align: 'center', w: 600, color: k === sel ? C.bg : on ? C.c : C.fg });
        }
        // every point on the keyboard with (nearly) the same time difference: a smooth band along one hyperbola
        // d1 - d2 grows with x, so for each row of the keyboard find where it equals target - tol and target + tol
        const xAt = (y, v) => { let lo = -40, hi = kbW + 40; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; dd({ x: m, y }) < v ? lo = m : hi = m; } return (lo + hi) / 2; };
        const ys = []; for (let y = -4; y <= 3 * P + 4; y += 2) ys.push(y);
        const cl = x => Math.max(-4, Math.min(kbW + 14, x));
        ctx.save(); ctx.beginPath();
        ys.forEach((y, i) => { const [a, b] = px(cl(xAt(y, target - tol)), y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
        [...ys].reverse().forEach(y => { const [a, b] = px(cl(xAt(y, target + tol)), y); ctx.lineTo(a, b); });
        ctx.closePath(); ctx.fillStyle = C.c; ctx.globalAlpha = .16; ctx.fill(); ctx.restore();
        ctx.save(); ctx.strokeStyle = C.c; ctx.globalAlpha = .7; ctx.setLineDash([2, 4]); ctx.lineWidth = 1.2; ctx.beginPath();
        ys.forEach((y, i) => { const [a, b] = px(cl(xAt(y, target)), y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
        ctx.stroke(); ctx.restore();
        { // redraw the pressed key on top so its label stays clear
          const [x, y] = px(sel.x - P / 2 + 1, sel.y - P / 2 + 1);
          rr(ctx, x, y, (P - 2) * S, (P - 2) * S, 6); ctx.fillStyle = C.b; ctx.fill();
          txt(ctx, sel.k, x + (P - 2) * S / 2, y + (P - 2) * S / 2 + 5, { align: 'center', w: 600, color: C.bg });
        }
        const [p0x, py] = px(phone.x0 - 8, phone.y - 6), pw = (140 + 16) * S;
        rr(ctx, p0x, py, pw, 12 * S, 10); ctx.fillStyle = C.soft; ctx.fill(); ctx.strokeStyle = C.mu; ctx.lineWidth = 1; ctx.stroke();
        txt(ctx, 'phone', p0x + pw / 2, py + 6 * S + 5, { align: 'center', color: C.mu });
        const [sx, sy] = px(sel.x, sel.y);
        for (const [m, name] of [[m1, 'mic 1'], [m2, 'mic 2']]) {
          const [x, y] = px(m.x, m.y);
          ctx.strokeStyle = C.b; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy + (P / 2 - 1) * S); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = C.a; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
          txt(ctx, `${name}: ${(m === m1 ? d1f(sel) : d2f(sel)).toFixed(0)} mm away`, x, y + 30, { align: 'center', size: 12, color: C.mu });
        }
        if (t < 1) {
          ctx.strokeStyle = C.b; ctx.lineWidth = 2; const R = t * 200 * S;
          for (const k of [0, .12, .24]) { const r = R - k * 200 * S; if (r > 0) { ctx.globalAlpha = Math.max(0, 1 - t); ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke(); } }
          ctx.globalAlpha = 1;
        }
        // what each microphone records: the same click, shifted in time
        const X0 = 476, X1 = 704, XC = (X0 + X1) / 2, SPAN = 260, us = v => XC + v / SPAN * (X1 - X0) / 2;
        txt(ctx, 'What the two microphones record', X0, 24, { size: 12, color: C.mu, w: 600 });
        const a1 = d1f(sel) / .343, a2 = d2f(sel) / .343, mid = (a1 + a2) / 2;
        for (const [arr, name, yb] of [[a1 - mid, 'mic 1', 78], [a2 - mid, 'mic 2', 138]]) {
          txt(ctx, name, X0, yb - 24, { size: 12, color: C.mu });
          ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X0, yb); ctx.lineTo(X1, yb); ctx.stroke();
          ctx.strokeStyle = C.a; ctx.lineWidth = 1.8; ctx.beginPath();
          for (let x = X0; x <= X1; x++) { const v = pulse((x - XC) / ((X1 - X0) / 2) * SPAN - arr); x === X0 ? ctx.moveTo(x, yb - v * 20) : ctx.lineTo(x, yb - v * 20); }
          ctx.stroke(); ctx.lineWidth = 1;
          ctx.strokeStyle = C.b; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(us(arr), yb - 22); ctx.lineTo(us(arr), 168); ctx.stroke(); ctx.setLineDash([]);
        }
        const dt = Math.abs(a1 - a2), xa = us(a1 - mid), xb = us(a2 - mid);
        ctx.strokeStyle = C.b; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xa, 168); ctx.lineTo(xb, 168); ctx.stroke(); ctx.lineWidth = 1;
        txt(ctx, `time difference ${dt.toFixed(0)} µs`, XC, 188, { align: 'center', size: 13, w: 700, color: C.b });
        txt(ctx, `about ${(dt / 20.83).toFixed(1)} samples at 48 kHz`, XC, 206, { align: 'center', size: 12, color: C.mu });
        const yy = para(ctx, same.length ? `Same time difference: ${same.map(k => k.k).join(', ')}. Timing alone cannot tell ${same.length > 1 ? 'these keys' : 'this key'} from ${sel.k}; the sound of each key can.` : `No other key shares this time difference at the current tolerance.`, X0, 236, X1 - X0, 17, { size: 12, color: same.length ? C.c : C.fg, w: 600 });
        para(ctx, 'Shaded band: every spot on the keyboard with the same time difference.', X0, Math.max(yy + 22, 286), X1 - X0, 15, { size: 11, color: C.mu });
        const usx = (d1f(sel) - d2f(sel)) / .343;
        out.textContent = `Key ${sel.k}: ${d1f(sel).toFixed(0)} mm to mic 1 and ${d2f(sel).toFixed(0)} mm to mic 2, so the sound reaches mic ${usx < 0 ? 1 : 2} first by ${Math.abs(usx).toFixed(0)} µs. ` +
          (same.length ? `Keys with nearly the same difference: ${same.map(k => k.k).join(' ')}.` : 'No other key has nearly the same difference.');
      },
      step() { t = Math.min(1, (performance.now() - t0) / 1100); }
    };
    let t0 = 0;
    const press = k => { sel = k; t = 0; t0 = performance.now(); animate(); };
    let raf = 0;
    const animate = () => { if (reduce) { t = 1; demo.draw(); return; } cancelAnimationFrame(raf); const f = () => { demo.step(); demo.draw(); if (t < 1) raf = requestAnimationFrame(f); }; f(); };
    D.cv.tabIndex = 0;
    D.cv.addEventListener('click', e => { const p = D.pos(e); const k = keys.find(k => { const [x, y] = px(k.x - P / 2, k.y - P / 2); return p.x >= x && p.x <= x + P * S && p.y >= y && p.y <= y + P * S; }); if (k) press(k); });
    D.cv.addEventListener('keydown', e => { const k = keys.find(k => k.k === e.key.toUpperCase()); if (k) { e.preventDefault(); press(k); } });
    slider(D.ctrl, 'Timing error the attacker can tolerate (mm)', 1, 8, 1, tol, v => { tol = v; demo.draw(); });
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
