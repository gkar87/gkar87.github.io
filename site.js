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
    const links = [...document.querySelectorAll('header nav a[href^="#"]')];
    const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (secs.length) {
      const so = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const id = en.target.id === 'work-with-me' ? 'contact' : en.target.id;
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(s => so.observe(s));
      const ww = document.getElementById('work-with-me'); if (ww) so.observe(ww);
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
  // ---- table of contents on project pages: mark the section being read
  const toc = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (toc.length) {
    const heads = toc.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    let tt = 0;
    const spy = () => {
      tt = 0;
      let cur = heads[0];
      for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * .3) cur = h;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = heads[heads.length - 1];
      toc.forEach(a => a.classList.toggle('active', cur && a.getAttribute('href') === '#' + cur.id));
    };
    addEventListener('scroll', () => { if (!tt) tt = requestAnimationFrame(spy); }, { passive: true }); spy();
  }

  // ---- floating back-to-top button
  const top = document.querySelector('.totop');
  if (top) {
    const show = () => top.classList.toggle('show', scrollY > innerHeight * 1.2);
    addEventListener('scroll', show, { passive: true }); show();
  }

  // ---- quick search over every page (Ctrl K, Cmd K or /)
  const me = document.currentScript || document.querySelector('script[src*="site.js"]');
  const base = me ? new URL('.', me.src) : new URL('./', location.href);
  const findBtn = document.querySelector('.find');
  let qs = null, data = null, sel = 0, items = [], lastFocus = null;
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const build = () => {
    qs = document.createElement('div'); qs.className = 'qs';
    qs.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-label="Search the site"><div class="in">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M20 20l-4.2-4.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
      '<input type="search" placeholder="Search projects, papers and sections" aria-label="Search" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="qs-list">' +
      '<button type="button" class="esc">Esc</button></div><ul id="qs-list" role="listbox"></ul>' +
      '<div class="hint"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div></div>';
    document.body.appendChild(qs);
    const inp = qs.querySelector('input'), ul = qs.querySelector('ul');
    const render = () => {
      const q = norm(inp.value.trim()), words = q.split(/\s+/).filter(Boolean);
      items = (data || []).map(e => {
        const t = norm(e.t), d = norm(e.d + ' ' + e.k);
        let sc = 0;
        for (const w of words) { if (t.includes(w)) sc += t.startsWith(w) ? 4 : 3; else if (d.includes(w)) sc += 1; else return null; }
        return { e, sc };
      }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 12).map(x => x.e);
      sel = 0;
      if (!data) { ul.innerHTML = '<li class="none">Loading…</li>'; return; }
      if (!items.length) { ul.innerHTML = '<li class="none">Nothing matches. Try fewer words.</li>'; return; }
      ul.innerHTML = items.map((e, i) => `<li role="option" id="qs-${i}"><a href="${new URL(e.u, base).href}"${i === 0 ? ' class="sel"' : ''}>` +
        `<span class="k${e.k === 'Open project' ? ' plan' : e.k === 'Section' ? ' sec' : ''}">${esc(e.k)}</span><b>${esc(e.t)}</b><small>${esc(e.d)}</small></a></li>`).join('');
      inp.setAttribute('aria-activedescendant', 'qs-0');
    };
    const move = d => {
      const as = ul.querySelectorAll('a'); if (!as.length) return;
      as[sel].classList.remove('sel'); sel = (sel + d + as.length) % as.length; as[sel].classList.add('sel');
      as[sel].scrollIntoView({ block: 'nearest' }); inp.setAttribute('aria-activedescendant', 'qs-' + sel);
    };
    inp.addEventListener('input', render);
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { const a = ul.querySelectorAll('a')[sel]; if (a) { e.preventDefault(); close(); location.href = a.href; } }
    });
    ul.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    qs.querySelector('.esc').addEventListener('click', close);
    qs.addEventListener('mousedown', e => { if (e.target === qs) close(); });
    qs.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') { const f = [...qs.querySelectorAll('input,button,a')]; const i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    qs.render = render;
  };
  const open = () => {
    if (!qs) build();
    lastFocus = document.activeElement;
    qs.classList.add('open'); document.documentElement.style.overflow = 'hidden';
    const inp = qs.querySelector('input'); inp.value = ''; qs.render(); inp.focus();
    if (!data) fetch(new URL('pages.json', base)).then(r => r.json()).then(j => { data = j; qs.render(); })
      .catch(() => { qs.querySelector('ul').innerHTML = '<li class="none">Search could not load. Use the menu above.</li>'; });
  };
  function close() { if (!qs) return; qs.classList.remove('open'); document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  if (findBtn) findBtn.addEventListener('click', open);
  if (findBtn && /Mac|iPhone|iPad/.test(navigator.platform || '')) { const k = findBtn.querySelector('kbd'); if (k) k.textContent = '⌘K'; }
  addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); qs && qs.classList.contains('open') ? close() : open(); }
    else if (e.key === '/' && !typing && !(qs && qs.classList.contains('open'))) { e.preventDefault(); open(); }
  });
})();
