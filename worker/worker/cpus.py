import math
import os
from pathlib import Path


def _read(path: str) -> str | None:
    try:
        return Path(path).read_text().strip()
    except OSError:
        return None


def _cgroup_quota() -> float | None:
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
    quota = _cgroup_quota()
    if quota:
        return max(1, math.ceil(quota))

    if hasattr(os, "sched_getaffinity"):
        return max(1, len(os.sched_getaffinity(0)))

    return os.cpu_count() or 1
