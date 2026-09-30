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
HEARTBEAT_INTERVAL_S = 10
HEARTBEAT_TTL_S = 30

FACES_DETECTOR_MODEL = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
FACES_RECOGNIZER_MODEL = MODELS_DIR / "face_recognition_sface_2021dec.onnx"
FACES_MODEL = "yunet-2023mar+sface-2021dec"
FACES_MIN_SCORE = 0.8
FACES_MIN_SIZE = 0.02
FACES_NMS_THRESHOLD = 0.3
FACES_MAX_IMAGE_SIDE = 1600


def task_queue(task: str) -> str:
    return f"worker-{task}"
