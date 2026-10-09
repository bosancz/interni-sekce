import ctypes
import gc

try:
    _libc: ctypes.CDLL | None = ctypes.CDLL("libc.so.6")
except OSError:
    _libc = None


def trim() -> None:
    gc.collect()
    if _libc is not None and hasattr(_libc, "malloc_trim"):
        _libc.malloc_trim(0)
