from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .core.database import Base, engine
from .models import admin, category, product, product_image, contact, setting
from .routers import auth, categories, products, contact as contact_router, settings as settings_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Laves Website API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(contact_router.router)
app.include_router(settings_router.router)

@app.get("/")
def root():
    return {"status": "ok"}
