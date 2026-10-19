/* LUXE ELISABETH — STYLE A. EMOTIONAL COUTURE
 * data/site-data.js 를 읽어 각 구역을 그린다. 공용 기능은 js/concept-shared.js
 */
(function () {
  'use strict';
  const { $, $$, esc, pad, roman, slot, val, draft, data, guides, reduce, coarse } = window.LX;
  const LX = window.LX;

  /* ───────── 원단: 시안 A는 적극적으로 ─────────
   * 기존 4차 원단(천장 스왜그 2줄 + 커튼 + 오간자 3장)을 아이보리 톤으로, 마우스 반응 그대로 */
  LX.fabric($('#fabricA'), { bg: '#EDE5DB', end: '#F5F0EA', fade: 1, swag: 1 });

  /* ───────── 첫 화면 ───────── */
  (function hero() {
    const stage = $('#heroStage');
    const list = data.hero.length ? data.hero : [{ image: null }];
    const withImg = list.filter(h => h.image);
    if (withImg.length) {
      stage.innerHTML = withImg.map((h, i) => `<div class="hero-slide${i === 0 ? ' on' : ''}">${slot({ name: 'HERO DRESS ' + (i + 1), src: h.image, alt: h.caption || 'LUXE ELISABETH 웨딩드레스', eager: i === 0 })}</div>`).join('');
    } else {
      stage.innerHTML = slot({ name: 'HERO MAIN DRESS', cls: 'arch-empty' });
    }
    LX.initHeroSlides(stage, list, { root: $('#heroCtrl'), count: $('#heroCount'), bar: $('#heroBar'), prev: $('#heroPrev'), next: $('#heroNext'), pause: $('#heroPause') });
  })();

  /* 상단 메뉴: 첫 화면을 지나면 바탕이 생기고 가운데 로고가 나타남 */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > innerHeight * 0.72);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ───────── 01 CEO ───────── */
  (function ceo() {
    const c = data.ceo;
    $('#ceoPhoto').innerHTML = slot({ name: 'CEO PORTRAIT', ratio: '4/5', src: c.portrait, alt: (c.name || '대표') + ' 프로필 사진' });
    $('#ceoQuote').innerHTML = c.quote ? draft(c.draft, esc(c.quote)) : val(null, '대표 인사말 한 문장');
    $('#ceoMsg').innerHTML = (c.message && c.message.length ? c.message : [null]).map(p => `<p>${p ? draft(c.draft, esc(p)) : val(null, '대표 인사말 본문')}</p>`).join('');
    $('#ceoSign').innerHTML = `<span class="sign-name">${val(c.name, '대표 성함', 'line')}</span>${c.nameEn ? `<span class="sign-en">${esc(c.nameEn)}</span>` : ''}<span class="sign-role">${esc(c.title || 'CEO')}, LUXE ELISABETH</span>`;
  })();

  /* ───────── 01 3개 업체 ─────────
   * 순서별 편집: 1 와이드(16:9 전폭) / 2 세로 대형(3:4, 오른쪽으로 흘러나감) / 3 정사각 중앙(이름이 사진 뒤로) — 4번째부터는 1·2·3 반복 */
  (function brands() {
    const html = data.brands.map((b, i) => {
      const kind = ['wide', 'tall', 'square'][i % 3];
      const ratio = { wide: '16/9', tall: '3/4', square: '1/1' }[kind];
      const name = b.name ? esc(b.name) : `${esc(b.display)}${guides ? '<span class="todo" data-todo="업체명"></span>' : ''}`;
      const logo = b.logo ? `<span class="b-logo">${slot({ name: `BRAND ${b.n} LOGO`, src: b.logo, alt: (b.name || '') + ' 로고', cls: 'logo-slot' })}</span>` : '';
      const link = b.link ? `<a class="more" href="${esc(b.link)}" target="_blank" rel="noopener">브랜드 페이지 보기</a>` : (guides ? '<span class="todo" data-todo="상세 페이지 링크(선택)"></span>' : '');
      const text = `
        <div class="b-text">
          <p class="b-num" aria-hidden="true">${roman(b.n)}</p>
          ${logo}
          <h4 class="b-name">${name}</h4>
          ${b.nameKo ? `<p class="b-ko">${esc(b.nameKo)}</p>` : (guides ? '<p class="b-ko"><span class="todo" data-todo="한글 업체명"></span></p>' : '')}
          ${b.tagline ? `<p class="b-tag">${esc(b.tagline)}</p>` : ''}
          <p class="b-intro">${val(b.intro, '업체 소개 2~3문장', 'lines')}</p>
          ${link}
        </div>`;
      const img = slot({ name: `BRAND ${b.n} CAMPAIGN`, ratio, src: b.image, alt: (b.name || b.display) + ' 대표 이미지' });
      return `<article class="house house-${kind} rv" id="${esc(b.key || 'brand-' + b.n)}">
        ${kind === 'square' ? `<p class="b-ghost" aria-hidden="true">${esc(b.display)}</p>` : ''}
        <div class="b-img">${img}</div>${text}</article>`;
    }).join('');
    $('#brandList').innerHTML = html;
  })();

  /* ───────── 02 바잉 업체: 디자이너 디렉터리 ───────── */
  (function buying() {
    const list = $('#buyList'), peek = $('#dirPeek'), drawer = $('#drawer');
    list.innerHTML = data.buying.map(b => `
      <li class="dir-row rv">
        <button type="button" class="dir-btn" data-buy="${b.n - 1}" aria-haspopup="dialog">
          <span class="d-no">${pad(b.n)}</span>
          <span class="d-name">${esc(b.display)}${b.name ? '' : (guides ? '<span class="todo" data-todo="업체명"></span>' : '')}</span>
          <span class="d-meta">${b.designer ? esc(b.designer) : (guides ? '<span class="todo" data-todo="디자이너"></span>' : '')}${b.origin ? `<em>${esc(b.origin)}</em>` : ''}</span>
          <span class="d-go" aria-hidden="true"></span>
        </button>
      </li>`).join('');
    // 마우스를 따라오는 대표 사진(데스크톱)
    if (!coarse) {
      let tx = 0, ty = 0, x = 0, y = 0, on = false, raf = 0;
      const loop = () => { x += (tx - x) * .14; y += (ty - y) * .14; peek.style.transform = `translate3d(${x}px,${y}px,0)`; raf = on || Math.abs(tx - x) > .5 ? requestAnimationFrame(loop) : 0; };
      const host = $('#buying');
      list.addEventListener('pointermove', e => {
        const r = host.getBoundingClientRect(); tx = e.clientX - r.left + 48; ty = e.clientY - r.top - 170;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      list.addEventListener('pointerover', e => {
        const btn = e.target.closest('[data-buy]'); if (!btn) return;
        const b = data.buying[+btn.dataset.buy];
        if (peek.dataset.i !== btn.dataset.buy) { peek.innerHTML = slot({ name: `BUYING ${pad(b.n)} COVER`, ratio: '3/4', src: b.cover, alt: '' }); peek.dataset.i = btn.dataset.buy; }
        on = true; peek.classList.add('on'); list.classList.add('peeking');
      });
      list.addEventListener('pointerleave', () => { on = false; peek.classList.remove('on'); list.classList.remove('peeking'); });
    }
    // 상세(오른쪽 패널)
    let last = null;
    const open = i => {
      const b = data.buying[i];
      $('#drawerBody').innerHTML = `
        <p class="dr-no">${pad(b.n)} / ${pad(data.buying.length)}</p>
        <h3 class="dr-name" id="drName">${esc(b.display)}</h3>
        <dl class="dr-facts">
          <div><dt>Designer</dt><dd>${val(b.designer, '디자이너명', '—')}</dd></div>
          <div><dt>Origin</dt><dd>${val(b.origin, '국가·도시', '—')}</dd></div>
          ${b.since || guides ? `<div><dt>Since</dt><dd>${val(b.since, '설립 연도(선택)', '—')}</dd></div>` : ''}
        </dl>
        <div class="dr-cover">${slot({ name: `BUYING ${pad(b.n)} COVER`, ratio: '3/4', src: b.cover, alt: b.display + ' 대표 이미지' })}</div>
        <p class="dr-intro">${val(b.intro, '브랜드 소개 2~3문장', 'lines')}</p>
        <p class="dr-sub">Lookbook</p>
        <div class="dr-look">${(b.lookbook.length ? b.lookbook : [null, null, null]).map((p, k) => slot({ name: `BUYING ${pad(b.n)} LOOKBOOK ${k + 1}`, ratio: '2/3', src: p, alt: b.display + ' 룩북 ' + (k + 1) })).join('')}</div>
        ${b.link ? `<a class="more" href="${esc(b.link)}" target="_blank" rel="noopener">브랜드 상세 보기</a>` : ''}
        <a class="dr-ask" href="#consultation" data-close>이 브랜드 드레스 상담하기</a>`;
      last = document.activeElement;
      drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); if ('inert' in drawer) drawer.inert = false;
      document.body.style.overflow = 'hidden';
      $('.drawer-close', drawer).focus();
    };
    const close = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); if ('inert' in drawer) drawer.inert = true; document.body.style.overflow = ''; last && last.focus(); };
    if ('inert' in drawer) drawer.inert = true;
    list.addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (b) open(+b.dataset.buy); });
    drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) { const a = e.target.closest('a[href="#consultation"]'); close(); if (a) { e.preventDefault(); const it = $('#cfInterest'); if (it) it.value = (data.consult.interests || [])[1] || ''; it && it.dispatchEvent(new Event('input', { bubbles: true })); $('#consultation').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } } });
    addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });
  })();

  /* ───────── 03 컬렉션: 시즌 탭 + 화보식 펼침면 ─────────
   * 룩 배치: 4개씩 한 묶음 [큰 왼쪽 / 작은 오른쪽(아래로) / 작은 왼쪽 / 큰 오른쪽] */
  LX.initSeasonTabs($('#tabs'), $('#seasonPanel'), data.seasons,
    s => `<span class="t-year">${esc(s.year || '')}</span><span class="t-title">${esc(s.title)}</span><span class="t-n">${pad(s.looks.length)}</span>`,
    s => {
      const looks = s.looks.map((l, i) => {
        const k = ['big-l', 'small-r', 'small-l', 'big-r'][i % 4];
        return `<figure class="look look-${k}">
          <a href="#collection" class="look-hit" data-look="${esc(l.id)}" aria-label="${esc(LX.lookName(l))} 자세히 보기">
            ${slot({ name: `LOOK ${l.id}`, ratio: '2/3', src: l.image, alt: LX.lookName(l) + ' 웨딩드레스' })}
          </a>
          <figcaption><span class="l-name">${esc(LX.lookName(l))}</span><span class="l-id">${esc(l.id)}</span>${l.designer ? `<span class="l-des">${esc(l.designer)}</span>` : ''}</figcaption>
        </figure>`;
      }).join('');
      return `
        <div class="s-open">
          <div class="s-title-block">
            <p class="s-period">${esc(s.period || '')}</p>
            <p class="s-year" aria-hidden="true">${esc(s.year || '')}</p>
            <h3 class="s-name">${esc(s.title)}</h3>
            ${s.note ? `<p class="s-note">${esc(s.note)}</p>` : (guides ? '<p class="s-note"><span class="todo" data-todo="시즌 소개 한 문장"></span></p>' : '')}
            <p class="s-count">${pad(s.looks.length)} looks${data.raw.sample && guides ? ' <span class="todo" data-todo="예시 시즌 — 실제 시즌·룩으로 교체"></span>' : ''}</p>
          </div>
          <div class="s-cover">${slot({ name: `${s.year} ${s.title} COLLECTION CAMPAIGN`.toUpperCase(), ratio: '3/2', src: s.cover, alt: LX.seasonName(s) + ' 캠페인' })}</div>
        </div>
        <div class="spread">${looks || '<p class="empty">이 시즌의 드레스를 준비하고 있습니다.</p>'}</div>`;
    }
  );

  /* ───────── 04 셀럽 착용: 가로로 넘겨 보는 필름 ───────── */
  (function celeb() {
    const strip = $('#celebStrip');
    strip.innerHTML = data.celebs.map(c => {
      const look = c.lookId && data.looks.find(l => l.id === c.lookId);
      return `<figure class="celeb-card rv">
        ${slot({ name: `CELEBRITY ${pad(c.n)} WEARING`, ratio: '4/5', src: c.image, alt: (c.name || '') + ' 착용 사진' })}
        <figcaption>
          <span class="c-name">${val(c.name, '셀럽 이름', '—')}</span>
          <span class="c-occ">${val(c.occasion, '착용 행사·매체')}</span>
          <span class="c-dress">${c.dress ? esc(c.dress) : val(null, '드레스명')}${c.designer ? ' — ' + esc(c.designer) : ''}</span>
          ${look ? `<a href="#collection" class="c-link" data-look="${esc(look.id)}">이 드레스 보기</a>` : (guides ? '<span class="todo" data-todo="관련 룩 번호(lookId)"></span>' : '')}
        </figcaption>
      </figure>`;
    }).join('');
    const by = d => { const card = $('.celeb-card', strip); const w = card ? card.getBoundingClientRect().width + 32 : 300; strip.scrollBy({ left: d * w, behavior: reduce ? 'auto' : 'smooth' }); };
    $('#celebPrev').onclick = () => by(-1); $('#celebNext').onclick = () => by(1);
    strip.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); by(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); by(-1); } });
    const upd = () => { $('#celebPrev').disabled = strip.scrollLeft < 4; $('#celebNext').disabled = strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 4; };
    strip.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    // 마우스로 끌어서 넘기기
    let down = null;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = { x: e.clientX, l: strip.scrollLeft, moved: false }; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 4) { down.moved = true; strip.classList.add('dragging'); } strip.scrollLeft = down.l - dx; });
    addEventListener('pointerup', () => { if (down && down.moved) { strip.addEventListener('click', ev => ev.preventDefault(), { capture: true, once: true }); } down = null; strip.classList.remove('dragging'); });
  })();

  /* ───────── 05 스토어: 매장마다 전경 파노라마 + 쇼룸 2장 + 정보(좌우 번갈아) ───────── */
  (function stores() {
    $('#storeList').innerHTML = data.stores.map((s, i) => {
      const nm = s.name ? esc(s.name) : (s.nameKo ? esc(s.nameKo) : esc(s.display));
      const facts = [
        ['Address', s.address, '주소'], ['Hours', s.hours, '운영 시간'], ['Contact', s.phone, '전화번호']
      ].map(f => `<div><dt>${f[0]}</dt><dd>${val(f[1], f[2], 'line')}</dd></div>`).join('');
      return `<article class="store ${i % 2 ? 'flip' : ''}" id="store-${esc(s.id)}">
        <div class="st-pano rv">${slot({ name: `${(s.name || s.nameKo || 'STORE ' + s.n)} STORE EXTERIOR`.toUpperCase(), ratio: '21/9', src: s.exterior, alt: nm + ' 전경' })}
          <div class="st-plate">
            <p class="st-region">${s.region ? esc(s.region) : (guides ? '<span class="todo" data-todo="지역"></span>' : (i === 0 ? 'Flagship' : 'Store'))}</p>
            <h3 class="st-name">${nm}${!s.name && !s.nameKo && guides ? '<span class="todo" data-todo="매장명"></span>' : ''}</h3>
            ${s.nameKo && s.name ? `<p class="st-ko">${esc(s.nameKo)}</p>` : ''}
          </div>
        </div>
        <div class="st-body wrap">
          <div class="st-in st-in1 rv">${slot({ name: `${(s.name || 'STORE ' + s.n)} SHOWROOM 1`.toUpperCase(), ratio: '4/5', src: s.interior[0], alt: nm + ' 쇼룸' })}</div>
          <div class="st-in st-in2 rv">${slot({ name: `${(s.name || 'STORE ' + s.n)} SHOWROOM 2`.toUpperCase(), ratio: '4/5', src: s.interior[1], alt: nm + ' 드레스 디스플레이' })}</div>
          <div class="st-info rv">
            ${s.note ? `<p class="st-note">${esc(s.note)}</p>` : ''}
            ${facts ? `<dl class="st-facts">${facts}</dl>` : ''}
            ${s.mapUrl ? `<a class="more" href="${esc(s.mapUrl)}" target="_blank" rel="noopener">지도에서 보기</a>` : (guides ? '<span class="todo" data-todo="지도 링크(네이버·카카오맵)"></span>' : '')}
            <a class="st-visit" href="#consultation">방문 상담 문의</a>
          </div>
        </div>
      </article>`;
    }).join('');
  })();

  /* ───────── 06 상담 ───────── */
  (function consult() {
    const c = data.consult;
    $('#consultLead').innerHTML = c.lead ? draft(c.draft, esc(c.lead)) : '';
    $('#consultSteps').innerHTML = (c.steps || []).map(s => `<li><span class="st-t">${esc(s.t)}</span><span class="st-d">${esc(s.d)}</span></li>`).join('');
    LX.initConsult(data);
  })();

  LX.initMenu();
  LX.initSpy();
  LX.initLightbox(data, { ratio: '2/3' });
  LX.initFloat($('#floatCta'));
  // 컬렉션 탭이 바뀌어도 새 룩들에 등장 효과
  LX.reveal();
})();
