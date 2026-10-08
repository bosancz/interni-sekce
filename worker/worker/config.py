import os
from pathlib import Path

REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379")
DATA_DIR = Path(os.environ.get("DATA_DIR", "/data")).resolve()
WORKER_TASKS = os.environ.get("WORKER_TASKS", "*")
WORKER_NAME = os.environ.get("WORKER_NAME", "")

MODELS_DIR = Path(os.environ.get("MODELS_DIR", Path(__file__).resolve().parent.parent / "models"))

RESULTS_QUEUE = "worker-results"
JOB_LOCK_DURATION_MS = 60_000

HEARTBEAT_PREFIX = "worker-heartbeat:"
NAME_CLAIM_PREFIX = "worker-name:"
NAME_MAX_ROUNDS = 100
WORKER_NAMES = [
    "thorin",
    "balin",
    "dwalin",
    "fili",
    "kili",
    "dori",
    "nori",
    "ori",
    "oin",
    "gloin",
    "bifur",
    "bofur",
    "bombur",
    "gimli",
    "dain",
    "thrain",
    "thror",
    "durin",
    "fundin",
    "groin",
    "nain",
    "farin",
    "borin",
    "fror",
    "gror",
    "telchar",
    "narvi",
]
HEARTBEAT_INTERVAL_S = 10
HEARTBEAT_TTL_S = 30
HEARTBEAT_FILE = Path(os.environ.get("HEARTBEAT_FILE", "/tmp/worker-heartbeat"))

FACES_DETECTOR_MODEL = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
FACES_RECOGNIZER_MODEL = MODELS_DIR / "face_recognition_sface_2021dec.onnx"
FACES_EXPRESSION_MODEL = MODELS_DIR / "facial_expression_recognition_mobilefacenet_2022july.onnx"
FACES_EMOTIONS = ["angry", "disgust", "fearful", "happy", "neutral", "sad", "surprised"]
FACES_MODEL = "yunet-2023mar-multiscale+sface-2021dec+fer-2022july"
FACES_MIN_SCORE = 0.8
FACES_MIN_SIZE = 0.02
FACES_NMS_THRESHOLD = 0.3
FACES_MAX_IMAGE_SIDE = 1600
FACES_LARGE_SCALES = [640, 320]
FACES_LARGE_PADDING = 0.25

CLIP_VISION_MODEL = MODELS_DIR / "clip-vit-base-patch32-vision.onnx"
CLIP_TEXT_MODEL = MODELS_DIR / "clip-vit-base-patch32-multilingual-text.onnx"
CLIP_TEXT_TOKENIZER = MODELS_DIR / "clip-vit-base-patch32-multilingual-tokenizer.json"
CLIP_TEXT_PROJECTION = MODELS_DIR / "clip-vit-base-patch32-multilingual-dense.safetensors"
CLIP_MODEL = "clip-vit-b32+multilingual-v1"
CLIP_IMAGE_MODEL = "clip-vit-b32-crops-v2"
CLIP_CROP_MIN_ASPECT = 1.15
CLIP_IMAGE_SIZE = 224
CLIP_IMAGE_MEAN = [0.48145466, 0.4578275, 0.40821073]
CLIP_IMAGE_STD = [0.26862954, 0.26130258, 0.27577711]
CLIP_TEXT_MAX_TOKENS = 128
CLIP_TEXT_MAX_BATCH = 64


def task_queue(task: str) -> str:
    return f"worker-{task}"
