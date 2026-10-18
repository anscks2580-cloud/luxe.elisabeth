"""레이스 텍스처 생성기.
출력 lace-map: R=레이스 면(클로스 스티치), G=코드(입체 테두리 실), B=비즈·시퀸 위치. 이어붙여도 끊기지 않게 래핑.
출력 lace-preview: 웹GL이 안 될 때 쓰는 보기용 이미지.
"""
import math, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

S = 2048          # 그리는 해상도(2배 수퍼샘플링)
OUT = 1024
random.seed(7)

fill = Image.new('L', (S, S), 0)
cord = Image.new('L', (S, S), 0)
seq = Image.new('L', (S, S), 0)
df, dc, ds = ImageDraw.Draw(fill), ImageDraw.Draw(cord), ImageDraw.Draw(seq)

OFF = [(ox, oy) for ox in (-S, 0, S) for oy in (-S, 0, S)]

def poly(draw, pts, fillv=None, outline=None, width=1):
    for ox, oy in OFF:
        p = [(x + ox, y + oy) for x, y in pts]
        if fillv is not None:
            draw.polygon(p, fill=fillv)
        if outline is not None:
            draw.line(p + [p[0]], fill=outline, width=width, joint='curve')

def line(draw, pts, v, w):
    for ox, oy in OFF:
        draw.line([(x + ox, y + oy) for x, y in pts], fill=v, width=w, joint='curve')

def dot(draw, x, y, r, v):
    for ox, oy in OFF:
        draw.ellipse([x + ox - r, y + oy - r, x + ox + r, y + oy + r], fill=v)

def ellipse_pts(cx, cy, a, b, rot, n=48, pinch=0.0):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = a * math.cos(t), b * math.sin(t)
        # 끝을 약간 뾰족하게: 꽃잎 바깥쪽
        if pinch and x > 0:
            y *= 1 - pinch * (x / a) ** 2
        xr = x * math.cos(rot) - y * math.sin(rot)
        yr = x * math.sin(rot) + y * math.cos(rot)
        pts.append((cx + xr, cy + yr))
    return pts

def petal_scallop(cx, cy, a, b, rot, n=56):
    """끝이 물결처럼 갈라진 꽃잎."""
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = a * math.cos(t), b * math.sin(t)
        if x > 0:
            ripple = 1 + 0.07 * math.cos(t * 7)
            x *= ripple
            y *= ripple * (1 - 0.25 * (x / a) ** 2)
        xr = x * math.cos(rot) - y * math.sin(rot)
        yr = x * math.sin(rot) + y * math.cos(rot)
        pts.append((cx + xr, cy + yr))
    return pts

CW = 7   # 코드 두께(수퍼샘플 기준)

def flower(cx, cy, R, n, rot):
    for layer, k in ((0, 1.0), (1, 0.62), (2, 0.34)):
        m = n if layer < 2 else n
        off = rot + (math.pi / m if layer == 1 else 0)
        for i in range(m):
            a0 = off + 2 * math.pi * i / m
            rr = R * k
            px, py = cx + math.cos(a0) * rr * 0.55, cy + math.sin(a0) * rr * 0.55
            pts = petal_scallop(px, py, rr * 0.5, rr * 0.33 * (1.0 if layer else 1.08), a0)
            poly(df, pts, fillv=150 + 40 * layer)
            poly(dc, pts, outline=255, width=CW if layer < 2 else CW - 2)
            # 꽃잎 잎맥
            if layer == 0:
                for s in (-0.18, 0, 0.18):
                    ex = cx + math.cos(a0 + s) * rr * 0.92
                    ey = cy + math.sin(a0 + s) * rr * 0.92
                    sx = cx + math.cos(a0) * rr * 0.32
                    sy = cy + math.sin(a0) * rr * 0.32
                    line(dc, [(sx, sy), ((sx + ex) / 2 + math.cos(a0 + 1.57) * s * rr * 0.2, (sy + ey) / 2 + math.sin(a0 + 1.57) * s * rr * 0.2), (ex, ey)], 200, 3)
    # 중심과 비즈
    c = ellipse_pts(cx, cy, R * 0.13, R * 0.13, 0)
    poly(df, c, fillv=230)
    poly(dc, c, outline=255, width=CW)
    for i in range(n * 2):
        a = rot + 2 * math.pi * i / (n * 2)
        dot(ds, cx + math.cos(a) * R * 0.2, cy + math.sin(a) * R * 0.2, 7, 255)
    dot(ds, cx, cy, 10, 255)
    # 바깥 테두리 피코(작은 고리)
    for i in range(n * 6):
        a = rot + 2 * math.pi * i / (n * 6)
        dot(df, cx + math.cos(a) * R * 1.04, cy + math.sin(a) * R * 1.04, 4, 210)

def catmull(pts, steps=24):
    out = []
    p = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for s in range(steps):
            t = s / steps
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(pts[-1])
    return out

def leaf(x, y, ang, L, W):
    pts_l, pts_r = [], []
    for i in range(21):
        s = i / 20
        w = W * math.sin(math.pi * s) ** 0.85 * (1 - 0.2 * s)
        ax, ay = x + math.cos(ang) * L * s, y + math.sin(ang) * L * s
        nx, ny = -math.sin(ang), math.cos(ang)
        pts_l.append((ax + nx * w, ay + ny * w))
        pts_r.append((ax - nx * w, ay - ny * w))
    pts = pts_l + pts_r[::-1]
    poly(df, pts, fillv=170)
    poly(dc, pts, outline=255, width=CW - 1)
    line(dc, [(x, y), (x + math.cos(ang) * L * 0.9, y + math.sin(ang) * L * 0.9)], 220, 4)
    # 잎 위 작은 비즈
    if random.random() < 0.5:
        dot(ds, x + math.cos(ang) * L * 0.55, y + math.sin(ang) * L * 0.55, 6, 255)

def tendril(x, y, ang, R, turn):
    pts = []
    for i in range(40):
        t = i / 39
        r = R * (1 - 0.8 * t)
        a = ang + turn * t * 4.2
        x += math.cos(a) * r * 0.12
        y += math.sin(a) * r * 0.12
        pts.append((x, y))
    line(dc, pts, 235, 4)
    dot(ds, pts[-1][0], pts[-1][1], 5, 255)

def vine(points, leaves=True):
    path = catmull(points)
    line(dc, path, 255, CW + 2)
    off = [(x + 9, y + 9) for x, y in path]
    line(dc, off, 170, 3)
    # 덩굴 양옆 피코
    for i in range(0, len(path) - 1, 3):
        (x0, y0), (x1, y1) = path[i], path[i + 1]
        a = math.atan2(y1 - y0, x1 - x0)
        for sgn in (-1, 1):
            dot(df, x0 + math.cos(a + sgn * 1.57) * 14, y0 + math.sin(a + sgn * 1.57) * 14, 4, 200)
    if leaves:
        for i in range(8, len(path) - 8, 13):
            (x0, y0), (x1, y1) = path[i], path[i + 1]
            a = math.atan2(y1 - y0, x1 - x0)
            sgn = 1 if (i // 13) % 2 else -1
            leaf(x0, y0, a + sgn * (0.7 + random.uniform(-0.25, 0.25)), random.uniform(80, 150), random.uniform(24, 38))
            if random.random() < 0.45:
                tendril(x0, y0, a - sgn * 0.9, random.uniform(50, 80), -sgn)
        # 덩굴 위 시퀸
        for i in range(5, len(path), 17):
            dot(ds, path[i][0], path[i][1], 6, 255)

F = lambda x, y: (x * S, y * S)

# 덩굴 (꽃 사이를 잇는 줄기) — 먼저 그려서 꽃 아래로
vines = [
    [F(0.22, 0.24), F(0.36, 0.34), F(0.47, 0.50), F(0.53, 0.62)],
    [F(0.22, 0.24), F(0.12, 0.42), F(0.10, 0.60), F(0.13, 0.79)],
    [F(0.53, 0.62), F(0.66, 0.70), F(0.78, 0.68), F(0.86, 0.71)],
    [F(0.71, 0.17), F(0.80, 0.32), F(0.84, 0.50), F(0.86, 0.71)],
    [F(0.71, 0.17), F(0.58, 0.10), F(0.42, 0.08), F(0.30, 0.02), F(0.22, -0.10)],
    [F(0.13, 0.79), F(0.25, 0.88), F(0.38, 0.93), F(0.53, 0.62 + 0.0)],
    [F(0.86, 0.71), F(0.93, 0.86), F(1.06, 0.96), F(1.22, 1.24)],
    [F(0.38, 0.93), F(0.45, 1.02), F(0.52, 1.10)],
]
for v in vines:
    vine(v)

# 꽃
flower(*F(0.22, 0.24), 0.125 * S, 6, 0.3)
flower(*F(0.71, 0.17), 0.095 * S, 5, 1.1)
flower(*F(0.53, 0.62), 0.150 * S, 7, 0.0)
flower(*F(0.13, 0.79), 0.085 * S, 5, 0.7)
flower(*F(0.86, 0.71), 0.105 * S, 6, 0.2)
flower(*F(0.40, 0.92), 0.060 * S, 5, 0.4)
flower(*F(0.92, 0.40), 0.055 * S, 5, 1.6)
flower(*F(0.36, 0.42), 0.050 * S, 5, 0.9)
flower(*F(0.62, 0.36), 0.045 * S, 6, 0.2)
flower(*F(0.30, 0.62), 0.040 * S, 5, 1.3)
flower(*F(0.70, 0.90), 0.050 * S, 5, 0.5)
flower(*F(0.05, 0.08), 0.045 * S, 5, 0.1)

# 포앙 데스프리(그물 위 작은 점) — 빈 곳에 흩뿌림
occ = fill.filter(ImageFilter.MaxFilter(41))
for _ in range(2600):
    x, y = random.uniform(0, S), random.uniform(0, S)
    if occ.getpixel((int(x) % S, int(y) % S)) < 10:
        dot(df, x, y, random.choice((4, 5, 5, 6)), 190)
        if random.random() < 0.06:
            dot(ds, x, y, 6, 255)

# 클로스 스티치 결: 면 채움에 교차 짜임
weave = Image.new('L', (S, S), 0)
dw = ImageDraw.Draw(weave)
for i in range(-S, 2 * S, 9):
    dw.line([(i, 0), (i + S * 0.58, S)], fill=255, width=3)
    dw.line([(i, 0), (i - S * 0.58, S)], fill=255, width=3)
weave = weave.point(lambda v: 150 + v * 105 // 255)
fill = ImageChops.multiply(fill, weave)

def down(im):
    return im.resize((OUT, OUT), Image.LANCZOS)

R, G, B = down(fill), down(cord), down(seq)
Image.merge('RGB', (R, G, B)).save('lace-map.png', optimize=True)
Image.merge('RGB', (R, G, B)).save('lace-map.webp', lossless=True, quality=100, method=6)

# 보기용 미리보기(대체 이미지)
import numpy as np
r = np.asarray(R, np.float32) / 255; g = np.asarray(G, np.float32) / 255; b = np.asarray(B, np.float32) / 255
a = np.clip(r * 0.7 + g, 0, 1)
bg = np.array([246, 242, 235], np.float32)
th = np.array([255, 253, 249], np.float32)
sh = np.roll(np.roll(a, 3, 0), 3, 1)
col = bg[None, None] * (1 - sh[..., None] * 0.22)
col = col * (1 - a[..., None]) + (th[None, None] * (0.86 + 0.14 * g[..., None])) * a[..., None]
col = np.clip(col + b[..., None] * 30, 0, 255).astype(np.uint8)
Image.fromarray(col).save('lace-preview.webp', quality=86)
print('ok')
