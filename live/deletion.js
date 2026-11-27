// Live illustration "deletion", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 16. Check an explanation: the deletion test
  demos.deletion = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const F = ['packets per second', 'failed logins', 'bytes sent out', 'distinct ports', 'capture ID'];
    const MODELS = [{ w: [1.4, 1.9, 1.1, .3, .05], b: -3 }, { w: [.3, .4, .2, .2, 1.3], b: -3 }];   // invented weights
    const X = [.9, 1.3, .8, 2.2, 3], B = [0, 0, 0, 0, 0];
    let mi = 0, ei = 0;
    const sig = z => 1 / (1 + Math.exp(-z));
    const score = (m, keep) => sig(m.b + m.w.reduce((a, w, i) => a + w * (keep[i] ? X[i] : B[i]), 0));
    const curve = (m, order) => { const keep = [1, 1, 1, 1, 1], c = [score(m, keep)]; for (const i of order) { keep[i] = 0; c.push(score(m, keep)); } return c; };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const m = MODELS[mi], attr = m.w.map((w, i) => w * (X[i] - B[i]));
        const rank = ei === 0 ? attr.map((a, i) => i).sort((p, q) => Math.abs(attr[q]) - Math.abs(attr[p])) : [0, 1, 2, 3, 4].sort((p, q) => X[q] - X[p]);
        // attribution bars
        txt(ctx, ei === 0 ? 'explanation: contribution to this alert' : 'explanation: ranks features by raw value', 20, 24, { size: 12, color: C.mu });
        const mx = Math.max(...attr.map(Math.abs));
        rank.forEach((i, r) => {
          const y = 44 + r * 40;
          txt(ctx, (r + 1) + '. ' + F[i], 20, y + 14, { size: 13, w: i === 4 && mi ? 700 : 500, color: i === 4 && mi ? C.b : C.fg });
          const v = ei === 0 ? Math.abs(attr[i]) / mx : X[i] / Math.max(...X);
          ctx.fillStyle = C.line; ctx.fillRect(20, y + 20, 260, 9); ctx.fillStyle = i === 4 ? C.b : C.a; ctx.fillRect(20, y + 20, 260 * v, 9);
        });
        // deletion curves
        const px = 360, pw = 330, py = 40, ph = 180;
        axes(ctx, px, py, pw, ph);
        const c1 = curve(m, rank);
        const rc = [0, 0, 0, 0, 0, 0]; let perms = 0;
        const perm = (arr, l) => { if (l === arr.length) { curve(m, arr).forEach((v, k) => rc[k] += v); perms++; return; } for (let i = l; i < arr.length; i++) { [arr[l], arr[i]] = [arr[i], arr[l]]; perm(arr, l + 1); [arr[l], arr[i]] = [arr[i], arr[l]]; } };
        perm([0, 1, 2, 3, 4], 0); const cr = rc.map(v => v / perms);
        const XX = k => px + k / 5 * pw, YY = v => py + ph - v * ph;
        for (const [c, col, dash] of [[cr, C.mu, [5, 5]], [c1, C.b, []]]) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash(dash); ctx.beginPath(); c.forEach((v, k) => k ? ctx.lineTo(XX(k), YY(v)) : ctx.moveTo(XX(k), YY(v))); ctx.stroke(); ctx.setLineDash([]); }
        txt(ctx, 'alert score as top-ranked features are removed', px, 26, { size: 12, color: C.mu });
        txt(ctx, 'following the explanation', px + pw, py + 12, { align: 'right', size: 12, color: C.b, w: 600 });
        txt(ctx, 'random order (average)', px + pw, py + 28, { align: 'right', size: 12, color: C.mu, w: 600 });
        txt(ctx, 'features removed →', px + pw, py + ph + 18, { align: 'right', size: 12, color: C.mu });
        const auc = c => c.reduce((a, v) => a + v, 0) / c.length, faithful = auc(c1) < auc(cr) - .03;
        const m1 = faithful ? 'Faithful: following the explanation drops the score faster than random.' : 'Not faithful: following this explanation is no better than random.';
        const m2 = mi && ei === 0 ? 'It also exposes the shortcut: the top reason is the capture ID.' : '';
        txt(ctx, m1, W / 2, H - (m2 ? 32 : 14), { align: 'center', size: 13, w: 600 });
        if (m2) txt(ctx, m2, W / 2, H - 12, { align: 'center', size: 13, w: 600, color: C.b });
        const msg = m1 + (m2 ? ' ' + m2 : '');
        out.textContent = msg;
      }
    };
    choice(D.ctrl, 'Detector', ['Learned behavior', 'Learned a shortcut'], 0, i => { mi = i; demo.draw(); });
    choice(D.ctrl, 'Explainer', ['Contributions', 'Raw values'], 0, i => { ei = i; demo.draw(); });
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
