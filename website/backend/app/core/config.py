from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost/laves_website"
    SECRET_KEY: str = "changeme-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    UPLOAD_DIR: str = "uploads"
    GROQ_API_KEY: str = ""
    PAYTR_MERCHANT_ID: str = ""
    PAYTR_MERCHANT_KEY: str = ""
    PAYTR_MERCHANT_SALT: str = ""
    SITE_URL: str = "https://laveskimya.com"
    MAIL_FROM: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_TO: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
