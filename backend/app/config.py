from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Inventory & Order Management System"
    DATABASE_URL: str = Field("sqlite:///./inventory.db", validation_alias="DATABASE_URL")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
