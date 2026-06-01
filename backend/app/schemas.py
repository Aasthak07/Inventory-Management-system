from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# ----------------- PRODUCT SCHEMAS -----------------

class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50, description="Unique Stock Keeping Unit code")
    name: str = Field(..., min_length=2, max_length=100, description="Product Name")
    description: Optional[str] = Field(None, description="Detailed product description")
    price: Decimal = Field(..., gt=Decimal('0.00'), max_digits=10, decimal_places=2, description="Unit price of the product")
    stock_quantity: int = Field(..., ge=0, description="Current stock count in inventory")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=3, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=Decimal('0.00'), max_digits=10, decimal_places=2)
    stock_quantity: Optional[int] = Field(None, ge=0)

class Product(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- CUSTOMER SCHEMAS -----------------

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Customer Full Name")
    email: EmailStr = Field(..., description="Unique customer email address")
    phone: Optional[str] = Field(None, max_length=20, description="Customer contact phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)

class Customer(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------- ORDER ITEM SCHEMAS -----------------

class OrderItemBase(BaseModel):
    product_id: int = Field(..., description="ID of the product being ordered")
    quantity: int = Field(..., gt=0, description="Quantity of the product to order")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    price: Decimal

    class Config:
        from_attributes = True


# ----------------- ORDER SCHEMAS -----------------

class OrderBase(BaseModel):
    customer_id: int = Field(..., description="ID of the customer placing the order")

class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class Order(OrderBase):
    id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItem]
    customer: Customer

    class Config:
        from_attributes = True
