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
    img = Image.new("RGB", (W, H), "#0f1419")
    draw = ImageDraw.Draw(img)

    for y in range(H):
        t = y / H
        draw.line(
            [(0, y), (W, y)],
            fill=(int(12 + t * 8), int(18 + t * 12), int(28 + t * 20)),
        )

    draw.ellipse((-120, -160, 480, 420), fill=(28, 52, 88))
    draw.ellipse((720, 280, 1280, 720), fill=(45, 35, 95))

    lx, ly, size = 88, 155, 128
    draw.rounded_rectangle((lx, ly, lx + size, ly + size), radius=30, fill=(37, 99, 235))
    for y_off, w in ((36, 48), (54, 32), (72, 42)):
        draw.rounded_rectangle(
            (lx + 30, ly + y_off, lx + 30 + w, ly + y_off + 7),
            radius=3,
            fill="#ffffff",
        )
    draw.polygon(
        [
            (lx + 82, ly + 36),
            (lx + 98, ly + 52),
            (lx + 76, ly + 76),
            (lx + 64, ly + 76),
            (lx + 64, ly + 64),
        ],
        fill="#93c5fd",
    )
    draw.ellipse((lx + 84, ly + 24, lx + 104, ly + 44), fill="#4ade80")

    title_font = load_font(52, bold=True)
    slogan_font = load_font(34, bold=True)
    body_font = load_font(24)
    tag_font = load_font(18)

    draw.text((248, 168), "TaskExtraction", fill="#f1f5f9", font=title_font)
    draw.text((248, 238), "Пиши в Telegram — выполняй везде", fill="#93c5fd", font=slogan_font)

    draw.rounded_rectangle((248, 302, 1080, 368), radius=14, fill=(30, 41, 59))
    draw.text(
        (272, 322),
        "AI-задачи из чатов  ·  Канбан  ·  Jira  ·  Trello  ·  GitHub  ·  Slack",
        fill="#94a3b8",
        font=body_font,
    )

    draw.rounded_rectangle((248, 392, 420, 432), radius=8, fill=(34, 197, 94, 40))
    draw.text((268, 400), "Старт за 5 минут", fill="#86efac", font=tag_font)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
