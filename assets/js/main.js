// Marks that JS is running, so hidden-until-revealed styles only apply when they can be undone
document.documentElement.classList.add('js');

// Intro: start the motion once fonts are in, so the headline doesn't jump mid-animation
(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function start() {
    root.classList.add('is-ready');
    // After the fan has opened, switch to quick hover transitions and the slow drift
    setTimeout(() => root.classList.add('is-settled'), reduce ? 0 : 1900);
  }

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  // Don't wait forever on a slow font connection
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 1200))]).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(start));
  });
})();

// Section tabs: show one section at a time after the intro, driven by the URL hash
(function () {
  const nav = document.querySelector('.section-tabs');
  if (!nav) return;
  const sections = [...document.querySelectorAll('main > section[id]')];
  const ids = sections.map(s => s.id);
  const tabs = [...nav.querySelectorAll('a')];
  const anchor = document.getElementById('sections-top');
  const labels = Object.fromEntries(tabs.map(t => [t.hash.slice(1), t.textContent.replace(/^\d+/, '').trim()]));

  document.documentElement.classList.add('tabs-on');

  // "Next" button at the end of each section, leading to the following tab
  sections.forEach((s, i) => {
    const next = sections[i + 1];
    if (!next) return;
    const a = document.createElement('a');
    a.className = 'next-tab';
    a.href = '#' + next.id;
    a.innerHTML = `<span><small>Next</small><b>${labels[next.id]}</b></span><i aria-hidden="true">&rarr;</i>`;
    s.appendChild(a);
  });

  function show(id, scroll) {
    if (!ids.includes(id)) id = 'about';
    sections.forEach(s => s.classList.toggle('is-active', s.id === id));
    tabs.forEach(t => t.setAttribute('aria-current', String(t.hash === '#' + id)));
    // Keep the active tab visible in the bar on narrow screens (scroll the bar only, never the page)
    const current = tabs.find(t => t.hash === '#' + id);
    const track = nav.querySelector('.tabs-track');
    if (current && track.scrollWidth > track.clientWidth) {
      track.scrollTo({ left: current.offsetLeft - (track.clientWidth - current.offsetWidth) / 2 });
    }
    if (scroll) window.scrollTo({ top: anchor.offsetTop, behavior: 'smooth' });
  }

  // Any link to a section (intro cards, menu, ME badge, tabs, buttons) switches tabs
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!ids.includes(id)) return;
    e.preventDefault();
    if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    show(id, true);
  });

  window.addEventListener('popstate', () => show(location.hash.slice(1), true));

  // Arriving with a hash (e.g. "Back to portfolio" from a case study) opens that tab
  const start = location.hash.slice(1);
  show(start, false);
  if (ids.includes(start)) {
    window.addEventListener('load', () => window.scrollTo({ top: anchor.offsetTop, behavior: 'instant' }));
  }
})();

// Sections: fade content up as it scrolls into view
(function () {
  const items = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach(el => io.observe(el));
})();

// Videos: load and play only while on screen (saves data on phones), poster only for reduced motion
(function () {
  const videos = document.querySelectorAll('video[data-autoplay]');
  if (!videos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) {
    videos.forEach(v => v.play().catch(() => {}));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.play().catch(() => {});
      else target.pause();
    });
  }, { threshold: 0.25 });
  videos.forEach(v => io.observe(v));
})();
