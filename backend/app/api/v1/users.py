from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.user import FarmerRegistrationRequest, UserResponse, UserUpdate, BuyerRegistrationRequest, DriverRegistrationRequest
from app.models.all_models import User, FarmerProfile, Order, Payout, Product, ProductPhoto, DriverProfile
from sqlalchemy import func
from datetime import datetime, timedelta


router = APIRouter()

@router.patch("/me", response_model=UserResponse)
async def update_user_me(
    request: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user details"""
    if request.name is not None:
        current_user.name = request.name
    if request.phone is not None:
        current_user.phone = request.phone
    
    await db.commit()
    await db.refresh(current_user)
    
    # Attach profile info for response
    if current_user.role == 'farmer':
        stmt = select(FarmerProfile).where(FarmerProfile.user_id == current_user.id)
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()
        if profile:
            current_user.village = profile.village
            current_user.district = profile.district
            current_user.state = profile.state
            current_user.farm_size_acres = profile.farm_size_acres

    return current_user


@router.get("/farmer/dashboard")
async def get_farmer_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summarized dashboard data for farmer"""
    if current_user.role != 'farmer':
        raise HTTPException(status_code=400, detail="Only farmers can access this dashboard")

    # Weekly Earnings
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    earnings_stmt = select(func.sum(Order.total_amount)).where(
        Order.farmer_id == current_user.id,
        Order.status == 'delivered',
        Order.delivered_at >= seven_days_ago
    )
    earnings_res = await db.execute(earnings_stmt)
    weekly_earnings = earnings_res.scalar() or 0


    # Pending Orders
    pending_stmt = select(func.count(Order.id)).where(
        Order.farmer_id == current_user.id,
        Order.status.in_(['pending', 'confirmed', 'ready_for_pickup'])
    )
    pending_res = await db.execute(pending_stmt)
    pending_orders = pending_res.scalar() or 0

    # Pending Payouts
    payout_stmt = select(func.sum(Payout.amount)).where(
        Payout.recipient_id == current_user.id,
        Payout.status == 'pending'
    )
    payout_res = await db.execute(payout_stmt)
    pending_payout = payout_res.scalar() or 0

    # Recent Orders with details - fetch only one photo per product using a subquery
    photo_subquery = select(ProductPhoto.image_data).where(
        ProductPhoto.product_id == Product.id
    ).limit(1).scalar_subquery()

    recent_stmt = select(Order, Product.crop_name, photo_subquery).join(
        Product, Order.product_id == Product.id
    ).where(
        Order.farmer_id == current_user.id,
        Order.status != "draft"
    ).order_by(Order.created_at.desc()).limit(5)
    recent_res = await db.execute(recent_stmt)
    
    recent_orders = []
    import base64
    for row in recent_res.all():
        order, crop_name, image_data = row
        crop_photo = None
        if image_data:
            crop_photo = f"data:image/jpeg;base64,{base64.b64encode(image_data).decode()}"
            
        recent_orders.append({
            "id": str(order.id),
            "crop_name": crop_name,
            "crop_photo": crop_photo,
            "quantity_kg": float(order.quantity_kg),
            "status": order.status,
            "total_amount": float(order.total_amount),
            "created_at": order.created_at.isoformat()
        })



    return {
        "weekly_earnings": float(weekly_earnings),
        "pending_orders": int(pending_orders),
        "pending_payout": float(pending_payout),
        "recent_orders": recent_orders
    }


@router.get("/driver/dashboard")
async def get_driver_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summarized dashboard data for driver"""
    if current_user.role != 'driver':
        raise HTTPException(status_code=400, detail="Only drivers can access this dashboard")

    # Today's Earnings
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    earnings_stmt = select(func.sum(Order.delivery_charge)).where(
        Order.delivery_earned_by == current_user.id,
        Order.status == 'delivered',
        Order.delivered_at >= today_start
    )
    earnings_res = await db.execute(earnings_stmt)
    today_earnings = earnings_res.scalar() or 0

    # Total Deliveries (Lifetime)
    total_stmt = select(func.count(Order.id)).where(
        Order.delivery_earned_by == current_user.id,
        Order.status == 'delivered'
    )
    total_res = await db.execute(total_stmt)
    total_deliveries = total_res.scalar() or 0

    # Pending Payouts
    payout_stmt = select(func.sum(Payout.amount)).where(
        Payout.recipient_id == current_user.id,
        Payout.status == 'pending'
    )
    payout_res = await db.execute(payout_stmt)
    pending_payout = payout_res.scalar() or 0

    # Available Deliveries (Ready for pickup) - NO LONGER USED in manual booking, but keeping for compatibility
    from app.services.order_service import OrderService
    service = OrderService(db)
    available = await service.get_available_deliveries()

    # Incoming Requests (Specifically requested by farmers)
    from app.models.all_models import DriverRequest
    request_stmt = select(Order, Product.crop_name, User.name.label('farmer_name')).join(
        Product, Order.product_id == Product.id
    ).join(
        User, Order.farmer_id == User.id
    ).join(
        DriverRequest, Order.id == DriverRequest.order_id
    ).where(
        DriverRequest.driver_id == current_user.id,
        DriverRequest.status == 'requested'
    )
    request_res = await db.execute(request_stmt)
    
    incoming_requests = []
    for row in request_res.all():
        order, crop_name, farmer_name = row
        incoming_requests.append({
            "id": str(order.id),
            "crop_name": crop_name,
            "farmer_name": farmer_name,
            "quantity_kg": float(order.quantity_kg),
            "delivery_charge": float(order.delivery_charge),
            "created_at": order.created_at.isoformat()
        })

    # My Active Deliveries (Accepted & Ready for Pickup, or In Transit)
    active_stmt = select(Order, Product.crop_name).join(Product, Order.product_id == Product.id).where(
        Order.assigned_driver_id == current_user.id,
        Order.status.in_(['ready_for_pickup', 'in_transit'])
    )
    active_res = await db.execute(active_stmt)
    
    my_active = []
    for row in active_res.all():
        order, crop_name = row
        my_active.append({
            "id": str(order.id),
            "crop_name": crop_name,
            "status": order.status,
            "delivery_charge": float(order.delivery_charge),
            "created_at": order.created_at.isoformat()
        })

    return {
        "today_earnings": float(today_earnings),
        "total_deliveries": int(total_deliveries),
        "pending_payout": float(pending_payout),
        "incoming_requests": incoming_requests,
        "available_orders": [
            {
                "id": str(o.id),
                "crop_name": o.crop_name,
                "delivery_charge": float(o.delivery_charge),
                "distance_km": 5.5 # Mock distance
            } for o in available
        ],
        "my_active_orders": my_active
    }


@router.post("/register/farmer", response_model=UserResponse)

async def register_farmer(
    request: FarmerRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register farmer details after OTP verification"""
    
    if current_user.role != 'farmer':
        raise HTTPException(status_code=400, detail="User is not a farmer")

    # Update User model
    current_user.name = request.name
    current_user.phone = request.phone
    current_user.language = request.language
    current_user.aadhar_number = request.aadhar_number
    
    # Update FarmerProfile
    stmt = select(FarmerProfile).where(FarmerProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.village = request.village
    profile.district = request.district
    profile.state = request.state
    profile.farm_size_acres = request.farm_size_acres
    
    await db.commit()
    await db.refresh(current_user)
    
    # Attach profile info for response
    current_user.village = profile.village
    current_user.district = profile.district
    current_user.state = profile.state
    current_user.farm_size_acres = profile.farm_size_acres
    
    return current_user


@router.post("/register/buyer", response_model=UserResponse)
async def register_buyer(
    request: BuyerRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register buyer details after OTP verification"""
    
    if current_user.role != 'buyer':
        raise HTTPException(status_code=400, detail="User is not a buyer")

    # Update User model
    current_user.name = request.name
    current_user.phone = request.phone
    current_user.language = request.language
    
    from app.models.all_models import BuyerProfile
    # Update BuyerProfile
    stmt = select(BuyerProfile).where(BuyerProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = BuyerProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.village = request.village
    profile.district = request.district
    profile.state = request.state
    
    await db.commit()
    await db.refresh(current_user)
    
    # Attach profile info for response
    current_user.village = profile.village
    current_user.district = profile.district
    current_user.state = profile.state
    
    return current_user


@router.post("/register/driver", response_model=UserResponse)
async def register_driver(
    request: DriverRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register driver details after OTP verification"""
    
    if current_user.role != 'driver':
        raise HTTPException(status_code=400, detail="User is not a driver")

    # Update User model
    current_user.name = request.name
    current_user.phone = request.phone
    current_user.language = request.language
    current_user.aadhar_number = request.aadhar_number
    
    # Update DriverProfile
    stmt = select(DriverProfile).where(DriverProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    
    if not profile:
        profile = DriverProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.vehicle_type = request.vehicle_type
    profile.vehicle_number = request.vehicle_number
    profile.license_number = request.license_number
    profile.upi_id = request.upi_id
    
    await db.commit()
    await db.refresh(current_user)
    
    # Attach profile info for response
    current_user.vehicle_type = profile.vehicle_type
    current_user.vehicle_number = profile.vehicle_number
    current_user.license_number = profile.license_number
    current_user.aadhar_number = current_user.aadhar_number
    
    return current_user


@router.get("/me", response_model=UserResponse)

async def read_user_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user details with profile info"""
    if current_user.role == 'farmer':
        stmt = select(FarmerProfile).where(FarmerProfile.user_id == current_user.id)
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()
        if profile:
            current_user.village = profile.village
            current_user.district = profile.district
            current_user.state = profile.state
            current_user.farm_size_acres = profile.farm_size_acres
            current_user.lat = float(profile.lat) if profile.lat else None
            current_user.lng = float(profile.lng) if profile.lng else None
            
    elif current_user.role == 'buyer':
        from app.models.all_models import BuyerProfile
        stmt = select(BuyerProfile).where(BuyerProfile.user_id == current_user.id)
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()
        if profile:
            current_user.village = profile.village
            current_user.district = profile.district
            current_user.state = profile.state
            current_user.lat = float(profile.lat) if profile.lat else None
            current_user.lng = float(profile.lng) if profile.lng else None

    elif current_user.role == 'driver':
        stmt = select(DriverProfile).where(DriverProfile.user_id == current_user.id)
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()
        if profile:
            current_user.vehicle_type = profile.vehicle_type
            current_user.vehicle_number = profile.vehicle_number
            current_user.license_number = profile.license_number
            current_user.lat = float(profile.lat) if profile.lat else None
            current_user.lng = float(profile.lng) if profile.lng else None

    return current_user


@router.get("/drivers/nearby")
async def get_nearby_drivers(
    lat: float = None,
    lng: float = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List online drivers nearby for farmer to book"""
    if current_user.role != 'farmer':
        raise HTTPException(status_code=400, detail="Only farmers can browse drivers")

    # Fetch all available drivers
    stmt = select(User, DriverProfile).join(DriverProfile, User.id == DriverProfile.user_id).where(
        User.role == 'driver',
        DriverProfile.is_available == True
    )
    result = await db.execute(stmt)
    
    drivers = []
    for row in result.all():
        u, p = row
        drivers.append({
            "id": str(u.id),
            "name": u.name,
            "phone": u.phone,
            "vehicle_type": p.vehicle_type,
            "vehicle_number": p.vehicle_number,
            "rating": float(p.rating),
            "distance_km": 2.4, # Mock distance
            "lat": float(p.lat) if p.lat else None,
            "lng": float(p.lng) if p.lng else None
        })
        
    return drivers

@router.post("/driver/request/{order_id}/{driver_id}")
async def request_driver(
    order_id: str,
    driver_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Farmer requests a specific driver for an order"""
    if current_user.role != 'farmer':
        raise HTTPException(status_code=400, detail="Only farmers can request drivers")
    
    from app.models.all_models import Order, DriverRequest
    
    # Check if request already exists
    check_stmt = select(DriverRequest).where(
        DriverRequest.order_id == order_id,
        DriverRequest.driver_id == driver_id,
        DriverRequest.status == 'requested'
    )
    existing = await db.execute(check_stmt)
    if existing.scalar_one_or_none():
        return {"status": "error", "message": "Request already sent to this driver"}

    new_request = DriverRequest(
        order_id=order_id,
        driver_id=driver_id,
        status='requested'
    )
    db.add(new_request)
    await db.commit()
    return {"status": "success", "message": "Driver requested"}

@router.post("/driver/respond/{order_id}")
async def respond_to_driver_request(
    order_id: str,
    accept: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Driver accepts or rejects a farmer's request"""
    if current_user.role != 'driver':
        raise HTTPException(status_code=400, detail="Only drivers can respond to requests")
    
    from app.models.all_models import Order, DriverRequest
    
    # Find the specific request for this driver and order
    req_stmt = select(DriverRequest).where(
        DriverRequest.order_id == order_id,
        DriverRequest.driver_id == current_user.id,
        DriverRequest.status == 'requested'
    )
    req_res = await db.execute(req_stmt)
    request = req_res.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Active request not found")

    if accept:
        # Check if order is still available
        order = await db.get(Order, order_id)
        if order.status != 'ready_for_pickup' or order.assigned_driver_id is not None:
             request.status = 'cancelled' # Someone else might have accepted
             await db.commit()
             raise HTTPException(status_code=400, detail="Order is no longer available")

        import random
        otp = str(random.randint(100000, 999999))
        
        request.status = 'accepted'
        order.assigned_driver_id = current_user.id
        order.pickup_otp = otp
        # We don't move to in_transit yet; wait for OTP verification at pickup
        
        # Cancel all other requests for this order
        cancel_stmt = update(DriverRequest).where(
            DriverRequest.order_id == order_id,
            DriverRequest.id != request.id,
            DriverRequest.status == 'requested'
        ).values(status='cancelled')
        await db.execute(cancel_stmt)
    else:
        request.status = 'rejected'
        
    await db.commit()
    return {"status": "success", "message": "Response recorded"}

@router.post("/driver/verify-pickup/{order_id}")
async def verify_driver_pickup(
    order_id: str,
    otp: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Driver enters OTP from farmer to start the trip"""
    if current_user.role != 'driver':
        raise HTTPException(status_code=400, detail="Only drivers can verify pickup")
        
    from app.models.all_models import Order
    order = await db.get(Order, order_id)
    if not order or str(order.assigned_driver_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Order not assigned to you")
        
    if order.pickup_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    order.status = 'in_transit'
    order.delivery_earned_by = current_user.id
    await db.commit()
    
    return {"status": "success", "message": "Pickup verified! Trip started."}



