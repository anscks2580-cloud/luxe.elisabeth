# LUXE ELISABETH 홈페이지

정적 홈페이지(HTML·CSS·JS)입니다. 별도 서버나 빌드 과정 없이 GitHub Pages로 바로 배포됩니다.

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 화면 뼈대 |
| `css/style.css` | 디자인 |
| `js/fabric.js` | 첫 화면의 걸려 있는 원단(WebGL) — 천장 스왜그 2줄·커튼·오간자 자락, 마우스에 반응하는 변위장 |
| `js/site.js` | 데이터를 읽어 각 구역을 만드는 코드 |
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
