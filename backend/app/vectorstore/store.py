import numpy as np
from typing import List, Dict, Any, Optional
from pymongo.database import Database
from app.models.mongo_models import CodeChunk


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


class VectorStore:
    """
    Unified Vector Store backed by MongoDB.
    Embeddings are stored as float lists in the code_chunks collection.
    Compression of chunk_content is handled transparently by mongo_models.CodeChunk.
    """

    def __init__(self, db: Database):
        self.db = db

    def search_similar_chunks(
        self,
        repository_id: str,
        query_embedding: List[float],
        query_text: str = "",
        top_k: int = 8,
        language: Optional[str] = None,
        path_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Hybrid vector search + lexical keyword boosting.
        Returns top ranked code chunks with similarity scores.
        Chunk content is returned decompressed.
        """
        mongo_filter: Dict[str, Any] = {"repository_id": repository_id}
        if language:
            mongo_filter["language"] = {"$regex": language, "$options": "i"}
        if path_filter:
            mongo_filter["file_path"] = {"$regex": path_filter, "$options": "i"}

        chunks = list(self.db[CodeChunk.COLLECTION].find(mongo_filter))
        if not chunks:
            return []

        query_tokens = set(
            query_text.lower()
            .replace("/", " ")
            .replace("_", " ")
            .replace(".", " ")
            .split()
        )
        scored_chunks = []

        for chunk in chunks:
            # Decompress content for scoring
            chunk_content = CodeChunk.get_chunk_content(chunk)

            # 1. Cosine similarity score
            vec_score = 0.0
            emb = chunk.get("embedding_json")
            if emb and isinstance(emb, list):
                vec_score = cosine_similarity(query_embedding, emb)

            # 2. Lexical keyword boost
            chunk_text = (
                (chunk.get("file_path") or "")
                + " "
                + (chunk.get("symbol_name") or "")
                + " "
                + chunk_content
            ).lower()

            matches = sum(1 for tok in query_tokens if tok in chunk_text)
            lexical_boost = min(0.35, (matches / max(1, len(query_tokens))) * 0.35)

            # Exact symbol name match boost
            symbol_boost = 0.0
            if chunk.get("symbol_name") and chunk["symbol_name"].lower() in query_text.lower():
                symbol_boost = 0.25

            # File path match boost
            path_boost = 0.0
            if any(
                part in query_text.lower()
                for part in (chunk.get("file_path") or "").lower().split("/")
            ):
                path_boost = 0.15

            total_score = float(vec_score * 0.6 + lexical_boost + symbol_boost + path_boost)

            scored_chunks.append({
                "chunk_id": chunk["_id"],
                "file_id": chunk.get("file_id"),
                "file_path": chunk.get("file_path"),
                "language": chunk.get("language"),
                "symbol_name": chunk.get("symbol_name"),
                "symbol_type": chunk.get("symbol_type"),
                "start_line": chunk.get("start_line"),
                "end_line": chunk.get("end_line"),
                "chunk_content": chunk_content,
                "score": round(min(1.0, max(0.0, total_score)), 4),
            })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]
