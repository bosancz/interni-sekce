import asyncio
import logging
from typing import Any

import cv2
from bullmq import Queue

from .. import config
from ..paths import resolve_data_path
from .clip import embed_image

NAME = "embed-photo"
RESULT = "photo-embedded"

logger = logging.getLogger(NAME)


async def run(data: dict[str, Any], results: Queue) -> None:
    photo_id = data["photoId"]
    result: dict[str, Any] = {"photoId": photo_id, "model": config.CLIP_IMAGE_MODEL}

    try:
        path = resolve_data_path(data["path"])
        result["embeddings"] = await asyncio.to_thread(embed_image, path)
        logger.info("Photo %s embedded (%d crops)", photo_id, len(result["embeddings"]))
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
