from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/erp_db"
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    KDV_RATE: float = 0.20  # %20 — değiştirmek için .env dosyasına KDV_RATE=0.10 ekle

    class Config:
        env_file = ".env"

settings = Settings()
