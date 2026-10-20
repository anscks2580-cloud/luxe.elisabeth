/* LUXE ELISABETH — 화면 구성
 * data/dresses.js 의 데이터를 읽어 첫 화면 슬라이드, 신규 입고, 시즌 컬렉션, 시그니처, 방문 안내를 만든다.
 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const { reduce, coarse } = window.LuxeFabric || { reduce: false, coarse: false };
  const mobile = () => matchMedia('(max-width:900px)').matches;

  /* ───────── 데이터 ─────────
   * 나중에 관리자 페이지·DB를 붙이면 이 함수만 서버 요청(fetch)으로 바꾸면 된다. */
  function loadData() { return Promise.resolve(window.LUXE_DATA); }

  function prepare(raw) {
    const seasons = (raw.seasons || []).filter(s => s.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    const sid = new Map(seasons.map(s => [s.id, s]));
    const dresses = (raw.dresses || []).filter(d => d.visible !== false && d.image)
      .map(d => Object.assign({ details: [], categories: [] }, d, { seasonObj: sid.get(d.season) || null }))
      .sort((a, b) => String(b.arrived || '').localeCompare(String(a.arrived || '')));
    return { raw, seasons, dresses, cats: raw.categories || {} };
  }
  const fmtDate = d => d ? d.slice(0, 7).replace('-', '.') : '';
  const seasonName = s => s ? `${s.title} ${s.year || ''}`.trim() : '';
  const catNames = (d, cats) => d.categories.map(c => cats[c] || c).join(' · ');

  /* ───────── 1. 원단 ─────────
   * 첫 화면에만 움직이는 원단(WebGL). 다른 구역은 같은 원단의 정지 그림자(css)를 은은하게 이어 쓴다. */
  function initFabric() {
    const F = window.LuxeFabric, c = document.getElementById('fabricHero'); if (!F || !c) return;
    let hero;
    try { hero = new F.Fabric(c, { bg: '#ECE6DC', end: '#F5F1EB', fade: 1, swag: 1, breeze: coarse }); }
    catch (e) { c.remove(); console.warn('원단 효과를 끄고 정지 이미지로 대체합니다', e.message); return; }
    if (reduce || coarse) return;
    // 마우스: 원단의 주름·자락이 밀리고(가로), 겹 사이 깊이가 달라짐(세로)
    addEventListener('pointermove', e => { if (e.pointerType === 'mouse') hero.pointer(e.clientX, e.clientY); }, { passive: true });
  }

  /* ───────── 2. 첫 화면 슬라이드 ───────── */
  function initSlider(data) {
    const stage = $('#stage');
    const list = data.dresses.filter(d => d.hero).sort((a, b) => (a.heroOrder || 99) - (b.heroOrder || 99));
    if (!list.length) { stage.innerHTML = ''; $('#ctrl').hidden = true; return; }
    stage.innerHTML = list.map((d, i) => `<figure class="slide${i === 0 ? ' on' : ''}" aria-roledescription="slide" aria-label="${i + 1} / ${list.length}: ${esc(d.name)}">
      <img src="${esc(d.image)}" alt="${esc(d.name)} 웨딩드레스" style="object-position:${esc(d.focus || '50% 30%')}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>`).join('');
    const slides = [...stage.children];
    const bar = $('#slBar'), now = $('#slNow'), count = $('#slCount'), pauseBtn = $('#slPause'), icon = $('#slPauseIcon');
    const HOLD = 7000;
    let idx = 0, elapsed = 0, last = performance.now(), userPaused = reduce, hover = false, inView = true;
    const pad = n => String(n).padStart(2, '0');
    const label = () => {
      const d = list[idx];
      count.textContent = `${pad(idx + 1)} / ${pad(list.length)}`;
      now.style.opacity = 0;
      setTimeout(() => { now.innerHTML = `<b>${esc(d.name)}</b>${esc(seasonName(d.seasonObj))}`; now.style.opacity = 1; }, reduce ? 0 : 350);
    };
    const go = n => {
      const prev = slides[idx]; idx = (n + list.length) % list.length; const next = slides[idx];
      if (prev === next) return;
      slides.forEach(s => s.classList.remove('off'));
      prev.classList.remove('on'); prev.classList.add('off');
      // 다음 장을 다시 확대 상태에서 시작
      const im = next.querySelector('img'); im.style.transition = 'none'; next.classList.remove('on'); void im.offsetWidth; im.style.transition = '';
      next.classList.add('on');
      const pre = slides[(idx + 1) % list.length].querySelector('img'); pre.loading = 'eager';
      elapsed = 0; label();
    };
    const setPaused = p => { userPaused = p; pauseBtn.setAttribute('aria-pressed', p); pauseBtn.setAttribute('aria-label', p ? '자동 넘김 시작' : '자동 넘김 멈춤'); icon.setAttribute('d', p ? 'M5 3.5v9l7-4.5z' : 'M6 4v8M10 4v8'); };
    setPaused(userPaused);
    $('#slPrev').onclick = () => go(idx - 1);
    $('#slNext').onclick = () => go(idx + 1);
    pauseBtn.onclick = () => setPaused(!userPaused);
    stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    stage.addEventListener('pointerleave', () => hover = false);
    let sx = null;
    stage.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    stage.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 45) go(idx + (dx < 0 ? 1 : -1)); sx = null; });
    new IntersectionObserver(es => inView = es[0].isIntersecting).observe(stage);
    const tick = t => {
      const dt = t - last; last = t;
      if (!userPaused && !hover && inView && !document.hidden && list.length > 1) {
        elapsed += dt; if (elapsed >= HOLD) go(idx + 1);
      }
      bar.style.width = (list.length > 1 ? Math.min(1, elapsed / HOLD) * 100 : 100) + '%';
      requestAnimationFrame(tick);
    };
    label(); requestAnimationFrame(tick);
  }

  /* ───────── 공통: 드레스 타일 ───────── */
  const tile = (d, data, opt = {}) => `
    <figure class="zoom ${opt.cls || ''}" data-id="${esc(d.id)}" ${opt.attr || ''}>
      <button type="button" class="tile" data-open="${esc(d.id)}" data-img="${esc(opt.img || d.image)}" aria-label="${esc(d.name)} 자세히 보기">
        <span class="ph"><img src="${esc(opt.img || d.image)}" alt="${esc(opt.alt || d.name + ' 웨딩드레스')}" loading="lazy" decoding="async"></span>
      </button>
      ${opt.noCap ? (opt.miniCap ? `<figcaption class="cap"><span>${esc(opt.miniCap)}</span></figcaption>` : '') :
      `<figcaption class="cap"><span><b>${esc(d.name)}</b>${opt.sub ? `<span class="sub">${esc(opt.sub)}</span>` : ''}</span><small>${esc(d.id)}</small></figcaption>`}
    </figure>`;

  /* ───────── 3. 신규 입고 ───────── */
  function renderNew(data) {
    const list = data.dresses.filter(d => d.isNew);
    const grid = $('#newGrid');
    if (!list.length) { grid.innerHTML = '<p class="empty">새로 입고된 드레스를 준비 중입니다.</p>'; return; }
    const sub = d => [seasonName(d.seasonObj), d.arrived ? fmtDate(d.arrived) + ' 입고' : ''].filter(Boolean).join(' · ');
    const [lead, second, ...rest] = list;
    grid.innerHTML =
      tile(lead, data, { cls: 'lead rv', sub: sub(lead) }) +
      (second ? tile(second, data, { cls: 'second rv', sub: sub(second) }) : '') +
      (rest.length ? `<div class="rest" style="--n:${Math.min(4, Math.max(3, rest.length))}">${rest.map(d => tile(d, data, { cls: 'rv', sub: sub(d) })).join('')}</div>` : '');
    const seasons = [...new Set(list.map(d => seasonName(d.seasonObj)).filter(Boolean))];
    $('#newMeta').textContent = `${seasons.join(' · ')}${seasons.length ? ' — ' : ''}${list.length} gowns`;
  }

  /* ───────── 4. 시즌 컬렉션 ───────── */
  function renderSeasons(data) {
    const tabs = $('#tabs'), panel = $('#season');
    const seasons = data.seasons.filter(s => data.dresses.some(d => d.season === s.id));
    if (!seasons.length) { tabs.hidden = true; panel.innerHTML = '<p class="empty">컬렉션을 준비 중입니다.</p>'; return; }
    tabs.innerHTML = seasons.map((s, i) => {
      const n = data.dresses.filter(d => d.season === s.id).length;
      return `<button type="button" role="tab" id="tab-${esc(s.id)}" aria-controls="season" aria-selected="${i === 0}" data-s="${esc(s.id)}" tabindex="${i === 0 ? 0 : -1}">
        <span class="y">${esc(s.year || '')}</span><span class="t">${esc(s.title)}<sup>${String(n).padStart(2, '0')}</sup></span></button>`;
    }).join('');
    let current = null, filter = 'all';
    const draw = (id, animate) => {
      const s = seasons.find(x => x.id === id) || seasons[0];
      const items = data.dresses.filter(d => d.season === s.id);
      const used = new Set(items.flatMap(d => d.categories));
      const cover = s.cover || items[0].image;
      const coverDress = items.find(d => d.image === cover) || items[0];
      const html = `
        <div class="s-intro">
          <figure class="cover">${tile(coverDress, data, { img: cover, noCap: true, alt: seasonName(s) + ' 대표 이미지' })}</figure>
          <div class="info">
            <span class="label">${esc(s.period || '')}</span>
            <div class="s-year">${esc(s.year || '')}</div>
            <div class="s-title">${esc(s.title)}</div>
            ${s.note ? `<p style="color:var(--stone);max-width:26em">${esc(s.note)}</p>` : ''}
            <div class="filters" role="group" aria-label="소재별 보기">
              <button type="button" data-f="all" aria-pressed="true">All<sup> ${String(items.length).padStart(2, '0')}</sup></button>
              ${Object.keys(data.cats).map(c => `<button type="button" data-f="${esc(c)}" aria-pressed="false" ${used.has(c) ? '' : 'disabled'}>${esc(data.cats[c])}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="s-gallery">${items.map(d => tile(d, data, { cls: 'item', attr: `data-c="${esc(d.categories.join(' '))}"`, sub: catNames(d, data.cats) })).join('')}</div>`;
      const apply = () => { panel.innerHTML = html; panel.setAttribute('aria-labelledby', 'tab-' + s.id); filter = 'all'; bindFilters(); };
      if (animate && !reduce) { panel.classList.add('swap'); setTimeout(() => { apply(); requestAnimationFrame(() => panel.classList.remove('swap')); }, 420); }
      else apply();
      current = s.id;
    };
    const bindFilters = () => panel.querySelectorAll('.filters button').forEach(b => b.onclick = () => {
      filter = b.dataset.f;
      panel.querySelectorAll('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
      panel.querySelectorAll('.s-gallery .item').forEach(it => it.hidden = filter !== 'all' && !it.dataset.c.split(' ').includes(filter));
    });
    const select = (btn, focus) => {
      tabs.querySelectorAll('[role=tab]').forEach(t => { const on = t === btn; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
      if (focus) btn.focus();
      if (btn.dataset.s !== current) draw(btn.dataset.s, true);
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b) select(b); });
    tabs.addEventListener('keydown', e => {
      const all = [...tabs.querySelectorAll('[role=tab]')], i = all.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select(all[(i + 1) % all.length], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(all[(i - 1 + all.length) % all.length], true); }
    });
    draw(seasons[0].id, false);
  }

  /* ───────── 5. 시그니처 ───────── */
  function renderSignature(data) {
    const list = data.dresses.filter(d => d.signature).sort((a, b) => (a.signatureOrder || 99) - (b.signatureOrder || 99)).slice(0, 4);
    const tiles = [];
    list.forEach(d => {
      tiles.push(tile(d, data, { cls: 'main rv s' + (tiles.length + 1), sub: catNames(d, data.cats) }));
      if (d.details[0]) tiles.push(tile(d, data, { cls: 'det rv s' + (tiles.length + 1), img: d.details[0], noCap: true, miniCap: 'Detail — ' + d.name, alt: d.name + ' 디테일' }));
    });
    $('#sigGrid').innerHTML = tiles.join('');
    if (!list.length) $('#signature').hidden = true;
  }

  /* ───────── 6. 방문 안내 ───────── */
  function renderVisit(data) {
    const b = data.raw.brand || {};
    const v = (val, what) => val ? esc(val) : `<span class="todo">${what} — 업체 확인 후 입력</span>`;
    $('#facts').innerHTML = `
      <div><dt>Location</dt><dd>${v(b.address, '주소')}</dd></div>
      <div><dt>Hours</dt><dd>${v(b.hours, '운영 시간')}</dd></div>
      <div><dt>Booking</dt><dd>${v(b.booking, '예약 방법')}</dd></div>
      <div><dt>Instagram</dt><dd>${esc(b.instagramHandle || '')}</dd></div>`;
    if (b.instagram) ['#cta', '#lbAsk'].forEach(s => $(s).href = b.instagram);
    $('#fAddr').innerHTML = b.address ? esc(b.address) + (b.phone ? ' · ' + esc(b.phone) : '') : '<span class="todo">주소 · 연락처 — 업체 확인 후 입력</span>';
    document.querySelectorAll('[data-sample]').forEach(el => el.hidden = !data.raw.sample);
  }

  /* ───────── 7. 크게 보기 ───────── */
  function initLightbox(data) {
    const lb = $('#lb'), img = $('#lbImg');
    let group = [], gi = 0, pics = [], pi = 0, lastFocus = null;
    const show = () => {
      const d = group[gi]; pics = [d.image, ...d.details];
      pi = Math.min(pi, pics.length - 1);
      img.style.opacity = 0;
      const src = pics[pi];
      const done = () => { img.style.opacity = 1; };
      img.onload = done; img.src = src; img.alt = d.name; if (img.complete) done();
      $('#lbId').textContent = d.id;
      $('#lbName').textContent = d.name;
      $('#lbMeta').textContent = [seasonName(d.seasonObj), catNames(d, data.cats), d.arrived ? fmtDate(d.arrived) + ' 입고' : ''].filter(Boolean).join(' · ');
      $('#lbThumbs').innerHTML = pics.length > 1 ? pics.map((p, i) => `<button type="button" aria-label="사진 ${i + 1}" aria-current="${i === pi}" data-i="${i}"><img src="${esc(p)}" alt=""></button>`).join('') : '';
    };
    const open = (id, src, scope) => {
      group = scope && scope.length ? scope : data.dresses;
      gi = Math.max(0, group.findIndex(d => d.id === id));
      pics = [group[gi].image, ...group[gi].details]; pi = Math.max(0, pics.indexOf(src));
      lastFocus = document.activeElement; show();
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; $('#lbClose').focus();
    };
    const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
    const step = n => { gi = (gi + n + group.length) % group.length; pi = 0; show(); };
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-open]'); if (!t) return;
      // 같은 구역 안의 드레스끼리 넘겨보기
      const sec = t.closest('section');
      const ids = [...new Set([...sec.querySelectorAll('[data-open]')].filter(x => !x.closest('[hidden]')).map(x => x.dataset.open))];
      open(t.dataset.open, t.dataset.img, ids.map(id => data.dresses.find(d => d.id === id)).filter(Boolean));
    });
    $('#lbThumbs').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { pi = +b.dataset.i; show(); } });
    $('#lbClose').onclick = close; $('#lbPrev').onclick = () => step(-1); $('#lbNext').onclick = () => step(1);
    lb.querySelector('.lb-view').addEventListener('click', e => { if (e.target === e.currentTarget) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) { if (e.key === 'Escape') setMenu(false); return; }
      if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1);
    });
    let sx = null;
    lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });
  }

  /* ───────── 메뉴·등장 ───────── */
  const nav = $('#nav'), menuBtn = $('#menuBtn'), sheet = $('#sheet');
  function setMenu(open) { document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기'); sheet.setAttribute('aria-hidden', !open); }
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  const onScroll = () => nav.classList.toggle('solid', scrollY > innerHeight * 0.6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  function reveal() {
    const els = document.querySelectorAll('.rv:not(.in)');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); io.observe(el); });
  }

  loadData().then(raw => {
    const data = prepare(raw || { seasons: [], dresses: [] });
    initFabric();
    initSlider(data);
    renderNew(data);
    renderSeasons(data);
    renderSignature(data);
    renderVisit(data);
    initLightbox(data);
    reveal();
  });
})();
