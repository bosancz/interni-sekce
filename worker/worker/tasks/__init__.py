from typing import Any, Awaitable, Callable

from bullmq import Queue

from . import detect_faces

TaskHandler = Callable[[dict[str, Any], Queue], Awaitable[None]]

TASKS: dict[str, TaskHandler] = {
    detect_faces.NAME: detect_faces.run,
}
