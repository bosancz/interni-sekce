from pathlib import Path

from . import config


def resolve_data_path(relative_path: str) -> Path:
    path = (config.DATA_DIR / relative_path).resolve()
    if not path.is_relative_to(config.DATA_DIR):
        raise ValueError(f"Path {relative_path} is outside of DATA_DIR.")
    return path
