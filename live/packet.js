// Live illustration "packet", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 3. One packet, which device? Nearest-centroid on four header fields
  demos.packet = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    // illustrative header profiles, not measurements from any dataset
    const devs = [
      { n: 'Camera', f: [64, 29200, 1400, 1] },
      { n: 'Thermostat', f: [255, 4096, 120, 0] },
      { n: 'Smart plug', f: [128, 8192, 90, 0] },
      { n: 'Speaker', f: [64, 65535, 600, 1] }
    ];
    const F = ['TTL', 'TCP window', 'Length', 'DF flag'], scale = [255, 65535, 1500, 1];
    let noise = .08, pkt = null, guess = null, truth = null, ok = 0, tot = 0, dist = [];
    const send = i => {
      truth = i ?? Math.floor(Math.random() * devs.length);
      pkt = devs[truth].f.map((v, k) => k === 3 ? (Math.random() < noise * 2 ? 1 - v : v)
        : Math.max(0, Math.min(scale[k], Math.round(v + gauss() * noise * scale[k]))));
      dist = devs.map(d => Math.sqrt(d.f.reduce((s, v, k) => s + ((v - pkt[k]) / scale[k]) ** 2, 0)));
      guess = dist.indexOf(Math.min(...dist)); tot++; if (guess === truth) ok++;
      demo.draw();
    };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        txt(ctx, 'Packet header', 24, 30, { w: 700 });
        F.forEach((f, k) => {
          const x = 24 + k * 118; rr(ctx, x, 44, 108, 58, 8); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
          txt(ctx, f, x + 54, 64, { align: 'center', size: 12, color: C.mu });
          txt(ctx, pkt ? String(pkt[k]) : '–', x + 54, 90, { align: 'center', mono: 1, w: 700, size: 15, color: C.a });
        });
        txt(ctx, 'Distance to each device profile (shorter is a better match)', 24, 136, { w: 700 });
        const max = Math.max(.001, ...dist, .5);
        devs.forEach((d, i) => {
          const y = 152 + i * 34;
          txt(ctx, d.n, 24, y + 16, { size: 13 });
          ctx.fillStyle = C.line; rr(ctx, 120, y + 4, 330, 16, 8); ctx.fill();
          if (pkt) { ctx.fillStyle = i === guess ? (guess === truth ? C.c : C.b) : C.a; ctx.globalAlpha = i === guess ? 1 : .45; rr(ctx, 120, y + 4, Math.max(8, 330 * dist[i] / max), 16, 8); ctx.fill(); ctx.globalAlpha = 1; }
          if (pkt && i === truth) txt(ctx, 'sent it', 462, y + 16, { size: 12, color: C.mu });
        });
        const msg = pkt ? `${devs[truth].n} sent the packet; the classifier says ${devs[guess].n}${guess === truth ? ' (right)' : ' (wrong)'}. Running score: ${ok} of ${tot} correct.`
                        : 'Pick a device to send one packet.';
        txt(ctx, pkt ? (guess === truth ? 'Identified' : 'Confused') : '', W - 24, 30, { align: 'right', w: 700, color: guess === truth ? C.c : C.b });
        out.textContent = msg;
      }
    };
    devs.forEach((d, i) => button(D.ctrl, d.n, () => send(i)));
    button(D.ctrl, 'Random device', () => send());
    slider(D.ctrl, 'Network noise', 0, .3, .01, noise, v => { noise = v; ok = tot = 0; });
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
