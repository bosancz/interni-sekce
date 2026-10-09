import asyncio
import json
import logging
import os
import socket
import time
from datetime import datetime, timezone
from typing import Any, Iterator

import redis.asyncio as redis

from . import config
from .resources import available_cpus, cpu_limit, cpu_time, memory_limit, memory_usage

logger = logging.getLogger("heartbeat")

CLAIM_SCRIPT = """
local owner = redis.call('GET', KEYS[1])
if owner == false or owner == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
  return 1
end
return 0
"""

RELEASE_SCRIPT = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Heartbeat:
    def __init__(self, tasks: list[str]):
        hostname = socket.gethostname()
        self.owner = f"{hostname}:{os.getpid()}"
        self.id = ""
        self.key = ""
        self.redis = redis.from_url(config.REDIS_URL)
        self.claim = self.redis.register_script(CLAIM_SCRIPT)
        self.release = self.redis.register_script(RELEASE_SCRIPT)
        self.state: dict[str, Any] = {
            "id": "",
            "hostname": hostname,
            "status": "idle",
            "tasks": tasks,
            "current": None,
            "cpus": available_cpus(),
            "cpuLimit": cpu_limit(),
            "cpuUsage": None,
            "memoryLimit": memory_limit(),
            "memoryUsage": None,
            "processed": 0,
            "failed": 0,
            "lastJobAt": None,
            "startedAt": _now(),
            "updatedAt": _now(),
        }
        self._task: asyncio.Task | None = None
        self._cpu_sample = (time.monotonic(), cpu_time())

    def _claim_key(self, name: str) -> str:
        return f"{config.NAME_CLAIM_PREFIX}{name}"

    async def _claim_name(self, name: str) -> bool:
        return bool(await self.claim(keys=[self._claim_key(name)], args=[self.owner, config.HEARTBEAT_TTL_S]))

    def _candidate_names(self) -> Iterator[str]:
        if config.WORKER_NAME:
            yield config.WORKER_NAME
        for round in range(1, config.NAME_MAX_ROUNDS + 1):
            for name in config.WORKER_NAMES:
                yield name if round == 1 else f"{name}-{round}"

    async def _acquire_name(self) -> None:
        for name in self._candidate_names():
            if await self._claim_name(name):
                if config.WORKER_NAME and name != config.WORKER_NAME:
                    logger.warning("Worker name %s is taken, using %s", config.WORKER_NAME, name)
                self.id = name
                self.key = f"{config.HEARTBEAT_PREFIX}{name}"
                self.state["id"] = name
                return
        raise RuntimeError("No free worker name")

    def _cpu_usage(self) -> float | None:
        now, used = time.monotonic(), cpu_time()
        previous_now, previous_used = self._cpu_sample
        self._cpu_sample = (now, used)
        if now <= previous_now:
            return None
        return round(max(0.0, used - previous_used) / (now - previous_now), 3)

    async def publish(self) -> None:
        self.state["cpuUsage"] = self._cpu_usage()
        self.state["memoryUsage"] = memory_usage()
        self.state["updatedAt"] = _now()
        try:
            if not await self._claim_name(self.id):
                previous = self.id
                await self._acquire_name()
                logger.warning("Worker name %s taken over, continuing as %s", previous, self.id)
            await self.redis.set(self.key, json.dumps(self.state), ex=config.HEARTBEAT_TTL_S)
            config.HEARTBEAT_FILE.touch()
        except redis.RedisError as err:
            logger.warning("Heartbeat failed: %s", err)

    async def _loop(self) -> None:
        while True:
            await self.publish()
            await asyncio.sleep(config.HEARTBEAT_INTERVAL_S)

    async def start(self) -> None:
        await self._acquire_name()
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
            if self.id and await self.release(keys=[self._claim_key(self.id)], args=[self.owner]):
                await self.redis.delete(self.key)
        finally:
            await self.redis.aclose()
