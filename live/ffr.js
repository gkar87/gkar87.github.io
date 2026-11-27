// Live illustration "ffr", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 11. Fractional frequency reuse: inner share vs throughput and fairness
  demos.ffr = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const R = 52, cx0 = 172, cy0 = 146, RIN = .6, NU = 36;
    let s = .5, edge = .5, users = [];
    const drop = () => {
      users = Array.from({ length: NU }, (_, i) => {
        const out = i < Math.round(NU * edge), d = out ? rnd(RIN + .02, .84) : Math.sqrt(Math.random()) * RIN, a = rnd(0, 2 * Math.PI);
        return { d, a };
      });
    };
    // invented link model: reuse-1 band efficiency falls with distance; the reuse-3 edge band is cleaner
    const effIn = d => Math.max(.3, 4.2 * (1 - d) ** 1.4), effOut = d => 3 - .8 * d;
    const evalS = sh => {
      const inn = users.filter(u => u.d < RIN), out = users.filter(u => u.d >= RIN);
      const x = [...inn.map(u => sh / (inn.length || 1) * effIn(u.d)), ...out.map(u => (1 - sh) / 3 / (out.length || 1) * effOut(u.d))];
      const T = x.reduce((p, q) => p + q, 0), J = T * T / (x.length * x.reduce((p, q) => p + q * q, 0));
      return { T, J };
    };
    const hex = (cx, cy, r) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } ctx.closePath(); };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const col = [C.a, C.b, C.c];
        const cells = [[0, 0, 0]]; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; cells.push([Math.sqrt(3) * R * Math.cos(a), Math.sqrt(3) * R * Math.sin(a), 1 + i % 2]); }
        for (const [dx, dy, band] of cells) {
          const x = cx0 + dx, y = cy0 + dy;
          hex(x, y, R); ctx.fillStyle = col[band]; ctx.globalAlpha = .28; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = C.mu; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.arc(x, y, R * RIN, 0, 7); ctx.fillStyle = C.bg; ctx.fill(); ctx.fillStyle = C.mu; ctx.globalAlpha = .3; ctx.fill(); ctx.globalAlpha = 1;
        }
        for (const u of users) { ctx.fillStyle = u.d < RIN ? C.fg : C.b; ctx.beginPath(); ctx.arc(cx0 + u.d * R * Math.cos(u.a), cy0 + u.d * R * Math.sin(u.a), 3, 0, 7); ctx.fill(); }
        // how the band is cut
        const bx = 24, bw = 300, by = 306;
        txt(ctx, 'How the band is cut', bx, by - 10, { size: 12, color: C.mu, w: 600 });
        const segs = [[s, C.mu, 'every center']].concat([0, 1, 2].map(i => [(1 - s) / 3, col[i], '']));
        let x = bx;
        for (const [w, c] of segs) { rr(ctx, x + 1, by, Math.max(1, w * bw - 2), 20, 4); ctx.fillStyle = c; ctx.globalAlpha = c === C.mu ? .45 : .75; ctx.fill(); ctx.globalAlpha = 1; x += w * bw; }
        txt(ctx, `shared by every cell center: ${Math.round(s * 100)}%`, bx, by + 38, { size: 12 });
        txt(ctx, `edge slices, one per cell color: ${Math.round((1 - s) / 3 * 100)}% each`, bx, by + 56, { size: 12 });

        // curves
        const px = 384, pw = 310, py = 64, ph = 186, pts = [];
        for (let i = 0; i <= 60; i++) { const sh = .05 + .9 * i / 60; pts.push({ sh, ...evalS(sh) }); }
        const Tm = Math.max(...pts.map(p => p.T)), Pm = Math.max(...pts.map(p => p.T / Tm * p.J));
        const best = pts.reduce((b, p) => p.T / Tm * p.J > b.T / Tm * b.J ? p : b);
        axes(ctx, px, py, pw, ph);
        const X = sh => px + (sh - .05) / .9 * pw, Y = v => py + ph - v * ph;
        for (const [key, cc] of [['T', C.a], ['J', C.c], ['P', C.b]]) {
          ctx.strokeStyle = cc; ctx.lineWidth = key === 'P' ? 3 : 2; ctx.beginPath();
          pts.forEach((p, i) => { const v = key === 'T' ? p.T / Tm : key === 'J' ? p.J : p.T / Tm * p.J / Pm; i ? ctx.lineTo(X(p.sh), Y(v)) : ctx.moveTo(X(p.sh), Y(v)); }); ctx.stroke();
        }
        ctx.lineWidth = 1;
        txt(ctx, 'throughput', px, py - 12, { size: 12, color: C.a, w: 700 });
        txt(ctx, 'fairness', px + 86, py - 12, { size: 12, color: C.c, w: 700 });
        txt(ctx, 'throughput × fairness', px + 160, py - 12, { size: 12, color: C.b, w: 700 });
        ctx.strokeStyle = C.fg; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(s), py); ctx.lineTo(X(s), py + ph); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(X(best.sh), Y(best.T / Tm * best.J / Pm), 5, 0, 7); ctx.fill();
        txt(ctx, 'share of the band given to cell centers →', px + pw, py + ph + 18, { align: 'right', size: 12, color: C.mu });
        for (const [cc, lab, dx] of [[C.fg, 'user near the center', 0], [C.b, 'user near the edge', 160]]) {
          ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(px + dx + 5, py + ph + 46, 4, 0, 7); ctx.fill();
          txt(ctx, lab, px + dx + 14, py + ph + 50, { size: 12, color: C.mu });
        }
        const c = evalS(s);
        const msg = `Center share ${Math.round(s * 100)}%: throughput ${Math.round(c.T / Tm * 100)}% of its maximum, fairness ${c.J.toFixed(2)}. Best balance near ${Math.round(best.sh * 100)}%.`;
                out.textContent = msg;
      }
    };
    slider(D.ctrl, 'Share of the band for cell centers', .05, .95, .01, s, v => { s = v; demo.draw(); });
    slider(D.ctrl, 'Users near the cell edge', .1, .9, .05, edge, v => { edge = v; drop(); demo.draw(); });
    button(D.ctrl, 'New user drop', () => { drop(); demo.draw(); });
    const out = readout(D.ctrl);
    drop(); demo.draw();
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
