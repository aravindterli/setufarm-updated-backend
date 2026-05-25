from pydantic import BaseModel
from typing import Optional

from uuid import UUID
from datetime import datetime

class OrderCreate(BaseModel):
    product_id: UUID
    quantity_kg: float
    address_id: Optional[UUID] = None
    delivery_address_text: Optional[str] = None

class DriverRequestResponse(BaseModel):
    driver_id: UUID
    driver_name: str
    status: str

class DriverInfoResponse(BaseModel):
    id: UUID
    name: str
    phone: str
    profile_photo: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None

class BuyerInfoResponse(BaseModel):
    id: UUID
    name: str
    phone: str
    profile_photo: Optional[str] = None

class FarmerInfoResponse(BaseModel):
    id: UUID
    name: str
    phone: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    rating: Optional[float] = 0.0

class OrderResponse(BaseModel):
    id: UUID
    product_id: UUID
    crop_name: Optional[str] = None
    status: str
    quantity_kg: float
    subtotal: float
    gst_amount: float = 0
    service_fee: float = 0
    delivery_charge: float = 0
    total_amount: float
    delivery_type: Optional[str] = None
    delivery_address_text: Optional[str] = None
    delivery_address: Optional[str] = None
    farmer: Optional[FarmerInfoResponse] = None
    buyer_name: Optional[str] = None
    buyer_phone: Optional[str] = None
    buyer: Optional[BuyerInfoResponse] = None
    assigned_driver_id: Optional[UUID] = None
    assigned_driver: Optional[DriverInfoResponse] = None
    pickup_otp: Optional[str] = None
    requests: Optional[list[DriverRequestResponse]] = []
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryOptionRequest(BaseModel):
    type: str
    charge: float

class DeliveryProofRequest(BaseModel):
    photo_url: str
    lat: float
    lng: float
