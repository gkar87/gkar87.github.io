// Live illustration "rate", generated from live.js by tools/split_live.py. Edit live.js, not this file.
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
  // 17. Sample rate vs key pitch: how much detail survives the audio path
  demos.rate = fig => {
    const D = setup(fig), { ctx, W, H } = D;
    const FS = [8000, 16000, 44100, 48000, 96000], LAB = ['8 kHz', '16 kHz', '44.1 kHz', '48 kHz', '96 kHz'], PITCH = 19, SOUND = 343000; // mm/s at about 20 °C
    let fi = 3, stereo = true, ns = false;
    // an invented keystroke: a short ringing click, reaching mic 2 120 µs after mic 1
    const click = tt => tt < 0 ? 0 : Math.exp(-tt / 90) * Math.sin(2 * Math.PI * tt / 80);
    const ARR = [50, 170], SPAN = 400, AMP = 30;
    // an invented keystroke spectrum, in kHz
    const spec = f => .9 * Math.exp(-(((f - 6) / 4.5) ** 2)) + .35 * Math.exp(-f / 9);
    const demo = {
      cv: D.cv,
      draw() {
        ctx.clearRect(0, 0, W, H);
        const fs = FS[fi], dtS = 1e6 / fs, amp = ns ? .35 : 1;
        // 1. waveforms
        const X0 = 20, X1 = 340, Xt = tt => X0 + tt / SPAN * (X1 - X0);
        txt(ctx, 'The keystroke at each microphone', X0, 20, { size: 12, color: C.mu, w: 600 });
        const lanes = stereo ? [[[ARR[0]], 'mic 1', 62], [[ARR[1]], 'mic 2', 128]] : [[ARR, 'mono mix of both', 96]];
        for (const [arrs, name, yb] of lanes) {
          const v = tt => arrs.reduce((a, r) => a + click(tt - r), 0) / arrs.length * amp;
          txt(ctx, name, X1, yb - 10, { align: 'right', size: 12, color: C.mu });
          ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X0, yb); ctx.lineTo(X1, yb); ctx.stroke();
          ctx.strokeStyle = C.mu; ctx.globalAlpha = .45; ctx.beginPath();
          for (let x = X0; x <= X1; x++) { const tt = (x - X0) / (X1 - X0) * SPAN, y = yb - arrs.reduce((a, r) => a + click(tt - r), 0) / arrs.length * AMP; x === X0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
          ctx.stroke(); ctx.globalAlpha = 1;
          ctx.strokeStyle = C.a; ctx.fillStyle = C.a; ctx.lineWidth = 2; ctx.beginPath();
          for (let tt = 0, i = 0; tt <= SPAN; tt += dtS, i++) { const x = Xt(tt), y = yb - v(tt) * AMP; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke(); ctx.lineWidth = 1;
          if (dtS > 15) for (let tt = 0; tt <= SPAN; tt += dtS) { ctx.beginPath(); ctx.arc(Xt(tt), yb - v(tt) * AMP, 2.4, 0, 7); ctx.fill(); }
        }
        txt(ctx, `gray: the sound · blue: what is recorded, ${Math.round(fs / 1000 * .4)} samples in 0.4 ms`, X0, 162, { size: 11, color: C.mu });
        // 2. spectrum
        const S0 = 384, S1 = 700, SY = 34, SH = 110, FMAX = 24, Xf = f => S0 + f / FMAX * (S1 - S0);
        txt(ctx, 'The keystroke\'s sound, by pitch', S0, 20, { size: 12, color: C.mu, w: 600 });
        const ny = fs / 2000;
        let kept = 0, tot = 0;
        for (let f = 0; f <= FMAX; f += .1) { tot += spec(f); if (f <= ny) kept += spec(f); }
        for (let f = 0; f <= FMAX; f += .25) {
          const h = spec(f) * SH, ok = f <= ny;
          ctx.fillStyle = ok ? C.c : C.line; ctx.globalAlpha = ok ? (ns ? .35 : .8) : 1;
          ctx.fillRect(Xf(f), SY + SH - h, (S1 - S0) / (FMAX / .25) + .3, h);
        }
        ctx.globalAlpha = 1; axes(ctx, S0, SY, S1 - S0, SH);
        if (ny < FMAX) { ctx.strokeStyle = C.b; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(Xf(ny), SY - 4); ctx.lineTo(Xf(ny), SY + SH); ctx.stroke(); ctx.setLineDash([]);
          txt(ctx, `cut off above ${ny % 1 ? ny.toFixed(2) : ny} kHz`, Math.min(Xf(ny) + 5, S1 - 120), SY + 8, { size: 11, color: C.b, w: 600 }); }
        for (const f of [0, 8, 16, 24]) txt(ctx, f + ' kHz', Xf(f), SY + SH + 15, { align: f ? (f === 24 ? 'right' : 'center') : 'left', size: 11, color: C.mu });
        const sound = kept / tot * (ns ? .35 : 1);
        // 3. timing resolution on the keyboard
        const res = SOUND / fs, KS = 2.05, kx = 20, ky = 196, keys = 'ASDFGHJKL';
        txt(ctx, 'One audio sample of timing, measured on the keyboard', kx, ky - 10, { size: 12, color: C.mu, w: 600 });
        for (let i = 0; i < keys.length; i++) {
          rr(ctx, kx + i * PITCH * KS + 2, ky, PITCH * KS - 4, PITCH * KS - 4, 6); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = C.mu; ctx.lineWidth = 1.2; ctx.stroke();
          txt(ctx, keys[i], kx + (i + .5) * PITCH * KS, ky + PITCH * KS / 2, { align: 'center', base: 'middle', w: 700, size: 12 });
        }
        const ty = ky + PITCH * KS + 14, kw = keys.length * PITCH * KS;
        ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(kx, ty); ctx.lineTo(kx + kw, ty); ctx.stroke();
        if (stereo) {
          ctx.strokeStyle = C.b; ctx.lineWidth = 2;
          for (let mm = 0; mm <= keys.length * PITCH + .01; mm += res) { ctx.beginPath(); ctx.moveTo(kx + mm * KS, ty - 8); ctx.lineTo(kx + mm * KS, ty + 8); ctx.stroke(); }
          ctx.lineWidth = 1;
          txt(ctx, `one tick = ${res.toFixed(1)} mm of path difference, ${(PITCH / res).toFixed(1)} ticks per key`, kx, ty + 28, { size: 12, color: C.b, w: 600 });
        } else txt(ctx, 'Mono: the two microphones are mixed, so there is no time difference left to measure.', kx, ty + 28, { size: 12, color: C.b, w: 600 });
        // 4. clue meters
        const mx = 420, mw = 270, timing = stereo ? clamp(PITCH / res / 6, 0, 1) : 0;
        txt(ctx, 'Clues left for an attacker', mx, 196, { size: 12, color: C.mu, w: 600 });
        for (const [lab, v, cc, y, note] of [['Where the key is (timing)', timing, C.a, 222, stereo ? `${(PITCH / res).toFixed(1)} samples per key` : 'gone in mono'],
                                             ['Which key it is (sound)', sound, C.c, 284, `${Math.round(sound * 100)}% of the sound kept`]]) {
          txt(ctx, lab, mx, y, { size: 13, w: 700 });
          rr(ctx, mx, y + 8, mw, 14, 7); ctx.fillStyle = C.soft; ctx.fill(); ctx.strokeStyle = C.line; ctx.stroke();
          if (v > 0) { rr(ctx, mx, y + 8, Math.max(6, v * mw), 14, 7); ctx.fillStyle = cc; ctx.fill(); }
          txt(ctx, note, mx, y + 40, { size: 12, color: C.mu });
        }
        out.textContent = `${LAB[fi]}, ${stereo ? 'two microphones' : 'mono'}${ns ? ', noise suppression on' : ''}: ` +
          (stereo ? `one sample is ${res.toFixed(1)} mm of path difference, ${(PITCH / res).toFixed(1)} samples per key; ` : 'no timing clue; ') + `${Math.round(sound * 100)}% of the keystroke sound kept.`;
      }
    };
    choice(D.ctrl, 'Sample rate', LAB, fi, i => { fi = i; demo.draw(); });
    toggle(D.ctrl, 'Two microphones', stereo, v => { stereo = v; demo.draw(); });
    toggle(D.ctrl, 'Noise suppression', ns, v => { ns = v; demo.draw(); });
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
