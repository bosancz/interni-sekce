import asyncio
import logging
import re
from datetime import date
from pathlib import Path
from typing import Any

import cv2
from bullmq import Queue

from .. import config
from ..paths import resolve_data_path
from ..resources import available_cpus

NAME = "read-insurance-card"

logger = logging.getLogger(NAME)

DATE_PATTERN = re.compile(r"(?<!\d)(\d{1,2})\s*[/.,-]\s*(\d{1,2})\s*[/.,-]\s*(\d{4})(?!\d)")
DIGIT_LOOKALIKES = str.maketrans({"O": "0", "o": "0", "D": "0", "I": "1", "l": "1", "|": "1", "S": "5", "B": "8"})

_engine: Any = None


def _ocr():
    global _engine
    if _engine is None:
        from rapidocr import RapidOCR

        threads = available_cpus()
        _engine = RapidOCR(
            params={
                "Global.log_level": "warning",
                "Det.model_path": str(config.OCR_DET_MODEL),
                "Cls.model_path": str(config.OCR_CLS_MODEL),
                "Rec.model_path": str(config.OCR_REC_MODEL),
                "EngineConfig.onnxruntime.intra_op_num_threads": threads,
                "EngineConfig.onnxruntime.inter_op_num_threads": 1,
            }
        )
    return _engine


def release() -> bool:
    global _engine
    if _engine is None:
        return False
    _engine = None
    return True


def _load(path: Path):
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Cannot read image {path.name}.")

    height, width = image.shape[:2]
    scale = config.OCR_MAX_IMAGE_SIDE / max(height, width)
    if scale < 1:
        image = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
    return image


def find_dates(texts: list[str]) -> list[str]:
    dates: list[str] = []
    for text in texts:
        for day, month, year in DATE_PATTERN.findall(text.translate(DIGIT_LOOKALIKES)):
            try:
                value = date(int(year), int(month), int(day)).isoformat()
            except ValueError:
                continue
            if value not in dates:
                dates.append(value)
    return dates


def read(path: Path) -> list[str]:
    result = _ocr()(_load(path))
    return [str(text) for text in (result.txts or ())]


async def run(data: dict[str, Any], results: Queue) -> dict[str, Any]:
    try:
        texts = await asyncio.to_thread(read, resolve_data_path(data["path"]))
    except (ValueError, OSError, cv2.error) as err:
        logger.warning("Member %s: %s", data.get("memberId"), err)
        return {"model": config.OCR_MODEL, "dates": [], "error": str(err)}

    dates = find_dates(texts)
    logger.info("Member %s: %d text lines, dates %s", data.get("memberId"), len(texts), dates)
    return {"model": config.OCR_MODEL, "dates": dates}
