// Reveal-on-scroll for figures and charts; everything shows at once without IntersectionObserver or with reduced motion.
{
  const els = document.querySelectorAll('.reveal');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) {
    els.forEach(e => e.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    els.forEach(e => io.observe(e));
  }
}
