(function () {
  /* ---------- New pages open at the top ----------
     Keep the browser's place only for Back/Forward, and honor #section links. */
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const key = 'y:' + location.pathname;
    const nav = performance.getEntriesByType('navigation')[0];
    const go = y => window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    if (nav && nav.type === 'back_forward') {
      let y = 0; try { y = +sessionStorage.getItem(key) || 0; } catch (_) {}
      go(y); addEventListener('load', () => go(y));
    } else if (!location.hash) {
      go(0);
    }
    addEventListener('pagehide', () => { try { sessionStorage.setItem(key, String(scrollY)); } catch (_) {} });
  } catch (_) {}

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Toast ---------- */
  const toast = document.createElement('div');
  toast.className = 'toast'; toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  let toastT;
  function say(msg, ms) {
    toast.textContent = msg; toast.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('on'), ms || 2600);
  }

  /* ---------- Project preview that follows the cursor ---------- */
  const list = document.querySelector('.projects');
  if (list && finePointer) {
    list.classList.add('has-peek');
    const peek = document.createElement('div');
    peek.className = 'peek'; peek.setAttribute('aria-hidden', 'true');
    const pimg = document.createElement('img'); pimg.alt = '';
    peek.appendChild(pimg); document.body.appendChild(peek);
    let tx = 0, ty = 0, x = 0, y = 0, raf = null, on = false;
    const loop = () => {
      x += (tx - x) * (reduce ? 1 : .18); y += (ty - y) * (reduce ? 1 : .18);
      peek.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      raf = (Math.abs(tx - x) > .3 || Math.abs(ty - y) > .3) ? requestAnimationFrame(loop) : null;
    };
    const place = e => {
      const w = peek.offsetWidth || 280, h = peek.offsetHeight || 210;
      const lr = list.getBoundingClientRect();
      tx = Math.min(lr.right - w, innerWidth - w - 16); // pinned to the right edge of the list
      ty = Math.max(16, Math.min(e.clientY - h / 2, innerHeight - h - 16));
      if (!on) { x = tx; y = ty; }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    list.querySelectorAll('.proj').forEach(a => {
      const src = a.dataset.img;
      if (src) { const i = new Image(); i.src = src; }
      a.addEventListener('mouseenter', e => { if (!src) return; pimg.src = src; place(e); on = true; peek.classList.add('on'); });
      a.addEventListener('mousemove', place);
      a.addEventListener('mouseleave', () => { on = false; peek.classList.remove('on'); });
    });
  }

  /* ---------- Copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const text = b.dataset.copy;
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e2) {} t.remove();
    }
    const was = b.textContent; b.textContent = 'Copied!'; b.classList.add('done');
    setTimeout(() => { b.textContent = was; b.classList.remove('done'); }, 1800);
  }));

  /* ---------- Inspect mode ---------- */
  const btn = document.getElementById('inspectBtn');
  if (!btn) return;
  const ix = document.createElement('div'); ix.className = 'ix'; ix.setAttribute('aria-hidden', 'true');
  ix.innerHTML = '<div class="ix-grid">' + '<i></i>'.repeat(12) + '</div><div class="ix-box"></div><div class="ix-gap"><b></b></div><div class="ix-tag"></div>';
  document.body.appendChild(ix);
  const grid = ix.querySelector('.ix-grid'), box = ix.querySelector('.ix-box'), tag = ix.querySelector('.ix-tag'), gap = ix.querySelector('.ix-gap');
  const PICK = 'h1, h2, h3, p, li, dt, dd, a, button, img, mark, figure, .stat > div, .num, .note, .btn, .frame';
  const weights = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extrabold', 900: 'Black' };
  let active = false, last = null;

  function placeGrid() {
    const w = document.querySelector('main .col') || document.querySelector('.col');
    if (!w) return;
    const r = w.getBoundingClientRect();
    grid.style.left = r.left + 'px'; grid.style.width = r.width + 'px';
  }
  const r0 = n => Math.round(n);

  function show(el) {
    if (!el || el === last) return; last = el;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    Object.assign(box.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const cs = getComputedStyle(el);
    let parts;
    if (el.tagName === 'IMG') parts = ['Image', r0(r.width) + ' × ' + r0(r.height)];
    else {
      const fs = parseFloat(cs.fontSize), lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
      parts = [r0(fs) + ' / ' + r0(lh), weights[cs.fontWeight] || cs.fontWeight, r0(r.width) + ' × ' + r0(r.height)];
      if (cs.color === 'rgb(0, 48, 135)') parts.push('JB blue');
    }
    tag.innerHTML = parts.map(p => '<span>' + p + '</span>').join('');
    tag.style.display = 'flex';
    const tw = tag.offsetWidth;
    tag.style.left = Math.max(8, Math.min(r.left, innerWidth - tw - 8)) + 'px';
    tag.style.top = (r.top > 34 ? r.top - 28 : r.bottom + 6) + 'px';
    // spacing to whatever sits below it
    let nx = el.nextElementSibling;
    while (nx && !nx.getBoundingClientRect().height) nx = nx.nextElementSibling;
    const g = nx ? nx.getBoundingClientRect().top - r.bottom : 0;
    if (nx && g >= 2 && g < 400) {
      Object.assign(gap.style, { display: 'block', left: (r.left + Math.min(40, r.width / 2)) + 'px', top: r.bottom + 'px', height: g + 'px' });
      gap.querySelector('b').textContent = r0(g);
    } else gap.style.display = 'none';
  }
  function hide() { last = null; box.style.display = tag.style.display = gap.style.display = 'none'; }

  function onMove(e) {
    const t = e.target.closest ? e.target.closest(PICK) : null;
    t ? show(t) : hide();
  }
  function onClick(e) {
    if (e.target.closest('#inspectBtn')) return;
    // links and buttons pause while inspecting, so a tap shows specs instead of navigating
    if (e.target.closest('a, button, summary')) { e.preventDefault(); e.stopPropagation(); }
    onMove(e);
  }
  function onKey(e) { if (e.key === 'Escape') set(false); }

  function set(on) {
    active = on;
    document.documentElement.classList.toggle('inspecting', on);
    btn.setAttribute('aria-pressed', String(on));
    if (on) {
      placeGrid();
      addEventListener('pointermove', onMove, { passive: true });
      addEventListener('click', onClick, true);
      addEventListener('keydown', onKey);
      addEventListener('resize', placeGrid);
      addEventListener('scroll', hide, { passive: true });
      say(finePointer ? 'Inspect is on. Hover anything to see how it’s built.' : 'Inspect is on. Tap anything to see how it’s built.', 3200);
    } else {
      hide();
      removeEventListener('pointermove', onMove);
      removeEventListener('click', onClick, true);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', placeGrid);
      removeEventListener('scroll', hide);
      say('Inspect is off.', 1400);
    }
  }
  btn.addEventListener('click', () => set(!active));
  addEventListener('keydown', e => {
    if ((e.key === 'i' || e.key === 'I') && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest('input, textarea, [contenteditable]')) set(!active);
  });
})();
