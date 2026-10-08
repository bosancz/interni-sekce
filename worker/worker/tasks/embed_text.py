import asyncio
from typing import Any

from bullmq import Queue

from .. import config
from .clip import embed_texts

NAME = "embed-text"


async def run(data: dict[str, Any], results: Queue) -> dict[str, Any]:
    texts = [str(text) for text in data["texts"]][: config.CLIP_TEXT_MAX_BATCH]
    embeddings = await asyncio.to_thread(embed_texts, texts)
    return {"model": config.CLIP_MODEL, "embeddings": embeddings}
