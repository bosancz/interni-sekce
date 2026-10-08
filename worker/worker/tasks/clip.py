from pathlib import Path
from typing import Any

import cv2
import numpy as np

from .. import config
from ..resources import available_cpus

_vision: Any = None
_text: Any = None
_tokenizer: Any = None
_projection: np.ndarray | None = None


def _session(path: Path) -> Any:
    import onnxruntime as ort

    options = ort.SessionOptions()
    options.intra_op_num_threads = available_cpus()
    options.inter_op_num_threads = 1
    return ort.InferenceSession(str(path), options, providers=["CPUExecutionProvider"])


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return vectors / np.maximum(norms, 1e-12)


def _to_input(image: np.ndarray) -> np.ndarray:
    size = config.CLIP_IMAGE_SIZE
    height, width = image.shape[:2]
    if (height, width) != (size, size):
        interpolation = cv2.INTER_AREA if max(height, width) > size else cv2.INTER_CUBIC
        image = cv2.resize(image, (size, size), interpolation=interpolation)
    image = image.astype(np.float32) / 255.0
    image = (image - np.asarray(config.CLIP_IMAGE_MEAN, np.float32)) / np.asarray(config.CLIP_IMAGE_STD, np.float32)
    return image.transpose(2, 0, 1)


def _padded(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    side = max(height, width)
    top = (side - height) // 2
    left = (side - width) // 2
    fill = [round(v * 255) for v in config.CLIP_IMAGE_MEAN]
    return cv2.copyMakeBorder(
        image, top, side - height - top, left, side - width - left, cv2.BORDER_CONSTANT, value=fill
    )


def _windows(image: np.ndarray) -> list[np.ndarray]:
    height, width = image.shape[:2]
    side = min(height, width)
    length = max(height, width)
    if length / side < config.CLIP_CROP_MIN_ASPECT:
        return []

    count = max(2, int(np.ceil(length / side)))
    offsets = [round(i * (length - side) / (count - 1)) for i in range(count)]
    if width >= height:
        return [image[:, offset : offset + side] for offset in offsets]
    return [image[offset : offset + side, :] for offset in offsets]


def image_crops(image: np.ndarray) -> list[np.ndarray]:
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    height, width = image.shape[:2]
    scale = config.CLIP_IMAGE_SIZE * 2 / min(height, width)
    if scale < 1:
        image = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)

    windows = _windows(image)
    if not windows:
        side = min(image.shape[:2])
        top = (image.shape[0] - side) // 2
        left = (image.shape[1] - side) // 2
        windows = [image[top : top + side, left : left + side]]

    return [_padded(image), *windows]


def embed_image(path: Path) -> list[list[float]]:
    global _vision
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Cannot read image {path}.")

    if _vision is None:
        _vision = _session(config.CLIP_VISION_MODEL)

    batch = np.stack([_to_input(crop) for crop in image_crops(image)])
    output = _vision.run(["image_embeds"], {"pixel_values": batch})[0]
    return [[round(float(v), 5) for v in row] for row in _normalize(output.astype(np.float32))]


def release_vision() -> bool:
    global _vision
    if _vision is None:
        return False
    _vision = None
    return True


def embed_texts(texts: list[str]) -> list[list[float]]:
    global _text, _tokenizer, _projection
    if _text is None:
        from safetensors.numpy import load_file
        from tokenizers import Tokenizer

        _tokenizer = Tokenizer.from_file(str(config.CLIP_TEXT_TOKENIZER))
        _tokenizer.enable_padding()
        _tokenizer.enable_truncation(config.CLIP_TEXT_MAX_TOKENS)
        _projection = load_file(str(config.CLIP_TEXT_PROJECTION))["linear.weight"].astype(np.float32)
        _text = _session(config.CLIP_TEXT_MODEL)

    encoded = _tokenizer.encode_batch(texts)
    ids = np.array([e.ids for e in encoded], dtype=np.int64)
    mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
    hidden = _text.run(["last_hidden_state"], {"input_ids": ids, "attention_mask": mask})[0]
    pooled = (hidden * mask[..., None]).sum(axis=1) / np.maximum(mask.sum(axis=1, keepdims=True), 1)
    vectors = _normalize((pooled @ _projection.T).astype(np.float32))
    return [[round(float(v), 6) for v in row] for row in vectors]
