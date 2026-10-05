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
    img = Image.new("RGB", (W, H), "#f6f6f4")
    draw = ImageDraw.Draw(img)

    mark_path = OUT.parent / "brand" / "logo-mark-512.png"
    if mark_path.exists():
        mark = Image.open(mark_path).convert("RGBA").resize((136, 136), Image.LANCZOS)
        img.paste(mark, (88, 120), mark)

    title_font = load_font(64, bold=True)
    brand_font = load_font(30, bold=True)
    body_font = load_font(28)
    tag_font = load_font(22, bold=True)

    draw.text((252, 188), "TaskExtraction", fill="#18181b", font=brand_font, anchor="lm")

    draw.text((88, 312), "Задачи из Telegram", fill="#18181b", font=title_font)
    draw.text((88, 390), "на одной доске", fill="#18181b", font=title_font)

    draw.text(
        (88, 492),
        "Бот находит поручения в чатах и заводит карточки. Без тегов и команд.",
        fill="#5c5c63",
        font=body_font,
    )

    for i, label in enumerate(("Jira", "Trello", "GitHub", "Slack")):
        x = 88 + i * 132
        draw.rounded_rectangle((x, 552, x + 118, 592), radius=20, fill="#eeeeeb")
        draw.text((x + 59, 572), label, fill="#3f3f46", font=tag_font, anchor="mm")

    draw.rectangle((0, H - 8, W, H), fill="#c2410c")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
