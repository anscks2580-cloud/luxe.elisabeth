/* LUXE ELISABETH — 원단 레이어
 * 구성
 *  1) ClothField : 화면 위에 깔린 작은 격자(스프링-질량). 커서가 지나가면 원단이 밀리고(가로·세로 변위),
 *                  부풀었다가(높이) 이웃 격자로 물결처럼 퍼진 뒤 감쇠하며 제자리로 돌아온다.
 *  2) Fabric     : WebGL 셰이더. 뒤에서부터 실크(큰 주름과 광택) → 레이스(텍스처, 입체 그림자, 비즈 반짝임)
 *                  → 튤(가는 그물, 반투명 베일) 세 겹을 그린다. 겹마다 반응 속도가 달라 깊이가 생긴다.
 *  레이스 무늬는 텍스처 한 장(R=레이스 면, G=입체 테두리 실, B=비즈)으로 바꿀 수 있다. data/dresses.js의 fabric 설정 참고.
 */
(function (root) {
  'use strict';

  /* ───────── 1. 원단 변위장 ───────── */
  class ClothField {
    constructor(cols) {
      this.W = cols; this.H = 2; this.alloc(cols, Math.round(cols * 0.6));
      this.kRest = 3.2;     // 제자리로 돌아오려는 힘
      this.kNb = 190;       // 이웃 격자를 끌어당기는 힘(물결 전파 속도)
      this.damp = 1.9;      // 감쇠(출렁임이 잦아드는 속도)
      this.amp = 0.16;      // 텍스처로 넘길 때의 최대 변위
    }
    alloc(w, h) {
      this.W = w; this.H = h; const n = w * h;
      this.d = new Float32Array(n * 3); this.v = new Float32Array(n * 3); this.tmp = new Float32Array(n * 3);
      this.bytes = new Uint8Array(n * 4);
    }
    fit(aspect) {           // aspect = 가로/세로
      const h = Math.max(16, Math.min(64, Math.round(this.W / Math.max(aspect, 0.3))));
      if (h !== this.H) this.alloc(this.W, h);
    }
    /* x,y: 0~1 화면 좌표, vx,vy: 초당 화면 비율, gain: 세기 */
    push(x, y, vx, vy, radius, gain) {
      const W = this.W, H = this.H, aspect = W / H, r2 = radius * radius;
      const sp = Math.hypot(vx, vy);
      const x0 = Math.max(0, Math.floor((x - radius * 1.8 / aspect) * W)), x1 = Math.min(W - 1, Math.ceil((x + radius * 1.8 / aspect) * W));
      const y0 = Math.max(0, Math.floor((y - radius * 1.8) * H)), y1 = Math.min(H - 1, Math.ceil((y + radius * 1.8) * H));
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const dx = ((i + 0.5) / W - x) * aspect, dy = (j + 0.5) / H - y;
        const g = Math.exp(-(dx * dx + dy * dy) / r2);
        if (g < 0.01) continue;
        const k = (j * W + i) * 3;
        this.v[k] += vx * g * gain;
        this.v[k + 1] += vy * g * gain;
        this.v[k + 2] += sp * g * gain * 0.9;
      }
    }
    step(dt) {
      const W = this.W, H = this.H, d = this.d, v = this.v;
      const kR = this.kRest, kN = this.kNb, c = this.damp;
      for (let j = 0; j < H; j++) {
        const ju = j > 0 ? j - 1 : j, jd = j < H - 1 ? j + 1 : j;
        for (let i = 0; i < W; i++) {
          const il = i > 0 ? i - 1 : i, ir = i < W - 1 ? i + 1 : i;
          const k = (j * W + i) * 3, kl = (j * W + il) * 3, kr = (j * W + ir) * 3, ku = (ju * W + i) * 3, kd = (jd * W + i) * 3;
          for (let a = 0; a < 3; a++) {
            const lap = d[kl + a] + d[kr + a] + d[ku + a] + d[kd + a] - 4 * d[k + a];
            v[k + a] += (-kR * d[k + a] + kN * lap - c * v[k + a]) * dt;
          }
        }
      }
      for (let n = 0; n < d.length; n++) d[n] += v[n] * dt;
    }
    energy() { let e = 0; for (let n = 0; n < this.d.length; n++) e = Math.max(e, Math.abs(this.d[n])); return e; }
    pack() {
      const d = this.d, b = this.bytes, s = 127.5 / this.amp;
      for (let n = 0, m = 0; n < d.length; n += 3, m += 4) {
        b[m] = Math.max(0, Math.min(255, 127.5 + d[n] * s));
        b[m + 1] = Math.max(0, Math.min(255, 127.5 + d[n + 1] * s));
        b[m + 2] = Math.max(0, Math.min(255, 127.5 + d[n + 2] * s));
        b[m + 3] = 255;
      }
      return b;
    }
  }

  /* ───────── 2. 셰이더 ───────── */
  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform vec2 uPar; uniform float uI;
uniform sampler2D uSim; uniform float uAmp;
uniform sampler2D uLace; uniform float uLaceOn; uniform float uLaceScale; uniform float uPhoto;
uniform vec3 uBg; uniform float uFade; uniform float uFocus; uniform vec2 uFocusAt;

const vec3 L = vec3(-0.48, -0.55, 0.68);   // 왼쪽 위에서 들어오는 빛 (y는 아래로 증가)

vec3 sim(vec2 s){ return (texture2D(uSim, s).rgb - 0.5) * 2.0 * uAmp; }

/* 원단이 위에서 늘어진 큰 주름. 시간이 흐르며 천천히 숨 쉬듯 바뀐다 */
float drape(vec2 p, float s){
  float y = p.y;
  float w = 0.50*sin(y*1.15 + s*2.3 + uT*0.21)
          + 0.24*sin(y*2.6 - s*1.7 - uT*0.17)
          + 0.10*sin(y*5.1 + s*3.9 + uT*0.29);
  float x = p.x*(1.25 + 0.42*s) + w;
  return 0.60*sin(x*2.4 + s*4.0 + uT*0.05)
       + 0.27*sin(x*4.6 + y*0.7 + s*1.3)
       + 0.11*sin(x*8.9 - y*1.3 + s*5.1 - uT*0.08)
       + 0.04*sin(x*17.0 + y*0.9 + s);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

vec4 lace(vec2 uv){
  vec3 t = texture2D(uLace, uv).rgb;
  if(uPhoto > 0.5){ float l = t.g; return vec4(l*0.8, l*l, 0.0, 1.0); }
  return vec4(t, 1.0);
}
float tulleNet(vec2 q, float pitch, float px){
  // 세 방향의 가는 실이 교차하는 그물
  float n = 0.0;
  vec2 d1 = vec2(1.0, 0.0), d2 = vec2(0.5, 0.866), d3 = vec2(-0.5, 0.866);
  float w = px * 0.9;
  n = max(n, 1.0 - smoothstep(0.0, w, abs(fract(dot(q, d1)/pitch) - 0.5)*pitch - pitch*0.5 + w));
  n = max(n, 1.0 - smoothstep(0.0, w, abs(fract(dot(q, d2)/pitch) - 0.5)*pitch - pitch*0.5 + w));
  n = max(n, 1.0 - smoothstep(0.0, w, abs(fract(dot(q, d3)/pitch) - 0.5)*pitch - pitch*0.5 + w));
  return n;
}

void main(){
  vec2 s = gl_FragCoord.xy / uRes; s.y = 1.0 - s.y;          // 0~1, 위가 0
  float asp = uRes.x / uRes.y;
  vec2 p = vec2(s.x * asp, s.y);                             // 세로 길이 기준 좌표
  float px = 1.0 / uRes.y;
  vec3 ln = normalize(L);
  vec3 H = normalize(ln + vec3(0.0, 0.0, 1.0));

  /* 변위장: 가로·세로 밀림과 높이, 높이의 기울기 */
  vec3 D = sim(s);
  float e = 1.5 / 48.0;
  float dzx = (sim(s + vec2(e, 0.0)).z - sim(s - vec2(e, 0.0)).z) / (2.0*e*asp);
  float dzy = (sim(s + vec2(0.0, e)).z - sim(s - vec2(0.0, e)).z) / (2.0*e);
  vec2 dz = vec2(dzx, dzy);

  /* ─ 1겹: 실크·오간자 바탕 ─ */
  vec2 q0 = p + uPar*0.010 - D.xy*0.55;
  float ee = 0.004;
  float h0 = drape(q0, 0.0);
  vec2 g0 = vec2(drape(q0 + vec2(ee,0.0), 0.0) - h0, drape(q0 + vec2(0.0,ee), 0.0) - h0) / ee;
  g0 = g0*0.085 + dz*1.4;
  vec3 n0 = normalize(vec3(-g0, 1.0));
  float l0 = dot(n0, ln);
  float sh0 = pow(max(dot(n0, H), 0.0), 18.0);
  vec3 silkLo = uBg * vec3(0.885, 0.875, 0.86);
  vec3 silkHi = min(uBg * 1.015, vec3(1.0));
  vec3 col = mix(silkLo, silkHi, smoothstep(0.35, 0.95, l0));
  col += vec3(1.0, 0.99, 0.97) * sh0 * 0.14;

  /* ─ 2겹: 레이스 ─ */
  vec2 q1 = p + uPar*0.022 - D.xy*1.0;
  float h1 = drape(q1, 1.0);
  vec2 g1 = vec2(drape(q1 + vec2(ee,0.0), 1.0) - h1, drape(q1 + vec2(0.0,ee), 1.0) - h1) / ee;
  g1 = g1*0.11 + dz*2.0;
  q1 += g1 * 0.035;                                          // 주름을 따라 무늬가 휘어짐
  vec3 n1 = normalize(vec3(-g1, 1.0));
  float l1 = dot(n1, ln);
  if(uLaceOn > 0.5){
    vec2 uv = q1 * uLaceScale;
    uv = vec2(uv.x*0.966 - uv.y*0.259, uv.x*0.259 + uv.y*0.966);  // 살짝 기울여 격자 반복을 숨김
    vec4 Lc = lace(uv);
    float du = 1.5 / 1024.0;
    vec4 Lx = lace(uv + vec2(du, 0.0)), Ly = lace(uv + vec2(0.0, du));
    float hl = Lc.g + Lc.r*0.45, hx = Lx.g + Lx.r*0.45, hy = Ly.g + Ly.r*0.45;
    vec3 nl = normalize(vec3(-(hx-hl)*1.6 - g1.x, -(hy-hl)*1.6 - g1.y, 1.0));
    float a = clamp(Lc.r*0.62 + Lc.g*0.95, 0.0, 1.0);
    // 레이스가 바탕 위에 떠 있어 생기는 그림자. 주름이 들린 곳일수록 그림자가 멀어진다
    vec2 so = vec2(0.0045, 0.0055) * (1.2 + h1*0.6 + D.z*6.0) * uLaceScale;
    vec4 Ls = lace(uv + so);
    float sa = clamp(Ls.r*0.62 + Ls.g*0.95, 0.0, 1.0);
    // 레이스의 존재감은 화면 위치와 주름에 따라 달라짐(벽지처럼 균일하지 않게)
    float cov = 0.55 + 0.45*smoothstep(-0.6, 0.7, sin(q1.x*1.3 + q1.y*0.7 + 1.4) + 0.5*h1);
    cov *= uI;
    col *= 1.0 - sa * 0.30 * cov;
    vec3 thread = vec3(1.0, 0.992, 0.978);
    float lit = 0.80 + 0.30*dot(nl, ln);
    float spec = pow(max(dot(nl, H), 0.0), 26.0);
    vec3 lc = thread * lit + vec3(1.0)*spec*0.35*Lc.g;
    lc = mix(lc, lc*vec3(0.93,0.915,0.895), (1.0 - Lc.g)*0.5);  // 면은 실보다 약간 어둡게
    col = mix(col, lc, a * 0.94 * cov);
    // 비즈·시퀸: 주름 각도에 따라 순간적으로 반짝
    if(Lc.b > 0.05){
      vec2 cell = floor(uv * 512.0);
      vec3 fn = normalize(n1 + vec3(hash(cell)-0.5, hash(cell+7.1)-0.5, 0.0)*0.9);
      float sp = pow(max(dot(fn, H), 0.0), 90.0);
      float tw = 0.5 + 0.5*sin(uT*2.3 + hash(cell+3.0)*40.0);
      col = mix(col, vec3(0.80, 0.80, 0.82), Lc.b*0.35*cov);
      col += vec3(1.0) * Lc.b * (sp*2.4 + tw*0.12) * cov;
    }
  }

  /* ─ 3겹: 튤 베일 ─ */
  vec2 q2 = p + uPar*0.040 - D.xy*1.45;
  float h2 = drape(q2*vec2(0.8, 1.0), 2.0);
  vec2 g2 = vec2(drape(q2*vec2(0.8,1.0) + vec2(ee,0.0), 2.0) - h2, drape(q2*vec2(0.8,1.0) + vec2(0.0,ee), 2.0) - h2) / ee;
  g2 = g2*0.12 + dz*2.6;
  vec3 n2 = normalize(vec3(-g2, 1.0));
  float veil = smoothstep(-0.15, 0.55, sin(q2.x*0.9 - q2.y*0.55 + uT*0.06 + 2.2) + 0.35*h2);
  float crease = smoothstep(0.88, 0.45, dot(n2, ln));           // 접힌 곳에서 튤이 겹쳐 진해짐
  float net = tulleNet(q2 + g2*0.02, 0.011, px);
  float ta = (0.05 + 0.20*crease) * veil * uI;
  col = mix(col, vec3(1.0), veil*0.07*uI);                       // 베일의 흰 안개
  col = mix(col, vec3(0.97, 0.965, 0.955), net*ta*0.9);
  col = mix(col, col*0.93, crease*veil*0.25*uI);
  col += vec3(1.0) * pow(max(dot(n2, H), 0.0), 40.0) * veil * 0.20 * uI;
  // 베일 위 크리스털 점
  vec2 cg = floor(q2 * 140.0);
  float star = step(0.985, hash(cg));
  vec2 cf = fract(q2*140.0) - 0.5;
  col += vec3(1.0) * star * veil * smoothstep(0.22, 0.0, length(cf)) * (0.25 + 1.6*pow(max(dot(n2,H),0.0), 60.0)) * uI;

  /* 글자·사진 주변 은은히 밝히기, 아래쪽 페이드 */
  if(uFocus > 0.0){ float f = smoothstep(0.55, 0.0, length((s - uFocusAt)*vec2(asp*0.8, 1.0))); col = mix(col, uBg, f*uFocus); }
  col = mix(uBg, col, mix(1.0, smoothstep(1.0, 0.86, s.y), uFade));
  gl_FragColor = vec4(col, 1.0);
}`;

  const reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = root.matchMedia && root.matchMedia('(pointer: coarse)').matches;

  function rgb(hex) { hex = hex.trim().replace('#', ''); return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); }

  class Fabric {
    /* opt: intensity(0~1.2), fade(아래쪽 페이드), scale(렌더 해상도 배율), laceScale, focus(글자 쪽 밝히기), focusAt */
    constructor(canvas, opt) {
      this.c = canvas;
      this.o = Object.assign({ intensity: 1, fade: 0, scale: coarse ? 0.55 : 0.72, laceScale: 1.05, focus: 0, focusAt: [0.2, 0.75], cols: coarse ? 36 : 48, idle: true, bg: '#F6F2EB' }, opt);
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'default', preserveDrawingBuffer: false });
      if (!gl) throw new Error('webgl');
      this.gl = gl;
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = n => gl.getUniformLocation(pr, n);
      this.u = {};
      ['uRes', 'uT', 'uPar', 'uI', 'uSim', 'uAmp', 'uLace', 'uLaceOn', 'uLaceScale', 'uPhoto', 'uBg', 'uFade', 'uFocus', 'uFocusAt'].forEach(n => this.u[n] = U(n));

      this.field = new ClothField(this.o.cols);
      this.simTex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.simTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(this.u.uSim, 0); gl.uniform1i(this.u.uLace, 1);
      gl.uniform1f(this.u.uAmp, this.field.amp);
      gl.uniform1f(this.u.uI, this.o.intensity);
      gl.uniform1f(this.u.uFade, this.o.fade);
      gl.uniform1f(this.u.uFocus, this.o.focus);
      gl.uniform2f(this.u.uFocusAt, this.o.focusAt[0], this.o.focusAt[1]);
      gl.uniform1f(this.u.uLaceScale, this.o.laceScale);
      gl.uniform1f(this.u.uLaceOn, 0);
      gl.uniform1f(this.u.uPhoto, 0);
      gl.uniform3fv(this.u.uBg, rgb(this.o.bg));

      this.ptr = null; this.sm = null; this.par = [0, 0]; this.parT = [0, 0];
      this.t0 = performance.now(); this.slow = 0; this.running = false; this.visible = true; this.nextGust = 900; this.gust = null;
      this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas);
      if (reduce) { this.draw(performance.now(), 0); return; }
      new IntersectionObserver(es => { this.visible = es[0].isIntersecting; this.visible ? this.start() : (this.running = false); }, { rootMargin: '80px' }).observe(canvas);
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.running = false; else if (this.visible) this.start(); });
    }

    /* 레이스 텍스처 연결. src: 이미지 주소 또는 data URI. photo=true면 일반 레이스 사진(밝은 레이스, 어두운 바탕)으로 취급 */
    setLace(src, photo) {
      const img = new Image();
      img.onload = () => {
        const gl = this.gl;
        this.laceTex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.laceTex);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); }
        catch (e) { console.warn('레이스 텍스처를 불러오지 못했습니다', e); return; }
        const pot = (img.width & (img.width - 1)) === 0 && (img.height & (img.height - 1)) === 0;
        if (pot) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); }
        else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1f(this.u.uLaceOn, 1); gl.uniform1f(this.u.uPhoto, photo ? 1 : 0);
        if (!this.running) this.draw(performance.now(), 0);
      };
      img.src = src;
    }

    resize() {
      const r = this.c.getBoundingClientRect(); if (!r.width || !r.height) return;
      const k = Math.min(root.devicePixelRatio || 1, 1.6) * this.o.scale;
      this.c.width = Math.max(2, Math.round(r.width * k)); this.c.height = Math.max(2, Math.round(r.height * k));
      this.gl.viewport(0, 0, this.c.width, this.c.height);
      this.gl.uniform2f(this.u.uRes, this.c.width, this.c.height);
      this.field.fit(r.width / r.height);
      this.rect = r;
      if (!this.running) this.draw(performance.now(), 0);
    }

    /* 창 좌표의 포인터를 받아 원단 좌표로 */
    pointer(cx, cy) {
      const r = this.c.getBoundingClientRect(); this.rect = r;
      const x = (cx - r.left) / r.width, y = (cy - r.top) / r.height;
      if (x < -0.15 || x > 1.15 || y < -0.15 || y > 1.15) { this.ptr = null; return; }
      const now = performance.now();
      this.ptr = { x, y, t: now };
      this.parT = [x * 2 - 1, y * 2 - 1];
      if (!this.sm) this.sm = { x, y };
    }
    /* 화면을 가로지르는 바람(첫 화면 연출·대기 상태·모바일 스크롤에 사용) */
    sweep(fromX, fromY, toX, toY, dur, gain) { this.gust = { fromX, fromY, toX, toY, t0: performance.now(), dur, gain }; }

    start() { if (this.running || reduce) return; this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      // 저사양: 프레임이 계속 느리면 해상도를 낮추고, 그래도 느리면 정지 화면으로
      if (dt > 0.034) this.slow++; else this.slow = Math.max(0, this.slow - 1);
      if (this.slow > 45) { if (this.o.scale > 0.4) { this.o.scale = 0.4; this.slow = 0; this.resize(); } else { this.running = false; return; } }

      const f = this.field;
      // 커서: 지연을 두고 따라가며, 그 속도가 원단을 민다
      if (this.ptr && this.sm) {
        const px = this.sm.x, py = this.sm.y, k = 1 - Math.pow(0.0009, dt);
        this.sm.x += (this.ptr.x - this.sm.x) * k; this.sm.y += (this.ptr.y - this.sm.y) * k;
        const vx = (this.sm.x - px) / dt, vy = (this.sm.y - py) / dt;
        if (Math.abs(vx) + Math.abs(vy) > 0.02) f.push(this.sm.x, this.sm.y, vx, vy, 0.13, 7.5 * dt * 60 / 60);
      }
      // 대기 상태에도 가끔 바람이 지나가며 살아 움직이게
      if (this.o.idle) {
        this.nextGust -= dt * 1000;
        if (this.nextGust < 0 && !this.gust) {
          const y = 0.25 + Math.random() * 0.5, dir = Math.random() < 0.5 ? 1 : -1;
          this.sweep(dir > 0 ? -0.1 : 1.1, y, dir > 0 ? 1.1 : -0.1, y + (Math.random() - 0.5) * 0.4, 2600, 0.30);
          this.nextGust = 4200 + Math.random() * 3000;
        }
      }
      if (this.gust) {
        const g = this.gust, t = (now - g.t0) / g.dur;
        if (t >= 1) this.gust = null;
        else {
          const e = t * t * (3 - 2 * t);
          const x = g.fromX + (g.toX - g.fromX) * e, y = g.fromY + (g.toY - g.fromY) * e;
          const vx = (g.toX - g.fromX) / (g.dur / 1000) * 6 * t * (1 - t) * 1.5, vy = (g.toY - g.fromY) / (g.dur / 1000) * 6 * t * (1 - t) * 1.5;
          f.push(x, y, vx, vy, 0.2, g.gain * dt * 60 / 60 * 7.5);
        }
      }
      const sub = 3; for (let i = 0; i < sub; i++) f.step(dt / sub);

      this.par[0] += (this.parT[0] - this.par[0]) * (1 - Math.pow(0.12, dt));
      this.par[1] += (this.parT[1] - this.par[1]) * (1 - Math.pow(0.12, dt));
      this.draw(now, 1);
      requestAnimationFrame(t => this.loop(t));
    }
    draw(now, live) {
      const gl = this.gl, f = this.field;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.simTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      if (!this.simInit || this.simInit !== f.W * 1000 + f.H) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, f.W, f.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, f.pack()); this.simInit = f.W * 1000 + f.H; }
      else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, f.W, f.H, gl.RGBA, gl.UNSIGNED_BYTE, f.pack());
      gl.uniform1f(this.u.uT, reduce ? 6.0 : (now - this.t0) / 1000);
      gl.uniform2f(this.u.uPar, this.par[0], this.par[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  root.LuxeFabric = { Fabric, ClothField, reduce, coarse };
  if (typeof module !== 'undefined') module.exports = { ClothField };
})(typeof window !== 'undefined' ? window : globalThis);
