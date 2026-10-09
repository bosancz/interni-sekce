import asyncio
from typing import Any

import numpy as np
import redis.asyncio as redis
from bullmq import Queue

from .. import config

NAME = "match-faces"

_redis: redis.Redis | None = None


def _client() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(config.REDIS_URL)
    return _redis


def _matrix(data: bytes | None, dimensions: int) -> np.ndarray:
    if data is None:
        raise ValueError("Embeddings expired in Redis")
    return np.frombuffer(data, dtype=">f4").astype(np.float32).reshape(-1, dimensions)


def match(
    references: np.ndarray,
    reference_members: np.ndarray,
    faces: np.ndarray,
    excluded: list[tuple[int, int]],
) -> tuple[list[int | None], list[float | None], list[float | None]]:
    count = faces.shape[0]
    best_members: list[int | None] = [None] * count
    best_scores: list[float | None] = [None] * count
    second_scores: list[float | None] = [None] * count
    if not count or not references.shape[0]:
        return best_members, best_scores, second_scores

    order = np.argsort(reference_members, kind="stable")
    references = np.ascontiguousarray(references[order])
    sorted_members = reference_members[order]
    starts = np.flatnonzero(np.r_[True, sorted_members[1:] != sorted_members[:-1]])
    members = sorted_members[starts]
    member_index = {int(member): index for index, member in enumerate(members)}

    excluded_by_face: dict[int, list[int]] = {}
    for face, member in excluded:
        index = member_index.get(int(member))
        if index is not None:
            excluded_by_face.setdefault(int(face), []).append(index)

    block = config.MATCH_FACES_BLOCK
    for start in range(0, count, block):
        end = min(count, start + block)
        scores = np.maximum.reduceat(faces[start:end] @ references.T, starts, axis=1)

        for face in range(start, end):
            indexes = excluded_by_face.get(face)
            if indexes:
                scores[face - start, indexes] = -np.inf

        best = np.argmax(scores, axis=1)
        rows = np.arange(end - start)
        best_score = scores[rows, best].copy()
        scores[rows, best] = -np.inf
        second_score = scores.max(axis=1)

        for row in range(end - start):
            if not np.isfinite(best_score[row]):
                continue
            best_members[start + row] = int(members[best[row]])
            best_scores[start + row] = float(best_score[row])
            if np.isfinite(second_score[row]):
                second_scores[start + row] = float(second_score[row])

    return best_members, best_scores, second_scores


async def run(data: dict[str, Any], results: Queue) -> dict[str, Any]:
    dimensions = int(data["dimensions"])
    client = _client()
    references_data, faces_data = await client.mget([data["referencesKey"], data["facesKey"]])

    references = _matrix(references_data, dimensions)
    reference_members = np.asarray(data["referenceMemberIds"], dtype=np.int64)
    faces = _matrix(faces_data, dimensions)
    if references.shape[0] != reference_members.shape[0]:
        raise ValueError("Reference embeddings do not match their members")

    excluded = [(int(face), int(member)) for face, member in data.get("excluded", [])]
    members, scores, second_scores = await asyncio.to_thread(match, references, reference_members, faces, excluded)
    return {"memberIds": members, "scores": scores, "secondScores": second_scores}
