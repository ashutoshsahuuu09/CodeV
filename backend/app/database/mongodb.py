"""
MongoDB Database Layer — Codev
==============================
Uses Motor (async) + PyMongo (sync fallback).
WiredTiger snappy compression is configured at the collection level via
``storageEngine`` options when each collection is (re-)created.

All collections are created with:
    - WiredTiger block-compression: snappy  (CPU-light, high throughput)
    - Proper indexes for tenant isolation, lookups and sort queries
"""

import logging
from typing import AsyncGenerator, Generator, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient, ASCENDING, DESCENDING, IndexModel
from pymongo.errors import CollectionInvalid

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# WiredTiger snappy compression options applied to every collection
# ---------------------------------------------------------------------------
_SNAPPY_STORAGE = {
    "storageEngine": {
        "wiredTiger": {
            "configString": "block_compressor=snappy"
        }
    }
}

# ---------------------------------------------------------------------------
# Collection definitions: (name, indexes)
# Each index entry is a list of (key, direction) tuples + optional options dict
# ---------------------------------------------------------------------------
COLLECTION_SCHEMAS = {
    "organizations": [
        IndexModel([("slug", ASCENDING)], unique=True, name="idx_org_slug"),
        IndexModel([("created_at", DESCENDING)], name="idx_org_created"),
    ],
    "users": [
        IndexModel([("email", ASCENDING)], unique=True, name="idx_user_email"),
        IndexModel([("is_active", ASCENDING)], name="idx_user_active"),
    ],
    "organization_members": [
        IndexModel([("organization_id", ASCENDING), ("user_id", ASCENDING)], unique=True, name="idx_member_org_user"),
        IndexModel([("user_id", ASCENDING)], name="idx_member_user"),
        IndexModel([("organization_id", ASCENDING)], name="idx_member_org"),
    ],
    "github_connections": [
        IndexModel([("user_id", ASCENDING)], name="idx_ghconn_user"),
    ],
    "repositories": [
        IndexModel([("organization_id", ASCENDING)], name="idx_repo_org"),
        IndexModel([("full_name", ASCENDING)], name="idx_repo_fullname"),
        IndexModel([("indexing_status", ASCENDING)], name="idx_repo_status"),
        IndexModel([("organization_id", ASCENDING), ("created_at", DESCENDING)], name="idx_repo_org_created"),
    ],
    "repository_files": [
        IndexModel([("repository_id", ASCENDING)], name="idx_file_repo"),
        IndexModel([("repository_id", ASCENDING), ("file_path", ASCENDING)], unique=True, name="idx_file_repo_path"),
    ],
    "code_chunks": [
        IndexModel([("repository_id", ASCENDING)], name="idx_chunk_repo"),
        IndexModel([("repository_id", ASCENDING), ("file_path", ASCENDING)], name="idx_chunk_repo_path"),
        IndexModel([("file_id", ASCENDING)], name="idx_chunk_file"),
        IndexModel([("symbol_name", ASCENDING)], name="idx_chunk_symbol"),
    ],
    "conversations": [
        IndexModel([("organization_id", ASCENDING)], name="idx_conv_org"),
        IndexModel([("repository_id", ASCENDING)], name="idx_conv_repo"),
        IndexModel([("user_id", ASCENDING)], name="idx_conv_user"),
        IndexModel([("organization_id", ASCENDING), ("updated_at", DESCENDING)], name="idx_conv_org_updated"),
    ],
    "messages": [
        IndexModel([("conversation_id", ASCENDING), ("created_at", ASCENDING)], name="idx_msg_conv_created"),
    ],
    "generated_documents": [
        IndexModel([("organization_id", ASCENDING)], name="idx_doc_org"),
        IndexModel([("repository_id", ASCENDING), ("doc_type", ASCENDING)], name="idx_doc_repo_type"),
    ],
    "indexing_jobs": [
        IndexModel([("repository_id", ASCENDING)], name="idx_job_repo"),
        IndexModel([("repository_id", ASCENDING), ("started_at", DESCENDING)], name="idx_job_repo_started"),
        IndexModel([("status", ASCENDING)], name="idx_job_status"),
    ],
    "usage_events": [
        IndexModel([("organization_id", ASCENDING)], name="idx_usage_org"),
        IndexModel([("organization_id", ASCENDING), ("event_type", ASCENDING)], name="idx_usage_org_type"),
        IndexModel([("organization_id", ASCENDING), ("created_at", DESCENDING)], name="idx_usage_org_created"),
    ],
}


# ---------------------------------------------------------------------------
# Singleton clients
# ---------------------------------------------------------------------------
_async_client: Optional[AsyncIOMotorClient] = None
_sync_client: Optional[MongoClient] = None


def _get_sync_client() -> MongoClient:
    global _sync_client
    if _sync_client is None:
        _sync_client = MongoClient(settings.MONGODB_URL)
    return _sync_client


def _get_async_client() -> AsyncIOMotorClient:
    global _async_client
    if _async_client is None:
        _async_client = AsyncIOMotorClient(settings.MONGODB_URL)
    return _async_client


def get_sync_db() -> MongoClient:
    """Return sync PyMongo database handle."""
    return _get_sync_client()[settings.MONGODB_DB_NAME]


async def get_async_db() -> AsyncIOMotorDatabase:
    """Return async Motor database handle."""
    return _get_async_client()[settings.MONGODB_DB_NAME]


# ---------------------------------------------------------------------------
# FastAPI dependency injectors
# ---------------------------------------------------------------------------
def get_db() -> Generator:
    """
    Sync MongoDB database dependency for FastAPI routes.
    Yields a PyMongo database object.
    """
    db = get_sync_db()
    try:
        yield db
    finally:
        pass  # PyMongo connections are pooled; no per-request teardown needed


async def get_async_db_dep() -> AsyncGenerator:
    """Async Motor database dependency for async routes."""
    db = await get_async_db()
    try:
        yield db
    finally:
        pass


# ---------------------------------------------------------------------------
# Collection bootstrap — snappy compression + indexes
# ---------------------------------------------------------------------------
def initialize_collections() -> None:
    """
    Create all MongoDB collections with WiredTiger snappy compression and
    ensure all indexes exist. Safe to call on every startup (idempotent).
    """
    client = _get_sync_client()
    db = client[settings.MONGODB_DB_NAME]
    existing = db.list_collection_names()

    for col_name, indexes in COLLECTION_SCHEMAS.items():
        if col_name not in existing:
            try:
                db.create_collection(col_name, **_SNAPPY_STORAGE)
                logger.info("Created collection '%s' with snappy compression.", col_name)
            except CollectionInvalid:
                pass  # Already exists (race condition)

        # Ensure indexes (create_indexes is idempotent for existing indexes)
        if indexes:
            db[col_name].create_indexes(indexes)

    logger.info(
        "MongoDB collections initialized with WiredTiger snappy compression. "
        "Database: '%s'",
        settings.MONGODB_DB_NAME,
    )


def close_connections() -> None:
    """Close MongoDB client connections gracefully."""
    global _async_client, _sync_client
    if _async_client:
        _async_client.close()
        _async_client = None
    if _sync_client:
        _sync_client.close()
        _sync_client = None
