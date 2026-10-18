/* LUXE ELISABETH — 걸려 있는 원단 + 마우스 반응
 *
 * 장면(뒤 → 앞)
 *   1. 벽을 덮은 실크 커튼 : 넓고 부드러운 세로 주름
 *   2. 오간자 자락 3장     : 반투명, 가장자리가 따로 흔들림, 겹친 곳에 그림자
 *   3. 천장 스왜그 2줄     : 뒤 줄과 앞 줄이 다른 간격으로 늘어져 깊이가 생김
 *
 * 움직임
 *   - 기본 : 위(봉)는 고정, 아래로 갈수록 천천히 흔들림. 겹마다 주기·방향이 달라 동시에 움직이지 않음
 *   - 마우스 : 2차 시안의 '변위장(ClothField)'을 원단용으로 다시 연결.
 *              · 격자를 세로로 단단히, 가로로 느슨하게 묶어 물결처럼 퍼지지 않고 '자락 단위'로 밀림
 *              · 맨 윗줄은 봉에 고정 → 밑단일수록 크게 밀렸다가 관성으로 몇 번 흔들리며 가라앉음
 *              · 밀린 쪽은 주름이 촘촘하고 깊어지고, 반대쪽은 펴짐(주름이 반응)
 *              · 겹마다 반응 크기가 달라(앞 겹 > 뒤 겹) 깊이가 드러남
 *              · 마우스 세로 위치는 겹 사이 시차와 앞 자락의 겹침 정도를 바꿈
 *   - 빛은 주름 모양만 보여줌. 반짝임·번쩍임·부푸는 광택 없음
 */
(function (root) {
  'use strict';

  /* ───────── 변위장 ───────── */
  class ClothField {
    constructor(cols, rows) {
      this.kV = 240;   // 세로 이웃(같은 자락) — 강하게: 자락 전체가 함께 움직임
      this.kH = 26;    // 가로 이웃 — 약하게: 옆 자락은 조금 늦게, 조금만 따라옴
      this.kR = 2.4;   // 제자리로 돌아오려는 힘(진자처럼 몇 번 흔들림)
      this.damp = 1.25;
      this.amp = 0.08; // 텍스처로 넘길 최대 변위(화면 비율)
      this.alloc(cols, rows);
    }
    alloc(w, h) { this.W = w; this.H = h; const n = w * h; this.d = new Float32Array(n * 2); this.v = new Float32Array(n * 2); this.bytes = new Uint8Array(n * 4); }
    /* x,y: 0~1, vx,vy: 초당 화면 비율 */
    push(x, y, vx, vy, r, gain) {
      const W = this.W, H = this.H, asp = this.asp || 1.6, r2 = r * r;
      for (let j = 1; j < H; j++) {
        const fy = j / (H - 1);
        const hang = Math.pow(fy, 1.2);                 // 봉 가까이는 거의 안 밀림
        for (let i = 0; i < W; i++) {
          const dx = ((i + 0.5) / W - x) * asp, dy = (fy - y) * 0.55; // 세로로 긴 영향 범위(자락 단위)
          const g = Math.exp(-(dx * dx + dy * dy) / r2);
          if (g < 0.01) continue;
          const k = (j * W + i) * 2;
          this.v[k] += vx * g * gain * hang;
          this.v[k + 1] += vy * g * gain * hang * 0.35;
        }
      }
    }
    step(dt) {
      const W = this.W, H = this.H, d = this.d, v = this.v;
      for (let j = 1; j < H; j++) {
        const ju = j - 1, jd = j < H - 1 ? j + 1 : j;
        for (let i = 0; i < W; i++) {
          const il = i > 0 ? i - 1 : i, ir = i < W - 1 ? i + 1 : i;
          const k = (j * W + i) * 2, ku = (ju * W + i) * 2, kd = (jd * W + i) * 2, kl = (j * W + il) * 2, kr = (j * W + ir) * 2;
          for (let a = 0; a < 2; a++) {
            const lv = d[ku + a] + d[kd + a] - 2 * d[k + a];
            const lh = d[kl + a] + d[kr + a] - 2 * d[k + a];
            v[k + a] += (this.kV * lv + this.kH * lh - this.kR * d[k + a] - this.damp * v[k + a]) * dt;
          }
        }
      }
      for (let n = 2 * W; n < d.length; n++) {         // 첫 줄(봉)은 고정
        d[n] += v[n] * dt;
        if (d[n] > this.amp) { d[n] = this.amp; v[n] *= 0.5; } else if (d[n] < -this.amp) { d[n] = -this.amp; v[n] *= 0.5; }
      }
    }
    pack() {
      const d = this.d, b = this.bytes, s = 127.5 / this.amp;
      for (let n = 0, m = 0; n < d.length; n += 2, m += 4) {
        b[m] = Math.max(0, Math.min(255, 127.5 + d[n] * s));
        b[m + 1] = Math.max(0, Math.min(255, 127.5 + d[n + 1] * s));
        b[m + 2] = 128; b[m + 3] = 255;
      }
      return b;
    }
    maxAbs() { let e = 0; for (let n = 0; n < this.d.length; n++) e = Math.max(e, Math.abs(this.d[n])); return e; }
  }

  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform vec2 uPar;
uniform sampler2D uSim; uniform float uAmp;
uniform vec3 uBg; uniform vec3 uEnd; uniform float uFade; uniform float uSwag;

float hash(float n){ return fract(sin(n) * 43758.5453); }
float vnoise(float x){ float i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f); return mix(hash(i), hash(i + 1.0), f); }

vec2 simAt(vec2 s){ return (texture2D(uSim, s).rg - 0.5) * 2.0 * uAmp; }

/* 커튼 한 겹의 주름 높이. x: 세로 기준 가로 좌표, y: 0(봉)~1(바닥), k: 겹 번호, m: 마우스 변위(가로), c: 압축(+면 촘촘) */
float curtain(float x, float y, float k, float t, float m, float c){
  float g = pow(y, 1.7);
  float sway = g * ( 0.016*sin(t*0.29 + k*1.9 + x*0.9)
                   + 0.009*sin(t*0.43 + k*3.1 - x*1.7)
                   + 0.004*sin(t*0.71 + k*0.7 + x*3.1) );
  float xs = x + sway + m;
  float f = (15.0 + 4.0*k) * (1.0 + c * 0.5);
  float ph = vnoise(xs*2.2 + k*7.0) * 2.4 + 0.5*sin(y*1.7 + x*2.3 + k) * g;
  float h = 0.62*sin(xs*f + ph + k*2.0)
          + 0.28*sin(xs*f*1.73 + ph*1.6 + k)
          + 0.07*sin(xs*f*3.1 - ph + k*4.0 + y*1.5);
  return h * (0.6 + 0.4*smoothstep(0.0, 0.9, y)) * (1.0 + c * 0.6);
}

vec3 shadeFold(float s, float h, vec3 base, float contrast){
  float n = clamp(-s * 0.026, -1.0, 1.0);
  float lit = 0.5 + 0.5 * n;
  float ao = 0.5 + 0.5 * h;
  float v = mix(0.5, lit*0.62 + ao*0.38, contrast);
  return mix(base * vec3(0.872, 0.858, 0.836), base * 1.012, v);
}

/* 오간자 자락: 가로 범위(가장자리가 따로 흔들림) */
float panel(float x, float y, float c, float w, float k, float t, float m){
  float g = pow(y, 1.6);
  float e = g * (0.03*sin(t*0.23 + k*2.3) + 0.012*sin(t*0.37 + k*4.1 + y*2.0)) + m;
  float d = abs(x - c - e) - w * (1.0 + 0.3*y);
  return 1.0 - smoothstep(-0.05, 0.02, d);
}

/* 천장 스왜그 한 줄. 반환: x=덮임, y=명암, z=아래 그림자 */
vec3 swag(float x, float y, float P, float off, float top, float sagBase, float t, float m, float seed){
  float xx = x + off + m * 0.3;
  float u = fract(xx / P), idx = floor(xx / P);
  float sag = sagBase * (0.85 + 0.3*hash(idx + seed)) + 0.006*sin(t*0.21 + idx*1.7 + seed);
  float edge = top + sag * pow(sin(3.14159 * u), 0.8);
  float cov = 1.0 - smoothstep(edge - 0.004, edge + 0.006, y);
  float sh = smoothstep(edge + 0.07, edge, y) * (1.0 - cov);
  float v = clamp(y / max(edge, 0.001), 0.0, 1.0);
  float ph = v * 3.14159 * 3.5 + u * 1.3 + idx;
  float lit = 0.5 + 0.5 * clamp(cos(ph) * 0.55 + (u - 0.5) * 0.4, -1.0, 1.0);
  float body = 0.5 + 0.5 * sin(ph) * (0.55 + 0.45 * sin(3.14159 * u));
  return vec3(cov, lit * 0.75 + body * 0.25, sh);
}

void main(){
  vec2 s = gl_FragCoord.xy / uRes; s.y = 1.0 - s.y;
  float asp = uRes.x / uRes.y;
  float x = s.x * asp, y = s.y;
  float t = uT;
  float ex = 1.5 / uRes.y;

  // 마우스 변위와, 그 가로 기울기(밀린 쪽은 주름이 모이고 반대쪽은 펴짐)
  vec2 D = simAt(s);
  float e = 1.0 / 40.0;
  float comp = -(simAt(s + vec2(e, 0.0)).x - simAt(s - vec2(e, 0.0)).x) / (2.0 * e);
  comp = clamp(comp * 2.4, -0.7, 0.7);
  float px = uPar.x, py = uPar.y;   // 지연을 두고 따라오는 마우스 위치(-1~1)

  /* 1. 뒤 커튼 — 반응 작게 */
  float m0 = D.x * asp * 0.45 + px * 0.006;
  float yb = y + py * 0.004;
  float h0 = curtain(x, yb, 0.0, t, m0, comp * 0.5);
  float s0 = (curtain(x + ex, yb, 0.0, t, m0, comp * 0.5) - h0) / ex;
  vec3 col = shadeFold(s0, h0, uBg, 1.0);
  col *= 1.0 + 0.02 * smoothstep(0.9, 0.0, s.x) - 0.025 * smoothstep(0.5, 1.0, s.x);

  /* 2. 오간자 자락 3장 — 앞일수록 크게 반응, 마우스 세로 위치에 따라 겹침이 달라짐 */
  for(int i = 0; i < 3; i++){
    float k = 1.0 + float(i);
    float c = (i == 0 ? 0.06 : (i == 1 ? 0.33 : 0.70)) * asp;
    float w = (i == 0 ? 0.09 : (i == 1 ? 0.12 : 0.09)) * asp;
    float resp = 0.6 + 0.25 * k;
    float m = D.x * asp * resp + px * (0.008 + 0.006 * k);
    float yy = y + py * 0.006 * k;
    float msk = panel(x, yy, c, w, k, t, m * 0.8);
    if(msk > 0.001){
      float h = curtain(x, yy, k, t, m, comp * resp);
      float sl = (curtain(x + ex, yy, k, t, m, comp * resp) - h) / ex;
      vec3 sheer = shadeFold(sl, h, min(uBg * 1.05, vec3(1.0)), 0.8);
      float edgeOn = smoothstep(0.25, 0.9, abs(sl) * 0.026);
      float a = (0.40 + 0.26 * edgeOn) * msk * (0.92 + 0.08 * py * (k - 2.0));
      // 자락이 뒤 커튼에 드리우는 그림자(살짝 오른쪽 아래)
      float shm = panel(x - 0.018, yy - 0.01, c, w, k, t, m * 0.8);
      col *= 1.0 - 0.07 * shm * (1.0 - msk);
      col = mix(col, sheer, a);
      col *= 1.0 - msk * (1.0 - msk) * 4.0 * 0.028;
    }
  }

  /* 3. 천장 스왜그 — 뒤 줄(간격 넓고 얕음), 앞 줄(간격 좁고 깊음) */
  if(uSwag > 0.0){
    vec3 b = swag(x, y - py * 0.004, 1.15, 0.52, 0.02, 0.15, t, D.x * asp * 0.4 + px * 0.006, 11.0);
    col *= 1.0 - b.z * 0.07;
    col = mix(col, mix(uBg * vec3(0.885, 0.872, 0.852), uBg * 1.01, b.y), b.x * uSwag);
    vec3 f = swag(x, y + py * 0.006, 0.82, 0.07, 0.03, 0.125, t * 1.1, D.x * asp * 0.7 + px * 0.012, 3.0);
    col *= 1.0 - f.z * 0.07 * uSwag;
    col = mix(col, mix(uBg * vec3(0.89, 0.877, 0.858), uBg * 1.018, f.y), f.x * uSwag);
  }

  float fade = smoothstep(1.0 - 0.22 * uFade, 1.0, y) * step(0.001, uFade);
  col = mix(col, uEnd, fade);
  gl_FragColor = vec4(col, 1.0);
}`;

  const reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = root.matchMedia && root.matchMedia('(pointer: coarse)').matches;
  const rgb = hex => { hex = hex.trim().replace('#', ''); return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); };

  class Fabric {
    /* opt: bg, end, fade, swag, scale, keep(정지 이미지 저장용) */
    constructor(canvas, opt) {
      opt = opt || {};
      this.c = canvas;
      this.o = Object.assign({ bg: '#ECE6DC', end: '#F5F1EB', fade: 1, swag: 1, scale: coarse ? 0.5 : 0.65 }, opt);
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: !!opt.keep });
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
      this.u = {}; ['uRes', 'uT', 'uPar', 'uSim', 'uAmp', 'uBg', 'uEnd', 'uFade', 'uSwag'].forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
      gl.uniform3fv(this.u.uBg, rgb(this.o.bg)); gl.uniform3fv(this.u.uEnd, rgb(this.o.end));
      gl.uniform1f(this.u.uFade, this.o.fade); gl.uniform1f(this.u.uSwag, this.o.swag);

      this.field = new ClothField(40, 24);
      gl.uniform1f(this.u.uAmp, this.field.amp); gl.uniform1i(this.u.uSim, 0);
      this.simTex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.simTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR));
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(p => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.field.W, this.field.H, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.field.pack());

      this.ptr = null; this.sm = null; this.par = [0, 0]; this.parT = [0, 0];
      this.t0 = performance.now() - 40000 * Math.random(); this.slow = 0; this.running = false; this.visible = true;
      this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas);
      if (reduce) { this.draw(performance.now()); return; }
      new IntersectionObserver(es => { this.visible = es[0].isIntersecting; this.visible ? this.start() : (this.running = false); }).observe(canvas);
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.running = false; else if (this.visible) this.start(); });
    }
    resize() {
      const r = this.c.getBoundingClientRect(); if (!r.width || !r.height) return;
      const k = Math.min(root.devicePixelRatio || 1, 1.5) * this.o.scale;
      this.c.width = Math.max(2, Math.round(r.width * k)); this.c.height = Math.max(2, Math.round(r.height * k));
      this.gl.viewport(0, 0, this.c.width, this.c.height);
      this.gl.uniform2f(this.u.uRes, this.c.width, this.c.height);
      this.field.asp = r.width / r.height;
      if (!this.running) this.draw(performance.now());
    }
    /* 창 좌표의 마우스 위치 */
    pointer(cx, cy) {
      const r = this.c.getBoundingClientRect();
      const x = (cx - r.left) / r.width, y = (cy - r.top) / r.height;
      if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1) return;
      this.ptr = { x, y };
      this.parT = [x * 2 - 1, y * 2 - 1];
      if (!this.sm) this.sm = { x, y };
    }
    start() { if (this.running || reduce) return; this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (dt > 0.04) this.slow++; else this.slow = Math.max(0, this.slow - 1);
      if (this.slow > 50) { if (this.o.scale > 0.38) { this.o.scale = 0.38; this.slow = 0; this.resize(); } else { this.running = false; return; } }
      const f = this.field;
      // 마우스: 지연을 두고 따라가는 점의 속도가 원단을 민다(빠르게 움직여도 상한이 있어 과하게 출렁이지 않음)
      if (this.ptr && this.sm) {
        const px = this.sm.x, py = this.sm.y, k = 1 - Math.pow(0.02, dt);
        this.sm.x += (this.ptr.x - this.sm.x) * k; this.sm.y += (this.ptr.y - this.sm.y) * k;
        let vx = (this.sm.x - px) / dt, vy = (this.sm.y - py) / dt;
        const sp = Math.hypot(vx, vy), cap = 1.2;
        if (sp > cap) { vx *= cap / sp; vy *= cap / sp; }
        if (sp > 0.01) f.push(this.sm.x, this.sm.y, vx, vy, 0.24, 1.75 * dt);
      }
      // 마우스가 없는 기기: 가끔 아주 약한 바람이 한쪽에서 지나감
      if (this.o.breeze) {
        this.nb = (this.nb == null ? 2.5 : this.nb) - dt;
        if (this.nb < 0) { this.gust = { x: Math.random() < 0.5 ? 0.15 : 0.85, y: 0.55 + Math.random() * 0.3, d: Math.random() < 0.5 ? 1 : -1, t: 0 }; this.nb = 5 + Math.random() * 4; }
        if (this.gust) { const g = this.gust; g.t += dt; if (g.t > 1.6) this.gust = null; else f.push(g.x + g.d * g.t * 0.12, g.y, g.d * 0.35 * Math.sin(Math.PI * g.t / 1.6), 0, 0.3, 1.35 * dt); }
      }
      for (let i = 0; i < 4; i++) f.step(dt / 4);
      const kp = 1 - Math.pow(0.25, dt);        // 시차는 더 느리게
      this.par[0] += (this.parT[0] - this.par[0]) * kp; this.par[1] += (this.parT[1] - this.par[1]) * kp;
      this.draw(now);
      requestAnimationFrame(t => this.loop(t));
    }
    draw(now) {
      const gl = this.gl, f = this.field;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.simTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, f.W, f.H, gl.RGBA, gl.UNSIGNED_BYTE, f.pack());
      gl.uniform1f(this.u.uT, reduce ? 18.0 : (now - this.t0) / 1000);
      gl.uniform2f(this.u.uPar, this.par[0], this.par[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  root.LuxeFabric = { Fabric, ClothField, reduce, coarse };
  if (typeof module !== 'undefined') module.exports = { ClothField };
})(typeof window !== 'undefined' ? window : globalThis);
