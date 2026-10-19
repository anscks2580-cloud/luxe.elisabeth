/* LUXE ELISABETH — 시안 A·B 공용 기능
 *  - 데이터 정리(LX.data)
 *  - 사진 자리(LX.slot): 사진이 없거나 경로가 틀려도 깨진 아이콘 없이 빈 자리 유지
 *  - 확인용 표시(?guides): 사진 자리 이름·입력 필요 항목을 점선으로 표시
 *  - 메뉴(모바일 시트), 현재 섹션 표시, 등장 효과 관찰
 *  - 시즌 탭(키보드 ← → 지원) — 기존 사이트의 탭 동작을 그대로 옮김
 *  - 드레스 상세 보기(라이트박스) — 기존 사이트의 썸네일 전환·이전/다음·Esc·스와이프 유지
 *  - 첫 화면 슬라이드 — 기존 사이트의 자동 넘김·멈춤·진행 막대 유지(사진 2장 이상일 때만)
 *  - 상담 문의 작성 — 입력한 내용을 문장으로 정리해 복사하고 인스타그램을 연다
 *  - 원단(js/fabric.js) 연결
 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const roman = n => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n - 1] || String(n);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const guides = /[?&]guides\b/.test(location.search);
  if (guides) document.documentElement.classList.add('guides');

  /* ───────── 데이터 ───────── */
  function prepare(raw) {
    raw = raw || {};
    const seasons = (raw.seasons || []).filter(s => s.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
    const looks = [];
    seasons.forEach(s => {
      s.looks = (s.looks || []).filter(l => l.visible !== false).map((l, i) => Object.assign({ details: [] }, l, { season: s, n: i + 1 }));
      looks.push(...s.looks);
    });
    return {
      raw,
      contact: raw.contact || {},
      hero: (raw.hero || []).filter(Boolean),
      ceo: raw.ceo || {},
      brands: (raw.brands || []).filter(b => !b.hidden).map((b, i) => Object.assign({}, b, { n: i + 1, display: b.name || 'Brand ' + roman(i + 1) })),
      buying: (raw.buying || []).filter(b => !b.hidden).map((b, i) => Object.assign({ lookbook: [] }, b, { n: i + 1, display: b.name || 'Designer ' + pad(i + 1) })),
      seasons, looks,
      celebs: (raw.celebrities || []).filter(c => !c.hidden).map((c, i) => Object.assign({}, c, { n: i + 1 })),
      stores: (raw.stores || []).filter(s => !s.hidden).map((s, i) => Object.assign({ interior: [] }, s, { n: i + 1, display: s.name || s.nameKo || s.placeholder || 'Store ' + pad(i + 1) })),
      consult: raw.consult || {}
    };
  }
  const seasonName = s => s ? `${s.title} ${s.year || ''}`.trim() : '';
  const lookName = l => l.name || 'Look ' + pad(l.n);

  /* ───────── 사진 자리 ─────────
   * name : 사진 자리 이름(코드 주석·확인용 표시에 사용)  ratio : '4/5' 같은 가로/세로
   * src  : 사진 경로(null 이면 빈 자리)  alt : 대체 글  cls : 추가 클래스  pos : object-position */
  function slot(o) {
    const has = !!o.src;
    return `<!-- IMAGE SLOT: ${esc(o.name)} -->` +
      `<figure class="slot ${has ? 'has-img' : 'is-empty'} ${o.cls || ''}" data-slot="${esc(o.name)}" data-ratio="${esc(o.ratio || '')}" style="${o.ratio ? `--ratio:${o.ratio};` : ''}${o.style || ''}">` +
      (has ? `<img src="${esc(o.src)}" alt="${esc(o.alt || '')}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"${o.pos ? ` style="object-position:${esc(o.pos)}"` : ''}>` : '') +
      `<span class="slot-mark" aria-hidden="true"></span></figure>`;
  }
  // 사진 파일이 없거나 경로가 틀리면 빈 자리로 되돌림(깨진 아이콘 방지)
  document.addEventListener('error', e => {
    const im = e.target;
    if (im && im.tagName === 'IMG' && im.closest('.slot')) {
      const f = im.closest('.slot'); im.remove(); f.classList.remove('has-img'); f.classList.add('is-empty');
      if (guides) console.warn('사진을 불러오지 못해 빈 자리로 표시합니다:', im.getAttribute('src'));
    }
  }, true);

  /* 입력 필요 값: 값이 있으면 그대로, 없으면 visitor 에게는 fallback(없으면 감춤), ?guides 에서는 점선 표시 */
  function val(v, label, fallback) {
    if (v != null && v !== '') return esc(v);
    // 글 자리: 사진 자리처럼 빈 줄(가는 선)로 자리만 보여줌 — 방문자에게 안내 문구는 보이지 않음
    if (fallback === 'lines') return `<span class="todo tl" data-todo="${esc(label)}" aria-hidden="true"><i></i><i></i><i></i></span>`;
    if (fallback === 'line') return `<span class="todo tl one" data-todo="${esc(label)}" aria-hidden="true"><i></i></span>`;
    return `<span class="todo" data-todo="${esc(label)}">${fallback ? esc(fallback) : ''}</span>`;
  }
  // 임시 문구 표시(draft) — ?guides 에서만 점선
  const draft = (on, html) => on ? `<span class="draft" data-todo="임시 문구 — 확인 후 교체">${html}</span>` : html;

  /* ───────── 메뉴 ───────── */
  function initMenu() {
    const btn = $('#menuBtn'), sheet = $('#sheet');
    if (!btn || !sheet) return;
    const set = open => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      sheet.setAttribute('aria-hidden', !open);
      if ('inert' in sheet) sheet.inert = !open;
    };
    set(false);
    btn.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    sheet.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { set(false); btn.focus(); } });
    LX.closeMenu = () => set(false);
  }

  /* 현재 보고 있는 섹션 → 메뉴에 aria-current, body[data-section] */
  function initSpy(onChange) {
    const secs = $$('main section[id][data-nav]');
    const links = $$('a[href^="#"]').filter(a => secs.some(s => '#' + s.id === a.getAttribute('href')));
    let cur = null;
    const set = id => {
      if (id === cur) return; cur = id;
      links.forEach(a => a.getAttribute('href') === '#' + id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
      document.body.dataset.section = id || '';
      onChange && onChange(id, secs.findIndex(s => s.id === id));
    };
    const check = () => {
      const y = innerHeight * 0.38; let id = null;
      secs.forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) id = s.id; });
      set(id);
    };
    addEventListener('scroll', check, { passive: true }); addEventListener('resize', check); check();
  }

  /* 등장 효과: .rv 가 화면에 들어오면 .in */
  function reveal(root = document) {
    const els = $$('.rv:not(.in)', root);
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
    // 빠르게 스크롤하거나 메뉴로 건너뛰어도 지나온 내용이 비어 보이지 않도록: 화면 위쪽에 있는 것은 모두 표시
    let pend = false;
    const sweep = () => { pend = false; const lim = innerHeight * 0.94; $$('.rv:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < lim) { el.classList.add('in'); io.unobserve(el); } }); };
    if (!reveal.bound) { reveal.bound = true; addEventListener('scroll', () => { if (!pend) { pend = true; setTimeout(sweep, 120); } }, { passive: true }); }
  }

  /* ───────── 첫 화면 슬라이드(사진 2장 이상일 때) ───────── */
  function initHeroSlides(stage, list, ui) {
    const imgs = list.filter(h => h.image);
    if (imgs.length < 2) { if (ui && ui.root) ui.root.hidden = true; return; }
    if (ui && ui.root) ui.root.hidden = false;
    const slides = $$('.hero-slide', stage);
    const HOLD = 7000;
    let idx = 0, elapsed = 0, last = performance.now(), paused = reduce, hover = false;
    // 사진을 못 불러온 장(빈 자리)은 건너뜀
    const usable = i => !slides[i].querySelector('.slot.is-empty');
    const go = n => {
      const dir = n < idx ? -1 : 1; let k = (n + slides.length) % slides.length, t = 0;
      while (!usable(k) && t++ < slides.length) k = (k + dir + slides.length) % slides.length;
      slides[idx].classList.remove('on'); idx = k; slides[idx].classList.add('on'); elapsed = 0;
      if (ui.count) ui.count.textContent = `${pad(idx + 1)} / ${pad(slides.length)}`;
    };
    const setP = p => { paused = p; if (ui.pause) { ui.pause.setAttribute('aria-pressed', p); ui.pause.setAttribute('aria-label', p ? '자동 넘김 시작' : '자동 넘김 멈춤'); ui.pause.classList.toggle('paused', p); } };
    setP(paused);
    ui.prev && (ui.prev.onclick = () => go(idx - 1));
    ui.next && (ui.next.onclick = () => go(idx + 1));
    ui.pause && (ui.pause.onclick = () => setP(!paused));
    stage.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    stage.addEventListener('pointerleave', () => hover = false);
    let sx = null;
    stage.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    stage.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 45) go(idx + (dx < 0 ? 1 : -1)); sx = null; });
    const tick = t => {
      const dt = t - last; last = t;
      if (!paused && !hover && !document.hidden) { elapsed += dt; if (elapsed >= HOLD) go(idx + 1); }
      if (ui.bar) ui.bar.style.transform = `scaleX(${Math.min(1, elapsed / HOLD)})`;
      requestAnimationFrame(tick);
    };
    go(0); requestAnimationFrame(tick);
  }

  /* ───────── 시즌 탭 ─────────
   * render(season) 이 패널 HTML 을 돌려주면 탭 전환·키보드 이동·전환 효과를 처리 */
  function initSeasonTabs(tabsEl, panelEl, seasons, renderTab, renderPanel, after) {
    if (!seasons.length) { tabsEl.hidden = true; panelEl.innerHTML = '<p class="empty">새 컬렉션을 준비하고 있습니다.</p>'; return; }
    tabsEl.innerHTML = seasons.map((s, i) => `<button type="button" role="tab" id="tab-${esc(s.id)}" aria-controls="${panelEl.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-s="${esc(s.id)}">${renderTab(s, i)}</button>`).join('');
    let current = null;
    const draw = (s, animate) => {
      const apply = () => { panelEl.innerHTML = renderPanel(s); panelEl.setAttribute('aria-labelledby', 'tab-' + s.id); after && after(panelEl, s); };
      if (animate && !reduce) { panelEl.classList.add('swap'); setTimeout(() => { apply(); requestAnimationFrame(() => requestAnimationFrame(() => panelEl.classList.remove('swap'))); }, 380); }
      else apply();
      current = s.id;
    };
    const select = (btn, focus) => {
      $$('[role=tab]', tabsEl).forEach(t => { const on = t === btn; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
      if (focus) btn.focus();
      if (btn.dataset.s !== current) draw(seasons.find(s => s.id === btn.dataset.s), true);
    };
    tabsEl.addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b) select(b); });
    tabsEl.addEventListener('keydown', e => {
      const all = $$('[role=tab]', tabsEl), i = all.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select(all[(i + 1) % all.length], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(all[(i - 1 + all.length) % all.length], true); }
    });
    draw(seasons[0], false);
    LX.selectSeason = id => { const b = $(`[data-s="${CSS.escape(id)}"]`, tabsEl); if (b) select(b); };
  }

  /* ───────── 드레스 상세 보기 ─────────
   * [data-look="LE-0101"] 를 누르면 열림. 같은 구역 안의 룩끼리 이전/다음으로 넘겨봄. */
  function initLightbox(data, opt = {}) {
    const lb = $('#lb'); if (!lb) return;
    const view = $('#lbView'), thumbs = $('#lbThumbs');
    let group = [], gi = 0, pi = 0, lastFocus = null;
    const pics = l => [l.image, ...(l.details || [])];
    const show = () => {
      const l = group[gi], ps = pics(l);
      pi = Math.min(pi, ps.length - 1);
      view.innerHTML = slot({ name: `LOOK ${l.id} ${pi === 0 ? 'MAIN' : 'DETAIL ' + pi}`, ratio: opt.ratio || '2/3', src: ps[pi], alt: lookName(l) + (pi ? ' 디테일' : ''), cls: 'lb-slot', eager: true });
      $('#lbId').textContent = l.id;
      $('#lbName').innerHTML = l.name ? esc(l.name) : `${esc(lookName(l))}${guides ? ' <span class="todo" data-todo="드레스 이름"></span>' : ''}`;
      $('#lbMeta').innerHTML = [seasonName(l.season), l.designer ? esc(l.designer) : (guides ? '<span class="todo" data-todo="디자이너"></span>' : '')].filter(Boolean).map(x => `<span>${x}</span>`).join('');
      $('#lbCount').textContent = `${pad(gi + 1)} / ${pad(group.length)}`;
      thumbs.innerHTML = ps.length > 1 ? ps.map((p, i) => `<button type="button" aria-label="${i === 0 ? '전체 사진' : '디테일 ' + i}" aria-current="${i === pi}" data-i="${i}">${slot({ name: `LOOK ${l.id} THUMB ${i}`, ratio: '3/4', src: p, alt: '' })}<span class="t-label">${i === 0 ? 'Full' : 'Detail ' + i}</span></button>`).join('') : '';
    };
    const open = (id, scopeIds) => {
      group = (scopeIds && scopeIds.length ? scopeIds : data.looks.map(l => l.id)).map(x => data.looks.find(l => l.id === x)).filter(Boolean);
      gi = Math.max(0, group.findIndex(l => l.id === id)); pi = 0;
      lastFocus = document.activeElement; show();
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); if ('inert' in lb) lb.inert = false;
      document.body.style.overflow = 'hidden'; $('#lbClose').focus();
    };
    const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); if ('inert' in lb) lb.inert = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
    const step = n => { gi = (gi + n + group.length) % group.length; pi = 0; show(); };
    if ('inert' in lb) lb.inert = true;
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-look]'); if (!t) return;
      e.preventDefault();
      const scope = t.closest('[data-look-scope]') || t.closest('section');
      const ids = [...new Set($$('[data-look]', scope).filter(x => !x.closest('[hidden]')).map(x => x.dataset.look))];
      open(t.dataset.look, ids);
    });
    thumbs.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { pi = +b.dataset.i; show(); } });
    $('#lbClose').onclick = close; $('#lbPrev').onclick = () => step(-1); $('#lbNext').onclick = () => step(1);
    $('#lbAsk').onclick = e => { e.preventDefault(); const l = group[gi]; close(); LX.askAbout && LX.askAbout(l.id); };
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-backdrop')) close(); });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Tab') { // 포커스 가두기
        const f = $$('button,a[href],[tabindex]:not([tabindex="-1"])', lb).filter(x => x.offsetParent !== null);
        if (!f.length) return; const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    let sx = null;
    lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); sx = null; });
    LX.openLook = id => open(id);
  }

  /* ───────── 상담 문의 작성 ─────────
   * 서버가 없으므로 '보내기' 대신: 입력 내용을 문장으로 정리 → 복사 → 인스타그램(또는 등록된 연락 수단) 열기 */
  function initConsult(data) {
    const form = $('#consultForm'); if (!form) return;
    const c = data.contact, out = $('#consultPreview'), status = $('#consultStatus');
    const sel = $('#cfInterest');
    if (sel) sel.innerHTML = '<option value="">선택해 주세요</option>' + (data.consult.interests || []).map(x => `<option>${esc(x)}</option>`).join('');
    const dateEl = $('#cfDate');
    if (dateEl) { const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); dateEl.min = t.toISOString().slice(0, 10); }
    const text = () => {
      const f = Object.fromEntries(new FormData(form).entries());
      const lines = ['[LUXE ELISABETH 상담 문의]'];
      if (f.name) lines.push('성함: ' + f.name);
      if (f.date) lines.push('희망 날짜: ' + f.date.replace(/-/g, '.') + (f.time ? ' ' + f.time : ''));
      else if (f.time) lines.push('희망 시간대: ' + f.time);
      if (f.wedding) lines.push('예식 시기: ' + f.wedding);
      if (f.interest) lines.push('관심 분야: ' + f.interest);
      if (f.look) lines.push('관심 드레스 번호: ' + f.look);
      if (f.message) lines.push('메모: ' + f.message);
      return lines.length > 1 ? lines.join('\n') : '';
    };
    const upd = () => { const t = text(); out.textContent = t || '입력하신 내용이 여기에 정리됩니다.'; out.classList.toggle('filled', !!t); };
    form.addEventListener('input', upd); upd();
    const copy = async t => {
      try { await navigator.clipboard.writeText(t); return true; }
      catch (e) {
        const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} ta.remove(); return ok;
      }
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const t = text();
      if (!t) { status.textContent = '희망 날짜나 관심 드레스 중 하나 이상 적어 주세요.'; status.dataset.state = 'warn'; return; }
      const ok = await copy(t);
      status.textContent = ok ? '문의 내용을 복사했습니다. 인스타그램 메시지 창에 붙여 넣어 보내 주세요.' : '복사가 되지 않았습니다. 위 내용을 길게 눌러 복사해 주세요.';
      status.dataset.state = ok ? 'ok' : 'warn';
      if (c.instagram) window.open(c.instagram, '_blank', 'noopener');
    });
    // 연락 수단 버튼: 값이 있는 것만
    const ways = $('#consultWays');
    if (ways) {
      const list = [];
      if (c.instagram) list.push(`<a href="${esc(c.instagram)}" target="_blank" rel="noopener" data-way="instagram"><span class="w-k">Instagram</span><span class="w-v">${esc(c.instagramHandle || '')}</span></a>`);
      if (c.kakao) list.push(`<a href="${esc(c.kakao)}" target="_blank" rel="noopener" data-way="kakao"><span class="w-k">KakaoTalk</span><span class="w-v">카카오톡 채널</span></a>`);
      if (c.phone) list.push(`<a href="tel:${esc(c.phone.replace(/[^0-9+]/g, ''))}" data-way="phone"><span class="w-k">Call</span><span class="w-v">${esc(c.phone)}</span></a>`);
      if (c.email) list.push(`<a href="mailto:${esc(c.email)}" data-way="email"><span class="w-k">Email</span><span class="w-v">${esc(c.email)}</span></a>`);
      if (guides) ['phone', 'kakao', 'email'].filter(k => !c[k]).forEach(k => list.push(`<span class="todo" data-todo="${({ phone: '전화번호', kakao: '카카오톡 채널', email: '이메일' })[k]} — 받으면 data/site-data.js contact 에 입력"></span>`));
      ways.innerHTML = list.join('');
    }
    LX.askAbout = id => {
      const lk = $('#cfLook'); if (lk) lk.value = id;
      const it = $('#cfInterest'); if (it && !it.value) it.value = (data.consult.interests || [])[0] || '';
      upd();
      const sec = $('#consultation'); sec && sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(() => ($('#cfDate') || lk).focus({ preventScroll: true }), reduce ? 0 : 700);
    };
  }

  /* 상담 버튼(떠 있는 버튼): 첫 화면을 지나면 보이고, 상담 구역에서는 숨김 */
  function initFloat(btn) {
    if (!btn) return;
    const hero = $('.hero'), sec = $('#consultation');
    const upd = () => {
      const past = hero ? hero.getBoundingClientRect().bottom < innerHeight * 0.4 : true;
      const r = sec && sec.getBoundingClientRect();
      const inC = r && r.top < innerHeight * 0.8 && r.bottom > 0;
      btn.classList.toggle('show', past && !inC);
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ───────── 원단 ─────────
   * js/fabric.js(기존 4차 원단: 천장 스왜그·커튼·오간자 + 마우스 변위장)를 그대로 사용 */
  function fabric(canvas, opt, follow) {
    const F = window.LuxeFabric; if (!F || !canvas) return null;
    let f;
    try { f = new F.Fabric(canvas, Object.assign({ breeze: coarse }, opt)); }
    catch (e) { canvas.remove(); console.warn('원단 효과를 끄고 대체 배경을 사용합니다:', e.message); return null; }
    if (!reduce && !coarse && follow !== false) addEventListener('pointermove', e => { if (e.pointerType === 'mouse') f.pointer(e.clientX, e.clientY); }, { passive: true });
    canvas.classList.add('live');
    return f;
  }

  const LX = window.LX = {
    $, $$, esc, pad, roman, reduce, coarse, guides,
    data: prepare(window.LUXE_SITE),
    seasonName, lookName, slot, val, draft,
    initMenu, initSpy, reveal, initHeroSlides, initSeasonTabs, initLightbox, initConsult, initFloat, fabric
  };
})();
