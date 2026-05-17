#!/usr/bin/env python3
"""Генерирует public/og-image.png (1200×630) для Open Graph / Telegram."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path(__file__).resolve().parent.parent / "public" / "og-image.png"

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
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
            fill=(int(15 + t * 11), int(20 + t * 15), int(25 + t * 25)),
        )

    draw.ellipse((-80, -120, 520, 380), fill=(30, 58, 95))

    lx, ly, size = 120, 165, 120
    draw.rounded_rectangle((lx, ly, lx + size, ly + size), radius=28, fill=(37, 99, 235))
    for y_off, w in ((38, 44), (54, 34), (70, 40)):
        draw.rounded_rectangle(
            (lx + 28, ly + y_off, lx + 28 + w, ly + y_off + 6),
            radius=3,
            fill="#ffffff",
        )
    draw.polygon(
        [(lx + 78, ly + 38), (lx + 92, ly + 52), (lx + 72, ly + 72), (lx + 62, ly + 72), (lx + 62, ly + 62)],
        fill="#93c5fd",
    )
    draw.ellipse((lx + 78, ly + 26, lx + 96, ly + 44), fill="#4ade80")

    title = load_font(56)
    subtitle = load_font(32)
    body = load_font(26)

    draw.text((270, 185), "TaskExtraction", fill="#e7ecf3", font=title)
    draw.text((270, 265), "Пиши в Telegram — выполняй везде", fill="#93c5fd", font=subtitle)
    draw.text(
        (270, 330),
        "AI-извлечение задач · Канбан · Jira · Trello · Slack",
        fill="#8b9cb3",
        font=body,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
