import uuid
from sqlalchemy import Column, String, Boolean, DateTime, DECIMAL, Integer, ForeignKey, CheckConstraint, Text, Date, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(15), unique=True, nullable=True)
    email = Column(String(100), unique=True, nullable=True)
    name = Column(String(100))
    role = Column(String(20), nullable=False)
    language = Column(String(20), default='telugu')
    profile_photo = Column(Text)
    aadhar_number = Column(String(12), unique=True, nullable=True)
    aadhar_verified = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False)

    __table_args__ = (
        CheckConstraint(role.in_(['farmer', 'buyer', 'driver', 'admin'])),
        CheckConstraint(language.in_(['telugu', 'hindi', 'english'])),
    )

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    user = relationship("User", back_populates="farmer_profile")
    village = Column(String(100))
    district = Column(String(100))
    state = Column(String(100), default='Telangana')
    lat = Column(DECIMAL(10, 8))
    lng = Column(DECIMAL(11, 8))
    farm_size_acres = Column(DECIMAL(6, 2))
    delivery_radius_km = Column(Integer, default=5)
    willing_to_deliver = Column(Boolean, default=False)
    bank_account = Column(String(20))
    ifsc_code = Column(String(11))
    upi_id = Column(String(50))
    rating = Column(DECIMAL(3, 2), default=0.0)
    total_orders = Column(Integer, default=0)

class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    business_name = Column(String(200))
    business_type = Column(String(50))
    gst_number = Column(String(15))
    village = Column(String(100))
    state = Column(String(100), default='Telangana')
    address = Column(Text)
    lat = Column(DECIMAL(10, 8))
    lng = Column(DECIMAL(11, 8))
    district = Column(String(100))
    upi_id = Column(String(50))
    rating = Column(DECIMAL(3, 2), default=0.0)


    __table_args__ = (
        CheckConstraint(business_type.in_(['restaurant', 'hotel', 'shop', 'supermarket', 'home', 'other'])),
    )

class DriverProfile(Base):
    __tablename__ = "driver_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    vehicle_type = Column(String(30))
    vehicle_number = Column(String(15))
    license_number = Column(String(20))
    lat = Column(DECIMAL(10, 8))
    lng = Column(DECIMAL(11, 8))
    is_available = Column(Boolean, default=False)
    rating = Column(DECIMAL(3, 2), default=0.0)
    total_deliveries = Column(Integer, default=0)
    upi_id = Column(String(50))

    __table_args__ = (
        CheckConstraint(vehicle_type.in_(['bike', 'auto', 'tractor', 'van', 'tempo'])),
    )

class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    crop_name = Column(String(100), nullable=False)
    crop_name_telugu = Column(String(100))
    crop_name_hindi = Column(String(100))

    quantity_kg = Column(DECIMAL(10, 2), nullable=False)
    price_per_kg = Column(DECIMAL(8, 2), nullable=False)
    market_price_per_kg = Column(DECIMAL(8, 2))
    quality_grade = Column(String(5))
    available_from = Column(DateTime)
    available_till = Column(DateTime)
    is_organic = Column(Boolean, default=False)
    status = Column(String(20), default='active')
    category = Column(String(50))
    lat = Column(DECIMAL(10, 8))
    lng = Column(DECIMAL(11, 8))
    village = Column(String(100))
    district = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    photos = relationship("ProductPhoto", back_populates="product", cascade="all, delete-orphan")
    farmer = relationship("User")


    __table_args__ = (
        CheckConstraint(quality_grade.in_(['A', 'B', 'C'])),
        CheckConstraint(status.in_(['active', 'sold', 'expired', 'paused'])),
    )

class ProductPhoto(Base):
    __tablename__ = "product_photos"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))
    image_data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="photos")


class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    quantity_kg = Column(DECIMAL(10, 2), nullable=False)
    price_per_kg = Column(DECIMAL(8, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    gst_amount = Column(DECIMAL(8, 2), default=0)
    service_fee = Column(DECIMAL(8, 2), default=0)
    platform_commission = Column(DECIMAL(8, 2), nullable=False)
    delivery_charge = Column(DECIMAL(8, 2), default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    delivery_type = Column(String(20))
    delivery_earned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    delivery_distance_km = Column(DECIMAL(6, 2))
    status = Column(String(30), default='pending')
    payment_status = Column(String(20), default='pending')
    delivery_photo = Column(Text)
    delivery_lat = Column(DECIMAL(10, 8))
    delivery_lng = Column(DECIMAL(11, 8))
    delivery_address_text = Column(Text)
    delivered_at = Column(DateTime)
    assigned_driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True) # The final driver who accepted
    pickup_otp = Column(String(6)) # OTP for secure handoff
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(delivery_type.in_(['driver', 'farmer', 'self_pickup'])),
        CheckConstraint(status.in_(['draft', 'pending', 'confirmed', 'ready_for_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed'])),
        CheckConstraint(payment_status.in_(['pending', 'paid', 'released_to_farmer', 'refunded'])),
    )

class BuyerAddress(Base):
    __tablename__ = "buyer_addresses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    label = Column(String(50)) # e.g., 'Home', 'Work', 'Shop'
    address_line = Column(Text, nullable=False)
    village = Column(String(100))
    district = Column(String(100))
    state = Column(String(100), default='Telangana')
    pincode = Column(String(10))
    lat = Column(DECIMAL(10, 8))
    lng = Column(DECIMAL(11, 8))
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

class DriverRequest(Base):
    __tablename__ = "driver_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String(20), default='requested') # requested, accepted, rejected, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Payment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(String(20))
    razorpay_order_id = Column(String(100))
    razorpay_payment_id = Column(String(100))
    status = Column(String(20), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(payment_method.in_(['upi', 'card', 'netbanking', 'cash'])),
        CheckConstraint(status.in_(['pending', 'success', 'failed', 'refunded'])),
    )

class Payout(Base):
    __tablename__ = "payouts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    recipient_type = Column(String(10))
    amount = Column(DECIMAL(10, 2), nullable=False)
    upi_id = Column(String(50))
    razorpay_payout_id = Column(String(100))
    status = Column(String(20), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(recipient_type.in_(['farmer', 'driver'])),
        CheckConstraint(status.in_(['pending', 'processing', 'success', 'failed'])),
    )

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"))
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    rating_type = Column(String(20))
    score = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(rating_type.in_(['product_quality', 'delivery', 'buyer_behaviour'])),
        CheckConstraint(score >= 1),
        CheckConstraint(score <= 5),
    )

class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    target = Column(String(100), nullable=False) # Can be phone or email
    otp = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MarketPrice(Base):
    __tablename__ = "market_prices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = Column(String(100), nullable=False)
    district = Column(String(100))
    min_price = Column(DECIMAL(8, 2))
    max_price = Column(DECIMAL(8, 2))
    modal_price = Column(DECIMAL(8, 2))
    date = Column(Date, server_default=func.current_date())
    source = Column(String(50), default='agmarknet')

class CallSession(Base):
    __tablename__ = "call_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"))
    driver_number = Column(String(20), nullable=False)
    customer_number = Column(String(20), nullable=False)
    virtual_number = Column(String(20), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
