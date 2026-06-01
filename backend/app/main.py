from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import products, customers, orders
from app.config import settings

# Auto-create tables (SQLite or PostgreSQL) at startup.
# In a larger system, you'd use Alembic migrations, but for a simplified,
# "easy way" project, metadata.create_all is standard and robust.
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A simplified Inventory & Order Management API with strict validation and transaction-based order handling.",
    version="1.0.0"
)

# Enable CORS for Next.js (usually runs on port 3000 or 8080 during production/docker compose)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For simplified local testing; in production, lock down to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)

@app.get("/")
def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API!",
        "docs_url": "/docs",
        "status": "online"
    }
