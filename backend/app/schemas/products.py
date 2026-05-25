from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from typing import List

class ProductCreate(BaseModel):
    crop_name: str
    category: Optional[str] = None
    quantity_kg: float
    price_per_kg: float
    crop_photos: Optional[List[str]] = None  # Base64 strings

class ProductResponse(BaseModel):
    id: UUID
    crop_name: str
    quantity_kg: float
    price_per_kg: float
    status: str
    photos: Optional[List[str]] = None # We will return base64 strings
    village: Optional[str] = None
    district: Optional[str] = None
    farmer: Optional[dict] = None
    distance_km: Optional[float] = 0
    category: Optional[str] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    products: list[ProductResponse]

