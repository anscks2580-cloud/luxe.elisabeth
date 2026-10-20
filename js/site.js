/* LUXE ELISABETH — index.html 화면 구성
 * data/site-data.js 를 읽어 각 구역을 그린다. 공용 기능(슬라이드·탭·상세 보기·상담 작성)은 js/shared.js
 */
(function () {
  'use strict';
  const { $, $$, esc, slot, data } = window.LX;
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

  LX.initMenu();
  LX.initSpy();
})();
