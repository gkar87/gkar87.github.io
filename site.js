// Site behaviour shared by every page: theme toggle, reading progress, active nav link,
// reveal-on-scroll, publication filters and the hero network animation. No libraries.
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- theme toggle (remembers the choice on this device only)
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  const btn = document.querySelector('.theme');
  if (btn) {
    const dark = () => root.dataset.theme ? root.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const label = () => btn.setAttribute('aria-label', dark() ? 'Switch to light theme' : 'Switch to dark theme');
    label();
    btn.addEventListener('click', () => {
      root.dataset.theme = dark() ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      label();
      document.dispatchEvent(new Event('themechange'));
    });
  }

  // ---- reading progress bar in the header
  const bar = document.querySelector('.progress');
  if (bar) {
    const upd = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h) : 0);
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // ---- reveal on scroll
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    els.forEach(e => e.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(e => io.observe(e));
    // fallback for browsers that skip observer callbacks: reveal anything scrolled into view
    const check = () => {
      let left = 0;
      els.forEach(e => {
        if (e.classList.contains('in')) return;
        left++;
        const r = e.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) e.classList.add('in');
      });
      if (!left) removeEventListener('scroll', onScroll);
    };
    let t = 0;
    const onScroll = () => { if (!t) t = setTimeout(() => { t = 0; check(); }, 150); };
    addEventListener('scroll', onScroll, { passive: true });
    setTimeout(check, 600);
  }

  // ---- highlight the nav link of the section on screen (home page only)
  if ('IntersectionObserver' in window) {
    const links = [...document.querySelectorAll('nav a[href^="#"]')];
    const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (secs.length) {
      const so = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(s => so.observe(s));
    }
  }

  // ---- research map filter
  const rmap = document.querySelector('.rmap');
  if (rmap) rmap.querySelectorAll('.rm-filter button').forEach(b => b.addEventListener('click', () => {
    rmap.dataset.f = b.dataset.f;
    rmap.querySelectorAll('.rm-filter button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
  }));

  // ---- publication filters and search
  const tools = document.querySelector('.pubtools');
  if (tools) {
    const q = tools.querySelector('input');
    const btns = [...tools.querySelectorAll('button')];
    const groups = [...document.querySelectorAll('.pubgroup')];
    const count = document.querySelector('.pubcount');
    let kind = 'all';
    const run = () => {
      const term = (q.value || '').trim().toLowerCase();
      let n = 0;
      groups.forEach(g => {
        const okKind = kind === 'all' || g.dataset.kind === kind;
        let shown = 0;
        g.querySelectorAll('ol.pubs > li').forEach(li => {
          const ok = okKind && (!term || li.textContent.toLowerCase().includes(term));
          li.hidden = !ok; if (ok) shown++;
        });
        g.hidden = shown === 0; n += shown;
      });
      if (count) count.textContent = n + (n === 1 ? ' item' : ' items') + ' shown';
    };
    btns.forEach(b => b.addEventListener('click', () => {
      kind = b.dataset.kind;
      btns.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      run();
    }));
    q.addEventListener('input', run);
    run();
  }

  // ---- hero: a quiet network of sensing nodes; pulses travel between neighbours,
  //      and the few red nodes stand for devices that do not behave as they claim.
  const cv = document.getElementById('hero-net');
  if (cv && cv.getContext) {
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, nodes = [], pulses = [], raf = 0;
    const col = () => {
      const s = getComputedStyle(root);
      return { a: s.getPropertyValue('--accent').trim(), b: s.getPropertyValue('--accent-3').trim(),
               r: s.getPropertyValue('--accent-2').trim() };
    };
    let C = col();
    document.addEventListener('themechange', () => { C = col(); if (reduce) frame(); });
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.round(Math.min(70, W * H / 16000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
        bad: Math.random() < .06
      }));
    };
    const R = 130;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < R) {
          ctx.globalAlpha = (1 - d / R) * .35; ctx.strokeStyle = C.a;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (!reduce && Math.random() < .0009) pulses.push({ a, b, t: 0 });
        }
      }
      ctx.globalAlpha = 1;
      pulses = pulses.filter(p => (p.t += .012) < 1);
      for (const p of pulses) {
        ctx.fillStyle = p.a.bad || p.b.bad ? C.r : C.b;
        ctx.beginPath(); ctx.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 2.4, 0, 7); ctx.fill();
      }
      for (const p of nodes) {
        ctx.fillStyle = p.bad ? C.r : C.a; ctx.globalAlpha = p.bad ? .9 : .55;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.bad ? 3 : 2.2, 0, 7); ctx.fill();
        if (p.bad) { ctx.globalAlpha = .25; ctx.strokeStyle = C.r; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
    }
    size(); frame();
    let to;
    addEventListener('resize', () => { clearTimeout(to); to = setTimeout(() => { cancelAnimationFrame(raf); size(); frame(); }, 150); });
    document.addEventListener('visibilitychange', () => {
      if (reduce) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    });
  }
})();
