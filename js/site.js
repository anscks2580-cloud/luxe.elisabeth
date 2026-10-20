/* LUXE ELISABETH — index.html 화면 구성
 * data/site-data.js 를 읽어 각 구역을 그린다. 공용 기능(슬라이드·탭·상세 보기·상담 작성)은 js/shared.js
 * 규칙: 구역마다 같은 머리(영문 제목 + 한글 한 줄), 같은 좌우 여백, 같은 사진 간격. 장식 없음.
 */
(function () {
  'use strict';
  const { $, $$, esc, pad, slot, val, draft, data, guides, reduce } = window.LX;
  const LX = window.LX;

  /* ───────── 상단: 화면을 내리면 한 줄로 접힘 ───────── */
  (function head() {
    const head = $('#head');
    let on = false;
    const upd = () => { const c = scrollY > 40; if (c !== on) { on = c; head.classList.toggle('compact', c); } };
    addEventListener('scroll', upd, { passive: true }); upd();
  })();

  /* ───────── 첫 화면: 사진이 화면을 채움 ───────── */
  (function hero() {
    const stage = $('#heroStage');
    const list = data.hero.length ? data.hero : [{ image: null }];
    const withImg = list.filter(h => h.image);
    stage.innerHTML = withImg.length
      ? withImg.map((h, i) => `<div class="hero-slide${i === 0 ? ' on' : ''}">${slot({ name: 'HERO DRESS ' + (i + 1), src: h.image, pos: h.focus, alt: h.caption || 'LUXE ELISABETH 웨딩드레스', eager: i === 0 })}</div>`).join('')
      : slot({ name: 'HERO MAIN DRESS' });
    LX.initHeroSlides(stage, list, { root: $('#heroCtrl'), count: $('#heroCount'), bar: $('#heroBar'), prev: $('#heroPrev'), next: $('#heroNext'), pause: $('#heroPause'), dots: $('#heroDots') });
  })();

  /* ───────── 01 럭스 소개: 대표 사진 + 인사말, 그 아래 3개 업체 ───────── */
  (function intro() {
    const c = data.ceo;
    $('#ceoPhoto').innerHTML = slot({ name: 'CEO PORTRAIT', ratio: '4/5', src: c.portrait, alt: (c.name || '대표') + ' 프로필 사진' });
    $('#ceoQuote').innerHTML = c.quote ? draft(c.draft, esc(c.quote)) : val(null, '대표 인사말 한 문장', 'lines');
    $('#ceoMsg').innerHTML = (c.message && c.message.length ? c.message : [null]).map(p => `<p>${p ? draft(c.draft, esc(p)) : val(null, '대표 인사말 본문', 'lines')}</p>`).join('');
    $('#ceoName').innerHTML = `<span class="k">${esc(c.title || 'CEO')}</span>${val(c.name, '대표 성함', 'line')}${c.nameEn ? `<span class="en">${esc(c.nameEn)}</span>` : ''}`;

    $('#brands').innerHTML = data.brands.map(b => `
      <article class="brand" id="${esc(b.key || 'brand-' + b.n)}">
        ${slot({ name: `BRAND ${b.n} CAMPAIGN`, ratio: '4/5', src: b.image, alt: b.display + ' 대표 이미지' })}
        <h3 class="brand-name">${b.name ? esc(b.name) : esc(b.display) + (guides ? '<span class="todo" data-todo="업체명"></span>' : '')}${b.nameKo ? `<span>${esc(b.nameKo)}</span>` : ''}</h3>
        <p class="brand-intro">${val(b.intro, '업체 소개 2~3문장', 'lines')}</p>
        ${b.link ? `<a class="more" href="${esc(b.link)}" target="_blank" rel="noopener">자세히 보기</a>` : ''}
      </article>`).join('');
  })();

  /* ───────── 02 바잉 업체: 줄 목록. 줄을 누르면 그 아래로 소개·사진이 열림 ───────── */
  (function buying() {
    const list = $('#buyList');
    list.innerHTML = `<div class="d-head" aria-hidden="true"><span>No.</span><span>House</span><span>Designer</span><span>Origin</span><span>Since</span></div>` +
      data.buying.map((b, i) => `
      <div class="d-row">
        <button type="button" class="d-btn" aria-expanded="false" aria-controls="d-p-${i}">
          <span class="c-no">${pad(b.n)}</span>
          <span class="c-house">${esc(b.display)}${b.name ? '' : (guides ? '<span class="todo" data-todo="업체명"></span>' : '')}</span>
          <span class="c-des">${val(b.designer, '디자이너', 'line')}</span>
          <span class="c-ori">${val(b.origin, '국가·도시', 'line')}</span>
          <span class="c-since">${val(b.since, '설립 연도', 'line')}</span>
          <span class="c-pm" aria-hidden="true"></span>
        </button>
        <div class="d-panel" id="d-p-${i}" hidden>
          <div class="d-pics">
            ${slot({ name: `BUYING ${pad(b.n)} COVER`, ratio: '3/4', src: b.cover, alt: b.display + ' 대표 이미지' })}
            ${(b.lookbook.length ? b.lookbook : [null, null, null]).map((p, k) => slot({ name: `BUYING ${pad(b.n)} LOOKBOOK ${k + 1}`, ratio: '3/4', src: p, alt: b.display + ' 룩북 ' + (k + 1) })).join('')}
          </div>
          <div class="d-text">
            <p>${val(b.intro, '브랜드 소개 2~3문장', 'lines')}</p>
            <div class="d-links">
              ${b.link ? `<a class="more" href="${esc(b.link)}" target="_blank" rel="noopener">브랜드 홈페이지</a>` : ''}
              <a class="more" href="#consultation" data-ask-buy>이 브랜드 드레스 상담하기</a>
            </div>
          </div>
        </div>
      </div>`).join('');
    list.addEventListener('click', e => {
      const btn = e.target.closest('.d-btn');
      if (btn) {
        const row = btn.parentElement, panel = $('.d-panel', row), on = btn.getAttribute('aria-expanded') !== 'true';
        $$('.d-btn[aria-expanded="true"]', list).forEach(b => { if (b !== btn) { b.setAttribute('aria-expanded', 'false'); b.parentElement.classList.remove('open'); $('.d-panel', b.parentElement).hidden = true; } });
        btn.setAttribute('aria-expanded', on); row.classList.toggle('open', on); panel.hidden = !on;
        if (on && !reduce) { const top = row.getBoundingClientRect().top; if (top < 80 || top > innerHeight * 0.6) row.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      if (e.target.closest('[data-ask-buy]')) { const it = $('#cfInterest'); if (it) { it.value = (data.consult.interests || [])[1] || ''; it.dispatchEvent(new Event('input', { bubbles: true })); } }
    });
  })();

  /* ───────── 03 컬렉션: 시즌 탭 + 같은 크기의 사진 격자 ───────── */
  (function collection() {
    const panel = $('#seasonPanel');
    LX.initSeasonTabs($('#tabs'), panel, data.seasons,
      s => `${esc(s.year || '')} ${esc(s.title)}`,
      s => {
        const cells = s.looks.map(l => `
          <figure class="cell">
            <a href="#collection" class="cell-hit" data-look="${esc(l.id)}" aria-label="${esc(LX.lookName(l))} 자세히 보기">
              ${slot({ name: `LOOK ${l.id}`, ratio: '2/3', src: l.image, alt: LX.lookName(l) + ' 웨딩드레스' })}
            </a>
            <figcaption><span class="c-id">${esc(l.id)}</span><span class="c-name">${esc(LX.lookName(l))}</span>${l.designer ? `<span class="c-des">${esc(l.designer)}</span>` : ''}</figcaption>
          </figure>`).join('');
        const note = s.note ? `<p class="s-note">${esc(s.note)}</p>` : (guides ? `<p class="s-note"><span class="todo" data-todo="시즌 소개 한 문장"></span></p>` : '');
        return `<p class="s-line">${esc(s.period || '')}<span>${pad(s.looks.length)} looks</span>${data.raw.sample && guides ? ' <span class="todo" data-todo="예시 시즌 — 실제 시즌·룩으로 교체"></span>' : ''}</p>${note}
          <div class="cells">${cells || '<p class="empty">이 시즌의 드레스를 준비하고 있습니다.</p>'}</div>`;
      });
  })();

  /* ───────── 04 셀럽 착용 ───────── */
  (function celeb() {
    $('#celebGrid').innerHTML = data.celebs.map(c => {
      const look = c.lookId && data.looks.find(l => l.id === c.lookId);
      return `<figure class="celeb">
        ${slot({ name: `CELEBRITY ${pad(c.n)} WEARING`, ratio: '4/5', src: c.image, alt: (c.name || '') + ' 착용 사진' })}
        <figcaption>
          <p class="cb-name">${val(c.name, '셀럽 이름', 'line')}</p>
          <p class="cb-sub">${val(c.occasion, '착용 행사·매체', 'line')}</p>
          <p class="cb-sub">${val(c.dress, '드레스명', 'line')}${c.designer ? ' · ' + esc(c.designer) : ''}</p>
          ${look ? `<a class="more" href="#collection" data-look="${esc(look.id)}">이 드레스 보기</a>` : (guides ? '<span class="todo" data-todo="관련 룩 번호(lookId)"></span>' : '')}
        </figcaption>
      </figure>`;
    }).join('');
  })();

  /* ───────── 05 스토어: 모든 매장을 같은 규칙으로 차례로 ───────── */
  (function stores() {
    $('#storeList').innerHTML = data.stores.map(s => `
      <article class="store" id="store-${esc(s.id || s.n)}">
        ${slot({ name: `${(s.name || s.nameKo || s.display)} STORE EXTERIOR`.toUpperCase(), ratio: '21/9', src: s.exterior, alt: s.display + ' 전경', cls: 'store-pano' })}
        <div class="store-row">
          <div class="store-info">
            <h3 class="store-name">${esc(s.display)}${s.name && s.nameKo ? `<span>${esc(s.nameKo)}</span>` : ''}${!s.name && !s.nameKo && guides ? '<span class="todo" data-todo="매장명"></span>' : ''}</h3>
            ${s.note ? `<p class="store-note">${esc(s.note)}</p>` : ''}
            <dl class="facts">
              <div><dt>주소</dt><dd>${val(s.address, '주소', 'line')}</dd></div>
              <div><dt>운영 시간</dt><dd>${val(s.hours, '운영 시간', 'line')}</dd></div>
              <div><dt>전화</dt><dd>${s.phone ? `<a href="tel:${esc(s.phone.replace(/[^0-9+]/g, ''))}">${esc(s.phone)}</a>` : val(null, '전화번호', 'line')}</dd></div>
            </dl>
            <div class="store-links">
              ${s.mapUrl ? `<a class="more" href="${esc(s.mapUrl)}" target="_blank" rel="noopener">지도 보기</a>` : (guides ? '<span class="todo" data-todo="지도 링크(네이버·카카오맵)"></span>' : '')}
              <a class="more" href="#consultation">방문 상담 문의</a>
            </div>
          </div>
          ${slot({ name: `${(s.name || s.display)} SHOWROOM 1`.toUpperCase(), ratio: '4/5', src: s.interior[0], alt: s.display + ' 쇼룸' })}
          ${slot({ name: `${(s.name || s.display)} SHOWROOM 2`.toUpperCase(), ratio: '4/5', src: s.interior[1], alt: s.display + ' 드레스 디스플레이' })}
        </div>
      </article>`).join('');
  })();

  /* ───────── 06 상담 ───────── */
  (function consult() {
    const c = data.consult;
    $('#consultLead').innerHTML = c.lead ? draft(c.draft, esc(c.lead)) : '';
    LX.initConsult(data);
  })();

  LX.initMenu();
  LX.initSpy();
  LX.initLightbox(data, { ratio: '2/3' });
  LX.initFloat($('#floatCta'));
})();
