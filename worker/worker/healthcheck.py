import sys
import time

from . import config


def main() -> int:
    try:
        age = time.time() - config.HEARTBEAT_FILE.stat().st_mtime
    except FileNotFoundError:
        print("No heartbeat yet")
        return 1
    if age > config.HEARTBEAT_TTL_S:
        print(f"Heartbeat is {age:.0f} s old")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
