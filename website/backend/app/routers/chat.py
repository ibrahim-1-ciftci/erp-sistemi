from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import httpx
from ..core.database import get_db
from ..core.config import settings
from ..models.product import Product
from ..models.setting import SiteSetting

router = APIRouter(prefix="/api/chat", tags=["chat"])

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    lang: str = "tr"

def get_products_context(db: Session) -> str:
    products = db.query(Product).filter(Product.is_active == True).order_by(Product.order).all()
    if not products:
        return "Henüz ürün bulunmamaktadır."
    
    lines = []
    for p in products:
        cat = p.category.name_tr if p.category else "Kategorisiz"
        desc = p.description_tr or ""
        details = p.details_tr or ""
        lines.append(f"- {p.name_tr} (Kategori: {cat}){': ' + desc if desc else ''}{' | ' + details[:100] if details else ''}")
    return "\n".join(lines)

def get_products_context_en(db: Session) -> str:
    products = db.query(Product).filter(Product.is_active == True).order_by(Product.order).all()
    if not products:
        return "No products available."
    
    lines = []
    for p in products:
        cat = p.category.name_en if p.category else "Uncategorized"
        desc = p.description_en or ""
        details = p.details_en or ""
        lines.append(f"- {p.name_en} (Category: {cat}){': ' + desc if desc else ''}{' | ' + details[:100] if details else ''}")
    return "\n".join(lines)

def get_company_info(db: Session) -> dict:
    settings = db.query(SiteSetting).all()
    return {s.key: s.value for s in settings}

@router.post("")
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise HTTPException(500, "GROQ_API_KEY tanımlı değil")

    # Ürün ve şirket bilgilerini al
    if req.lang == "tr":
        products_ctx = get_products_context(db)
    else:
        products_ctx = get_products_context_en(db)
    
    company = get_company_info(db)
    company_name = company.get("company_name", "Laves Kimya")
    phone = company.get("phone", "")
    email = company.get("email", "")
    whatsapp = company.get("whatsapp", "")
    address = company.get("address", "")

    if req.lang == "tr":
        system_prompt = f"""Sen {company_name} şirketinin akıllı müşteri asistanısın. Kimya ve oto bakım ürünleri konusunda uzman, samimi ve yardımsever bir asistansın.

ŞİRKET BİLGİLERİ:
- Şirket: {company_name}
- Telefon: {phone}
- E-posta: {email}
- WhatsApp: {whatsapp}
- Adres: {address}

MEVCUT ÜRÜN KATALOĞU:
{products_ctx}

GÖREV VE KURALLAR:
1. Müşterilere ürünler hakkında detaylı, doğru ve faydalı bilgi ver
2. Ürün önerisi yaparken müşterinin ihtiyacını anlamaya çalış
3. Fiyat sorarken "Fiyat bilgisi için lütfen bizimle iletişime geçin" de
4. İletişim bilgilerini gerektiğinde paylaş
5. Türkçe konuş, samimi ve profesyonel ol
6. Katalogda olmayan ürünler için "Bu ürünü şu an sunmuyoruz, ama [benzer ürün] önerebilirim" de
7. Kısa ve öz cevaplar ver, gerektiğinde detaya gir
8. Emoji kullanabilirsin ama abartma"""
    else:
        system_prompt = f"""You are the smart customer assistant of {company_name}, a professional automotive care and chemistry products company.

COMPANY INFO:
- Company: {company_name}
- Phone: {phone}
- Email: {email}
- WhatsApp: {whatsapp}
- Address: {address}

PRODUCT CATALOG:
{products_ctx}

RULES:
1. Provide detailed, accurate and helpful information about products
2. Try to understand customer needs before recommending products
3. For pricing: "Please contact us for pricing information"
4. Share contact info when needed
5. Be friendly and professional
6. For products not in catalog: "We don't currently offer that, but I can suggest [similar product]"
7. Keep answers concise but detailed when needed"""

    # Groq API'ye gönder
    messages = [{"role": "system", "content": system_prompt}]
    for m in req.messages[-10:]:  # Son 10 mesajı gönder (context window)
        messages.append({"role": m.role, "content": m.content})

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.7,
                }
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
        except httpx.HTTPStatusError as e:
            raise HTTPException(502, f"Groq API hatası: {e.response.status_code}")
        except Exception as e:
            raise HTTPException(502, f"AI servisi geçici olarak kullanılamıyor: {str(e)}")
