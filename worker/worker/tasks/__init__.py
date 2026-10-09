from typing import Any, Awaitable, Callable

from bullmq import Queue

from . import detect_faces, embed_photo, embed_text, photo_thumbnails

TaskHandler = Callable[[dict[str, Any], Queue], Awaitable[Any]]

TASKS: dict[str, TaskHandler] = {
    detect_faces.NAME: detect_faces.run,
    embed_photo.NAME: embed_photo.run,
    embed_text.NAME: embed_text.run,
    photo_thumbnails.NAME: photo_thumbnails.run,
}

TaskRelease = Callable[[], bool]

RELEASES: dict[str, TaskRelease] = {
    detect_faces.NAME: detect_faces.release,
    embed_photo.NAME: embed_photo.release,
}
