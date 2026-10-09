import asyncio
import base64
import io
import logging
from typing import Any

from bullmq import Queue
from PIL import Image, ImageOps, ImageStat

from .. import config
from ..paths import resolve_data_path

NAME = "photo-thumbnails"
RESULT = "photo-thumbnails-created"

logger = logging.getLogger(NAME)

Image.MAX_IMAGE_PIXELS = config.THUMBNAILS_MAX_PIXELS

SAVE_OPTIONS: dict[str, dict[str, Any]] = {
    "JPEG": {"quality": config.THUMBNAILS_JPEG_QUALITY},
    "PNG": {"compress_level": config.THUMBNAILS_PNG_COMPRESS_LEVEL},
    "GIF": {},
}


def _target_size(width: int, height: int, box: dict[str, int]) -> tuple[int, int]:
    scale = min(box["width"] / width, box["height"] / height)
    return max(1, round(width * scale)), max(1, round(height * scale))


def _normalize_mode(image: Image.Image, output_format: str) -> Image.Image:
    if output_format == "JPEG":
        return image if image.mode in ("RGB", "L") else image.convert("RGB")
    if image.mode in ("RGB", "RGBA", "L"):
        return image
    return image.convert("RGBA" if "A" in image.getbands() or "transparency" in image.info else "RGB")


def _background(image: Image.Image) -> str:
    mean = ImageStat.Stat(image.convert("RGB")).mean
    return "rgb({})".format(",".join(str(round(channel)) for channel in mean[:3]))


def create(path: str, sizes: dict[str, dict[str, int]]) -> dict[str, Any]:
    with Image.open(resolve_data_path(path)) as source:
        output_format = source.format if source.format in SAVE_OPTIONS else "JPEG"
        largest = max(max(box["width"], box["height"]) for box in sizes.values())
        source.draft("RGB", (largest, largest))
        image = _normalize_mode(ImageOps.exif_transpose(source), output_format)

    thumbnails: dict[str, str] = {}
    smallest: Image.Image | None = None

    for name, box in sorted(sizes.items(), key=lambda item: -item[1]["width"] * item[1]["height"]):
        resized = image.resize(_target_size(image.width, image.height, box), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        resized.save(buffer, output_format, **SAVE_OPTIONS[output_format])
        thumbnails[name] = base64.b64encode(buffer.getvalue()).decode("ascii")
        smallest = resized

    return {"thumbnails": thumbnails, "bg": _background(smallest) if smallest else None}


async def run(data: dict[str, Any], results: Queue) -> None:
    photo_id = data["photoId"]
    result: dict[str, Any] = {"photoId": photo_id}

    try:
        result.update(await asyncio.to_thread(create, data["path"], data["sizes"]))
        logger.info("Photo %s: %d thumbnails", photo_id, len(result["thumbnails"]))
    except (ValueError, OSError, Image.DecompressionBombError) as err:
        logger.warning("Photo %s: %s", photo_id, err)
        result["error"] = str(err)

    await results.add(
        RESULT,
        result,
        {
            "attempts": 5,
            "backoff": {"type": "exponential", "delay": 10_000},
            "removeOnComplete": True,
            "removeOnFail": 1000,
        },
    )
