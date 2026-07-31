/* ============================================================
   Portfolio — state machine
   view:  cases | shots
   open:  ""  | <case-id>            (a case opened; shots have no open state)
   Cases are password-gated (session). Shots are always open.
   ============================================================ */
(() => {
  'use strict';

  const PASSWORD = 'wannaseethisattmpt';
  let unlocked = sessionStorage.getItem('cases_unlocked') === '1';

  const range = (from, to, dir) =>
    Array.from({ length: to - from + 1 }, (_, i) => `assets/cases/${dir}/${String(from + i).padStart(2, '0')}.webp`);

  const CASES = [
    {
      id: 'hornybox', icon: 'hornybox', title: 'HornyBox', caption: 'top-up store',
      coverType: 'hornybox',
      tags: ['PRODUCT', 'B2C', 'UX/UI', 'RESEARCH'],
      desc: "Public website redesign for a gaming top-up service. Reworked the user flow, page structure, and visual language. Improved trust and clarity for an audience that can't top up directly in-game. Designed responsive layouts for desktop and mobile. Coordinated with marketing on campaign",
      capLeft: 'How to design a gaming store that grows with the business',
      capRight: 'A redesign focused on business scalability and service functionality improvements',
      pages: range(31, 60, 'hornybox'),
    },
    {
      id: 'hornybox-b2b', icon: 'hornybox', title: 'HornyBox', caption: "B2B products and DS’s",
      coverImg: 'assets/cases/hornybox-b2b/cover.webp',
      tags: ['PRODUCT', 'B2B', 'UX/UI', 'RESEARCH', 'DESIGN SYSTEM'],
      desc: 'Design infrastructure for a game account top-up service. Two design systems: a base system (30+ components) and a product-specific system (15+ components tailored to the service’s logic). Atomic architecture, two levels of variables, and tokens passed via JSON. And admin panel.',
      pages: range(1, 31, 'hornybox-b2b'),
    },
    {
      id: 'viviash', icon: 'viviash', title: 'Viviash', caption: 'clothes brand',
      tags: ['PRODUCT', 'B2C', 'UX/UI', 'RESEARCH', 'AI', 'IDENTITY'],
      desc: 'E-commerce project design. Creation of a logo and brand identity for a clothing brand. The project showcases work on the interface, user flow, AI-generated content, and much more.',
      pages: range(1, 21, 'viviash'),
    },
    {
      id: 'attmpt', icon: 'attmpt', title: 'Attmpt', caption: 'personal project',
      tags: ['PERSONAL', 'UX/UI', 'GRAPHICS', 'FIGMA PLUGIN'],
      desc: 'A personal project that served as a space for visual experimentation and a collection of graphic design solutions. I also developed and designed an app and a Figma plugin for photo and video editing.',
      pages: range(1, 13, 'attmpt'),
    },
  ];

  /* Shots — masonry canvas of real works (images + animated GIFs) */
  const SHOT_IMAGES = Array.from({ length: 86 }, (_, i) => `assets/shots/s${String(i + 1).padStart(2, '0')}.webp`);
  const SHOT_GIFS   = Array.from({ length: 14 }, (_, i) => `assets/shots/g${String(i + 1).padStart(2, '0')}.gif`);
  // interleave a gif after roughly every 4 images so animations spread across the grid
  const SHOTS = (() => {
    const out = []; let g = 0;
    SHOT_IMAGES.forEach((src, i) => {
      out.push({ src, gif: false });
      if ((i + 1) % 4 === 0 && g < SHOT_GIFS.length) out.push({ src: SHOT_GIFS[g++], gif: true });
    });
    while (g < SHOT_GIFS.length) out.push({ src: SHOT_GIFS[g++], gif: true });
    return out;
  })();
  const SHOTS_BADGES = ['GRAPHICS', 'LOGOS', 'POSTERS', 'STICKERS'];
  const SHOTS_TEXT = 'Collection of various posters, animations,<br>graphic shots, AI-generated content, stickers<br>and other works';

  const SOCIALS = [
    { id: 'linkedin', icon: 'linkedin', label: 'Linkedin', href: 'https://www.linkedin.com/in/sergei-gorbachenko-ba36a6270/' },
    { id: 'telegram', icon: 'telegram', label: 'Telegram', href: 'https://telegram.me/weaknessxd' },
    { id: 'mail', icon: 'mail', label: 'Email', value: 'serega.gorbachenko@gmail.com', copy: true },
  ];

  const ICONS = {
    hornybox: { src: 'assets/HornyBox.svg', w: 2.7 },
    viviash:  { src: 'assets/Viviash.svg',  w: 3.4 },
    attmpt:   { src: 'assets/Attmpt.svg',   w: 2.6 },
    linkedin: { src: 'assets/linkdin.svg',  w: 1.8 },
    telegram: { src: 'assets/telegram.svg', w: 2.0 },
    mail:     { src: 'assets/Mail.svg',     w: 2.0 },
  };
  const icon = key => `<img src="${ICONS[key].src}" style="width:${ICONS[key].w}rem" alt="" />`;

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const app       = $('.app');
  const caseList  = $('#caseList');
  const meta      = $('#meta');
  const panel     = $('#panel');
  const socialsEl = $('#socials');
  const shotsView = $('#shotsView');

  let view = 'cases';
  let open = '';

  /* ---------- shared fragments ---------- */
  const PIXELS = '<span class="ci-pixels"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>';
  const CORNERS = '<span class="fc fc--tl"></span><span class="fc fc--tr"></span><span class="fc fc--bl"></span><span class="fc fc--br"></span>';
  const CLOSE = '<button class="cv-close" aria-label="Close"><img src="assets/close.svg" alt="" /></button>';

  function caseItemHTML(it, i) {
    return `
      <li class="case-item" data-id="${it.id}" role="button" tabindex="0" style="animation-delay:${0.1 + i * 0.07}s">
        <span class="ci-icon">${icon(it.icon)}</span>
        <span class="ci-body"><span class="ci-title">${it.title}</span><span class="ci-cap">${it.caption}</span></span>
        ${PIXELS}
      </li>`;
  }
  function renderLists() {
    caseList.innerHTML = CASES.map(caseItemHTML).join('');
  }
  function renderSocials() {
    socialsEl.innerHTML = SOCIALS.map(s => {
      const inner = `<span class="s-icon"><img src="${ICONS[s.icon].src}" alt="" /></span><span class="s-label">${s.label}</span>`;
      if (s.copy) {
        return `<button class="social" data-id="${s.id}" data-value="${s.value}">
          <span class="copied-badge">COPIED <img src="assets/chevron.svg" alt="" /></span>${inner}</button>`;
      }
      return `<a class="social" href="${s.href}" target="_blank" rel="noopener">${inner}</a>`;
    }).join('');
  }

  /* ---------- shots canvas (masonry) ---------- */
  function renderShots() {
    const tiles = SHOTS.map((s, i) =>
      `<div class="shot${s.gif ? ' shot--gif' : ''}" style="animation-delay:${(i % 12) * 0.03}s"><img src="${s.src}" loading="lazy" decoding="async" alt="" /></div>`
    ).join('');
    shotsView.innerHTML = `
      <div class="shots-scroll">
        <div class="shots-canvas">${tiles}</div>
      </div>
      <div class="shots-meta">
        <div class="badge-row">${SHOTS_BADGES.map(b => `<span class="badge">${b}</span>`).join('')}</div>
        <p class="bio">${SHOTS_TEXT}</p>
      </div>`;
    // desktop: fade meta on scroll
    const scroller = $('.shots-scroll', shotsView);
    const metaEl = $('.shots-meta', shotsView);
    scroller.addEventListener('scroll', () => {
      const o = Math.max(0, 1 - scroller.scrollTop / 160);
      metaEl.style.opacity = o;
      metaEl.style.pointerEvents = o < 0.1 ? 'none' : '';
    }, { passive: true });
  }

  /* ---------- switch CASES / SHOTS ---------- */
  function switchView(next) {
    if (next === view) return;
    if (open) closeDetail();
    view = next;
    app.dataset.view = next;
    if (next === 'cases') {
      $$('.case-item', caseList).forEach((el, i) => {
        el.style.animation = 'none'; void el.offsetWidth;
        el.style.animation = `itemIn .5s var(--ease-out) ${0.04 + i * 0.06}s forwards`;
      });
    } else {
      // restart shot entrance
      $$('.shot', shotsView).forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
      const sc = $('.shots-scroll', shotsView); if (sc) sc.scrollTop = 0;
      const m = $('.shots-meta', shotsView); if (m) { m.style.opacity = ''; m.style.pointerEvents = ''; }
    }
  }

  /* ---------- case cover ---------- */
  function coverHTML(it) {
    if (it.coverType === 'hornybox') {
      return `
        <div class="cover cover--hornybox">
          <div class="cover-wave"><svg viewBox="0 0 1988.52 636.345" preserveAspectRatio="none"><use href="#ic-hb-wave"/></svg></div>
          <div class="cover-word">
            <span class="wl"><svg viewBox="0 0 688.922 224.609"><use href="#ic-hb-horny"/></svg></span>
            <span class="wr"><svg viewBox="0 0 440.594 224.609"><use href="#ic-hb-box"/></svg></span>
          </div>
          <p class="cover-cap cover-cap--l">${it.capLeft}</p>
          <p class="cover-cap cover-cap--r">${it.capRight}</p>
          <div class="cover-girl"><img src="assets/case_cover_girl.png" alt="" /></div>
        </div>`;
    }
    if (it.coverImg) {
      return `<div class="case-cover-img"><img src="${it.coverImg}" alt="" /></div>`;
    }
    return '';   // Viviash / Attmpt — first page already serves as the cover
  }

  function pagesHTML(it) {
    if (!it.pages || !it.pages.length) return '';
    return `<div class="case-pages">${it.pages.map(src => `<img src="${src}" loading="lazy" decoding="async" alt="" />`).join('')}</div>`;
  }

  /* ---------- open / close ---------- */
  function metaHTML(tags, desc) {
    return `
      <div class="cv-tags">${tags.map(t => `<span class="cv-tag">${t}</span>`).join('')}</div>
      <p class="cv-desc">${desc}</p>`;
  }

  function pwHTML() {
    return `
      <div class="pw-lock">
        <div class="pw-box">
          <input class="pw-input" type="text" placeholder="password" autocomplete="off" spellcheck="false" />
          <button class="pw-go" aria-label="Unlock"><img src="assets/chevron.svg" alt="" /></button>
        </div>
      </div>`;
  }

  function openCase(it) {
    open = it.id;
    app.dataset.open = it.id;
    markActive(caseList, it.id);
    meta.innerHTML = metaHTML(it.tags, it.desc);

    const locked = !unlocked;
    panel.innerHTML = `
      <header class="cv-head">
        <span class="ci-icon">${icon(it.icon)}</span>
        <span class="ci-body"><span class="ci-title">${it.title}</span><span class="ci-cap">${it.caption}</span></span>
      </header>
      <div class="cv-head-meta">${metaHTML(it.tags, it.desc)}</div>
      <div class="case-frame ${locked ? 'is-locked' : ''}">
        ${CORNERS}
        <div class="frame-scroll">
          ${coverHTML(it)}
          ${locked ? '' : pagesHTML(it)}
        </div>
        ${locked ? pwHTML() : ''}
      </div>
      ${CLOSE}`;
    afterOpen(it);
  }

  function afterOpen(it) {
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.remove('opening'); void panel.offsetWidth;
    panel.classList.add('opening');
    const scroller = panel.querySelector('.frame-scroll');
    if (scroller) scroller.scrollTop = 0;
    panel.scrollTop = 0;
    if (window.matchMedia('(max-width:1024px)').matches) document.body.style.overflow = 'hidden';

    const lock = panel.querySelector('.pw-lock');
    if (lock) {
      const input = lock.querySelector('.pw-input');
      const go = lock.querySelector('.pw-go');
      const submit = () => tryUnlock(it, input, lock);
      go.addEventListener('click', submit);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      setTimeout(() => input.focus(), 60);
    }
  }

  function tryUnlock(it, input, lock) {
    if (input.value.trim() === PASSWORD) {
      unlocked = true;
      sessionStorage.setItem('cases_unlocked', '1');
      lock.classList.add('unlocking');
      const frame = panel.querySelector('.case-frame');
      // inject pages under the (still blurred) cover, then fade the lock away
      const scroller = panel.querySelector('.frame-scroll');
      scroller.insertAdjacentHTML('beforeend', pagesHTML(it));
      setTimeout(() => { frame.classList.remove('is-locked'); lock.remove(); }, 500);
    } else {
      lock.querySelector('.pw-box').classList.remove('shake'); void lock.offsetWidth;
      lock.querySelector('.pw-box').classList.add('shake');
      input.value = '';
    }
  }

  function closeDetail() {
    open = '';
    app.dataset.open = '';
    panel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    markActive(caseList, null);
    setTimeout(() => { if (!open) panel.innerHTML = ''; }, 350);
  }

  function markActive(list, id) {
    $$('.case-item', list).forEach(el => el.classList.toggle('is-active', el.dataset.id === id));
  }

  /* ---------- socials copy (email only) ---------- */
  function copySocial(btn) {
    if (btn.classList.contains('copied')) return;
    navigator.clipboard?.writeText(btn.dataset.value).catch(() => {});
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 1400);
  }

  /* ---------- events ---------- */
  const isMobile = () => window.matchMedia('(max-width:1024px)').matches;

  function activateItem(item) {
    const id = item.dataset.id;
    if (id === open) return;
    const it = CASES.find(c => c.id === id);
    if (it) openCase(it);
  }

  document.addEventListener('click', e => {
    const copyBtn = e.target.closest('.social[data-value]');
    if (copyBtn) { copySocial(copyBtn); return; }

    if (e.target.closest('.cv-close')) { closeDetail(); return; }
    if (e.target.closest('.pw-lock')) return;   // password UI handles itself

    const item = e.target.closest('.case-item');
    if (item) { if (!open || !isMobile()) activateItem(item); return; }

    const tab = e.target.closest('.nav-tab[data-tab]');
    if (tab) { switchView(tab.dataset.tab); return; }

    const edge = e.target.closest('.nav-edge');
    if (edge) { switchView(view === 'cases' ? 'shots' : 'cases'); return; }

    // click outside the case container → close (cases view, desktop)
    if (open && !e.target.closest('.panel, .meta')) closeDetail();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) closeDetail();
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest && e.target.closest('.case-item');
      if (item && !open) { e.preventDefault(); activateItem(item); }
    }
  });

  /* ============================================================
     Custom cursor — 16×16, iPadOS-style magnet
     ============================================================ */
  function initCursor() {
    if (!window.matchMedia('(hover: hover) and (min-width: 1025px)').matches) return;
    const cur = document.createElement('div');
    cur.id = 'cursor';
    document.body.appendChild(cur);

    const MAGNET_R_REM = 2.4;
    let mx = -100, my = -100, cx = -100, cy = -100, magnetEl = null;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cur.classList.remove('hidden'); });
    document.addEventListener('mouseleave', () => cur.classList.add('hidden'));

    const CLICKABLE = '.case-item, .nav-tab, .nav-edge, .social, .cv-close, .pw-go';

    function nearestClickable() {
      let best = null, bestD = Infinity;
      const rpx = MAGNET_R_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);
      for (const el of document.querySelectorAll(CLICKABLE)) {
        if (!el.getClientRects().length) continue;
        if (getComputedStyle(el).opacity === '0') continue;
        const r = el.getBoundingClientRect();
        const px = Math.max(r.left, Math.min(mx, r.right));
        const py = Math.max(r.top,  Math.min(my, r.bottom));
        const d = Math.hypot(mx - px, my - py);
        if (d < bestD) { bestD = d; best = { el, px, py }; }
      }
      return bestD <= rpx ? best : null;
    }

    function spawnRipple(el, px, py) {
      const r = el.getBoundingClientRect();
      const rip = document.createElement('div');
      rip.className = 'cursor-ripple';
      rip.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
      const dot = document.createElement('span');
      dot.style.cssText = `left:${px - r.left}px;top:${py - r.top}px;--rs:${Math.hypot(r.width, r.height) * 1.5}px`;
      rip.appendChild(dot);
      document.body.appendChild(rip);
      setTimeout(() => rip.remove(), 650);
    }

    function frame() {
      const hit = nearestClickable();
      const el = hit ? hit.el : null;
      if (el !== magnetEl) {
        magnetEl?.classList.remove('is-cursor-hover');
        magnetEl = el;
        if (el) { el.classList.add('is-cursor-hover'); spawnRipple(el, hit.px, hit.py); }
      }
      cur.classList.toggle('cursor--stuck', !!hit);
      const tx = hit ? hit.px : mx, ty = hit ? hit.py : my, k = hit ? 0.35 : 0.6;
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      cur.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- proportional root scale ---------- */
  function setScale() {
    const ref = window.innerWidth <= 1024 ? 44 : 192;
    document.documentElement.style.fontSize = (window.innerWidth / ref) + 'px';
  }
  window.addEventListener('resize', setScale);
  setScale();

  /* ---------- boot ---------- */
  renderLists();
  renderSocials();
  renderShots();
  initCursor();
  requestAnimationFrame(() => $$('.reveal').forEach(el => el.classList.add('in')));
})();
