import pytest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.auth.security import get_password_hash, verify_password, create_access_token, decode_token
from app.ingestion.secret_filter import redact_secrets, is_sensitive_file
from app.ingestion.chunker import chunk_code_file
from app.vectorstore.store import cosine_similarity
from app.embeddings.service import embedding_service
from app.ingestion.pipeline import extract_architecture_overview

def test_password_hashing():
    pwd = "SuperSecretPassword123!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_flow():
    user_id = "user-12345"
    org_id = "org-67890"
    token = create_access_token(subject=user_id, org_id=org_id)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["org_id"] == org_id

def test_secret_filtering():
    sensitive_code = 'API_KEY = "sk-1234567890abcdef1234567890abcdef"\ngithub_pat = "ghp_1234567890abcdef1234567890abcdef1234"\nprint("hello")'
    redacted = redact_secrets(sensitive_code)
    assert "sk-12345" not in redacted
    assert "ghp_12345" not in redacted
    assert "[REDACTED_SECRET]" in redacted
    assert 'print("hello")' in redacted

def test_sensitive_file_detection():
    assert is_sensitive_file(".env") is True
    assert is_sensitive_file("config/.env.local") is True
    assert is_sensitive_file("keys/id_rsa") is True
    assert is_sensitive_file("src/main.py") is False

def test_code_chunker_symbol_extraction():
    sample_python = '''import os

class AuthService:
    def __init__(self):
        self.secret = "key"

    def login_user(self, email: str, password: str):
        return {"status": "authenticated", "email": email}

def health_check():
    return {"status": "ok"}
'''
    chunks = chunk_code_file("auth/service.py", sample_python, "Python")
    assert len(chunks) >= 1
    chunk = chunks[0]
    assert chunk["file_path"] == "auth/service.py"
    assert chunk["start_line"] == 1
    assert chunk["end_line"] > 5
    assert chunk["symbol_name"] in ["AuthService", "login_user", "health_check", None]

def test_cosine_similarity():
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]
    assert pytest.approx(cosine_similarity(v1, v2), 0.001) == 1.0
    assert pytest.approx(cosine_similarity(v1, v3), 0.001) == 0.0

@pytest.mark.asyncio
async def test_deterministic_embedding_generation():
    text1 = "How does user authentication and JWT validation work?"
    text2 = "How does user authentication and JWT validation work?"
    text3 = "Database connection pool and redis caching"

    emb1 = await embedding_service.get_embedding(text1)
    emb2 = await embedding_service.get_embedding(text2)
    emb3 = await embedding_service.get_embedding(text3)

    assert len(emb1) == embedding_service.dimension
    assert emb1 == emb2  # Deterministic
    sim_same = cosine_similarity(emb1, emb2)
    sim_diff = cosine_similarity(emb1, emb3)
    assert sim_same > sim_diff

def test_architecture_extractor():
    sample_files = [
        {
            "relative_path": "app/main.py",
            "language": "Python",
            "raw_content": '@app.get("/health")\n@app.post("/login")\nimport stripe\nimport redis'
        },
        {
            "relative_path": "app/models/user.py",
            "language": "Python",
            "raw_content": 'class User(Base):\n    pass\nclass Organization(Base):\n    pass'
        }
    ]
    overview = extract_architecture_overview("TestRepo", sample_files)
    assert "primary_language" in overview
    assert len(overview["api_endpoints"]) >= 2
    assert any("Redis" in s for s in overview["external_services"])
    assert "diagram" in overview
