from PIL import Image, ImageDraw
import os; repo = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons', '')
S = 1024  # draw big, downsample

def draw(size_out, pad_frac):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = int(S * pad_frac)
    d.rounded_rectangle((pad, pad, S - pad, S - pad), radius=int(S * 0.2), fill=(29, 29, 31, 255))
    inner = S - 2 * pad
    r = inner * 0.115
    cx = S / 2
    for i, col in enumerate([(194, 59, 59), (217, 145, 42), (46, 139, 87)]):
        cy = pad + inner * (0.25 + 0.25 * i)
        # soft glow on its own layer, blended onto the tile
        glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        g = ImageDraw.Draw(glow)
        for k, a in ((1.7, 45), (1.35, 90)):
            g.ellipse((cx - r * k, cy - r * k, cx + r * k, cy + r * k), fill=col + (a,))
        img.alpha_composite(glow)
        d = ImageDraw.Draw(img)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col + (255,))
        # specular highlight
        hr = r * 0.32
        d.ellipse((cx - r * 0.45 - hr, cy - r * 0.45 - hr, cx - r * 0.45 + hr, cy - r * 0.45 + hr), fill=(255, 255, 255, 110))
    return img.resize((size_out, size_out), Image.LANCZOS)

# Store icon: 128 with the recommended ~16px transparent margin (96px tile)
draw(128, 0.125).save(repo + 'icon128.png', optimize=True)
# Toolbar sizes: less margin so the tile reads at 16px
draw(48, 0.06).save(repo + 'icon48.png', optimize=True)
draw(16, 0.0).save(repo + 'icon16.png', optimize=True)
# A 512 preview for checking
pass
print('ok')
