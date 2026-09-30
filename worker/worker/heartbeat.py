import asyncio
import json
import logging
import socket
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as redis

from . import config
from .resources import available_cpus, cpu_limit, memory_limit, memory_usage

logger = logging.getLogger("heartbeat")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Heartbeat:
    def __init__(self, tasks: list[str]):
        hostname = socket.gethostname()
        self.id = config.WORKER_NAME or hostname
        self.key = f"{config.HEARTBEAT_PREFIX}{self.id}"
        self.redis = redis.from_url(config.REDIS_URL)
        self.state: dict[str, Any] = {
            "id": self.id,
            "hostname": hostname,
            "status": "idle",
            "tasks": tasks,
            "current": None,
            "cpus": available_cpus(),
            "cpuLimit": cpu_limit(),
            "memoryLimit": memory_limit(),
            "memoryUsage": None,
            "processed": 0,
            "failed": 0,
            "lastJobAt": None,
            "startedAt": _now(),
            "updatedAt": _now(),
        }
        self._task: asyncio.Task | None = None

    async def publish(self) -> None:
        self.state["memoryUsage"] = memory_usage()
        self.state["updatedAt"] = _now()
        try:
            await self.redis.set(self.key, json.dumps(self.state), ex=config.HEARTBEAT_TTL_S)
        except redis.RedisError as err:
            logger.warning("Heartbeat failed: %s", err)

    async def _loop(self) -> None:
        while True:
            await self.publish()
            await asyncio.sleep(config.HEARTBEAT_INTERVAL_S)

    def start(self) -> None:
        self._task = asyncio.create_task(self._loop())

    async def job_started(self, task: str, job_id: str | None) -> None:
        self.state["status"] = "busy"
        self.state["current"] = {"task": task, "jobId": job_id, "startedAt": _now()}
        await self.publish()

    async def job_finished(self, ok: bool) -> None:
        self.state["status"] = "idle"
        self.state["current"] = None
        self.state["processed" if ok else "failed"] += 1
        self.state["lastJobAt"] = _now()
        await self.publish()

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
        try:
            await self.redis.delete(self.key)
        finally:
            await self.redis.aclose()
