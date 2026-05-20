from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
OUTPUT = ASSETS / "miniverto-demo.gif"

CANVAS = (960, 540)
SHOT_BOX = (58, 118, 902, 438)
BACKGROUND = "#0b1120"
PANEL = "#111827"
ACCENT = "#22c55e"
TEXT = "#f8fafc"
MUTED = "#cbd5e1"


SLIDES = [
    (
        "hero-dashboard.png",
        "Start with a learning goal",
        "Turn a vague ambition into a focused local-first learning project.",
    ),
    (
        "project-detail.png",
        "Follow an adaptive plan",
        "Review milestones, task outcomes, progress, and learning constraints.",
    ),
    (
        "learning-workspace.png",
        "Learn with context",
        "Work through focused tasks, durable notes, and assessment loops.",
    ),
    (
        "hero-dashboard.png",
        "Keep data local by default",
        "SQLite stores project data. OS keyring stores secrets. Providers stay explicit.",
    ),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


TITLE_FONT = font(31, bold=True)
CAPTION_FONT = font(18)
SMALL_FONT = font(14)


def rounded_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline)


def fit_image(path: Path, max_size: tuple[int, int]) -> Image.Image:
    image = Image.open(path).convert("RGB")
    image.thumbnail(max_size, Image.Resampling.LANCZOS)
    return image


def make_frame(image_name: str, title: str, caption: str, index: int) -> Image.Image:
    frame = Image.new("RGB", CANVAS, BACKGROUND)
    draw = ImageDraw.Draw(frame)

    rounded_rect(draw, (26, 22, 934, 518), 28, "#0f172a", "#1f2937")
    draw.text((54, 42), "Miniverto", fill=TEXT, font=TITLE_FONT)
    draw.text((55, 82), "Local-first AI learning planner", fill=MUTED, font=SMALL_FONT)

    step = f"{index + 1}/4"
    step_bbox = draw.textbbox((0, 0), step, font=SMALL_FONT)
    step_width = step_bbox[2] - step_bbox[0]
    rounded_rect(draw, (834, 46, 902, 78), 16, "#064e3b")
    draw.text((868 - step_width / 2, 53), step, fill="#dcfce7", font=SMALL_FONT)

    screenshot = fit_image(ASSETS / image_name, (SHOT_BOX[2] - SHOT_BOX[0], SHOT_BOX[3] - SHOT_BOX[1]))
    x = SHOT_BOX[0] + ((SHOT_BOX[2] - SHOT_BOX[0]) - screenshot.width) // 2
    y = SHOT_BOX[1] + ((SHOT_BOX[3] - SHOT_BOX[1]) - screenshot.height) // 2

    rounded_rect(draw, (x - 10, y - 10, x + screenshot.width + 10, y + screenshot.height + 10), 18, "#020617", "#334155")
    frame.paste(screenshot, (x, y))

    rounded_rect(draw, (54, 455, 906, 498), 18, PANEL, "#1e293b")
    draw.ellipse((75, 469, 88, 482), fill=ACCENT)
    draw.text((104, 461), title, fill=TEXT, font=CAPTION_FONT)
    draw.text((104, 485), caption, fill=MUTED, font=SMALL_FONT)

    return frame


def main() -> None:
    frames = [make_frame(*slide, index=i) for i, slide in enumerate(SLIDES)]
    frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=frames[1:],
        duration=[7500, 7500, 7500, 7500],
        loop=0,
        optimize=True,
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()

