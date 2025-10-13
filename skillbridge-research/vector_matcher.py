# vector_matcher.py
# Semantic matcher using SentenceTransformer embeddings.
# - Encodes individual skill phrases for all users (teaches and learns)
# - For each teacher->learner pair, computes max cosine similarity between any teach skill and any learn skill
# - If similarity >= threshold, adds an edge weighted by semantic score + rating + timezone score
# - Uses max weight matching to produce disjoint, high-quality recommendations

from __future__ import annotations
from typing import List, Dict, Tuple

import re

try:
    import numpy as np
except ImportError as e:
    raise SystemExit("NumPy is required. Install with: pip install numpy") from e

try:
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    raise SystemExit(
        "scikit-learn is required for cosine similarity. Install with: pip install scikit-learn"
    ) from e

try:
    from sentence_transformers import SentenceTransformer
except ImportError as e:
    raise SystemExit(
        "sentence-transformers is required. Install with: pip install sentence-transformers"
    ) from e

try:
    import networkx as nx
except ImportError as e:
    raise SystemExit(
        "NetworkX is required for matching. Install with: pip install networkx"
    ) from e


# Load the model once (small, fast, and semantically strong for short text)
_MODEL_NAME = "all-MiniLM-L6-v2"
_model = SentenceTransformer(_MODEL_NAME)


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


def _encode_skills(skills: List[str]) -> np.ndarray:
    if not skills:
        return np.zeros((0, _model.get_sentence_embedding_dimension()), dtype=np.float32)
    return _model.encode(skills, convert_to_numpy=True, normalize_embeddings=True)


def get_vector_matches(
    users: List[Dict],
    min_skill_similarity: float = 0.55,
) -> List[Tuple[str, str]]:
    """Compute semantic matches using skill embeddings and max weight matching.

    Args:
        users: list of user dicts with keys id, teaches, learns, rating, timezone
        min_skill_similarity: minimum cosine similarity for any teach/learn skill pair to consider an edge

    Returns:
        List of pairs (user_id_a, user_id_b) sorted by the matched edge weight desc.
        Each pair is a sorted tuple (min_id, max_id) to avoid duplicates.
    """
    # Pre-encode skills for each user
    teach_vecs: Dict[str, np.ndarray] = {}
    learn_vecs: Dict[str, np.ndarray] = {}

    for u in users:
        teaches = [s.strip() for s in u.get("teaches", []) if s and isinstance(s, str)]
        learns = [s.strip() for s in u.get("learns", []) if s and isinstance(s, str)]
        teach_vecs[u["id"]] = _encode_skills(teaches)
        learn_vecs[u["id"]] = _encode_skills(learns)

    # Build graph
    G = nx.Graph()
    user_ids = [u["id"] for u in users]
    id_to_user = {u["id"]: u for u in users}

    # two partitions
    G.add_nodes_from(user_ids, bipartite=0)
    G.add_nodes_from([f"L::{uid}" for uid in user_ids], bipartite=1)

    for teacher in users:
        t_id = teacher["id"]
        t_vecs = teach_vecs[t_id]
        if t_vecs.size == 0:
            continue
        for learner in users:
            l_id = learner["id"]
            if t_id == l_id:
                continue
            l_vecs = learn_vecs[l_id]
            if l_vecs.size == 0:
                continue
            # Compute pairwise similarities and take max as the compatibility
            sim_matrix = cosine_similarity(t_vecs, l_vecs)
            max_sim = float(np.max(sim_matrix)) if sim_matrix.size > 0 else 0.0
            if max_sim < min_skill_similarity:
                continue
            tz_score = _timezone_score(teacher.get("timezone", "GMT+0"), learner.get("timezone", "GMT+0"))
            # Weight scales semantic similarity to 0..100 and adds rating and timezone preference
            weight = (max_sim * 100.0) + float(teacher.get("rating", 0)) + tz_score
            G.add_edge(t_id, f"L::{l_id}", weight=weight)

    if G.number_of_edges() == 0:
        return []

    matching = nx.algorithms.matching.max_weight_matching(G, maxcardinality=True)

    pair2w: Dict[Tuple[str, str], float] = {}
    for a, b in matching:
        if isinstance(a, str) and a.startswith("L::"):
            a, b = b, a
        t_id = a
        l_id = b.split("::", 1)[1]
        pair = tuple(sorted((t_id, l_id)))
        w = G[a][b]["weight"]
        prev = pair2w.get(pair)
        pair2w[pair] = w if prev is None else max(prev, w)

    pairs_with_weights = sorted(pair2w.items(), key=lambda x: (-x[1], x[0]))
    return [p for p, _ in pairs_with_weights]


if __name__ == "__main__":
    # Simple smoke test
    import json
    from pathlib import Path

    data_path = Path(__file__).resolve().parent / "data" / "users.json"
    users = json.loads(data_path.read_text(encoding="utf-8"))
    pairs = get_vector_matches(users)
    print("Vector matches (top 10):", pairs[:10])
