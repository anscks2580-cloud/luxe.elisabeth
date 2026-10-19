/* LUXE ELISABETH — STYLE B. MODERN MINIMAL
 * data/site-data.js 를 읽어 각 구역을 그린다. 공용 기능은 js/concept-shared.js
 */
(function () {
  'use strict';
  const { $, $$, esc, pad, roman, slot, val, draft, data, guides, reduce, coarse } = window.LX;
  const LX = window.LX;

  /* ───────── 원단: 시안 B는 절제 ─────────
   * 첫 화면 가운데 좁은 세로 띠 안에서만. 흰색 톤, 천장 스왜그 끔, 마우스 반응은 유지 */
  LX.fabric($('#fabricB'), { bg: '#F6F6F4', end: '#FFFFFF', fade: 0, swag: 0, scale: coarse ? 0.45 : 0.6 });

  /* ───────── 첫 화면 ───────── */
  (function hero() {
    const stage = $('#heroStage');
    const list = data.hero.length ? data.hero : [{ image: null }];
    const withImg = list.filter(h => h.image);
    stage.innerHTML = withImg.length
      ? withImg.map((h, i) => `<div class="hero-slide${i === 0 ? ' on' : ''}">${slot({ name: 'HERO DRESS ' + (i + 1), ratio: '3/4', src: h.image, alt: h.caption || 'LUXE ELISABETH 웨딩드레스', eager: i === 0 })}</div>`).join('')
      : slot({ name: 'HERO MAIN DRESS', ratio: '3/4' });
    const s = data.seasons[0];
    $('#heroSeason').innerHTML = s ? `<span>${esc(s.year || '')}</span><span>${esc(s.title)}</span><span class="go">Collection</span>` : '';
    LX.initHeroSlides(stage, list, { root: $('#heroCtrl'), count: $('#heroCount'), bar: $('#heroBar'), prev: $('#heroPrev'), next: $('#heroNext'), pause: $('#heroPause') });
  })();

  /* 위쪽 진행 막대: 페이지를 얼마나 읽었는지 */
  const bar = $('#progress');
  const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  /* ───────── 01 CEO ───────── */
  (function ceo() {
    const c = data.ceo;
    $('#ceoName').innerHTML = `${val(c.name, '대표 성함', 'line')}${c.nameEn ? `<span>${esc(c.nameEn)}</span>` : ''}`;
    $('#ceoPhoto').innerHTML = slot({ name: 'CEO PORTRAIT', ratio: '4/5', src: c.portrait, alt: (c.name || '대표') + ' 프로필 사진' });
    $('#ceoQuote').innerHTML = c.quote ? draft(c.draft, esc(c.quote)) : val(null, '대표 인사말 한 문장', 'lines');
    $('#ceoMsg').innerHTML = (c.message && c.message.length ? c.message : [null]).map(p => `<p>${p ? draft(c.draft, esc(p)) : val(null, '대표 인사말 본문', 'lines')}</p>`).join('');
  })();

  /* ───────── 01 3개 업체: 펼침 패널 ───────── */
  (function brands() {
    const acc = $('#acc');
    acc.innerHTML = data.brands.map((b, i) => `
      <article class="acc-item${i === 0 ? ' open' : ''}" id="${esc(b.key || 'brand-' + b.n)}">
        <button type="button" class="acc-btn" aria-expanded="${i === 0}" aria-controls="acc-p-${i}">
          <span class="a-no">${roman(b.n)}</span>
          <span class="a-name">${esc(b.display)}</span>
          <span class="a-sign" aria-hidden="true"></span>
        </button>
        <div class="acc-panel" id="acc-p-${i}">
          <div class="a-img">${slot({ name: `BRAND ${b.n} CAMPAIGN`, ratio: '4/3', src: b.image, alt: b.display + ' 대표 이미지' })}</div>
          <div class="a-text">
            ${b.logo ? `<span class="a-logo">${slot({ name: `BRAND ${b.n} LOGO`, src: b.logo, alt: b.display + ' 로고', cls: 'logo-slot' })}</span>` : ''}
            <h4 class="a-title">${b.name ? esc(b.name) : esc(b.display) + (guides ? '<span class="todo" data-todo="업체명"></span>' : '')}</h4>
            ${b.nameKo ? `<p class="a-ko">${esc(b.nameKo)}</p>` : (guides ? '<p class="a-ko"><span class="todo" data-todo="한글 업체명"></span></p>' : '')}
            ${b.tagline ? `<p class="a-tag">${esc(b.tagline)}</p>` : ''}
            <p class="a-intro">${val(b.intro, '업체 소개 2~3문장', 'lines')}</p>
            ${b.link ? `<a class="arrow" href="${esc(b.link)}" target="_blank" rel="noopener">브랜드 페이지</a>` : (guides ? '<span class="todo" data-todo="상세 페이지 링크(선택)"></span>' : '')}
          </div>
        </div>
      </article>`).join('');
    const items = $$('.acc-item', acc);
    const open = it => items.forEach(x => { const on = x === it; x.classList.toggle('open', on); $('.acc-btn', x).setAttribute('aria-expanded', on); });
    items.forEach(it => {
      $('.acc-btn', it).addEventListener('click', () => open(it));
      // 데스크톱: 마우스를 잠시 올리면 열림
      let t; it.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse' || matchMedia('(max-width:900px)').matches) return; t = setTimeout(() => open(it), 160); });
      it.addEventListener('pointerleave', () => clearTimeout(t));
    });
  })();

  /* ───────── 02 바잉 업체: 표 + 줄 펼침 ───────── */
  (function buying() {
    const list = $('#buyList');
    $('#buyMeta').textContent = `${pad(data.buying.length)} houses`;
    list.innerHTML = data.buying.map((b, i) => `
      <div class="d-row rv">
        <button type="button" class="d-btn" aria-expanded="false" aria-controls="d-p-${i}">
          <span class="c-no">${pad(b.n)}</span>
          <span class="c-house">${esc(b.display)}${b.name ? '' : (guides ? '<span class="todo" data-todo="업체명"></span>' : '')}</span>
          <span class="c-des" data-k="Designer">${val(b.designer, '디자이너', 'line')}</span>
          <span class="c-ori" data-k="Origin">${val(b.origin, '국가·도시', 'line')}</span>
          <span class="c-since" data-k="Since">${val(b.since, '설립 연도', 'line')}</span>
          <span class="c-pm" aria-hidden="true"></span>
        </button>
        <div class="d-panel" id="d-p-${i}" hidden>
          <div class="d-cover">${slot({ name: `BUYING ${pad(b.n)} COVER`, ratio: '3/4', src: b.cover, alt: b.display + ' 대표 이미지' })}</div>
          <div class="d-look">${(b.lookbook.length ? b.lookbook : [null, null, null]).map((p, k) => slot({ name: `BUYING ${pad(b.n)} LOOKBOOK ${k + 1}`, ratio: '2/3', src: p, alt: b.display + ' 룩북 ' + (k + 1) })).join('')}</div>
          <div class="d-text">
            <p class="d-intro">${val(b.intro, '브랜드 소개 2~3문장', 'lines')}</p>
            ${b.link ? `<a class="arrow" href="${esc(b.link)}" target="_blank" rel="noopener">브랜드 상세 보기</a>` : ''}
            <a class="arrow" href="#consultation" data-ask-buy>이 브랜드 드레스 상담하기</a>
          </div>
        </div>
      </div>`).join('');
    list.addEventListener('click', e => {
      const btn = e.target.closest('.d-btn');
      if (btn) {
        const row = btn.parentElement, panel = $('.d-panel', row), on = btn.getAttribute('aria-expanded') !== 'true';
        $$('.d-btn[aria-expanded="true"]', list).forEach(b => { if (b !== btn) { b.setAttribute('aria-expanded', 'false'); b.parentElement.classList.remove('open'); $('.d-panel', b.parentElement).hidden = true; } });
        btn.setAttribute('aria-expanded', on); row.classList.toggle('open', on); panel.hidden = !on;
        if (on && !reduce) { const top = row.getBoundingClientRect().top; if (top < 70 || top > innerHeight * 0.6) row.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      if (e.target.closest('[data-ask-buy]')) { const it = $('#cfInterest'); if (it) { it.value = (data.consult.interests || [])[1] || ''; it.dispatchEvent(new Event('input', { bubbles: true })); } }
    });
  })();

  /* ───────── 03 컬렉션: 시즌 탭 + 보기 전환(그리드/목록) ───────── */
  (function collection() {
    const panel = $('#seasonPanel');
    $('#colMeta').textContent = `${pad(data.seasons.length)} seasons / ${pad(data.looks.length)} looks`;
    LX.initSeasonTabs($('#tabs'), panel, data.seasons,
      s => `<span class="t-year">${esc(s.year || '')}</span><span class="t-title">${esc(s.title)}</span>`,
      s => {
        const cells = s.looks.map(l => `
          <figure class="cell" data-look="${esc(l.id)}">
            <a href="#collection" class="cell-hit" data-look="${esc(l.id)}" aria-label="${esc(LX.lookName(l))} 자세히 보기">
              ${slot({ name: `LOOK ${l.id}`, ratio: '2/3', src: l.image, alt: LX.lookName(l) + ' 웨딩드레스' })}
            </a>
            <figcaption><span class="c-id">${esc(l.id)}</span><span class="c-name">${esc(LX.lookName(l))}</span><span class="c-des">${l.designer ? esc(l.designer) : ''}</span><span class="c-view" aria-hidden="true">View</span></figcaption>
          </figure>`).join('');
        return `
          <div class="s-head">
            <div class="s-cover">${slot({ name: `${s.year} ${s.title} COLLECTION CAMPAIGN`.toUpperCase(), ratio: '3/2', src: s.cover, alt: LX.seasonName(s) + ' 캠페인' })}</div>
            <dl class="s-facts">
              <div><dt>Season</dt><dd class="s-big">${esc(s.year || '')}<br>${esc(s.title)}</dd></div>
              <div><dt>Period</dt><dd>${esc(s.period || '')}</dd></div>
              <div><dt>Looks</dt><dd>${pad(s.looks.length)}${data.raw.sample && guides ? ' <span class="todo" data-todo="예시 시즌 — 실제 시즌·룩으로 교체"></span>' : ''}</dd></div>
              <div><dt>Note</dt><dd>${val(s.note, '시즌 소개 한 문장', 'line')}</dd></div>
            </dl>
          </div>
          <div class="cells">${cells || '<p class="empty">이 시즌의 드레스를 준비하고 있습니다.</p>'}</div>`;
      });
    // 보기 방식
    $$('.view-toggle button').forEach(b => b.addEventListener('click', () => {
      $$('.view-toggle button').forEach(x => x.setAttribute('aria-pressed', x === b));
      panel.dataset.view = b.dataset.view;
    }));
  })();

  /* ───────── 04 셀럽 착용 ───────── */
  (function celeb() {
    $('#celebMeta').textContent = `${pad(data.celebs.length)} looks`;
    $('#celebGrid').innerHTML = data.celebs.map(c => {
      const look = c.lookId && data.looks.find(l => l.id === c.lookId);
      return `<figure class="celeb rv">
        ${slot({ name: `CELEBRITY ${pad(c.n)} WEARING`, ratio: '4/5', src: c.image, alt: (c.name || '') + ' 착용 사진' })}
        <figcaption>
          <dl>
            <div><dt>Name</dt><dd>${val(c.name, '셀럽 이름', 'line')}</dd></div>
            <div><dt>Occasion</dt><dd>${val(c.occasion, '착용 행사·매체', 'line')}</dd></div>
            <div><dt>Dress</dt><dd>${val(c.dress, '드레스명', 'line')}${c.designer ? ' / ' + esc(c.designer) : ''}</dd></div>
          </dl>
          ${look ? `<a class="arrow" href="#collection" data-look="${esc(look.id)}">이 드레스 보기</a>` : (guides ? '<span class="todo" data-todo="관련 룩 번호(lookId)"></span>' : '')}
        </figcaption>
      </figure>`;
    }).join('');
  })();

  /* ───────── 05 스토어: 왼쪽 목록 / 오른쪽 상세 ───────── */
  (function stores() {
    const listEl = $('#storeList'), det = $('#storeDetail');
    $('#storeMeta').textContent = `${pad(data.stores.length)} stores`;
    listEl.innerHTML = data.stores.map((s, i) => `
      <button type="button" role="tab" id="st-tab-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" aria-controls="storeDetail" data-i="${i}">
        <span class="s-no">${pad(s.n)}</span>
        <span class="s-nm">${esc(s.display)}${!s.name && !s.nameKo && guides ? '<span class="todo" data-todo="매장명"></span>' : ''}</span>
        <span class="s-sub">${s.name && s.nameKo ? esc(s.nameKo) : ''}${s.region ? (s.name && s.nameKo ? ' / ' : '') + esc(s.region) : ''}</span>
      </button>`).join('');
    const draw = (i, animate) => {
      const s = data.stores[i];
      const html = `
        <div class="sd-pano">${slot({ name: `${(s.name || s.nameKo || s.display)} STORE EXTERIOR`.toUpperCase(), ratio: '21/9', src: s.exterior, alt: s.display + ' 전경' })}</div>
        <div class="sd-row">
          <div class="sd-in">${slot({ name: `${(s.name || s.display)} SHOWROOM 1`.toUpperCase(), ratio: '4/5', src: s.interior[0], alt: s.display + ' 쇼룸' })}</div>
          <div class="sd-in">${slot({ name: `${(s.name || s.display)} SHOWROOM 2`.toUpperCase(), ratio: '4/5', src: s.interior[1], alt: s.display + ' 드레스 디스플레이' })}</div>
          <div class="sd-info">
            <h3 class="sd-name">${esc(s.display)}</h3>
            ${s.name && s.nameKo ? `<p class="sd-ko">${esc(s.nameKo)}</p>` : ''}
            ${s.note ? `<p class="sd-note">${esc(s.note)}</p>` : ''}
            <dl class="sd-facts">
              <div><dt>Address</dt><dd>${val(s.address, '주소', 'line')}</dd></div>
              <div><dt>Hours</dt><dd>${val(s.hours, '운영 시간', 'line')}</dd></div>
              <div><dt>Contact</dt><dd>${s.phone ? `<a href="tel:${esc(s.phone.replace(/[^0-9+]/g, ''))}">${esc(s.phone)}</a>` : val(null, '전화번호', 'line')}</dd></div>
            </dl>
            <div class="sd-actions">
              ${s.mapUrl ? `<a class="btn" href="${esc(s.mapUrl)}" target="_blank" rel="noopener">지도 보기</a>` : (guides ? '<span class="todo" data-todo="지도 링크(네이버·카카오맵)"></span>' : '')}
              <a class="btn solid" href="#consultation">방문 상담 문의</a>
            </div>
          </div>
        </div>`;
      if (animate && !reduce) { det.classList.add('swap'); setTimeout(() => { det.innerHTML = html; requestAnimationFrame(() => det.classList.remove('swap')); }, 260); }
      else det.innerHTML = html;
      det.setAttribute('aria-labelledby', 'st-tab-' + i);
    };
    const tabs = $$('[role=tab]', listEl);
    const select = (b, focus) => { tabs.forEach(t => { const on = t === b; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; }); if (focus) b.focus(); draw(+b.dataset.i, true); };
    listEl.addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b && b.getAttribute('aria-selected') !== 'true') select(b); });
    listEl.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement); if (i < 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length], true); }
    });
    draw(0, false);
  })();

  /* ───────── 06 상담 ───────── */
  (function consult() {
    const c = data.consult;
    $('#consultLead').innerHTML = c.lead ? draft(c.draft, esc(c.lead)) : '';
    $('#consultSteps').innerHTML = (c.steps || []).map((s, i) => `<li><span class="st-no">${pad(i + 1)}</span><span class="st-t">${esc(s.t)}</span><span class="st-d">${esc(s.d)}</span></li>`).join('');
    LX.initConsult(data);
  })();

  LX.initMenu();
  LX.initSpy();
  LX.initLightbox(data, { ratio: '2/3' });
  LX.initFloat($('#floatCta'));
  LX.reveal();
})();
