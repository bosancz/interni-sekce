import math
import os
from pathlib import Path

UNLIMITED_MEMORY = 1 << 60


def _read(path: str) -> str | None:
    try:
        return Path(path).read_text().strip()
    except OSError:
        return None


def cpu_limit() -> float | None:
    cpu_max = _read("/sys/fs/cgroup/cpu.max")
    if cpu_max:
        quota, _, period = cpu_max.partition(" ")
        if quota != "max" and period:
            return int(quota) / int(period)
        return None

    quota = _read("/sys/fs/cgroup/cpu/cpu.cfs_quota_us")
    period = _read("/sys/fs/cgroup/cpu/cpu.cfs_period_us")
    if quota and period and int(quota) > 0:
        return int(quota) / int(period)

    return None


def available_cpus() -> int:
    limit = cpu_limit()
    if limit:
        return max(1, math.ceil(limit))

    if hasattr(os, "sched_getaffinity"):
        return max(1, len(os.sched_getaffinity(0)))

    return os.cpu_count() or 1


def memory_limit() -> int | None:
    value = _read("/sys/fs/cgroup/memory.max") or _read("/sys/fs/cgroup/memory/memory.limit_in_bytes")
    if not value or value == "max" or int(value) >= UNLIMITED_MEMORY:
        return None
    return int(value)


def memory_usage() -> int | None:
    value = _read("/sys/fs/cgroup/memory.current") or _read("/sys/fs/cgroup/memory/memory.usage_in_bytes")
    return int(value) if value else None
