// Live illustration "chain", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 21. A toy ledger: tamper with a block, or check in a cloned device
  demos.chain = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
    const NB = 5, BW = 118, GAP = 20, X0 = 20;
    let blocks = [], clone = false, check = null, tamperNext = 1;
    const build = () => {
      blocks = []; let prev = '00000000';
      for (let i = 0; i < NB; i++) { const data = `cam-0${i + 1}|fp:${fnv('dev' + i).slice(0, 6)}`; const h = fnv(prev + data); blocks.push({ data, prev, h }); prev = h; }
      check = null;
    };
    const valid = i => { const b = blocks[i]; return fnv(b.prev + b.data) === b.h && (i === 0 || b.prev === blocks[i - 1].h); };
    const tamper = i => { const b = blocks[i]; b.data = b.data.replace(/fp:\w+/, 'fp:' + fnv(Math.random() + '').slice(0, 6)); b.h = fnv(b.prev + b.data); };
    const checkIn = () => {
      const i = Math.floor(Math.random() * NB), rec = blocks[i].data.split('fp:')[1];
      const seen = clone ? fnv('clone' + Math.random()).slice(0, 6) : rec;
      check = { dev: 'cam-0' + (i + 1), rec, seen, ok: seen === rec };
    };
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        txt(ctx, 'Ledger of device identities (click a block to tamper with it)', X0, 22, { size: 12, color: C.mu });
        blocks.forEach((b, i) => {
          const x = X0 + i * (BW + GAP), y = 36, ok = valid(i);
          rr(ctx, x, y, BW, 112, 8); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = ok ? C.c : C.b; ctx.lineWidth = 2; ctx.stroke();
          const [dev, fp] = b.data.split('|');
          txt(ctx, dev, x + 10, y + 20, { w: 700, size: 13 });
          txt(ctx, fp, x + 10, y + 40, { mono: 1, size: 12 });
          txt(ctx, 'prev ' + b.prev, x + 10, y + 64, { mono: 1, size: 11, color: C.mu });
          txt(ctx, 'hash ' + b.h, x + 10, y + 82, { mono: 1, size: 11, color: ok ? C.fg : C.b });
          txt(ctx, ok ? 'valid' : 'broken', x + 10, y + 102, { size: 11, w: 700, color: ok ? C.c : C.b });
          if (i) { ctx.strokeStyle = b.prev === blocks[i - 1].h ? C.mu : C.b; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - GAP, y + 56); ctx.lineTo(x, y + 56); ctx.stroke(); }
        });
        const broken = blocks.findIndex((b, i) => !valid(i));
        let msg = broken < 0 ? 'Chain intact.' : `Block ${broken + 1} no longer matches the hash its neighbor recorded: the edit shows.`;
        // check-in panel
        const py = 170;
        rr(ctx, X0, py, W - 2 * X0, 86, 10); ctx.fillStyle = C.soft; ctx.fill();
        if (!check) txt(ctx, 'Press "A device checks in" to compare its live traffic fingerprint with the ledger.', X0 + 14, py + 46, { size: 13, color: C.mu });
        else {
          txt(ctx, `${check.dev} checks in with a valid credential.`, X0 + 14, py + 24, { size: 13, w: 600 });
          txt(ctx, `fingerprint on ledger: ${check.rec}   ·   fingerprint seen on the network: ${check.seen}`, X0 + 14, py + 48, { size: 12, mono: 1 });
          txt(ctx, check.ok ? 'Match: accepted.' : 'Mismatch: right credential, wrong behavior. Flagged as a possible clone.', X0 + 14, py + 72, { size: 13, w: 700, color: check.ok ? C.c : C.b });
          msg += ' ' + (check.ok ? 'Check-in accepted.' : 'Check-in flagged as a possible clone.');
        }
        txt(ctx, 'Toy hash (FNV-1a), not cryptographic. Fingerprints are invented.', X0, H - 10, { size: 11, color: C.mu });
        out.textContent = msg;
      }
    };
    button(D.ctrl, 'Tamper with a block', () => { tamper(tamperNext); tamperNext = (tamperNext + 2) % NB; demo.draw(); });
    button(D.ctrl, 'Rebuild the chain', () => { build(); demo.draw(); });
    button(D.ctrl, 'A device checks in', () => { checkIn(); demo.draw(); });
    toggle(D.ctrl, 'Attacker cloned a device', clone, v => { clone = v; check = null; demo.draw(); });
    D.cv.addEventListener('click', e => { const p = D.pos(e); const i = Math.floor((p.x - X0) / (BW + GAP)); if (p.y > 36 && p.y < 148 && i >= 0 && i < NB) { tamper(i); demo.draw(); } });
    const out = readout(D.ctrl);
    build(); demo.draw();
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
