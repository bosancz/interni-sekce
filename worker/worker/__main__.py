import asyncio
import logging
import signal
from typing import Any

import cv2
from bullmq import Queue, Worker

from . import config
from .heartbeat import Heartbeat
from .resources import available_cpus, release_memory
from .tasks import TASKS, UNLOADERS, TaskHandler

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


async def main() -> None:
    tasks = enabled_tasks(config.WORKER_TASKS)

    threads = available_cpus()
    cv2.setNumThreads(threads)
    logger.info("Tasks: %s, CPUs: %d, data: %s", ", ".join(tasks), threads, config.DATA_DIR)

    connection = {"connection": config.REDIS_URL}
    results = Queue(config.RESULTS_QUEUE, connection)
    lock = asyncio.Lock()
    heartbeat = Heartbeat(tasks)
    await heartbeat.start()
    logger.info("Worker name: %s", heartbeat.id)

    release_task: asyncio.Task | None = None

    async def release_when_idle() -> None:
        await asyncio.sleep(config.IDLE_RELEASE_S)
        async with lock:
            for unload in UNLOADERS:
                unload()
            release_memory()
        logger.info("Idle, memory released")

    def cancel_release() -> None:
        if release_task:
            release_task.cancel()

    def processor(name: str, handler: TaskHandler):
        async def process(job: Any, token: str) -> None:
            nonlocal release_task
            async with lock:
                cancel_release()
                await heartbeat.job_started(name, job.id)
                ok = False
                try:
                    await handler(job.data, results)
                    ok = True
                finally:
                    await heartbeat.job_finished(ok)
                    cancel_release()
                    release_task = asyncio.create_task(release_when_idle())

        return process

    workers = [
        Worker(
            config.task_queue(name),
            processor(name, TASKS[name]),
            {**connection, "concurrency": 1, "lockDuration": config.JOB_LOCK_DURATION_MS},
        )
        for name in tasks
    ]

    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, stop.set)

    await stop.wait()

    logger.info("Shutting down")
    cancel_release()
    await asyncio.gather(*(worker.close() for worker in workers))
    await results.close()
    await heartbeat.stop()


if __name__ == "__main__":
    asyncio.run(main())
