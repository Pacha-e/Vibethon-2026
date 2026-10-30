#!/usr/bin/env python3
"""Recorta las variantes OFICIALES del logo parKING desde las láminas entregadas por el equipo (JPG).

Sin redibujar: solo recorte + "color a alfa" (GIMP-style) para que la variante funcione sobre
vidrio sin la caja de fondo. Geometría, proporciones y colores se conservan píxel a píxel.
Uso: python3 scripts/extract_brand_assets.py <lamina1.jpg> <lamina2.jpg> <lamina3.jpg>
"""
import sys
import numpy as np
from PIL import Image

OUT = "public/brand/official/"


def bbox(mask, pad=0):
    ys, xs = np.where(mask)
    return xs.min() - pad, ys.min() - pad, xs.max() + pad + 1, ys.max() + pad + 1


def color_to_alpha(rgb, bg):
    """Quita el color de fondo `bg` dejando alfa proporcional a la distancia (preserva el color del primer plano)."""
    p = rgb.astype(float)
    b = np.array(bg, float)
    span = np.where(p >= b, 255 - b, b)  # distancia máxima posible por canal
    alpha = np.clip(np.max(np.abs(p - b) / np.maximum(span, 1), axis=2), 0, 1)
    alpha = np.where(alpha < 0.15, 0, alpha)  # ruido de compresión JPEG del fondo
    fg = b + (p - b) / np.maximum(alpha[..., None], 1e-3)
    out = np.dstack([np.clip(fg, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def trim(img, thr=60):
    a = np.asarray(img)[..., 3] > thr
    return img.crop(bbox(a, pad=6))


def main(l1, l2, l3):
    # Lámina 1: lockup a color sobre panel azul tinta.
    a = np.asarray(Image.open(l1).convert("RGB")).astype(int)
    navy = a[int(a.shape[0] * 0.33), int(a.shape[1] * 0.25)]
    panel = (np.abs(a - navy).sum(2) < 18)
    x0, y0, x1, y1 = bbox(panel)
    Image.fromarray(a[y0:y1, x0:x1].astype(np.uint8)).save(OUT + "parking-logo-navy.png")
    trim(color_to_alpha(a[y0 + 4:y1 - 4, x0 + 4:x1 - 4], navy)).save(OUT + "parking-logo-color.png")
    # Lámina 2: variantes monocromas (se usa la negra sobre blanco, arriba-derecha).
    b = np.asarray(Image.open(l2).convert("RGB")).astype(int)
    H, W = b.shape[:2]
    # La variante blanca sobre negro tiene fondo con textura (no uniforme): no se extrae para no alterarla.
    light = b[90: H // 2, W // 2 + 60:]
    trim(color_to_alpha(light, light[10, 10])).save(OUT + "parking-logo-black.png")
    # Lámina 3: ícono simplificado (cuadro negro con corona y K).
    c = np.asarray(Image.open(l3).convert("RGB")).astype(int)
    sq = c.sum(2) < 120
    x0, y0, x1, y1 = bbox(sq)
    icon = Image.fromarray(c[y0 + 6:y1 - 6, x0 + 6:x1 - 6].astype(np.uint8))
    side = min(icon.size)
    icon = icon.crop(((icon.width - side) // 2, (icon.height - side) // 2, (icon.width + side) // 2, (icon.height + side) // 2))
    icon.save(OUT + "parking-icon.png")
    icon.resize((64, 64), Image.LANCZOS).save(OUT + "favicon-64.png")
    print("navy", tuple(navy), "panel", (x0, y0, x1, y1))


if __name__ == "__main__":
    main(*sys.argv[1:4])
