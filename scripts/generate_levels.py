import json
import math
import random
from pathlib import Path

LEVEL_COUNT = 100
COLS = 11
MIN_ROWS = 5
MAX_ROWS = 10
OUTPUT = Path("levels/levels.json")


def build_weight(level_id: int, row: int, col: int, rng: random.Random) -> float:
    mid = (COLS - 1) / 2
    weight = 0.0
    radius = 2 + ((row * 2 + level_id) % 5)
    radius += math.sin((level_id + row * 1.5) * 0.35) * 0.8
    if abs(col - mid) < radius:
        weight += 1.3
    shard_mod = 3 + (level_id + row) % 4
    if ((col + row + level_id) % shard_mod) < 2:
        weight += 0.8
    ripple = math.sin((col - mid) * 0.9 + (row % 5) * 0.6)
    if ripple > 0.35:
        weight += 0.6 + ripple * 0.25
    if rng.random() < 0.14 + (row % 3) * 0.03:
        weight += 0.5
    ring_base = math.hypot(col - mid, row % 5 - 2.5)
    if abs(ring_base - (radius - 1)) < 1.2:
        weight += 0.45
    return weight


def generate_level(level_id: int) -> dict:
    rng = random.Random(level_id * 7919)
    rows = MIN_ROWS + (level_id % (MAX_ROWS - MIN_ROWS + 1))
    rows += (level_id // 25)
    rows = min(rows, MAX_ROWS)
    pattern = []
    for row in range(rows):
        half = (COLS + 1) // 2
        row_bits = []
        for col in range(half):
            weight = build_weight(level_id, row, col, rng)
            threshold = 1.15 + ((row % 2) * 0.17) - ((level_id % 4) * 0.05)
            row_bits.append("1" if weight >= threshold else "0")
        mirror = row_bits[: COLS - half]
        mirror = list(reversed(mirror))
        full = row_bits + mirror
        if len(full) < COLS:
            full += ["0"] * (COLS - len(full))
        if all(char == "0" for char in full):
            idx = rng.randrange(COLS)
            full[idx] = "1"
        pattern.append("".join(full[:COLS]))
    return {"id": level_id, "pattern": pattern}


def build_levels() -> dict:
    return {"levels": [generate_level(i) for i in range(1, LEVEL_COUNT + 1)]}


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump(build_levels(), handle, indent=2)
    print(f"Generated {LEVEL_COUNT} levels in {OUTPUT}")


if __name__ == "__main__":
    main()
