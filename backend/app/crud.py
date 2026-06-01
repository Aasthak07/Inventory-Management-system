from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import models, schemas
from fastapi import HTTPException, status
from decimal import Decimal

# ----------------- PRODUCT CRUD -----------------

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku.upper().strip()).first()

def get_products(db: Session, search: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Product)
    if search:
        query = query.filter(
            or_(
                models.Product.name.ilike(f"%{search}%"),
                models.Product.sku.ilike(f"%{search}%")
            )
        )
    return query.offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Check SKU uniqueness
    db_product = get_product_by_sku(db, product.sku)
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    
    new_product = models.Product(
        sku=product.sku.upper().strip(),  # Normalize SKU
        name=product.name.strip(),
        description=product.description,
        price=product.price,
        stock_quantity=product.stock_quantity
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    # Check unique SKU if updating SKU
    if "sku" in update_data:
        normalized_sku = update_data["sku"].upper().strip()
        if normalized_sku != db_product.sku:
            existing_sku = get_product_by_sku(db, normalized_sku)
            if existing_sku:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with SKU '{normalized_sku}' already exists."
                )
            update_data["sku"] = normalized_sku

    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    
    # Check if product is in any orders
    in_orders = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if in_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it exists in previous customer orders."
        )

    db.delete(db_product)
    db.commit()
    return db_product


# ----------------- CUSTOMER CRUD -----------------

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email.lower().strip()).first()

def get_customers(db: Session, search: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Customer)
    if search:
        query = query.filter(
            or_(
                models.Customer.name.ilike(f"%{search}%"),
                models.Customer.email.ilike(f"%{search}%")
            )
        )
    return query.offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Check unique Email
    normalized_email = customer.email.lower().strip()
    db_customer = get_customer_by_email(db, normalized_email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{normalized_email}' already exists."
        )
    
    new_customer = models.Customer(
        name=customer.name.strip(),
        email=normalized_email,
        phone=customer.phone.strip() if customer.phone else None
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def update_customer(db: Session, customer_id: int, customer_update: schemas.CustomerUpdate):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    
    update_data = customer_update.model_dump(exclude_unset=True)
    
    if "email" in update_data:
        normalized_email = update_data["email"].lower().strip()
        if normalized_email != db_customer.email:
            existing_email = get_customer_by_email(db, normalized_email)
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Customer with email '{normalized_email}' already exists."
                )
            update_data["email"] = normalized_email

    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    
    # Check if customer has any orders
    has_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete customer because they have previous order logs."
        )

    db.delete(db_customer)
    db.commit()
    return db_customer


# ----------------- ORDER CRUD (BUSINESS RULES) -----------------

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # 1. Verify customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_data.customer_id} not found."
        )

    # 2. Begin manual transaction operations
    # Create the order record first (with total 0, to be updated later)
    new_order = models.Order(
        customer_id=order_data.customer_id,
        status="Completed",
        total_amount=Decimal("0.00")
    )
    db.add(new_order)
    
    try:
        # Flush to generate order ID
        db.flush()
        
        running_total = Decimal("0.00")
        
        # Keep track of unique products in the same order payload to group quantities if needed
        # (Though we can just validate each line item independently)
        
        for item in order_data.items:
            # Fetch product and lock row for concurrent updates (with_for_update)
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} not found."
                )
            
            # --- CRITICAL BUSINESS RULE: Inventory validation ---
            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.stock_quantity}, Requested: {item.quantity}."
                )
            
            # --- CRITICAL BUSINESS RULE: Automatic stock reduction ---
            product.stock_quantity -= item.quantity
            
            # Calculate pricing
            item_total = product.price * item.quantity
            running_total += item_total
            
            # Create Order Item record
            new_item = models.OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item.quantity,
                price=product.price  # Lock in current purchase price
            )
            db.add(new_item)
        
        # Update order total price
        new_order.total_amount = running_total
        db.commit()
        db.refresh(new_order)
        return new_order

    except HTTPException as http_ex:
        # Rollback database changes on business validation errors
        db.rollback()
        raise http_ex
    except Exception as e:
        # Rollback database changes on any other unexpected exceptions
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while placing order: {str(e)}"
        )
