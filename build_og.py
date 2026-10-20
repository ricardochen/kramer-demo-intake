"""OG card 1200x630 (1.91:1) del demo de intake legal.

Paleta navy/oro del despacho. Dos bandas para que nada se corte en el preview.
Coordenadas medidas con textlength.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
NAVY = (11, 31, 58)
NAVY2 = (18, 43, 78)
GOLD = (201, 163, 78)
GOLD2 = (184, 145, 47)
WHITE = (255, 255, 255)
MUTED = (176, 194, 214)
CARD = (74, 92, 116)

F = "/usr/share/fonts/truetype/dejavu/"
def fb(s): return ImageFont.truetype(F + "DejaVuSans-Bold.ttf", s)
def fn(s): return ImageFont.truetype(F + "DejaVuSans.ttf", s)

canvas = Image.new("RGB", (W, H), NAVY)
d = ImageDraw.Draw(canvas)

for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)], fill=(
        int(NAVY[0] + (NAVY2[0] - NAVY[0]) * t),
        int(NAVY[1] + (NAVY2[1] - NAVY[1]) * t),
        int(NAVY[2] + (NAVY2[2] - NAVY[2]) * t),
    ))
glow = Image.new("RGB", (W, H), NAVY)
gd = ImageDraw.Draw(glow)
gd.ellipse([760, -300, 1520, 380], fill=(48, 40, 18))
gd.ellipse([-340, 400, 380, 1060], fill=(24, 44, 78))
glow = glow.filter(ImageFilter.GaussianBlur(150))
canvas = Image.blend(canvas, glow, 0.45)
d = ImageDraw.Draw(canvas)

LX = 64
RX = W - 64

# ---------- banda superior ----------
seal = d.textlength("DEMO", font=fb(30)) + 32
d.rounded_rectangle([LX, 36, LX + seal, 84], radius=11, fill=GOLD)
d.text((LX + 16, 41), "DEMO", font=fb(30), fill=NAVY)
d.text((LX + seal + 13, 53), "funcional · datos ficticios", font=fb(15), fill=MUTED)

d.text((LX, 106), "Contesta 24 horas tarde, en un solo idioma.",
       font=fb(34), fill=WHITE)
d.text((LX, 154), "El agente contesta en 3 segundos, en su idioma.", font=fb(28), fill=GOLD)

# ---------- burbuja del visitante ----------
QY, QH = 214, 58
qx0 = RX - 358
d.rounded_rectangle([qx0, QY, RX, QY + QH], radius=18, fill=GOLD2)
d.polygon([(RX - 6, QY + QH - 18), (RX + 14, QY + QH), (RX - 24, QY + QH)], fill=GOLD2)
d.text((qx0 + 20, QY + 9), "¿Yo califico para la visa?", font=fb(19), fill=(255, 255, 255))
d.text((qx0 + 20, QY + 32), "¿Cuánto cuesta?", font=fb(19), fill=(255, 255, 255))

# ---------- tarjeta del agente ----------
CY = 272
CARD_H = 278
d.rounded_rectangle([LX, CY, RX, CY + CARD_H], radius=18, fill=(255, 255, 255))

d.rounded_rectangle([LX + 26, CY + 20, LX + 70, CY + 64], radius=11, fill=NAVY)
d.text((LX + 36, CY + 28), "AI", font=fb(19), fill=GOLD)
d.text((LX + 84, CY + 22), "Asistente de intake", font=fb(19), fill=NAVY)
d.text((LX + 84, CY + 48), "cualquier idioma · nunca da asesoría", font=fn(15), fill=(15, 81, 50))

ty = CY + 84
rows = [
    ("No puedo decirte si calificas.", NAVY, fb(19)),
    ("Eso lo define un abogado, caso por caso.", CARD, fn(18)),
    ("No cotizo honorarios ni prometo aprobación.", CARD, fn(18)),
    ("Te tomo los datos y te contacta un abogado.", (15, 81, 50), fb(18)),
]
for txt, col, fnt in rows:
    d.text((LX + 26, ty), txt, font=fnt, fill=col)
    ty += 38

d.line([LX + 26, ty + 6, RX - 26, ty + 6], fill=(226, 220, 200), width=2)
d.text((LX + 26, ty + 18), "LEAD CAPTURADO", font=fb(13), fill=GOLD2)

py = ty + 38
sx = LX + 26
for label in ["servicio", "nacionalidad", "ubicación", "plazo"]:
    pw = d.textlength(label, font=fb(14)) + 22
    d.rounded_rectangle([sx, py, sx + pw, py + 27], radius=13, fill=(251, 245, 230))
    d.text((sx + 11, py + 6), label, font=fb(14), fill=(122, 91, 18))
    sx += pw + 11

# ---------- pie ----------
d.line([LX, 566, RX, 566], fill=(40, 62, 96), width=2)
d.text((LX, 578), "Ricardo Chen", font=fb(19), fill=WHITE)
d.text((LX, 602), "Consultoría e implementación de IA para empresas", font=fn(14), fill=MUTED)

btn = "Pruébalo tú mismo"
bw = d.textlength(btn, font=fb(17)) + 42
d.rounded_rectangle([RX - bw, 574, RX, 610], radius=10, fill=GOLD)
d.text((RX - bw + 21, 582), btn, font=fb(17), fill=NAVY)

out = "/tmp/kramer/og-card.png"
canvas.save(out, "PNG")
print("saved", out, canvas.size)
