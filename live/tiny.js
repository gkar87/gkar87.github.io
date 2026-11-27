// Live illustration "tiny", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 19. Will it fit? Model memory against a microcontroller's RAM
  demos.tiny = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const BITS = [32, 16, 8, 4], RAM = [64, 256, 512];
    let lk = Math.log10(60), bi = 0, ri = 1, ws = [];
    for (let i = 0; i < 3000; i++) ws.push(gauss() * .1);
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const params = Math.round(10 ** lk) * 1000, bits = BITS[bi], kb = params * bits / 8 / 1024, budget = RAM[ri];
        // memory bar
        const bx = 30, bw = 300, top = 60, max = Math.max(budget * 1.6, kb * 1.05), Y = v => top + 180 - v / max * 180;
        txt(ctx, 'weights in memory (KB)', bx, 30, { size: 12, color: C.mu });
        ctx.fillStyle = kb <= budget ? C.c : C.b; rr(ctx, bx + 80, Y(kb), 120, top + 180 - Y(kb), 6); ctx.fill();
        txt(ctx, `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`, bx + 140, Y(kb) - 8, { align: 'center', w: 700 });
        ctx.strokeStyle = C.fg; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, Y(budget)); ctx.lineTo(bx + bw, Y(budget)); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, `${budget} KB RAM`, bx + bw, Y(budget) - 6, { align: 'right', size: 12, w: 600 });
        ctx.strokeStyle = C.mu; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, top + 180); ctx.lineTo(bx + bw, top + 180); ctx.stroke();
        // quantization of a weight distribution
        const hx = 380, hw = 310, lo = -.4, hi = .4, nb = 60, hist = new Array(nb).fill(0);
        for (const w of ws) { const k = Math.floor((w - lo) / (hi - lo) * nb); if (k >= 0 && k < nb) hist[k]++; }
        const hm = Math.max(...hist);
        txt(ctx, `weights and the ${bits}-bit grid`, hx, 30, { size: 12, color: C.mu });
        hist.forEach((c, k) => { ctx.fillStyle = C.a; ctx.globalAlpha = .6; ctx.fillRect(hx + k * hw / nb, 240 - c / hm * 150, hw / nb - 1, c / hm * 150); ctx.globalAlpha = 1; });
        const levels = 2 ** bits, step = (2 * .3) / (levels - 1);
        let err = 0; for (const w of ws) { const q = clamp(Math.round((clamp(w, -.3, .3) + .3) / step) * step - .3, -.3, .3); err += (w - q) ** 2; }
        const rel = Math.sqrt(err / ws.length) / .1;
        if (bits <= 8) { ctx.strokeStyle = C.b; ctx.lineWidth = 1; ctx.globalAlpha = bits === 8 ? .25 : .8; for (let j = 0; j < levels; j++) { const x = hx + ((-.3 + j * step) - lo) / (hi - lo) * hw; ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, 240); ctx.stroke(); } ctx.globalAlpha = 1; }
        ctx.strokeStyle = C.mu; ctx.beginPath(); ctx.moveTo(hx, 240); ctx.lineTo(hx + hw, 240); ctx.stroke();
        txt(ctx, `rounding error: ${rel < .001 ? 'under 0.1' : (rel * 100).toFixed(1)}% of the weight spread`, hx, 264, { size: 13 });
        const fits = kb <= budget;
        const msg = `${(params / 1000).toLocaleString()}k weights × ${bits} bits = ${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB: ${fits ? 'fits in ' + budget + ' KB' : 'does not fit in ' + budget + ' KB'}.`;
        txt(ctx, msg, 30, H - 14, { size: 13, w: 600, color: fits ? C.fg : C.b });
        out.textContent = msg;
      }
    };
    slider(D.ctrl, 'Weights (thousands, log)', 0, 3, .02, lk, v => { lk = v; demo.draw(); });
    choice(D.ctrl, 'Bits per weight', BITS.map(String), bi, i => { bi = i; demo.draw(); });
    choice(D.ctrl, 'Example RAM', RAM.map(r => r + ' KB'), ri, i => { ri = i; demo.draw(); });
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
