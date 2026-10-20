# LUXE ELISABETH 홈페이지

정적 홈페이지(HTML·CSS·JS)입니다. 별도 서버나 빌드 과정 없이 GitHub Pages로 바로 배포됩니다.

## 현재 홈페이지 (6차, 2026-10)

흰 바탕에 사진이 주인공인 구성입니다. 장식·원단 애니메이션 없이 여백·정렬·사진 비율로만 위계를 만듭니다.

| 경로 | 내용 |
|---|---|
| `index.html` | 화면 뼈대 (첫 화면 → 01 럭스 소개 → 02 바잉 업체 → 03 컬렉션 → 04 셀럽 착용 → 05 스토어 → 06 상담) |
| `css/style.css` | 디자인 |
| `js/legacy-site.js` | 데이터를 읽어 각 구역을 만드는 코드 |
| `js/shared.js` | 공용 기능 — 첫 화면 슬라이드, 시즌 탭, 드레스 상세 보기, 상담 문의 작성, 모바일 메뉴 |
| `js/logo.js` | 로고(SVG) |
| `data/site-data.js` | **글·사진·업체·매장·연락처 — 내용을 바꿀 때는 이 파일만 고치면 됩니다** |

### 사진·글 넣기

`data/site-data.js` 에서 `null` 로 되어 있는 항목에 값을 넣으면 됩니다. 각 항목 위에 `IMAGE SLOT:` 주석으로 어떤 사진이 들어갈지, 권장 비율이 적혀 있습니다.
주소 뒤에 `?guides` 를 붙여 열면(예: `index.html?guides`) 사진 자리 이름과 입력이 필요한 항목이 점선으로 표시됩니다. 일반 방문자에게는 보이지 않습니다.

- 첫 화면 `hero`: **가로 사진(16:9~3:2) 권장.** 세로 사진이면 `focus` 로 잘림 기준점을 정합니다. 2장 이상이면 자동 슬라이드.
- 현재 들어 있는 드레스·매장 사진은 인스타그램 캡처를 임시로 넣은 예시입니다(`sample: true`). 실제 사진으로 교체하세요.

### 이전 버전

| 경로 | 내용 |
|---|---|
| `legacy-index.html` · `css/legacy-style.css` · `js/legacy-site.js` · `js/fabric.js` · `data/dresses.js` | 4차까지의 홈페이지(원단 WebGL 포함) |
| `concept-a.html` · `concept-b.html` | 5차 시안 A·B |

---

## (이전) 4차 홈페이지 설명

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `legacy-index.html` | 화면 뼈대 |
| `css/legacy-style.css` | 디자인 |
| `js/fabric.js` | 첫 화면의 걸려 있는 원단(WebGL) — 천장 스왜그 2줄·커튼·오간자 자락, 마우스에 반응하는 변위장 |
| `js/legacy-site.js` | 데이터를 읽어 각 구역을 만드는 코드 |
| `data/dresses.js` | **드레스·시즌 데이터 — 새 드레스는 여기만 고치면 됩니다** |
| `images/dresses/` | 드레스 대표 사진 |
| `images/details/` | 드레스 디테일 사진 |
| `images/fabric/` | 원단 정지 이미지(웹GL이 안 될 때 대체용), 아래 구역에 이어지는 원단 그림자 |

## 새 드레스 추가하기

1. 사진을 `images/dresses/` 에 넣습니다. (세로 사진, 가로 1000px 이상 권장)
2. `data/dresses.js` 의 `dresses` 목록에 한 줄 블록을 추가합니다.

```js
{ id: 'LE-0106', name: '드레스 이름', season: '2026-fw', arrived: '2026-11-02',
  categories: ['lace'], image: 'images/dresses/파일명.webp', focus: '50% 30%',
  details: ['images/details/디테일.webp'],
  isNew: true, hero: false, signature: false, visible: true },
```

- `isNew: true` → New Arrivals 에 최신 입고순으로 표시
- `hero: true` (+ `heroOrder`) → 첫 화면 슬라이드에 표시
- `signature: true` (+ `signatureOrder`) → Signature Dresses 에 표시
- `visible: false` → 지우지 않고 숨기기
- `focus` → 사진이 잘릴 때 기준점(가로 세로 %)

## 새 시즌 추가하기

`data/dresses.js` 의 `seasons` 목록에 추가하고, 드레스의 `season` 값을 그 `id` 로 맞춥니다. `order` 가 작을수록 앞 탭에 나옵니다.

## 예시 데이터 표시

현재 시즌 구분·입고일은 예시입니다(`sample: true`). 실제 값으로 바꾼 뒤 `sample: false` 로 바꾸면 화면의 '예시 데이터' 표시가 사라집니다.
주소·운영 시간·예약 방법은 `brand` 항목에 넣으면 방문 안내와 하단에 자동으로 표시됩니다.

## 관리자 페이지·DB 연결

`js/site.js` 의 `loadData()` 함수만 서버 요청으로 바꾸면 됩니다. 서버는 `data/dresses.js` 와 같은 모양의 JSON을 돌려주면 됩니다.

---

## 리디자인 시안 (2026-10)

기존 홈페이지(`index.html`)는 그대로 두고, 새 시안 두 개를 따로 만들었습니다.

| 주소 | 방향 |
|---|---|
| `concept-a.html` | STYLE A. Emotional Couture — 아이보리·블러시, 세리프, 화보 잡지식 편집, 원단 적극 사용 |
| `concept-b.html` | STYLE B. Modern Minimal — 흰 바탕·검정 선, 산세리프, 룩북 그리드, 원단은 첫 화면 세로 띠로 절제 |

주소 뒤에 `?guides` 를 붙이면(예: `concept-a.html?guides`) 사진 자리 이름과 입력이 필요한 항목이 점선으로 표시됩니다. 일반 방문자에게는 보이지 않습니다.

### 시안 파일

| 경로 | 내용 |
|---|---|
| `data/site-data.js` | **두 시안 공용 데이터 — 글·사진·업체·매장·연락처는 여기만 고치면 됩니다** |
| `js/concept-shared.js` | 공용 기능(사진 자리, 시즌 탭, 드레스 상세 보기, 상담 문의 작성, 현재 섹션 표시) |
| `js/concept-a.js` · `css/concept-a.css` | 시안 A |
| `js/concept-b.js` · `css/concept-b.css` | 시안 B |
| `js/logo.js` | 로고(Cinzel 700 획을 도형으로 바꾼 것) — `images/logo/` 에 원본 SVG |
| `js/fabric.js` | 기존 원단(WebGL) — 수정 없이 두 시안이 옵션만 달리해서 사용 |

### 사진 넣기

`data/site-data.js` 에서 `null` 로 되어 있는 사진 항목에 경로를 넣으면 됩니다. 각 항목 위에 `IMAGE SLOT:` 주석으로 어떤 사진이 들어갈지, 권장 비율이 적혀 있습니다.
파일이 없거나 경로가 틀리면 깨진 아이콘 대신 빈 자리로 돌아갑니다. 첫 화면 사진을 2장 이상 넣으면 자동 넘김 슬라이드가 켜집니다.
