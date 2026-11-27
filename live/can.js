// Live illustration "can", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 7. In-vehicle bus: periodic frames, an injector breaks the rhythm
  demos.can = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    // illustrative identifiers and periods (milliseconds), not taken from any real vehicle
    const ids = [{ id: '0x0C9', n: 'engine', p: 10 }, { id: '0x0F1', n: 'brakes', p: 20 }, { id: '0x1E5', n: 'steering', p: 25 }, { id: '0x3C1', n: 'body', p: 50 }];
    let now = 0, frames = [], last = {}, inject = false, flagged = 0, total = 0, win = 300;
    ids.forEach(q => { last[q.id] = -q.p; q.next = Math.random() * q.p; });
    const demo = {
      cv: D.cv,
      step() {
        now += 1;
        for (const q of ids) if (now >= q.next) { push(q.id, false); q.next = now + q.p * (1 + (Math.random() - .5) * .06); }
        if (inject && Math.random() < .5) push('0x0C9', true);
        frames = frames.filter(f => now - f.t < win);
      },
      draw() {
        ctx.clearRect(0, 0, W, H);
        const x0 = 110, x1 = W - 20, rowH = 44, X = t => x1 - (now - t) / win * (x1 - x0);
        ids.forEach((q, i) => {
          const y = 34 + i * rowH; txt(ctx, q.id, 20, y + 6, { mono: 1, w: 700, size: 13 }); txt(ctx, q.n, 20, y + 22, { size: 11, color: C.mu });
          ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(x0, y + 8); ctx.lineTo(x1, y + 8); ctx.stroke();
        });
        for (const f of frames) {
          const i = ids.findIndex(q => q.id === f.id), y = 34 + i * rowH;
          ctx.fillStyle = f.bad ? C.b : C.a; ctx.globalAlpha = f.bad ? 1 : .75; rr(ctx, X(f.t) - 3, y - 2, 6, 20, 2); ctx.fill(); ctx.globalAlpha = 1;
        }
        txt(ctx, `${win} ms of bus traffic, newest on the right`, x0, H - 14, { size: 11, color: C.mu });
        const recent = frames.filter(f => f.bad).length;
        txt(ctx, recent ? 'INTRUSION: messages arriving too fast' : 'timing normal', W - 20, H - 14, { align: 'right', w: 700, color: recent ? C.b : C.c });
        out.textContent = `Frames checked: ${total}. Flagged as arriving faster than their usual period: ${flagged}.`;
      }
    };
    function push(id, injected) {
      const q = ids.find(q => q.id === id), gap = now - last[id];
      const bad = gap < q.p * .5;                 // the detector: much faster than this identifier's usual period
      last[id] = now; total++; if (bad) flagged++;
      frames.push({ id, t: now, bad, injected });
    }
    demo.speed = 0.45;   // calm, readable pace
    loop(demo, D.ctrl);
    const ib = button(D.ctrl, 'Plug in an injector', () => { inject = !inject; ib.textContent = inject ? 'Unplug the injector' : 'Plug in an injector'; ib.classList.toggle('on', inject); });
    button(D.ctrl, 'Reset counts', () => { flagged = total = 0; demo.draw(); });
    const out = readout(D.ctrl);
    for (let i = 0; i < win; i++) demo.step();
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
