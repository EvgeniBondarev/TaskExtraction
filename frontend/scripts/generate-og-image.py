#!/usr/bin/env python3
"""Генерирует public/og-image.png (1200×630) для превью ссылок.

Картинка рисуется в 2× и уменьшается — края получаются гладкими.
PNG хранится в репозитории и в `npm run build` не пересобирается: на сборочных
образах без шрифтов с кириллицей Pillow рисует текст квадратами. Запускать вручную:
    npm run og-image
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
K = 2  # коэффициент суперсэмплинга
OUT = Path(__file__).resolve().parent.parent / "public" / "og-image.png"

BOLD_FONTS = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Debian/Ubuntu
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",  # Alpine (font-dejavu)
    "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
]
REGULAR_FONTS = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
]


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    for path in BOLD_FONTS if bold else REGULAR_FONTS:
        if Path(path).exists():
            return ImageFont.truetype(path, size * K)
    # Bitmap-шрифт Pillow не содержит кириллицы — лучше упасть, чем выпустить картинку с квадратами.
    raise SystemExit("Нет TrueType-шрифта с кириллицей (Arial / DejaVu). Картинка не создана.")


def main() -> None:
    def p(v: float) -> int:
        return round(v * K)

    def box(x0: float, y0: float, x1: float, y1: float) -> tuple[int, int, int, int]:
        return (p(x0), p(y0), p(x1), p(y1))

    img = Image.new("RGB", (p(W), p(H)), "#101722")

    for radius, alpha in ((560, 20), (390, 30), (250, 38)):
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse(box(W - radius, -radius // 2, W + radius, radius * 1.5), fill=(59, 130, 246, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Статичная версия иконки приложения: задняя плитка, передняя, пузырь и галочка.
    x, y, s = 72, 44, 188
    u = s / 176  # исходные размеры иконки заданы для s=176
    def i(dx: float, dy: float) -> tuple[int, int]:
        return (p(x + dx * u), p(y + dy * u))

    draw.ellipse((*i(10, 162), *i(176 + 56, 176 + 58)), fill="#07111e")
    draw.rounded_rectangle((*i(28, 24), *i(176 + 28, 176 + 24)), radius=p(36 * u), fill="#1d3148")
    draw.polygon([i(176, 22), i(176 + 28, 46), i(176 + 28, 176 + 24), i(176, 176)], fill="#0b1726")
    draw.rounded_rectangle((*i(0, 0), *i(176, 176)), radius=p(36 * u), fill="#223e5b")
    draw.rounded_rectangle((*i(6, 6), *i(170, 167)), radius=p(31 * u), fill="#2d5377")
    draw.rounded_rectangle((*i(25, 35), *i(144, 131)), radius=p(21 * u), fill="#fafaf9")
    draw.polygon([i(36, 117), i(36, 151), i(65, 127)], fill="#fafaf9")
    draw.line([i(52, 80), i(72, 100), i(113, 59)], fill="#ea580c", width=p(11 * u), joint="curve")

    brand_font, tag_font = load_font(54, True), load_font(22, True)
    title_font, body_font = load_font(86, True), load_font(34)

    draw.text((p(330), p(104)), "TaskExtraction", fill="#f8fafc", font=brand_font, anchor="lm")
    draw.rounded_rectangle(box(330, 148, 520, 190), radius=p(20), fill="#1f344b", outline="#3d5d7e", width=K)
    draw.text((p(425), p(169)), "AI · TELEGRAM", fill="#b9d7f2", font=tag_font, anchor="mm")

    draw.text((p(72), p(300)), "Задачи из Telegram", fill="#f8fafc", font=title_font)
    draw.text((p(72), p(398)), "на одной доске", fill="#f8fafc", font=title_font)
    draw.text((p(72), p(512)), "Бот находит поручения в чатах и создаёт задачи", fill="#b7c5d8", font=body_font)

    for n, label in enumerate(("Jira", "Trello", "GitHub", "Slack")):
        cx = 72 + n * 146
        draw.rounded_rectangle(box(cx, 562, cx + 130, 608), radius=p(23), fill="#1f344b", outline="#3d5d7e", width=K)
        draw.text((p(cx + 65), p(585)), label, fill="#d8e5f2", font=tag_font, anchor="mm")

    draw.rectangle(box(0, H - 8, W, H), fill="#ea580c")

    img = img.resize((W, H), Image.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
