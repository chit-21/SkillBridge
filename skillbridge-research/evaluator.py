# evaluator.py
# Orchestrates loading data, running matchers, and computing Precision@k.

from __future__ import annotations

import json
import argparse
from pathlib import Path
from typing import List, Tuple, Dict, Set

# Local imports
from bipartite_matcher import get_bipartite_matches

# Vector matcher is optional; provide a friendly message if unavailable
try:
    from vector_matcher import get_vector_matches
    _VECTOR_AVAILABLE = True
except SystemExit as e:
    print("[vector_matcher] Dependency missing:", e)
    _VECTOR_AVAILABLE = False
except Exception as e:
    print("[vector_matcher] Could not initialize:", e)
    _VECTOR_AVAILABLE = False


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
USERS_PATH = DATA_DIR / "users.json"
GROUND_TRUTH_PATH = DATA_DIR / "ground_truth.json"


def _load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _canon_pair(pair: Tuple[str, str]) -> Tuple[str, str]:
    a, b = pair
    return tuple(sorted((a, b)))


def _load_ground_truth() -> List[Dict]:
    return _load_json(GROUND_TRUTH_PATH)


def _good_pairs_set(ground_truth: List[Dict], min_score: int = 2) -> Set[Tuple[str, str]]:
    good: Set[Tuple[str, str]] = set()
    for item in ground_truth:
        pair = _canon_pair(tuple(item["pair"]))
        if int(item.get("score", 0)) >= min_score:
            good.add(pair)
    return good


def precision_at_k(recommended_pairs: List[Tuple[str, str]], good_pairs: Set[Tuple[str, str]], k: int = 5) -> float:
    if k <= 0:
        return 0.0
    topk = recommended_pairs[:k]
    hits = sum(1 for p in topk if p in good_pairs)
    return float(hits) / float(k)


def evaluate_algorithm(name: str, rec_pairs: List[Tuple[str, str]], good_pairs: Set[Tuple[str, str]], k: int = 5) -> None:
    print(f"--- {name} Results ---")
    print(f"Recommended Pairs ({len(rec_pairs)}): {rec_pairs}")
    p_at_k = precision_at_k(rec_pairs, good_pairs, k=k)
    print(f"Precision@{k}: {p_at_k:.2f}")
    print()


def main():
    parser = argparse.ArgumentParser(description="Evaluate matching algorithms against ground truth")
    parser.add_argument("--k", type=int, default=5, help="Precision@k (default 5)")
    parser.add_argument("--min-score", type=int, default=2, help="Ground-truth score threshold for 'good' (default 2)")
    parser.add_argument("--vec-threshold", type=float, default=0.55, help="Vector matcher min skill similarity (default 0.55)")
    args = parser.parse_args()

    # Load data
    users = _load_json(USERS_PATH)
    ground_truth = _load_ground_truth()

    # Build set of good pairs (score >= args.min_score)
    good_pairs = _good_pairs_set(ground_truth, min_score=args.min_score)

    # Run Bipartite matcher
    bipartite_results = get_bipartite_matches(users)
    evaluate_algorithm("Bipartite Graph Matcher", bipartite_results, good_pairs, k=args.k)

    # Run Vector matcher (if available)
    if _VECTOR_AVAILABLE:
        vector_results = get_vector_matches(users, min_skill_similarity=args.vec_threshold)
        evaluate_algorithm("Vector Embedding Matcher", vector_results, good_pairs, k=args.k)
    else:
        print("Vector Embedding Matcher skipped due to missing dependencies.")
        print("Install with: pip install sentence-transformers scikit-learn numpy networkx\n")


if __name__ == "__main__":
    main()
