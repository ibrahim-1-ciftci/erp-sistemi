from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import hashlib, hmac, base64, json, os, requests as req
from ..core.database import get_db
from ..models.setting import SiteSetting

router = APIRouter(prefix="/api/payment", tags=["payment"])

def get_paytr_creds(db: Session):
    from ..core.config import settings
    return settings.PAYTR_MERCHANT_ID, settings.PAYTR_MERCHANT_KEY, settings.PAYTR_MERCHANT_SALT


class PaymentItem(BaseModel):
    name: str
    qty: int
    price: float

class PaymentRequest(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    city: str
    note: str = ""
    items: List[PaymentItem]
    total: float
    lang: str = "tr"
    order_id: str = ""


@router.post("/start")
def start_payment(data: PaymentRequest, request: Request, db: Session = Depends(get_db)):
    merchant_id, merchant_key, merchant_salt = get_paytr_creds(db)
    if not merchant_id:
        raise HTTPException(500, "PayTR bilgileri eksik")

    # Sipariş ID
    import time, random, string
    order_id = data.order_id or f"LVS{int(time.time())}{random.randint(100,999)}"

    # Tutar kuruş cinsinden (tam sayı)
    amount = int(round(data.total * 100))

    # Sepet JSON
    basket = [[item.name, f"{item.price:.2f}", item.qty] for item in data.items]
    basket_encoded = base64.b64encode(json.dumps(basket, ensure_ascii=False).encode()).decode()

    # IP
    forwarded = request.headers.get("X-Forwarded-For")
    user_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "1.2.3.4")

    # Başarı / Hata URL
    base_url = os.getenv("SITE_URL", "https://laveskimya.com")
    merchant_ok_url   = f"{base_url}/siparis-tamamlandi"
    merchant_fail_url = f"{base_url}/odeme-hatasi"
    merchant_notify_url = f"{base_url}/api/payment/notify"

    currency    = "TL"
    test_mode   = "1"   # Canlıya geçince "0" yap
    no_installment = "0"
    max_installment = "0"
    lang_code   = "tr" if data.lang == "tr" else "en"
    debug_on    = "1"

    # Hash oluştur
    hash_str = (
        merchant_id + user_ip + order_id + data.email + str(amount) +
        basket_encoded + no_installment + max_installment + currency + test_mode + merchant_salt
    )
    token = base64.b64encode(
        hmac.new(merchant_key.encode(), hash_str.encode(), hashlib.sha256).digest()
    ).decode()

    payload = {
        "merchant_id":       merchant_id,
        "user_ip":           user_ip,
        "merchant_oid":      order_id,
        "email":             data.email,
        "payment_amount":    amount,
        "paytr_token":       token,
        "user_basket":       basket_encoded,
        "debug_on":          debug_on,
        "no_installment":    no_installment,
        "max_installment":   max_installment,
        "user_name":         data.name,
        "user_address":      data.address,
        "user_phone":        data.phone,
        "merchant_ok_url":   merchant_ok_url,
        "merchant_fail_url": merchant_fail_url,
        "merchant_notify_url": merchant_notify_url,
        "currency":          currency,
        "test_mode":         test_mode,
        "lang":              lang_code,
    }

    try:
        resp = req.post("https://www.paytr.com/odeme/api/get-token", data=payload, timeout=30)
        result = resp.json()
    except Exception as e:
        raise HTTPException(500, f"PayTR bağlantı hatası: {str(e)}")

    if result.get("status") != "success":
        raise HTTPException(400, f"PayTR hatası: {result.get('reason', 'Bilinmeyen hata')}")

    return {
        "token": result["token"],
        "order_id": order_id,
        "iframe_url": f"https://www.paytr.com/odeme/guvenli/{result['token']}"
    }


@router.post("/notify")
async def payment_notify(request: Request, db: Session = Depends(get_db)):
    """PayTR ödeme sonucu bildirimi"""
    merchant_id, merchant_key, merchant_salt = get_paytr_creds(db)
    form = await request.form()

    merchant_oid  = form.get("merchant_oid", "")
    status        = form.get("status", "")
    total_amount  = form.get("total_amount", "")
    hash_received = form.get("hash", "")

    # Hash doğrula
    hash_str = merchant_oid + merchant_salt + status + total_amount
    expected = base64.b64encode(
        hmac.new(merchant_key.encode(), hash_str.encode(), hashlib.sha256).digest()
    ).decode()

    if hash_received != expected:
        return HTMLResponse("PAYTR_INVALID_HASH", status_code=400)

    if status == "success":
        # Siparişi güncelle — order_id ile eşleştir
        try:
            from sqlalchemy import text
            db.execute(text(
                "UPDATE orders SET status='paid', payment_ref=:ref WHERE payment_ref=:ref OR id::text=:oid"
            ), {"ref": merchant_oid, "oid": merchant_oid.replace("LVS","").rstrip("0123456789")[:10]})
            db.commit()
        except Exception:
            pass

    return HTMLResponse("OK")
