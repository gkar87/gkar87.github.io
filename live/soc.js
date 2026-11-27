// Live illustration "soc", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 27. Alert triage: rule severity vs model score vs model with retrieved context
  demos.soc = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    // sev: 3 high, 2 medium, 1 low. m: model score alone, c: model with context, h: with a made-up fact. All invented.
    const AL = [
      { t: 'Port scan from the internet', sev: 3, m: .42, c: .2 },
      { t: 'Antivirus found adware on a laptop', sev: 3, m: .35, c: .18 },
      { t: 'Many failed logins, one VPN address', sev: 3, m: .5, c: .3 },
      { t: 'New admin account created at 2 AM', sev: 2, m: .55, c: .93, real: 1, h: .25, note: 'no change ticket for this account' },
      { t: 'Large upload to cloud storage', sev: 2, m: .48, c: .22, h: .95, note: 'nightly backup job on the asset list', hn: 'claims it matches known malware (no record says so)' },
      { t: 'Login from a new country', sev: 2, m: .45, c: .4 },
      { t: 'Office macro opened a script', sev: 2, m: .6, c: .55 },
      { t: 'Repeated DNS lookups to a rare domain', sev: 1, m: .72, c: .88, real: 1, note: 'regular 60-second beacon from a server' },
      { t: 'Expired certificate on intranet site', sev: 1, m: .1, c: .05 },
      { t: 'Printer firmware out of date', sev: 1, m: .15, c: .08 },
      { t: 'USB drive inserted', sev: 1, m: .3, c: .15 },
      { t: 'Disabled account tried to log in', sev: 1, m: .38, c: .35 }];
    let mode = 0, k = 4, hall = false;
    const score = a => mode === 0 ? a.sev + a.m * .01 : mode === 1 ? a.m : (hall && a.h !== undefined ? a.h : a.c);
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const order = AL.slice().sort((a, b) => score(b) - score(a));
        const RH = 22, Y0 = 34;
        txt(ctx, 'Rank', 20, 22, { size: 11, color: C.mu }); txt(ctx, 'Alert', 60, 22, { size: 11, color: C.mu }); txt(ctx, 'Rule severity', 360, 22, { size: 11, color: C.mu }); txt(ctx, mode === 0 ? '' : 'Model score', 470, 22, { size: 11, color: C.mu });
        order.forEach((a, i) => {
          const y = Y0 + i * RH, rev = i < k;
          if (rev) { rr(ctx, 14, y - 1, W - 28, RH - 3, 6); ctx.fillStyle = C.soft; ctx.fill(); }
          txt(ctx, String(i + 1), 34, y + 14, { size: 12, mono: 1, align: 'right', color: rev ? C.fg : C.mu });
          txt(ctx, a.t, 60, y + 14, { size: 12, w: a.real ? 700 : 500, color: rev ? C.fg : C.mu });
          if (a.real) { ctx.fillStyle = C.b; ctx.beginPath(); ctx.arc(52, y + 10, 3.5, 0, 7); ctx.fill(); }
          const sl = ['', 'Low', 'Medium', 'High'][a.sev]; txt(ctx, sl, 360, y + 14, { size: 11, w: 600, color: a.sev === 3 ? C.b : C.mu });
          if (mode) { const v = score(a); rr(ctx, 470, y + 4, 120, 10, 4); ctx.fillStyle = C.line; ctx.fill(); rr(ctx, 470, y + 4, Math.max(2, 120 * v), 10, 4); ctx.fillStyle = C.a; ctx.fill(); }
          if (mode === 2 && a.note) txt(ctx, hall && a.hn ? a.hn : hall && a.h !== undefined && a.real ? 'claims a change ticket exists (none does)' : a.note, 600, y + 14, { size: 10, color: hall && a.h !== undefined ? C.b : C.mu });
        });
        const caught = order.slice(0, k).filter(a => a.real).length;
        const yb = Y0 + AL.length * RH + 6;
        txt(ctx, `The analyst reviews the top ${k}. Real incidents reviewed: ${caught} of 2.`, 20, yb + 12, { size: 13, w: 700, color: caught === 2 ? C.c : C.b });
        txt(ctx, 'Bold with a red dot: the two real incidents.', W - 20, yb + 12, { size: 11, color: C.mu, align: 'right' });
        out.textContent = `${['Rule severity', 'Model score', 'Model with context'][mode]}${mode === 2 && hall ? ', with invented facts' : ''}: ${caught} of 2 real incidents in the top ${k}.`;
      }
    };
    choice(D.ctrl, 'Rank by', ['Rule severity', 'Model score', 'Model + context'], mode, i => { mode = i; demo.draw(); });
    slider(D.ctrl, 'Analyst has time for', 1, 12, 1, k, v => { k = v; demo.draw(); });
    toggle(D.ctrl, 'Model invents facts', hall, v => { hall = v; demo.draw(); });
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
