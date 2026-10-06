#!/usr/bin/env python3
"""Генерирует public/og-image.png (1200×630) для Open Graph / Telegram / WhatsApp."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path(__file__).resolve().parent.parent / "public" / "og-image.png"

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = FONT_CANDIDATES if bold else FONT_CANDIDATES[2:] + FONT_CANDIDATES[:2]
    for path in paths:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except OSError:
                continue
    return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), "#101722")
    draw = ImageDraw.Draw(img)

    # Subtle depth behind the card, matching the layered 3D app icon.
    for radius, alpha in ((500, 18), (350, 26), (220, 34)):
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_draw.ellipse((W - radius, -radius // 2, W + radius, radius * 1.5), fill=(59, 130, 246, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
        draw = ImageDraw.Draw(img)

    # Static rendition of AppIcon3D: back tile, front tile, bubble and check.
    x, y, s = 88, 106, 142
    draw.ellipse((x + 10, y + 130, x + s + 42, y + s + 48), fill="#07111e")
    draw.rounded_rectangle((x + 24, y + 20, x + s + 24, y + s + 20), radius=30, fill="#1d3148")
    draw.polygon([(x + s, y + 18), (x + s + 24, y + 38), (x + s + 24, y + s + 20), (x + s, y + s)], fill="#0b1726")
    draw.rounded_rectangle((x, y, x + s, y + s), radius=30, fill="#223e5b")
    draw.rounded_rectangle((x + 5, y + 5, x + s - 5, y + s - 8), radius=26, fill="#2d5377")
    draw.rounded_rectangle((x + 20, y + 28, x + 116, y + 105), radius=18, fill="#fafaf9")
    draw.polygon([(x + 29, y + 94), (x + 29, y + 121), (x + 53, y + 101)], fill="#fafaf9")
    draw.line([(x + 42, y + 64), (x + 58, y + 80), (x + 91, y + 47)], fill="#ea580c", width=9, joint="curve")

    title_font = load_font(64, bold=True)
    brand_font = load_font(30, bold=True)
    body_font = load_font(28)
    tag_font = load_font(22, bold=True)

    draw.text((260, 178), "TaskExtraction", fill="#f8fafc", font=brand_font, anchor="lm")

    draw.text((88, 306), "Задачи из Telegram", fill="#f8fafc", font=title_font)
    draw.text((88, 384), "на одной доске", fill="#f8fafc", font=title_font)

    draw.text(
        (88, 492),
        "Бот находит поручения в чатах и заводит карточки. Без тегов и команд.",
        fill="#b7c5d8",
        font=body_font,
    )

    for i, label in enumerate(("Jira", "Trello", "GitHub", "Slack")):
        x = 88 + i * 132
        draw.rounded_rectangle((x, 552, x + 118, 592), radius=20, fill="#1f344b", outline="#3d5d7e")
        draw.text((x + 59, 572), label, fill="#d8e5f2", font=tag_font, anchor="mm")

    draw.rectangle((0, H - 8, W, H), fill="#ea580c")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
