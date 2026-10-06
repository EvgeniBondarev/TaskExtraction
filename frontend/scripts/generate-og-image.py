#!/usr/bin/env python3
"""Генерирует чёткое public/og-image.png (1200×630) для превью ссылок."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path(__file__).resolve().parent.parent / "public" / "og-image.png"

FONT_CANDIDATES = [
    # font-dejavu устанавливается в Docker-образ. У него есть кириллица, в отличие
    # от стандартного bitmap fallback Pillow, который превращает её в квадраты.
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    paths = FONT_CANDIDATES if bold else [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        *FONT_CANDIDATES,
    ]
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

    # Мягкая глубина фона в стилистике 3D-иконки приложения.
    for radius, alpha in ((560, 20), (390, 30), (250, 38)):
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_draw.ellipse((W - radius, -radius // 2, W + radius, radius * 1.5), fill=(59, 130, 246, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
        draw = ImageDraw.Draw(img)

    # Static rendition of AppIcon3D: back tile, front tile, bubble and check.
    x, y, s = 76, 92, 176
    draw.ellipse((x + 10, y + 162, x + s + 56, y + s + 58), fill="#07111e")
    draw.rounded_rectangle((x + 28, y + 24, x + s + 28, y + s + 24), radius=36, fill="#1d3148")
    draw.polygon([(x + s, y + 22), (x + s + 28, y + 46), (x + s + 28, y + s + 24), (x + s, y + s)], fill="#0b1726")
    draw.rounded_rectangle((x, y, x + s, y + s), radius=36, fill="#223e5b")
    draw.rounded_rectangle((x + 6, y + 6, x + s - 6, y + s - 9), radius=31, fill="#2d5377")
    draw.rounded_rectangle((x + 25, y + 35, x + 144, y + 131), radius=21, fill="#fafaf9")
    draw.polygon([(x + 36, y + 117), (x + 36, y + 151), (x + 65, y + 127)], fill="#fafaf9")
    draw.line([(x + 52, y + 80), (x + 72, y + 100), (x + 113, y + 59)], fill="#ea580c", width=11, joint="curve")

    title_font = load_font(64, bold=True)
    brand_font = load_font(36, bold=True)
    body_font = load_font(27)
    tag_font = load_font(20, bold=True)

    draw.text((292, 180), "TaskExtraction", fill="#f8fafc", font=brand_font, anchor="lm")
    draw.rounded_rectangle((292, 218, 443, 252), radius=17, fill="#1f344b", outline="#3d5d7e")
    draw.text((367, 235), "AI · TELEGRAM", fill="#b9d7f2", font=tag_font, anchor="mm")

    draw.text((76, 308), "Задачи из Telegram", fill="#f8fafc", font=title_font)
    draw.text((76, 386), "на одной доске", fill="#f8fafc", font=title_font)

    draw.text(
        (76, 492),
        "Бот находит поручения и превращает их в задачи — без тегов и команд.",
        fill="#b7c5d8",
        font=body_font,
    )

    for i, label in enumerate(("Jira", "Trello", "GitHub", "Slack")):
        x = 76 + i * 132
        draw.rounded_rectangle((x, 552, x + 118, 592), radius=20, fill="#1f344b", outline="#3d5d7e")
        draw.text((x + 59, 572), label, fill="#d8e5f2", font=tag_font, anchor="mm")

    draw.rectangle((0, H - 8, W, H), fill="#ea580c")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
