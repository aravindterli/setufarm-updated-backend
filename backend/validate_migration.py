import sys
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.all_models import (
    User, FarmerProfile, BuyerProfile, DriverProfile, Product, ProductPhoto,
    Order, BuyerAddress, DriverRequest, Payment, Payout, Rating, OTPVerification,
    MarketPrice, CallSession
)

MODELS = [
    User, FarmerProfile, BuyerProfile, DriverProfile, BuyerAddress,
    Product, ProductPhoto, Order, DriverRequest, Payment,
    Payout, Rating, OTPVerification, MarketPrice, CallSession
]

def validate_migration():
    local_url = settings.LOCAL_DATABASE_URL
    supabase_url = settings.DIRECT_URL or settings.DATABASE_URL
    
    if not local_url or not supabase_url:
        print("Error: Database URLs not configured in .env")
        sys.exit(1)
        
    local_engine = create_engine(local_url)
    supabase_engine = create_engine(supabase_url)
    
    LocalSession = sessionmaker(bind=local_engine)
    SupabaseSession = sessionmaker(bind=supabase_engine)
    
    local_session = LocalSession()
    supabase_session = SupabaseSession()
    
    print("\n=======================================================")
    print("             DATABASE MIGRATION VALIDATION             ")
    print("=======================================================")
    print(f"{'Table Name':<25} | {'Local Count':<12} | {'Supabase Count':<14} | {'Status':<10}")
    print("-" * 72)
    
    all_match = True
    for Model in MODELS:
        table_name = Model.__tablename__
        
        try:
            local_count = local_session.query(func.count(Model.id)).scalar()
        except Exception:
            local_count = "Error"
            
        try:
            supabase_count = supabase_session.query(func.count(Model.id)).scalar()
        except Exception:
            supabase_count = "Error"
            
        status = "MATCH"
        if local_count == "Error" or supabase_count == "Error":
            status = "ERROR"
            all_match = False
        elif local_count != supabase_count:
            status = "MISMATCH"
            all_match = False
            
        print(f"{table_name:<25} | {str(local_count):<12} | {str(supabase_count):<14} | {status:<10}")
        
    print("=======================================================")
    if all_match:
        print(" SUCCESS: All table row counts match exactly!")
    else:
        print(" WARNING: Mismatches or errors detected in validation.")
    print("=======================================================\n")
    
    local_session.close()
    supabase_session.close()

if __name__ == "__main__":
    validate_migration()
