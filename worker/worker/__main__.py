import asyncio
import logging
import signal
import time
from typing import Any

import cv2
from bullmq import Queue, Worker

from . import config, memory
from .heartbeat import Heartbeat
from .resources import available_cpus
from .tasks import RELEASES, TASKS, TaskHandler, TaskRelease

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("worker")


def enabled_tasks(setting: str) -> list[str]:
    names = [name.strip() for name in setting.split(",") if name.strip()]
    if not names or "*" in names:
        return list(TASKS)

    unknown = [name for name in names if name not in TASKS]
    if unknown:
        raise SystemExit(f"Unknown tasks in WORKER_TASKS: {', '.join(unknown)} (known: {', '.join(TASKS)})")

    return names


async def release_idle_models(lock: asyncio.Lock, releases: dict[str, TaskRelease], last_job: list[float]) -> None:
    while True:
        await asyncio.sleep(config.MODELS_IDLE_CHECK_S)
        if lock.locked() or time.monotonic() - last_job[0] < config.MODELS_IDLE_RELEASE_S:
            continue

        async with lock:
            released = [name for name, release in releases.items() if release()]
            if released:
                memory.trim()
                logger.info("Idle, released models: %s", ", ".join(released))


async def main() -> None:
    tasks = enabled_tasks(config.WORKER_TASKS)

    threads = available_cpus()
    cv2.setNumThreads(threads)
    logger.info("Tasks: %s, CPUs: %d, data: %s", ", ".join(tasks), threads, config.DATA_DIR)

    connection = {"connection": config.REDIS_URL}
    results = Queue(config.RESULTS_QUEUE, connection)
    lock = asyncio.Lock()
    heartbeat = Heartbeat(tasks)
    last_job = [time.monotonic()]
    await heartbeat.start()
    logger.info("Worker name: %s", heartbeat.id)

    def processor(name: str, handler: TaskHandler):
        async def process(job: Any, token: str) -> Any:
            async with lock:
                await heartbeat.job_started(name, job.id)
                ok = False
                try:
                    result = await handler(job.data, results)
                    ok = True
                    return result
                finally:
                    last_job[0] = time.monotonic()
                    await heartbeat.job_finished(ok)

        return process

    workers = [
        Worker(
            config.task_queue(name),
            processor(name, TASKS[name]),
            {**connection, "concurrency": 1, "lockDuration": config.JOB_LOCK_DURATION_MS},
        )
        for name in tasks
    ]

    releases = {name: RELEASES[name] for name in tasks if name in RELEASES}
    idle = asyncio.create_task(release_idle_models(lock, releases, last_job)) if releases else None

    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, stop.set)

    await stop.wait()

    logger.info("Shutting down")
    if idle:
        idle.cancel()
    await asyncio.gather(*(worker.close() for worker in workers))
    await results.close()
    await heartbeat.stop()


if __name__ == "__main__":
    asyncio.run(main())
