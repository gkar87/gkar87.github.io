// Live illustration "flows", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 12. Which app is this encrypted flow? Sizes and timing only
  demos.flows = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const APPS = [ // invented profiles: [size mean, size spread, gap mean in ms, gap spread]
      { name: 'Video stream', s: [1350, 180], g: [6, 5] },
      { name: 'Messaging', s: [180, 90], g: [140, 120] },
      { name: 'Voice call', s: [210, 20], g: [20, 1.5] }];
    const NP = 36;
    let pad = false, jitter = false, refs = [], mys = null, truth = 0;
    const gen = a => Array.from({ length: NP }, () => ({ s: clamp(a.s[0] + gauss() * a.s[1], 60, 1500), g: Math.max(1, a.g[0] + gauss() * a.g[1]) }));
    const defend = f => f.map(p => ({ s: pad ? 1500 : p.s, g: jitter ? 1 + Math.random() * 120 : p.g }));
    const featOf = f => { const m = k => f.reduce((a, p) => a + p[k], 0) / f.length, sd = k => Math.sqrt(f.reduce((a, p) => a + (p[k] - m(k)) ** 2, 0) / f.length); return [m('s') / 1500, sd('s') / 500, Math.log(m('g')) / 5, sd('g') / m('g')]; };
    const fresh = () => { refs = APPS.map(gen); truth = Math.floor(Math.random() * 3); mys = gen(APPS[truth]); };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const rows = [...refs.map((f, i) => [APPS[i].name, defend(f)]), ['Unknown flow', defend(mys)]];
        const fm = featOf(rows[3][1]), dist = refs.map(f => { const q = featOf(defend(f)); return Math.hypot(...q.map((x, i) => x - fm[i])); });
        // with both defenses on, every app's packets look alike by construction, so call it a tie
        const md = Math.min(...dist), ties = pad && jitter ? 3 : dist.filter(d => d - md < .02).length, guess = dist.indexOf(md);
        rows.forEach(([name, f], r) => {
          const y0 = 30 + r * 62, base = y0 + 40; let x = 150;
          txt(ctx, name, 16, base - 12, { w: r === 3 ? 700 : 500, color: r === 3 ? C.b : C.fg });
          ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(150, base); ctx.lineTo(W - 16, base); ctx.stroke();
          for (const p of f) { x += Math.min(p.g, 200) * .09 + 3; if (x > W - 20) break; ctx.fillStyle = r === 3 ? C.b : C.a; ctx.fillRect(x, base - p.s / 1500 * 38, 3, p.s / 1500 * 38); }
        });
        const orig = mys.reduce((a, p) => a + p.s, 0), padded = pad ? 1500 * mys.length : orig;
        const right = ties > 1 ? 'a coin flip between ' + ties + ' apps' : (guess === truth ? 'correct' : 'wrong, it was ' + APPS[truth].name);
        const msg = `Guess: ${APPS[guess].name} (${right}).` + (pad ? ` Padding costs +${Math.round((padded / orig - 1) * 100)}% bytes.` : '');
        txt(ctx, msg, W / 2, H - 12, { align: 'center', w: 600 });
        txt(ctx, 'bar height = packet size, spacing = time between packets', W - 16, 18, { align: 'right', size: 12, color: C.mu });
        out.textContent = msg;
      }
    };
    button(D.ctrl, 'New unknown flow', () => { fresh(); demo.draw(); });
    toggle(D.ctrl, 'Pad every packet to 1500 bytes', pad, v => { pad = v; demo.draw(); });
    toggle(D.ctrl, 'Randomize timing', jitter, v => { jitter = v; demo.draw(); });
    const out = readout(D.ctrl);
    fresh(); demo.draw();
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
