/* ─────────────────────────────────────────────────────────────
 * LUXE ELISABETH 드레스 데이터
 *
 * 새 드레스가 들어오면 이 파일만 고치면 됩니다. HTML은 건드리지 않아도 됩니다.
 *  - 첫 화면 슬라이드      : hero: true 인 드레스 (heroOrder 순)
 *  - New Arrivals          : isNew: true 인 드레스 (arrived 최신순, 첫 번째가 크게)
 *  - Seasonal Collection   : seasons 목록이 탭이 되고, 각 드레스의 season 값으로 묶임
 *  - Signature Dresses     : signature: true 인 드레스 (signatureOrder 순, details 사진이 함께 배치)
 *  - visible: false 로 바꾸면 어디에도 나오지 않습니다(삭제하지 않고 숨기기).
 *
 * 나중에 관리자 페이지·데이터베이스를 붙일 때는 같은 모양의 JSON을 서버에서 내려주면 됩니다.
 * (js/site.js 의 loadData 함수 한 곳만 바꾸면 됨)
 *
 * ※ 현재 시즌 구분, 시즌 이름, 입고일은 구조를 보여주기 위한 "예시"입니다. (sample: true)
 *    업체 확인 후 실제 값으로 바꾸고 sample 을 false 로 바꾸면 화면의 '예시 데이터' 표시가 사라집니다.
 *    드레스 이름은 사진에서 보이는 특징을 적은 임시 이름입니다.
 * ───────────────────────────────────────────────────────────── */
window.LUXE_DATA = {
  sample: true,

  brand: {
    instagram: 'https://www.instagram.com/luxe.elisabeth/',
    instagramHandle: '@luxe.elisabeth',
    address: null,      // 예: '서울시 ○○구 ○○로 00, 3층'
    hours: null,        // 예: '화–일 11:00–20:00 · 월요일 휴무'
    booking: null,      // 예: '100% 예약제 · 인스타그램 DM 또는 카카오톡 채널'
    phone: null
  },

  /* 원단 효과에 쓰는 레이스 텍스처.
   *  laceTexture: null 이면 기본 레이스(js/lace-texture.js)를 씁니다.
   *  실제 레이스 사진을 쓰려면 정사각형(예: 1024×1024) 사진을 images/fabric/ 에 넣고
   *  laceTexture: 'images/fabric/파일명.jpg', lacePhoto: true 로 바꾸세요.
   *  (어두운 바탕 위에 흰 레이스를 찍은 사진이 가장 잘 보입니다. 서버에 올렸을 때 적용됩니다.) */
  fabric: { laceTexture: null, lacePhoto: false, laceScale: 1.05 },

  seasons: [
    { id: '2026-fw', title: 'Fall / Winter', year: '2026', period: '2026.09 —', order: 1, visible: true,
      cover: 'images/dresses/lace-crystal-ballgown.webp',
      note: '빛을 머금은 크리스털과 레이스, 풍성한 볼가운 실루엣.' },
    { id: '2026-ss', title: 'Spring / Summer', year: '2026', period: '2026.03 — 2026.08', order: 2, visible: true,
      cover: 'images/dresses/lace-off-shoulder.webp',
      note: '가벼운 레이스와 튤, 자연광 아래에서 더 아름다운 드레스.' },
    { id: '2025', title: 'Collection', year: '2025', period: '2025', order: 3, visible: true,
      cover: 'images/dresses/geometric-beading.webp',
      note: '비즈 장식이 돋보이는 클래식 볼가운.' }
  ],

  dresses: [
    { id: 'LE-0101', name: 'Lace Crystal Ball Gown', season: '2026-fw', arrived: '2026-10-12',
      categories: ['lace', 'beaded'], image: 'images/dresses/lace-crystal-ballgown.webp', focus: '50% 30%',
      details: ['images/details/lace-skirt-hem.webp'],
      isNew: true, hero: true, heroOrder: 1, signature: false, visible: true },

    { id: 'LE-0102', name: 'Crystal Corset', season: '2026-fw', arrived: '2026-10-08',
      categories: ['beaded'], image: 'images/dresses/crystal-corset.webp', focus: '50% 0%',
      details: ['images/details/crystal-corset-bodice.webp'],
      isNew: true, hero: true, heroOrder: 2, signature: true, signatureOrder: 1, visible: true },

    { id: 'LE-0103', name: 'Tiered Tulle', season: '2026-fw', arrived: '2026-10-03',
      categories: ['tulle'], image: 'images/dresses/tiered-tulle.webp', focus: '50% 30%',
      details: [],
      isNew: true, hero: true, heroOrder: 4, signature: false, visible: true },

    { id: 'LE-0104', name: 'Crystal Veil', season: '2026-fw', arrived: '2026-09-27',
      categories: ['tulle'], image: 'images/dresses/crystal-veil.webp', focus: '50% 20%',
      details: ['images/details/crystal-veil-close.webp'],
      isNew: true, hero: false, signature: false, visible: true },

    { id: 'LE-0105', name: 'Beaded Bodice, Tulle Skirt', season: '2026-fw', arrived: '2026-09-20',
      categories: ['beaded', 'tulle'], image: 'images/dresses/beaded-bodice-tulle.webp', focus: '50% 35%',
      details: [],
      isNew: true, hero: true, heroOrder: 3, signature: false, visible: true },

    { id: 'LE-0201', name: 'Lace Off-Shoulder', season: '2026-ss', arrived: '2026-05-10',
      categories: ['lace'], image: 'images/dresses/lace-off-shoulder.webp', focus: '50% 30%',
      details: ['images/details/lace-glove-ribbon.webp'],
      isNew: false, hero: false, signature: true, signatureOrder: 3, visible: true },

    { id: 'LE-0202', name: 'Corseted Lace', season: '2026-ss', arrived: '2026-04-22',
      categories: ['lace'], image: 'images/dresses/corseted-lace.webp', focus: '50% 30%',
      details: [], isNew: false, hero: false, signature: false, visible: true },

    { id: 'LE-0203', name: 'Petal Train', season: '2026-ss', arrived: '2026-04-02',
      categories: ['tulle'], image: 'images/dresses/petal-train.webp', focus: '50% 40%',
      details: [], isNew: false, hero: false, signature: false, visible: true },

    { id: 'LE-0204', name: 'Lace-Edged Veil', season: '2026-ss', arrived: '2026-03-18',
      categories: ['lace', 'beaded'], image: 'images/dresses/lace-edged-veil.webp', focus: '50% 30%',
      details: [], isNew: false, hero: false, signature: false, visible: true },

    { id: 'LE-0301', name: 'Geometric Beading', season: '2025', arrived: '2025-11-05',
      categories: ['beaded'], image: 'images/dresses/geometric-beading.webp', focus: '50% 30%',
      details: ['images/details/geometric-beading-skirt.webp'],
      isNew: false, hero: true, heroOrder: 5, signature: true, signatureOrder: 2, visible: true },

    { id: 'LE-0302', name: 'Floral Crystal', season: '2025', arrived: '2025-10-14',
      categories: ['beaded'], image: 'images/dresses/floral-crystal.webp', focus: '50% 25%',
      details: ['images/details/floral-crystal-bodice.webp'],
      isNew: false, hero: false, signature: true, signatureOrder: 4, visible: true },

    { id: 'LE-0303', name: 'Beaded Lace Bodice', season: '2025', arrived: '2025-09-30',
      categories: ['beaded', 'lace'], image: 'images/dresses/beaded-lace-bodice.webp', focus: '50% 30%',
      details: [], isNew: false, hero: false, signature: false, visible: true }
  ],

  categories: { beaded: 'Beaded', lace: 'Lace', tulle: 'Tulle' }
};
