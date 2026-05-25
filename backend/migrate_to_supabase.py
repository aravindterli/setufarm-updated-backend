import sys
import time
from sqlalchemy import create_engine, insert, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.all_models import (
    User, FarmerProfile, BuyerProfile, DriverProfile, Product, ProductPhoto,
    Order, BuyerAddress, DriverRequest, Payment, Payout, Rating, OTPVerification,
    MarketPrice, CallSession
)

# Ordered list of models for forward insertion (dependencies first)
MODELS_IN_ORDER = [
    User,
    FarmerProfile,
    BuyerProfile,
    DriverProfile,
    BuyerAddress,
    Product,
    ProductPhoto,
    Order,
    DriverRequest,
    Payment,
    Payout,
    Rating,
    OTPVerification,
    MarketPrice,
    CallSession
]

def model_to_dict(obj):
    """Converts a SQLAlchemy model instance into a dictionary of column names and values."""
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

def migrate_data():
    local_url = settings.LOCAL_DATABASE_URL
    supabase_url = settings.DIRECT_URL or settings.DATABASE_URL
    
    if not local_url:
        print("Error: LOCAL_DATABASE_URL is not set in .env")
        sys.exit(1)
        
    if not supabase_url:
        print("Error: DIRECT_URL or DATABASE_URL is not set in .env")
        sys.exit(1)
        
    print(f"--- DATABASE MIGRATION SCRIPT ---")
    print(f"Source (Local DB):     {local_url.split('@')[-1]}")
    print(f"Destination (Supabase): {supabase_url.split('@')[-1]}")
    print(f"---------------------------------\n")
    
    # Initialize engines & sessions
    local_engine = create_engine(local_url)
    supabase_engine = create_engine(supabase_url)
    
    LocalSession = sessionmaker(bind=local_engine)
    SupabaseSession = sessionmaker(bind=supabase_engine)
    
    local_session = LocalSession()
    supabase_session = SupabaseSession()
    
    # 1. Truncate destination tables in reverse order to clean up
    print("Step 1: Cleaning up existing destination data in reverse dependency order...")
    for Model in reversed(MODELS_IN_ORDER):
        table_name = Model.__tablename__
        print(f"  Truncating table: {table_name}...")
        try:
            supabase_session.execute(text(f"TRUNCATE TABLE {table_name} CASCADE;"))
            supabase_session.commit()
        except Exception as e:
            supabase_session.rollback()
            print(f"  Warning: Could not truncate {table_name}: {e}. Continuing anyway...")
            
    print("Cleanup step complete.\n")
    
    # 2. Migrate tables in forward order
    print("Step 2: Migrating data in forward dependency order...")
    total_migrated = 0
    start_time = time.time()
    
    for Model in MODELS_IN_ORDER:
        table_name = Model.__tablename__
        print(f"  Migrating {table_name}...")
        
        try:
            # Retrieve all records from local database
            local_records = local_session.query(Model).all()
            record_count = len(local_records)
            
            if record_count == 0:
                print(f"    No records found in local {table_name}. Skipping.")
                continue
                
            # Convert records to dictionary format
            records_data = [model_to_dict(rec) for rec in local_records]
            
            # Bulk insert into Supabase
            supabase_session.execute(insert(Model), records_data)
            supabase_session.commit()
            
            print(f"    Successfully migrated {record_count} records to Supabase {table_name}.")
            total_migrated += record_count
            
        except Exception as e:
            supabase_session.rollback()
            print(f"    ERROR migrating {table_name}: {e}", file=sys.stderr)
            print("    Rolling back and aborting migration.", file=sys.stderr)
            local_session.close()
            supabase_session.close()
            sys.exit(1)
            
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"\nMigration completed successfully!")
    print(f"Total tables migrated: {len(MODELS_IN_ORDER)}")
    print(f"Total rows migrated:   {total_migrated}")
    print(f"Duration:              {duration:.2f} seconds")
    
    local_session.close()
    supabase_session.close()

if __name__ == "__main__":
    migrate_data()
