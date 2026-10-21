from PIL import Image, ImageDraw, ImageFont
import os; repo = os.path.join(os.path.dirname(os.path.abspath(__file__)), '')
FONT = '/System/Library/Fonts/HelveticaNeue.ttc'
BG = (29, 29, 31, 255); FG = (240, 238, 234, 255); MUTED = (160, 160, 160, 255)
RED, AMBER, GREEN = (194, 59, 59), (217, 145, 42), (46, 139, 87)
f = lambda size, idx=0: ImageFont.truetype(FONT, size, index=idx)

def lights(img, cx, top, r, gap):
    d = ImageDraw.Draw(img)
    for i, col in enumerate([RED, AMBER, GREEN]):
        cy = top + i * gap
        glow = Image.new('RGBA', img.size, (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
        for k, a in ((1.7, 45), (1.35, 90)):
            g.ellipse((cx - r * k, cy - r * k, cx + r * k, cy + r * k), fill=col + (a,))
        img.alpha_composite(glow); d = ImageDraw.Draw(img)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col + (255,))
        hr = r * 0.32; ox = oy = r * 0.45
        d.ellipse((cx - ox - hr, cy - oy - hr, cx - ox + hr, cy - oy + hr), fill=(255, 255, 255, 110))

def pill(img, x, y, h, col, label, conf):
    d = ImageDraw.Draw(img)
    fl, fc = f(int(h * 0.5), 1), f(int(h * 0.42))
    lw = d.textlength(label, font=fl); cw = d.textlength(conf, font=fc)
    pad = h * 0.55; dot = h * 0.3; gap = h * 0.3
    w = pad + dot + gap + lw + gap + cw + pad
    d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=(44, 44, 47, 255), outline=(70, 70, 74, 255), width=2)
    cx = x + pad + dot / 2; cy = y + h / 2
    d.ellipse((cx - dot / 2, cy - dot / 2, cx + dot / 2, cy + dot / 2), fill=col + (255,))
    tx = x + pad + dot + gap
    d.text((tx, cy), label, font=fl, fill=FG, anchor='lm')
    d.text((tx + lw + gap, cy), conf, font=fc, fill=MUTED, anchor='lm')
    return w

def tile(W, H, scale, out):
    S = 4  # supersample
    img = Image.new('RGBA', (W * S, H * S), BG)
    d = ImageDraw.Draw(img)
    u = H * S / 280 * scale  # unit relative to the small tile
    # mark
    r = 17 * u; gap = 48 * u
    cx = 70 * u; top = (H * S) / 2 - gap
    lights(img, cx, top, r, gap)
    # wordmark and tagline
    x = 125 * u
    d.text((x, H * S / 2 - 30 * u), 'AI Signal', font=f(int(46 * u), 1), fill=FG, anchor='ls')
    d.text((x, H * S / 2 - 2 * u), 'A signal, not a verdict.', font=f(int(18 * u)), fill=MUTED, anchor='ls')
    d.text((x, H * S / 2 + 22 * u), 'A badge on every LinkedIn and Reddit post.', font=f(int(13 * u), 7), fill=MUTED, anchor='ls')
    return img

def finish(img, W, H, out):
    img = img.resize((W, H), Image.LANCZOS).convert('RGB')
    img.save(out, optimize=True); print(out, img.size)

# Small tile 440x280
img = tile(440, 280, 1.0, None)
d = ImageDraw.Draw(img); S = 4; u = 4.0
pill(img, 125 * u, 280 * S / 2 + 42 * u, 26 * u, GREEN, 'AI signal 23', 'medium confidence')
finish(img, 440, 280, repo + 'promo-small-440x280.png')

# Marquee 1400x560: same composition, scaled, with three pills on the right
W, H = 1400, 560; S = 4
img = Image.new('RGBA', (W * S, H * S), BG); d = ImageDraw.Draw(img)
u = H * S / 280 * 1.0
cx = 130 * u; r = 20 * u; gap = 56 * u
lights(img, cx, H * S / 2 - gap, r, gap)
x = 200 * u
d.text((x, H * S / 2 - 34 * u), 'AI Signal', font=f(int(56 * u), 1), fill=FG, anchor='ls')
d.text((x, H * S / 2 - 2 * u), 'A signal, not a verdict.', font=f(int(22 * u)), fill=MUTED, anchor='ls')
for i, line in enumerate(['Scores LinkedIn and Reddit posts', 'for signs of AI-written style.', 'Nothing leaves your browser.']):
    d.text((x, H * S / 2 + (24 + 16 * i) * u), line, font=f(int(12 * u), 7), fill=MUTED, anchor='ls')
ph = 26 * u
probe = Image.new('RGBA', img.size, (0, 0, 0, 0))
w = pill(probe, 0, 0, ph, GREEN, 'AI signal 23', 'medium confidence')
px = (W - 60) * S - w
for i, (col, lab) in enumerate([(GREEN, 'AI signal 23'), (AMBER, 'AI signal 52'), (RED, 'AI signal 84')]):
    pill(img, px, H * S / 2 - 52 * u + i * 36 * u, ph, col, lab, 'medium confidence')
finish(img, W, H, repo + 'promo-marquee-1400x560.png')
