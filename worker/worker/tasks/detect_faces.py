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
_expression: Any = None


def _models():
    global _detector, _recognizer, _expression
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
        _expression = cv2.dnn.readNet(str(config.FACES_EXPRESSION_MODEL))
    return _detector, _recognizer, _expression


def _emotions(expression: Any, aligned: np.ndarray) -> dict[str, float]:
    image = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    image = (image - 0.5) / 0.5
    expression.setInput(cv2.dnn.blobFromImage(image), "data")
    logits = expression.forward("label").flatten().astype(np.float64)
    probabilities = np.exp(logits - logits.max())
    probabilities /= probabilities.sum()
    return {name: round(float(p), 4) for name, p in zip(config.FACES_EMOTIONS, probabilities)}


def _resolve(relative_path: str) -> Path:
    path = (config.DATA_DIR / relative_path).resolve()
    if not path.is_relative_to(config.DATA_DIR):
        raise ValueError(f"Path {relative_path} is outside of DATA_DIR.")
    return path


def _detect_scaled(detector: Any, image: np.ndarray, max_side: int | None) -> np.ndarray:
    height, width = image.shape[:2]
    scale = 1.0 if max_side is None else min(1.0, max_side / max(width, height))
    pad = 0
    if max_side is not None:
        image = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
        pad = round(max(image.shape[:2]) * config.FACES_LARGE_PADDING)
        image = cv2.copyMakeBorder(image, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0))

    detector.setInputSize((image.shape[1], image.shape[0]))
    _, detected = detector.detect(image)
    if detected is None:
        return np.empty((0, 15), dtype=np.float32)

    detected = detected.copy()
    detected[:, [0, 1, *range(4, 14)]] -= pad
    detected[:, 0:14] /= scale
    return detected


def _detect_multiscale(detector: Any, image: np.ndarray) -> np.ndarray:
    detected = np.concatenate(
        [_detect_scaled(detector, image, None)]
        + [_detect_scaled(detector, image, side) for side in config.FACES_LARGE_SCALES]
    )
    if len(detected) == 0:
        return detected

    boxes = [[float(v) for v in row[:4]] for row in detected]
    scores = [float(row[-1]) for row in detected]
    keep = cv2.dnn.NMSBoxes(boxes, scores, config.FACES_MIN_SCORE, config.FACES_NMS_THRESHOLD)
    return detected[np.array(keep, dtype=int).flatten()]


def detect(path: Path) -> list[dict[str, Any]]:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Cannot read image {path}.")

    height, width = image.shape[:2]
    scale = min(1.0, config.FACES_MAX_IMAGE_SIDE / max(width, height))
    if scale < 1.0:
        image = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
        height, width = image.shape[:2]

    detector, recognizer, expression = _models()
    detected = _detect_multiscale(detector, image)

    faces = []
    for row in detected:
        x, y, w, h = (float(v) for v in row[:4])
        score = float(row[-1])

        left, top = max(0.0, x), max(0.0, y)
        right, bottom = min(float(width), x + w), min(float(height), y + h)
        if right <= left or bottom <= top:
            continue
        if max(right - left, bottom - top) < config.FACES_MIN_SIZE * max(width, height):
            continue

        aligned = recognizer.alignCrop(image, row)
        descriptor = recognizer.feature(aligned).flatten()
        emotions = _emotions(expression, aligned)
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
                "emotions": emotions,
                "emotion": max(emotions, key=emotions.get),
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
