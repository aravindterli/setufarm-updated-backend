import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy import select, update, desc, func
from app.models.all_models import Order, Product, FarmerProfile, DriverProfile

def haversine_distance(lat1, lon1, lat2, lon2):
    # Simulating distance for now
    return 5.5

def calculate_delivery_charge(distance_km, vehicle="auto"):
    # Base rate ₹20 + ₹10 per km
    return 20 + (distance_km * 10)

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, order_data, buyer_id: str):
        product = await self.db.get(Product, order_data.product_id)
        if not product:
            raise Exception("Product not found")

        subtotal = float(product.price_per_kg) * float(order_data.quantity_kg)
        commission = subtotal * 0.05 # 5% commission

        delivery_address_text = order_data.delivery_address_text
        delivery_lat = product.lat
        delivery_lng = product.lng

        if order_data.address_id:
            from app.models.all_models import BuyerAddress
            stmt = select(BuyerAddress).where(BuyerAddress.id == order_data.address_id)
            res = await self.db.execute(stmt)
            addr = res.scalar_one_or_none()
            if addr:
                delivery_address_text = f"{addr.address_line}, {addr.village}, {addr.district}, {addr.state} - {addr.pincode}"
                delivery_lat = addr.lat
                delivery_lng = addr.lng

        # Calculations
        gst_rate = 0.05 # 5% GST
        service_rate = 0.02 # 2% Service Fee
        
        gst_amount = float(subtotal) * gst_rate
        service_fee = float(subtotal) * service_rate
        platform_commission = float(subtotal) * 0.10 # 10% Platform Commission (from farmer)
        
        total_amount = float(subtotal) + gst_amount + service_fee

        new_order = Order(
            id=uuid.uuid4(),
            buyer_id=buyer_id,
            farmer_id=product.farmer_id,
            product_id=product.id,
            quantity_kg=order_data.quantity_kg,
            price_per_kg=product.price_per_kg,
            subtotal=subtotal,
            gst_amount=gst_amount,
            service_fee=service_fee,
            platform_commission=platform_commission,
            total_amount=total_amount,
            status="draft",
            payment_status="pending",
            delivery_address_text=delivery_address_text,
            delivery_lat=delivery_lat,
            delivery_lng=delivery_lng
        )
        self.db.add(new_order)
        await self.db.commit()
        await self.db.refresh(new_order)
        return new_order

    async def get_order(self, order_id: str, user_id: str = None):
        stmt = select(Order, Product.crop_name).join(Product, Order.product_id == Product.id).where(Order.id == order_id)
        res = await self.db.execute(stmt)
        row = res.first()
        if not row:
            raise Exception("Order not found")
        order, crop_name = row
        order.crop_name = crop_name
        order.delivery_address = order.delivery_address_text
        
        # Fetch requests
        from app.models.all_models import DriverRequest, User
        req_stmt = select(DriverRequest, User.name).join(User, DriverRequest.driver_id == User.id).where(
            DriverRequest.order_id == order_id
        )
        req_res = await self.db.execute(req_stmt)
        order.requests = []
        for r_row in req_res.all():
            req, driver_name = r_row
            order.requests.append({
                "driver_id": str(req.driver_id),
                "driver_name": driver_name,
                "status": req.status
            })
            
        # Fetch buyer details
        buyer_stmt = select(User).where(User.id == order.buyer_id)
        buyer_res = await self.db.execute(buyer_stmt)
        buyer = buyer_res.scalar_one_or_none()
        if buyer:
            order.buyer_name = buyer.name
            order.buyer_phone = buyer.phone
            order.buyer = {
                "id": str(buyer.id),
                "name": buyer.name,
                "phone": buyer.phone,
                "profile_photo": buyer.profile_photo
            }

        # Fetch driver details if assigned
        if order.assigned_driver_id:
            driver_stmt = select(User, DriverProfile).outerjoin(DriverProfile, User.id == DriverProfile.user_id).where(User.id == order.assigned_driver_id)
            driver_res = await self.db.execute(driver_stmt)
            driver_row = driver_res.first()
            if driver_row:
                driver, driver_profile = driver_row
                order.driver_name = driver.name
                order.assigned_driver = {
                    "id": str(driver.id),
                    "name": driver.name,
                    "phone": driver.phone,
                    "profile_photo": driver.profile_photo,
                    "vehicle_type": driver_profile.vehicle_type if driver_profile else None,
                    "vehicle_number": driver_profile.vehicle_number if driver_profile else None
                }
            
        # Fetch farmer details
        farmer_stmt = select(User, FarmerProfile).join(FarmerProfile, User.id == FarmerProfile.user_id).where(User.id == order.farmer_id)
        farmer_res = await self.db.execute(farmer_stmt)
        farmer_row = farmer_res.first()
        if farmer_row:
            farmer_user, farmer_profile = farmer_row
            order.farmer = {
                "id": str(farmer_user.id),
                "name": farmer_user.name,
                "phone": farmer_user.phone,
                "village": farmer_profile.village,
                "district": farmer_profile.district,
                "rating": float(farmer_profile.rating) if farmer_profile.rating else 0.0
            }

        # Security: Only farmer should see pickup_otp
        if user_id and str(order.farmer_id) != str(user_id):
            order.pickup_otp = None
            
        return order

    async def get_my_orders(self, user_id: str, role: str):
        print(f"Fetching orders for user: {user_id}, role: {role}")
        from app.models.all_models import User
        if role == 'farmer':
            stmt = select(Order, Product.crop_name, User.name, User.phone).join(Product, Order.product_id == Product.id).outerjoin(User, Order.buyer_id == User.id).where(
                Order.farmer_id == user_id,
                Order.status != "draft"  # Hide drafts from farmer
            ).order_by(desc(Order.created_at))
        else:
            stmt = select(Order, Product.crop_name, User.name, User.phone).join(Product, Order.product_id == Product.id).outerjoin(User, Order.buyer_id == User.id).where(
                Order.buyer_id == user_id
            ).order_by(desc(Order.created_at))
            
        res = await self.db.execute(stmt)
        all_rows = res.all()
        print(f"Found {len(all_rows)} orders")
        orders = []
        for row in all_rows:
            order, crop_name, buyer_name, buyer_phone = row
            # Attach crop_name and buyer info to order object for Pydantic
            order.crop_name = crop_name
            order.buyer_name = buyer_name
            order.buyer_phone = buyer_phone
            order.delivery_address = order.delivery_address_text
            orders.append(order)
        return orders


    async def get_delivery_options(self, product_id: str, buyer_lat: float, buyer_lng: float):
        product = await self.db.get(Product, product_id)
        stmt = select(FarmerProfile).where(FarmerProfile.user_id == product.farmer_id)
        res = await self.db.execute(stmt)
        farmer_profile = res.scalar_one_or_none()

        # In real app, calculate real distance
        if buyer_lat is not None and buyer_lng is not None:
            distance_km = haversine_distance(17.0, 78.0, buyer_lat, buyer_lng)
        else:
            distance_km = 5.0 # Default fallback distance

        options = []
        
        # 1. Driver Option
        driver_stmt = select(func.count(DriverProfile.id)).where(DriverProfile.is_available == True)
        driver_res = await self.db.execute(driver_stmt)
        drivers_available = driver_res.scalar() or 0

        options.append({
            "type": "driver",
            "label": "GramFleet Driver",
            "label_telugu": "గ్రామ్‌ఫ్లీట్ డ్రైవర్",
            "charge": calculate_delivery_charge(distance_km, "auto"),
            "estimated_time": "30-45 mins",
            "available": True,
            "drivers_available": drivers_available,
            "badge": "RECOMMENDED"
        })

        # 2. Farmer Option
        if farmer_profile and farmer_profile.willing_to_deliver:
            options.append({
                "type": "farmer",
                "label": "Farmer Delivery",
                "charge": calculate_delivery_charge(distance_km, "bike"),
                "estimated_time": "By Evening",
                "available": True
            })

        # 3. Self Pickup
        options.append({
            "type": "self_pickup",
            "label": "Self Pickup",
            "charge": 0,
            "estimated_time": "Now",
            "available": True
        })

        return {"distance_km": distance_km, "options": options}

    async def select_delivery(self, order_id: str, option_data, buyer_id: str):
        order = await self.db.get(Order, order_id)
        order.delivery_type = option_data.type
        order.delivery_charge = option_data.charge
        order.total_amount = float(order.subtotal) + float(order.platform_commission) + float(option_data.charge)
        
        if option_data.type == "farmer":
            order.delivery_earned_by = order.farmer_id
            
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def update_status(self, order_id: str, status: str, user_id: str):
        order = await self.db.get(Order, order_id)
        if not order:
            raise Exception("Order not found")
            
        order.status = status
        
        if status == "delivered":
            order.delivered_at = datetime.utcnow()
            order.payment_status = "paid"
            
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def upload_delivery_proof(self, order_id: str, photo_url: str, lat: float, lng: float, user_id: str):
        from app.models.all_models import CallSession
        order = await self.db.get(Order, order_id)
        order.delivery_photo = photo_url
        order.delivery_lat = lat
        order.delivery_lng = lng
        order.status = "delivered"
        order.delivered_at = datetime.utcnow()
        
        # Deactivate Call Sessions
        await self.db.execute(
            update(CallSession)
            .where(CallSession.order_id == order.id)
            .values(is_active=False)
        )
        
        await self.db.commit()
        return order

    async def get_available_deliveries(self):
        # Orders ready for pickup where delivery_type is driver
        stmt = select(Order, Product.crop_name).join(Product, Order.product_id == Product.id).where(
            Order.status == "ready_for_pickup",
            Order.delivery_type == "driver"
        )
        res = await self.db.execute(stmt)
        all_rows = res.all()
        orders = []
        for row in all_rows:
            order, crop_name = row
            order.crop_name = crop_name
            orders.append(order)
        return orders

    async def pickup_order(self, order_id: str, driver_id: str):
        from app.models.all_models import Order, User
        from app.api.v1.calls import create_call_session
        
        order = await self.db.get(Order, order_id)
        if not order:
             raise Exception("Order not found")
             
        order.status = "in_transit"
        order.delivery_earned_by = driver_id
        order.assigned_driver_id = driver_id
        
        # Create Call Masking Session
        try:
            # Get driver phone
            driver_user = await self.db.get(User, driver_id)
            # Get buyer phone
            buyer_user = await self.db.get(User, order.buyer_id)
            
            if driver_user and buyer_user:
                await create_call_session(self.db, order.id, driver_user.phone, buyer_user.phone)
                print(f"Call session created for order {order_id}")
        except Exception as e:
            print(f"Failed to create call session: {e}")

        await self.db.commit()
        await self.db.refresh(order)
        return order
