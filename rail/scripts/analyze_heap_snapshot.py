#!/usr/bin/env python3
"""
Streaming analyzer for Chrome/V8 `.heapsnapshot` files.

It avoids loading the full snapshot into memory and reports:
- total nodes / total self size
- top constructors (by summed self size)
- top node types (by summed self size)
- top individual nodes (by self size)
"""

from __future__ import annotations

import argparse
import heapq
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import ijson


def human_bytes(value: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    num = float(value)
    for unit in units:
        if num < 1024 or unit == units[-1]:
            return f"{num:.2f} {unit}"
        num /= 1024
    return f"{value} B"


def read_snapshot_meta(path: Path) -> dict:
    with path.open("rb") as f:
        try:
            return next(ijson.items(f, "snapshot.meta"))
        except StopIteration as exc:
            raise RuntimeError("Could not read snapshot.meta from heapsnapshot") from exc


def resolve_selected_strings(path: Path, selected_indexes: Iterable[int]) -> Dict[int, str]:
    selected = set(selected_indexes)
    if not selected:
        return {}

    resolved: Dict[int, str] = {}
    with path.open("rb") as f:
        for idx, value in enumerate(ijson.items(f, "strings.item")):
            if idx in selected:
                resolved[idx] = value
                if len(resolved) == len(selected):
                    break
    return resolved


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=Path, help="Path to .heapsnapshot file")
    parser.add_argument(
        "--top",
        type=int,
        default=25,
        help="How many top entries to print for constructors/types/nodes",
    )
    args = parser.parse_args()

    snapshot_path = args.snapshot
    meta = read_snapshot_meta(snapshot_path)

    node_fields: List[str] = meta["node_fields"]
    node_types_meta: List[List[str]] = meta["node_types"]
    type_names: List[str] = node_types_meta[0]

    stride = len(node_fields)
    type_idx = node_fields.index("type")
    name_idx = node_fields.index("name")
    self_size_idx = node_fields.index("self_size")
    detached_idx = node_fields.index("detachedness") if "detachedness" in node_fields else -1

    total_nodes = 0
    total_self_size = 0
    detached_nodes = 0
    detached_self_size = 0

    total_self_by_name_idx: Dict[int, int] = defaultdict(int)
    total_count_by_name_idx: Counter[int] = Counter()
    total_self_by_type_idx: Dict[int, int] = defaultdict(int)
    total_count_by_type_idx: Counter[int] = Counter()

    top_nodes_heap: List[Tuple[int, int, int, int]] = []
    top_limit = max(args.top, 10)

    record = [0] * stride
    with snapshot_path.open("rb") as f:
        for i, raw_value in enumerate(ijson.items(f, "nodes.item")):
            slot = i % stride
            record[slot] = int(raw_value)
            if slot != stride - 1:
                continue

            node_type = record[type_idx]
            node_name = record[name_idx]
            self_size = record[self_size_idx]

            total_nodes += 1
            total_self_size += self_size
            total_self_by_name_idx[node_name] += self_size
            total_count_by_name_idx[node_name] += 1
            total_self_by_type_idx[node_type] += self_size
            total_count_by_type_idx[node_type] += 1

            if detached_idx >= 0 and record[detached_idx] > 0:
                detached_nodes += 1
                detached_self_size += self_size

            row = (self_size, total_nodes - 1, node_name, node_type)
            if len(top_nodes_heap) < top_limit:
                heapq.heappush(top_nodes_heap, row)
            elif self_size > top_nodes_heap[0][0]:
                heapq.heapreplace(top_nodes_heap, row)

    top_name_rows = sorted(
        ((size, idx, total_count_by_name_idx[idx]) for idx, size in total_self_by_name_idx.items()),
        reverse=True,
    )[: args.top]
    top_type_rows = sorted(
        ((size, idx, total_count_by_type_idx[idx]) for idx, size in total_self_by_type_idx.items()),
        reverse=True,
    )[: args.top]
    top_nodes = sorted(top_nodes_heap, reverse=True)

    needed_string_indexes = {idx for _, idx, _ in top_name_rows}
    needed_string_indexes.update(node_name for _, _, node_name, _ in top_nodes)
    resolved_strings = resolve_selected_strings(snapshot_path, needed_string_indexes)

    print(f"Snapshot: {snapshot_path}")
    print(f"Node count: {total_nodes:,}")
    print(f"Total self size: {total_self_size:,} bytes ({human_bytes(total_self_size)})")
    if detached_idx >= 0:
        print(
            "Detached nodes: "
            f"{detached_nodes:,} ({human_bytes(detached_self_size)} self size)"
        )
    print("")

    print(f"Top constructors by self size (top {args.top}):")
    for size, idx, count in top_name_rows:
        name = resolved_strings.get(idx, f"<string#{idx}>")
        print(f"- {human_bytes(size):>10} | count={count:>8} | {name}")
    print("")

    print(f"Top node types by self size (top {args.top}):")
    for size, type_index, count in top_type_rows:
        type_name = type_names[type_index] if 0 <= type_index < len(type_names) else str(type_index)
        print(f"- {human_bytes(size):>10} | count={count:>8} | {type_name}")
    print("")

    print(f"Top individual nodes by self size (top {args.top}):")
    for size, node_index, node_name_idx, node_type_idx in top_nodes[: args.top]:
        type_name = (
            type_names[node_type_idx] if 0 <= node_type_idx < len(type_names) else str(node_type_idx)
        )
        name = resolved_strings.get(node_name_idx, f"<string#{node_name_idx}>")
        print(
            f"- {human_bytes(size):>10} | node#{node_index:<9} | type={type_name:<11} | {name}"
        )


if __name__ == "__main__":
    main()
