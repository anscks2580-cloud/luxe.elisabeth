/* LUXE ELISABETH — 걸려 있는 원단
 * 화면 위쪽 천장에 원단이 스왜그(늘어진 곡선)로 걸려 있고, 그 아래로 실크·오간자 커튼이 바닥까지 늘어진 장면을 그린다.
 *  - 커튼 윗부분은 고정, 아래로 갈수록 아주 약한 공기에 천천히 흔들린다(밑단이 가장 많이 움직임).
 *  - 겹마다 흔들리는 주기와 방향이 달라 동시에 움직이지 않는다.
 *  - 마우스는 원단을 움직이지 않고, 겹 사이의 아주 작은 시차만 만든다.
 *  - 강한 광택·반짝임·물결 효과 없음. 명암은 주름의 입체감이 보일 만큼만.
 */
(function (root) {
  'use strict';

  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform vec2 uPar;
uniform vec3 uBg; uniform vec3 uEnd; uniform float uFade; uniform float uSwag;

float hash(float n){ return fract(sin(n) * 43758.5453); }
float vnoise(float x){ float i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f); return mix(hash(i), hash(i + 1.0), f); }

/* 커튼 한 겹의 높이(주름). x: 세로 길이 기준 가로 좌표, y: 0(위)~1(아래) */
float curtain(float x, float y, float k, float t){
  float g = pow(y, 1.7);                                   // 위는 고정, 밑단으로 갈수록 흔들림
  float sway = g * ( 0.018*sin(t*0.29 + k*1.9 + x*0.9)
                   + 0.010*sin(t*0.43 + k*3.1 - x*1.7)
                   + 0.005*sin(t*0.71 + k*0.7 + x*3.1) );
  float xs = x + sway + uPar.x * 0.004 * (k + 1.0);
  float f = 15.0 + 4.0*k;
  float ph = vnoise(xs*2.2 + k*7.0) * 2.4                   // 주름 간격을 불규칙하게
           + 0.5*sin(y*1.7 + x*2.3 + k) * g;                 // 아래쪽은 주름이 살짝 휘어짐
  float h = 0.62*sin(xs*f + ph + k*2.0)
          + 0.28*sin(xs*f*1.73 + ph*1.6 + k)
          + 0.07*sin(xs*f*3.1 - ph + k*4.0 + y*1.5);
  return h * (0.6 + 0.4*smoothstep(0.0, 0.9, y));
}

/* 얇은 커튼 자락의 가로 범위(가장자리도 천천히 흔들림) */
float panel(float x, float y, float c, float w, float k, float t){
  float g = pow(y, 1.6);
  float e = g * (0.03*sin(t*0.23 + k*2.3) + 0.012*sin(t*0.37 + k*4.1 + y*2.0));
  float d = abs(x - c - e) - w * (1.0 + 0.25*y);            // 아래로 갈수록 자락이 살짝 넓어짐
  return 1.0 - smoothstep(-0.05, 0.02, d);
}

vec3 shadeFold(float s, float h, vec3 base, float contrast){
  // s: 가로 기울기, h: 높이. 왼쪽 위 창에서 들어오는 부드러운 빛
  float n = clamp(-s * 0.026, -1.0, 1.0);
  float lit = 0.5 + 0.5 * n;
  float ao = 0.5 + 0.5 * h / 1.0;
  float v = mix(0.5, lit*0.62 + ao*0.38, contrast);
  vec3 lo = base * vec3(0.862, 0.848, 0.826);
  vec3 hi = min(base * 1.022, vec3(1.0));
  return mix(lo, hi, v);
}

void main(){
  vec2 s = gl_FragCoord.xy / uRes; s.y = 1.0 - s.y;
  float asp = uRes.x / uRes.y;
  float x = s.x * asp, y = s.y;
  float t = uT;
  float ex = 1.5 / uRes.y;

  /* 뒤: 벽을 덮은 실크 커튼 */
  float h0 = curtain(x, y, 0.0, t);
  float s0 = (curtain(x + ex, y, 0.0, t) - h0) / ex;
  vec3 col = shadeFold(s0, h0, uBg, 1.0);
  // 창 쪽(왼쪽)에서 들어오는 아주 옅은 빛
  col *= 1.0 + 0.025 * smoothstep(0.9, 0.0, s.x) - 0.02 * smoothstep(0.5, 1.0, s.x);

  /* 가운데: 오간자 자락 두 장 */
  for(int i = 0; i < 2; i++){
    float k = 1.0 + float(i);
    float c = (i == 0 ? 0.20 : 0.62) * asp;
    float w = (i == 0 ? 0.13 : 0.10) * asp;
    float m = panel(x, y, c, w, k, t);
    if(m > 0.001){
      float h = curtain(x, y, k, t);
      float sl = (curtain(x + ex, y, k, t) - h) / ex;
      vec3 sheer = shadeFold(sl, h, min(uBg * 1.03, vec3(1.0)), 0.7);
      float edgeOn = smoothstep(0.25, 0.9, abs(sl) * 0.026);  // 옆으로 꺾인 면은 더 진하게 보임
      float a = (0.42 + 0.28 * edgeOn) * m;
      col = mix(col, sheer, a);
      // 자락 가장자리의 접힌 선
      float rim = m * (1.0 - m) * 4.0;
      col *= 1.0 - rim * 0.012;
    }
  }

  /* 천장의 스왜그: 걸린 지점 사이로 원단이 곡선으로 늘어짐 */
  if(uSwag > 0.0){
    float P = 0.95;
    float u = fract((x + 0.07) / P);
    float idx = floor((x + 0.07) / P);
    float sag = 0.12 + 0.025 * hash(idx + 3.0) + 0.006 * sin(t*0.21 + idx*1.7);
    float edge = 0.03 + sag * pow(sin(3.14159 * u), 0.8);
    float m = 1.0 - smoothstep(edge - 0.004, edge + 0.006, y);
    // 스왜그 아래로 드리운 그림자
    float sh = smoothstep(edge + 0.075, edge, y) * (1.0 - m);
    col *= 1.0 - sh * 0.06 * uSwag;
    if(m > 0.001){
      float v = clamp(y / max(edge, 0.001), 0.0, 1.0);
      float hs = sin(v * 3.14159 * 3.5 + u * 1.3 + idx) * (0.55 + 0.45 * sin(3.14159 * u));
      float dv = cos(v * 3.14159 * 3.5 + u * 1.3 + idx);
      float lit = 0.5 + 0.5 * clamp(dv * 0.55 + (u - 0.5) * 0.4, -1.0, 1.0);
      vec3 base = min(uBg * 1.02, vec3(1.0));
      vec3 sc = mix(base * vec3(0.9, 0.887, 0.868), min(base * 1.02, vec3(1.0)), lit * 0.75 + (0.5 + 0.5*hs) * 0.25);
      col = mix(col, sc, m * uSwag);
    }
  }

  /* 아래쪽은 다음 구역의 바탕색으로 자연스럽게 */
  float fade = smoothstep(1.0 - 0.22 * uFade, 1.0, y) * step(0.001, uFade);
  col = mix(col, uEnd, fade);
  gl_FragColor = vec4(col, 1.0);
}`;

  const reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = root.matchMedia && root.matchMedia('(pointer: coarse)').matches;
  const rgb = hex => { hex = hex.trim().replace('#', ''); return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); };

  class Fabric {
    /* opt: bg(원단 바탕색), end(아래쪽이 이어질 색), fade(0~1), swag(천장 스왜그 0~1), scale(렌더 배율) */
    constructor(canvas, opt) {
      this.c = canvas;
      this.o = Object.assign({ bg: '#F2EDE5', end: '#F8F5F0', fade: 1, swag: 1, scale: coarse ? 0.5 : 0.65 }, opt);
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
      this.u = {}; ['uRes', 'uT', 'uPar', 'uBg', 'uEnd', 'uFade', 'uSwag'].forEach(n => this.u[n] = gl.getUniformLocation(pr, n));
      gl.uniform3fv(this.u.uBg, rgb(this.o.bg)); gl.uniform3fv(this.u.uEnd, rgb(this.o.end));
      gl.uniform1f(this.u.uFade, this.o.fade); gl.uniform1f(this.u.uSwag, this.o.swag);
      this.par = [0, 0]; this.parT = [0, 0];
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
      if (!this.running) this.draw(performance.now());
    }
    /* 마우스는 시차용 목표값만 바꾼다(원단 모양은 그대로) */
    pointer(cx, cy) {
      const r = this.c.getBoundingClientRect();
      this.parT = [Math.max(-1, Math.min(1, ((cx - r.left) / r.width) * 2 - 1)), Math.max(-1, Math.min(1, ((cy - r.top) / r.height) * 2 - 1))];
    }
    start() { if (this.running || reduce) return; this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); }
    loop(now) {
      if (!this.running) return;
      const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
      if (dt > 0.04) this.slow++; else this.slow = Math.max(0, this.slow - 1);
      if (this.slow > 50) { if (this.o.scale > 0.38) { this.o.scale = 0.38; this.slow = 0; this.resize(); } else { this.running = false; return; } }
      const k = 1 - Math.pow(0.35, dt);   // 아주 느리게 따라가는 시차
      this.par[0] += (this.parT[0] - this.par[0]) * k; this.par[1] += (this.parT[1] - this.par[1]) * k;
      this.draw(now);
      requestAnimationFrame(t => this.loop(t));
    }
    draw(now) {
      const gl = this.gl;
      gl.uniform1f(this.u.uT, reduce ? 18.0 : (now - this.t0) / 1000);
      gl.uniform2f(this.u.uPar, this.par[0], this.par[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  root.LuxeFabric = { Fabric, reduce, coarse };
})(window);
