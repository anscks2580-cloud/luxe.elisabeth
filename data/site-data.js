/* ─────────────────────────────────────────────────────────────
 * LUXE ELISABETH — 새 시안(concept-a.html, concept-b.html) 공용 데이터
 *
 * 두 시안은 이 파일 하나를 함께 읽습니다. 글·사진·업체·매장을 바꿀 때는 이 파일만 고치면 됩니다.
 * (기존 홈페이지 index.html 은 data/dresses.js 를 그대로 사용 — 이 파일과 무관)
 *
 * ■ 값을 비워 두는 규칙
 *   - null  : 아직 받지 못한 정보. 화면에서는 자연스럽게 감추거나 빈 자리로 둡니다.
 *   - 사진   : 경로 문자열('images/…/파일.webp')을 넣으면 그 자리에 바로 나옵니다. null 이면 빈 사진 자리.
 *             파일이 없거나 경로가 틀리면 깨진 아이콘 대신 빈 자리로 돌아갑니다.
 *   - draft: true  : 임시로 써 둔 문구. 업체 확인 후 고치고 false 로 바꾸세요.
 *
 * ■ 확인용 표시 보기
 *   주소 뒤에 ?guides 를 붙여 열면(예: concept-a.html?guides) 사진 자리 이름과
 *   '입력 필요' 항목이 점선으로 표시됩니다. 일반 방문자에게는 보이지 않습니다.
 * ───────────────────────────────────────────────────────────── */
window.LUXE_SITE = {
  /* 시즌·룩 구성이 예시라는 표시(?guides 에서만 보임) */
  sample: true,

  /* ───────── 연락 수단 ─────────
   * 기존 사이트에서 확인된 것은 인스타그램뿐입니다. 나머지는 받으면 넣으세요(넣는 순간 상담 영역에 버튼이 생깁니다). */
  contact: {
    instagram: 'https://www.instagram.com/luxe.elisabeth/',
    instagramHandle: '@luxe.elisabeth',
    phone: null,        // 예: '02-000-0000'
    kakao: null,        // 예: 'https://pf.kakao.com/_xxxx/chat'
    email: null,        // 예: 'hello@luxe-elisabeth.com'
    hours: null,        // 예: '화–일 11:00–20:00 · 월요일 휴무'
    booking: null       // 예: '100% 예약제'
  },

  /* ───────── 첫 화면 사진 ─────────
   * 2장 이상 넣으면 기존 사이트처럼 자동으로 넘어가는 슬라이드(이전·다음·멈춤 버튼, 진행 막대)가 켜집니다.
   * 1장이면 고정, 없으면 빈 사진 자리(시안 A는 원단이 비쳐 보이는 아치 창, 시안 B는 재단선 표시 프레임). */
  hero: [
    // IMAGE SLOT: HERO MAIN DRESS (세로 3:4, 드레스 전신 — 인물은 화면 가운데 또는 약간 오른쪽)
    { image: null, caption: null },
    // IMAGE SLOT: HERO DRESS 2
    { image: null, caption: null },
    // IMAGE SLOT: HERO DRESS 3
    { image: null, caption: null }
  ],

  /* ───────── 01 럭스 소개 · CEO ───────── */
  ceo: {
    name: null,                 // 대표 성함
    nameEn: null,               // 영문 표기
    title: 'CEO',
    // IMAGE SLOT: CEO PORTRAIT — 세로 4:5, 상반신, 밝은 배경 권장
    portrait: null,
    draft: true,                // 아래 인사말은 임시 문구입니다
    quote: '드레스는 하루를 위해 입지만, 그 하루는 오래 기억됩니다.',
    message: [
      '럭스 엘리자베스는 직접 보고 고른 드레스만 소개합니다. 원단의 결, 비즈가 빛을 받는 방향, 실루엣이 몸을 따라 흐르는 방식까지 가까이에서 확인한 뒤에 쇼룸에 걸어 둡니다.',
      '드레스를 고르는 시간이 서두르지 않고 충분하도록, 한 분 한 분에게 집중합니다.'
    ]
  },

  /* ───────── 01 럭스 소개 · 3개 업체 ─────────
   * 순서대로 화면에 각기 다른 편집으로 배치됩니다(1번: 와이드, 2번: 세로 대형, 3번: 정사각 중앙).
   * name 이 null 이면 'Brand I / II / III' 로 표시됩니다. */
  brands: [
    { key: 'brand-1', name: null, nameKo: null, tagline: null, intro: null, link: null,
      // IMAGE SLOT: BRAND 1 LOGO (투명 PNG·SVG 권장) / BRAND 1 CAMPAIGN (가로 16:9)
      logo: null, image: null },
    { key: 'brand-2', name: null, nameKo: null, tagline: null, intro: null, link: null,
      // IMAGE SLOT: BRAND 2 LOGO / BRAND 2 CAMPAIGN (세로 3:4)
      logo: null, image: null },
    { key: 'brand-3', name: null, nameKo: null, tagline: null, intro: null, link: null,
      // IMAGE SLOT: BRAND 3 LOGO / BRAND 3 CAMPAIGN (정사각 1:1)
      logo: null, image: null }
  ],

  /* ───────── 02 바잉 업체·디자이너 ─────────
   * 한 줄 = 한 업체. 추가·삭제해도 레이아웃이 알아서 맞춰집니다. hidden: true 로 숨기기.
   * name 이 null 인 줄은 'Designer 01' 처럼 자리만 표시됩니다. */
  buying: [
    // IMAGE SLOT: BUYING 01 COVER (세로 3:4) / LOOKBOOK 3장 (세로 2:3)
    { name: null, designer: null, origin: null, since: null, intro: null, link: null, cover: null, lookbook: [null, null, null] },
    { name: null, designer: null, origin: null, since: null, intro: null, link: null, cover: null, lookbook: [null, null, null] },
    { name: null, designer: null, origin: null, since: null, intro: null, link: null, cover: null, lookbook: [null, null, null] },
    { name: null, designer: null, origin: null, since: null, intro: null, link: null, cover: null, lookbook: [null, null, null] },
    { name: null, designer: null, origin: null, since: null, intro: null, link: null, cover: null, lookbook: [null, null, null] },
    { name: null, designer: null, origin: null, since: null, intro: null, link: null, cover: null, lookbook: [null, null, null] }
  ],

  /* ───────── 03 컬렉션 ─────────
   * seasons 가 탭이 되고, 각 시즌의 looks 가 룩북이 됩니다. 새 시즌은 맨 앞에 추가(order 가 작을수록 앞).
   * look: { id, name, designer, image(세로 2:3), details: [디테일 사진…], note }
   * ※ 현재 시즌 이름·룩 수는 구조를 보여주기 위한 예시입니다(sample: true). */
  seasons: [
    { id: '2026-fw', title: 'Fall / Winter', year: '2026', period: '2026.09 —', order: 1,
      // IMAGE SLOT: 2026 FW COLLECTION CAMPAIGN (가로 3:2)
      cover: null,
      note: null,
      looks: [
        { id: 'LE-0101', name: null, designer: null, image: null, details: [null, null] },
        { id: 'LE-0102', name: null, designer: null, image: null, details: [null] },
        { id: 'LE-0103', name: null, designer: null, image: null, details: [] },
        { id: 'LE-0104', name: null, designer: null, image: null, details: [null] },
        { id: 'LE-0105', name: null, designer: null, image: null, details: [] },
        { id: 'LE-0106', name: null, designer: null, image: null, details: [] }
      ] },
    { id: '2026-ss', title: 'Spring / Summer', year: '2026', period: '2026.03 — 2026.08', order: 2,
      // IMAGE SLOT: 2026 SS COLLECTION CAMPAIGN (가로 3:2)
      cover: null,
      note: null,
      looks: [
        { id: 'LE-0201', name: null, designer: null, image: null, details: [null] },
        { id: 'LE-0202', name: null, designer: null, image: null, details: [] },
        { id: 'LE-0203', name: null, designer: null, image: null, details: [] },
        { id: 'LE-0204', name: null, designer: null, image: null, details: [] }
      ] },
    { id: '2025', title: 'Collection', year: '2025', period: '2025', order: 3,
      // IMAGE SLOT: 2025 COLLECTION CAMPAIGN (가로 3:2)
      cover: null,
      note: null,
      looks: [
        { id: 'LE-0301', name: null, designer: null, image: null, details: [null] },
        { id: 'LE-0302', name: null, designer: null, image: null, details: [] },
        { id: 'LE-0303', name: null, designer: null, image: null, details: [] }
      ] }
  ],

  /* ───────── 04 셀럽 착용 ─────────
   * 실제 착용 사례가 확인되면 채워 넣으세요. 이름이 없는 줄은 빈 자리로만 보입니다.
   * lookId 에 컬렉션의 룩 번호(예: 'LE-0101')를 넣으면 '이 드레스 보기'로 연결됩니다. */
  celebrities: [
    // IMAGE SLOT: CELEBRITY 01 WEARING (세로 4:5)
    { name: null, occasion: null, dress: null, designer: null, lookId: null, image: null },
    { name: null, occasion: null, dress: null, designer: null, lookId: null, image: null },
    { name: null, occasion: null, dress: null, designer: null, lookId: null, image: null },
    { name: null, occasion: null, dress: null, designer: null, lookId: null, image: null }
  ],

  /* ───────── 05 스토어 ─────────
   * 매장을 추가하면 목록에 자동으로 붙습니다. 주소·지도 링크가 null 이면 그 줄은 감춰집니다.
   * mapUrl 에 네이버 지도/카카오맵 공유 링크를 넣으면 '지도 보기' 버튼이 생깁니다. */
  stores: [
    { id: 'elisabeth-town', name: 'Elisabeth Town', nameKo: '엘리자베스 타운', region: null,
      address: null, hours: null, phone: null, mapUrl: null, note: null,
      // IMAGE SLOT: ELIZABETH TOWN STORE (외관/전경, 가로 21:9) · SHOWROOM 2장 (세로 4:5)
      exterior: null, interior: [null, null] },
    // 지방 매장: 이름을 받기 전까지 placeholder 문구로 표시
    { id: 'regional-1', name: null, nameKo: null, placeholder: 'Regional Store', region: null,
      address: null, hours: null, phone: null, mapUrl: null, note: null,
      // IMAGE SLOT: REGIONAL STORE 1 (가로 21:9) · SHOWROOM 2장 (세로 4:5)
      exterior: null, interior: [null, null] }
  ],

  /* ───────── 06 상담 ───────── */
  consult: {
    draft: true,
    lead: '드레스를 천천히 입어 보실 수 있도록, 방문 전에 먼저 문의해 주세요.',
    steps: [
      { t: '문의', d: '원하시는 날짜와 관심 있는 드레스를 남겨 주세요.' },
      { t: '방문 안내', d: '가능한 방문 시간을 안내드립니다.' },
      { t: '피팅', d: '쇼룸에서 여유 있게 입어 보십니다.' }
    ],
    // 문의 내용 작성 칸에서 고를 수 있는 항목
    interests: ['컬렉션 드레스', '바잉 브랜드', '셀럽 착용 드레스', '아직 정하지 않음']
  }
};
