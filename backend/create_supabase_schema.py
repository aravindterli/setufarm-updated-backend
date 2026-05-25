import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.all_models import Base
from app.core.config import settings

async def create_supabase_schema():
    # Load DIRECT connection if available, otherwise fallback to the default ASYNC_DATABASE_URL
    db_url = settings.ASYNC_DIRECT_URL or settings.ASYNC_DATABASE_URL
    
    if not db_url:
        print("Error: No database URL configured in settings.")
        sys.exit(1)
        
    print(f"Connecting to database using URL: {db_url.split('@')[-1]}") # Hide credentials
    
    from uuid import uuid4
    engine = create_async_engine(
        db_url, 
        echo=True, 
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4().hex}__",
        }
    )
    
    try:
        async with engine.begin() as conn:
            print("Successfully connected to Supabase.")
            print("Creating all tables on Supabase if they do not exist...")
            await conn.run_sync(Base.metadata.create_all)
            print("Successfully created/updated all database tables and schema.")
    except Exception as e:
        print(f"Error creating schema: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_supabase_schema())
