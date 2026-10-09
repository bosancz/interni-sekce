from typing import Any, Awaitable, Callable

from bullmq import Queue

from . import detect_faces, embed_photo, embed_text, render_registration

TaskHandler = Callable[[dict[str, Any], Queue], Awaitable[Any]]

TASKS: dict[str, TaskHandler] = {
    detect_faces.NAME: detect_faces.run,
    embed_photo.NAME: embed_photo.run,
    embed_text.NAME: embed_text.run,
    render_registration.NAME: render_registration.run,
}

TaskRelease = Callable[[], bool | Awaitable[bool]]

RELEASES: dict[str, TaskRelease] = {
    detect_faces.NAME: detect_faces.release,
    embed_photo.NAME: embed_photo.release,
    render_registration.NAME: render_registration.release,
}
