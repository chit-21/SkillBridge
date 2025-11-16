from __future__ import annotations
import os
import re
from pathlib import Path
from typing import List, Dict

from flask import Flask, request, jsonify

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

import firebase_admin
from firebase_admin import credentials, firestore

# -----------------------------
# Firebase Init
# -----------------------------
cred_path = Path(__file__).resolve().parent / "serviceAccount.json"
cred = credentials.Certificate(str(cred_path))
firebase_admin.initialize_app(cred)
db = firestore.client()

# -----------------------------
# Model
# -----------------------------
MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

USERS_COLLECTION = "users"


# -----------------------------
# Utility
# -----------------------------
def encode_list(skills: List[str]):
    if not skills:
        return np.zeros((0, model.get_sentence_embedding_dimension()))
    return model.encode(skills, convert_to_numpy=True, normalize_embeddings=True)


def encode_single(text: str):
    return model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]


def timezone_score(tz1, tz2):
    # Optional: same as before
    return 0


# -----------------------------
# Load users
# -----------------------------
def load_users() -> List[Dict]:
    docs = db.collection(USERS_COLLECTION).stream()
    users = []

    for doc in docs:
        d = doc.to_dict()
        users.append({
            "id": doc.id,
            "teachingSkills": d.get("teachingSkills", []),
            "learningSkills": d.get("learningSkills", []),
            "timezone": d.get("timezone", "UTC"),
        })
    return users


# -----------------------------
# Matching Logic (Skill Search)
# -----------------------------
def search_skill(query: str, mode: str, users: List[Dict]):
    """
    mode = "learn" → user wants to learn; find TEACHERS
    mode = "teach" → user wants to teach; find STUDENTS
    """

    query_vec = encode_single(query)
    results = []

    for u in users:
        if mode == "learn":
            target_skills = u.get("teachingSkills", [])
        elif mode == "teach":
            target_skills = u.get("learningSkills", [])
        else:
            continue

        skill_vecs = encode_list(target_skills)

        if skill_vecs.size == 0:
            continue

        # Compare query to all of user's skills
        sims = cosine_similarity([query_vec], skill_vecs)[0]
        max_sim = float(np.max(sims))

        if max_sim < 0.45:  # threshold
            continue

        results.append({
            "userId": u["id"],
            "score": max_sim * 100
        })

    # Sort descending by score
    results.sort(key=lambda x: -x["score"])
    return results[:20]


# -----------------------------
# Flask App
# -----------------------------
app = Flask(__name__)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/compute-match", methods=["POST"])
def compute_match():
    data = request.get_json(silent=True) or {}
    query = data.get("query")
    mode = data.get("mode")  # "learn" or "teach"

    if not query:
        return jsonify({"error": "query is required"}), 400

    if mode not in ("learn", "teach"):
        return jsonify({"error": "mode must be 'learn' or 'teach'"}), 400

    users = load_users()
    matches = search_skill(query, mode, users)

    return jsonify(matches), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
