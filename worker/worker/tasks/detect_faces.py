import asyncio
import logging
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from bullmq import Queue

from .. import config

NAME = "detect-faces"
RESULT = "faces-detected"

logger = logging.getLogger(NAME)

_detector: Any = None
_recognizer: Any = None


def _models():
    global _detector, _recognizer
    if _detector is None:
        _detector = cv2.FaceDetectorYN.create(
            str(config.FACES_DETECTOR_MODEL),
            "",
            (320, 320),
            config.FACES_MIN_SCORE,
            config.FACES_NMS_THRESHOLD,
            5000,
        )
        _recognizer = cv2.FaceRecognizerSF.create(str(config.FACES_RECOGNIZER_MODEL), "")
    return _detector, _recognizer


def _resolve(relative_path: str) -> Path:
    path = (config.DATA_DIR / relative_path).resolve()
    if not path.is_relative_to(config.DATA_DIR):
        raise ValueError(f"Path {relative_path} is outside of DATA_DIR.")
    return path


def detect(path: Path) -> list[dict[str, Any]]:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Cannot read image {path}.")

    height, width = image.shape[:2]
    scale = min(1.0, config.FACES_MAX_IMAGE_SIDE / max(width, height))
    if scale < 1.0:
        image = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
        height, width = image.shape[:2]

    detector, recognizer = _models()
    detector.setInputSize((width, height))
    _, detected = detector.detect(image)

    faces = []
    for row in detected if detected is not None else []:
        x, y, w, h = (float(v) for v in row[:4])
        score = float(row[-1])

        left, top = max(0.0, x), max(0.0, y)
        right, bottom = min(float(width), x + w), min(float(height), y + h)
        if right <= left or bottom <= top:
            continue
        if max(right - left, bottom - top) < config.FACES_MIN_SIZE * max(width, height):
            continue

        descriptor = recognizer.feature(recognizer.alignCrop(image, row)).flatten()
        norm = float(np.linalg.norm(descriptor))
        if norm > 0:
            descriptor = descriptor / norm

        faces.append(
            {
                "x": left / width,
                "y": top / height,
                "width": (right - left) / width,
                "height": (bottom - top) / height,
                "score": score,
                "descriptor": [round(float(v), 6) for v in descriptor],
            }
        )

    return faces


async def run(data: dict[str, Any], results: Queue) -> None:
    photo_id = data["photoId"]
    result: dict[str, Any] = {"photoId": photo_id, "model": config.FACES_MODEL}

    try:
        path = _resolve(data["path"])
        result["faces"] = await asyncio.to_thread(detect, path)
        logger.info("Photo %s: %d faces", photo_id, len(result["faces"]))
    except (ValueError, OSError, cv2.error) as err:
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
