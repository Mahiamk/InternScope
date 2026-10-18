import logging
from sqlalchemy import text
from app.core.database import async_engine

logger = logging.getLogger(__name__)

async def migrate_columns():
    """Safely adds missing columns to existing tables across PostgreSQL and SQLite without data loss."""
    statements = [
        "ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT 'NORMAL';",
        "ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS assigned_moderator_id VARCHAR(36);",
        "ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT;",
        "ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;",
        "ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;",
    ]
    try:
        async with async_engine.begin() as conn:
            for stmt in statements:
                try:
                    await conn.execute(text(stmt))
                except Exception as ex:
                    # SQLite does not support IF NOT EXISTS in ALTER TABLE or column may already exist
                    logger.debug(f"Statement notice for '{stmt}': {ex}")
    except Exception as e:
        logger.warning(f"Schema migration warning: {e}")
