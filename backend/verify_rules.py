import os
import sys

# Add the parent directory to Python path to allow app imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app import models, schemas, crud
from fastapi import HTTPException
from decimal import Decimal

def run_tests():
    print("=" * 60)
    print("INVENTORY & ORDER MANAGEMENT SYSTEM - BUSINESS RULES VERIFICATION")
    print("=" * 60)

    # 1. Initialize clean database tables
    print("\n[Step 1] Initializing fresh database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables reset successfully.")

    db: Session = SessionLocal()
    try:
        # 2. Register Products and Validate Uniqueness
        print("\n[Step 2] Testing Product SKU Uniqueness Constraint...")
        prod_data_1 = schemas.ProductCreate(
            sku="IPHONE-15",
            name="Apple iPhone 15 Pro",
            description="128GB, Space Black",
            price=Decimal("999.99"),
            stock_quantity=10
        )
        p1 = crud.create_product(db, prod_data_1)
        print(f"[OK] Created product '{p1.name}' with SKU '{p1.sku}' and Stock = {p1.stock_quantity}.")

        # Try to insert duplicate SKU
        prod_data_2 = schemas.ProductCreate(
            sku="iphone-15",  # lowercase, will be capitalized in create_product
            name="Apple iPhone 15 Pro (Copy)",
            description="Duplicate testing item",
            price=Decimal("950.00"),
            stock_quantity=5
        )
        try:
            crud.create_product(db, prod_data_2)
            print("[FAIL] Database allowed duplicate SKU creation!")
            raise AssertionError("Duplicate SKU allowed.")
        except HTTPException as e:
            print(f"[OK] Prevented duplicate SKU. Exception caught: {e.detail}")

        # 3. Register Customers and Validate Uniqueness
        print("\n[Step 3] Testing Customer Email Uniqueness Constraint...")
        cust_data_1 = schemas.CustomerCreate(
            name="Alice Smith",
            email="alice@example.com",
            phone="1234567890"
        )
        c1 = crud.create_customer(db, cust_data_1)
        print(f"[OK] Registered customer '{c1.name}' with Email '{c1.email}'.")

        # Try to insert duplicate Email
        cust_data_2 = schemas.CustomerCreate(
            name="Alice Smith Clone",
            email="ALICE@EXAMPLE.COM",  # capitalized, normalized to lowercase in crud
            phone="0987654321"
        )
        try:
            crud.create_customer(db, cust_data_2)
            print("[FAIL] Database allowed duplicate email registration!")
            raise AssertionError("Duplicate Email allowed.")
        except HTTPException as e:
            print(f"[OK] Prevented duplicate Email. Exception caught: {e.detail}")

        # 4. Create an Order and Verify Stock Reduction
        print("\n[Step 4] Testing Standard Order Placement & Stock Reduction...")
        # Alice wants to order 3 iPhones
        order_data = schemas.OrderCreate(
            customer_id=c1.id,
            items=[
                schemas.OrderItemCreate(product_id=p1.id, quantity=3)
            ]
        )
        
        ord1 = crud.create_order(db, order_data)
        db.refresh(p1)  # Refresh product stock from DB
        print(f"[OK] Order #ORD-{ord1.id} processed for Alice.")
        print(f"  Order Total: ${ord1.total_amount}")
        print(f"  Remaining '{p1.name}' Stock in Database: {p1.stock_quantity} (Expected: 7)")
        assert p1.stock_quantity == 7, "Stock was not reduced correctly."

        # 5. Create an Insufficient Stock Order and Verify Atomicity / Rollback
        print("\n[Step 5] Testing Insufficient Stock Validation & Transaction Rollback...")
        # Alice tries to order 8 iPhones. But only 7 are left in stock!
        # The entire transaction must fail, and stock must remain exactly 7.
        order_data_invalid = schemas.OrderCreate(
            customer_id=c1.id,
            items=[
                schemas.OrderItemCreate(product_id=p1.id, quantity=8)
            ]
        )

        try:
            crud.create_order(db, order_data_invalid)
            print("[FAIL] System allowed placing order for more than available stock!")
            raise AssertionError("Order placed with insufficient stock.")
        except HTTPException as e:
            print(f"[OK] Order placement rejected. Exception caught: {e.detail}")
            
            # Verify stock was rolled back and is still exactly 7
            db.refresh(p1)
            print(f"  Confirming '{p1.name}' Stock count: {p1.stock_quantity} (Expected: 7)")
            assert p1.stock_quantity == 7, "Transaction failed to roll back! Stock was altered."
            print("[OK] Transaction atomicity confirmed! Stock was rolled back safely.")

        print("\n" + "=" * 60)
        print("ALL BUSINESS RULE VALIDATIONS PASSED SUCCESSFULY!")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
