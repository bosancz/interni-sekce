import asyncio
import base64
import logging
import re
import tempfile
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from bullmq import Queue

from .. import config

NAME = "render-registration"

logger = logging.getLogger(NAME)

_playwright: Any = None
_browser: Any = None

MM_TO_PX = 96 / 25.4
PREVIEW_VIEWPORT = {
    "width": round((config.REGISTRATION_PAGE_WIDTH_MM - 2 * config.REGISTRATION_PREVIEW_MARGIN_MM) * MM_TO_PX),
    "height": round((config.REGISTRATION_PAGE_HEIGHT_MM - 2 * config.REGISTRATION_PREVIEW_MARGIN_MM) * MM_TO_PX),
}
PREVIEW_MARGIN = round(config.REGISTRATION_PREVIEW_MARGIN_MM * MM_TO_PX * config.REGISTRATION_PREVIEW_SCALE)


async def _get_browser() -> Any:
    global _playwright, _browser
    if _browser is not None and _browser.is_connected():
        return _browser

    if _playwright is None:
        from playwright.async_api import async_playwright

        _playwright = await async_playwright().start()

    _browser = await _playwright.chromium.launch(executable_path=config.CHROMIUM_PATH or None)
    return _browser


async def release() -> bool:
    global _playwright, _browser
    if _playwright is None:
        return False

    try:
        if _browser is not None:
            await _browser.close()
        await _playwright.stop()
    except Exception as err:
        logger.warning("Closing browser failed: %s", err)
    _playwright = _browser = None
    return True


def _template_dir(template: str) -> Path:
    if not re.fullmatch(r"[a-z0-9_-]+", template, re.I):
        raise ValueError(f"Invalid template {template!r}.")
    path = config.REGISTRATION_TEMPLATES_DIR / template
    if not path.is_dir():
        raise ValueError(f"Template {template!r} not found.")
    return path


def _with_base(html: str, base: str) -> str:
    tag = f'<base href="{base}">'
    head = re.search(r"<head\b[^>]*>", html, re.I)
    if head:
        return html[: head.end()] + tag + html[head.end() :]
    return tag + html


def _preview(screenshot: bytes) -> bytes:
    image = cv2.imdecode(np.frombuffer(screenshot, np.uint8), cv2.IMREAD_COLOR)
    margin = PREVIEW_MARGIN
    image = cv2.copyMakeBorder(image, margin, margin, margin, margin, cv2.BORDER_CONSTANT, value=(255, 255, 255))
    ok, jpeg = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, config.REGISTRATION_PREVIEW_QUALITY])
    if not ok:
        raise ValueError("Preview encoding failed.")
    return jpeg.tobytes()


async def _render(html: str, template_dir: Path, title: str) -> tuple[bytes, bytes]:
    browser = await _get_browser()
    context = await browser.new_context(
        viewport=PREVIEW_VIEWPORT, device_scale_factor=config.REGISTRATION_PREVIEW_SCALE
    )
    try:
        page = await context.new_page()
        page.set_default_timeout(config.REGISTRATION_TIMEOUT_MS)

        with tempfile.TemporaryDirectory(prefix="registration-") as tmp:
            file = Path(tmp) / "registration.html"
            file.write_text(_with_base(html, template_dir.as_uri() + "/"), encoding="utf-8")
            await page.goto(file.as_uri(), wait_until="load")
            await page.evaluate("document.fonts.ready.then(() => undefined)")
            await page.evaluate("title => { document.title = title; }", title)

            pdf = await page.pdf(format="A4", landscape=True, print_background=True, prefer_css_page_size=True)
            await page.emulate_media(media="print")
            screenshot = await page.screenshot(type="png", full_page=True)
    finally:
        await context.close()

    return pdf, await asyncio.to_thread(_preview, screenshot)


async def run(data: dict[str, Any], results: Queue) -> dict[str, Any]:
    template_dir = _template_dir(str(data["template"]))
    pdf, image = await _render(str(data["html"]), template_dir, str(data.get("title") or ""))
    logger.info("Registration rendered (%s, PDF %d kB)", template_dir.name, len(pdf) // 1024)
    return {"pdf": base64.b64encode(pdf).decode("ascii"), "image": base64.b64encode(image).decode("ascii")}
