# bipartite_matcher.py
# Rule-based bipartite matching using NetworkX.
# - Builds a bipartite graph over users (teacher side vs learner side)
# - Adds edges when there's direct skill overlap (teacher.teaches ∩ learner.learns)
# - Edge weight = (overlap_count * 10) + teacher_rating + timezone_score
# - timezone_score decreases with timezone difference (0..5)
# - Returns matched pairs sorted by edge weight (desc)

from __future__ import annotations
from typing import List, Dict, Tuple

import re

try:
    import networkx as nx
except ImportError as e:
    raise SystemExit(
        "NetworkX is required for bipartite_matcher. Install with: pip install networkx"
    ) from e


def _parse_timezone_offset(tz: str) -> float:
    """Parse timezone strings like 'GMT+3', 'GMT-5', 'GMT+05', 'GMT-05:30' into hours offset.
    Returns 0.0 on failure.
    """
    if not isinstance(tz, str):
        return 0.0
    m = re.match(r"^GMT([+-])(\d{1,2})(?::(\d{2}))?$", tz.strip(), re.IGNORECASE)
    if not m:
        return 0.0
    sign = -1 if m.group(1) == '-' else 1
    hours = int(m.group(2))
    minutes = int(m.group(3)) if m.group(3) else 0
    return sign * (hours + minutes / 60.0)


def _timezone_score(tz_a: str, tz_b: str) -> float:
    diff = abs(_parse_timezone_offset(tz_a) - _parse_timezone_offset(tz_b))
    # Map difference in hours to a score in [0, 5], dropping by 1 per hour up to 5 hours
    return max(0.0, 5.0 - min(diff, 5.0))


def get_bipartite_matches(users: List[Dict]) -> List[Tuple[str, str]]:
    """Compute bipartite matches using max weight matching.

    Returns a list of pairs (user_id_a, user_id_b) sorted by the matched edge weight desc.
    Pairs are returned as sorted tuples (min_id, max_id) to avoid duplicates.
    """
    # Build graph
    G = nx.Graph()
    user_ids = [u["id"] for u in users]

    # Add nodes with bipartite attribute (two partitions of the same set of users)
    G.add_nodes_from(user_ids, bipartite=0)
    G.add_nodes_from([f"L::{uid}" for uid in user_ids], bipartite=1)  # suffix to keep sides distinct

    # Build edges from teacher (original id) to learner (prefixed id)
    id_to_user = {u["id"]: u for u in users}

    for teacher in users:
        t_id = teacher["id"]
        t_skills = set(teacher.get("teaches", []))
        for learner in users:
            l_id = learner["id"]
            if t_id == l_id:
                continue
            l_wants = set(learner.get("learns", []))
            overlap = t_skills & l_wants
            if not overlap:
                continue
            tz_score = _timezone_score(teacher.get("timezone", "GMT+0"), learner.get("timezone", "GMT+0"))
            weight = (len(overlap) * 10.0) + float(teacher.get("rating", 0)) + tz_score
            # Edge from teacher side node to learner side node
            G.add_edge(t_id, f"L::{l_id}", weight=weight)

    if G.number_of_edges() == 0:
        return []

    # Maximum weight matching on bipartite graph
    matching = nx.algorithms.matching.max_weight_matching(G, maxcardinality=True)

    # Convert to canonical, deduped user-id pairs and collect weights
    pair2w: Dict[Tuple[str, str], float] = {}
    for a, b in matching:
        # Determine which one is learner side
        if isinstance(a, str) and a.startswith("L::"):
            a, b = b, a
        # Now a is teacher (plain id), b is learner (L::id)
        t_id = a
        l_id = b.split("::", 1)[1]
        # Canonical undirected pair
        pair = tuple(sorted((t_id, l_id)))
        w = G[a][b]["weight"]
        prev = pair2w.get(pair)
        pair2w[pair] = w if prev is None else max(prev, w)

    # Sort by weight desc, then pair id for stability
    pairs_with_weights = sorted(pair2w.items(), key=lambda x: (-x[1], x[0]))

    # Return just the pairs (unique already by construction)
    return [p for p, _ in pairs_with_weights]


if __name__ == "__main__":
    # Simple smoke test when running this module directly
    import json
    from pathlib import Path

    data_path = Path(__file__).resolve().parent / "data" / "users.json"
    users = json.loads(data_path.read_text(encoding="utf-8"))
    pairs = get_bipartite_matches(users)
    print("Bipartite matches (top 10):", pairs[:10])
