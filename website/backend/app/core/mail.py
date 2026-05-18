import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str) -> bool:
    """Gmail SMTP ile mail gönder. Hata olursa False döner, sistemi durdurmaz."""
    if not settings.MAIL_FROM or not settings.MAIL_PASSWORD:
        logger.warning("Mail ayarları eksik, mail gönderilmedi.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"Laves Kimya <{settings.MAIL_FROM}>"
        msg["To"]      = to
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.MAIL_FROM, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to, msg.as_string())
        logger.info(f"Mail gönderildi: {to} — {subject}")
        return True
    except Exception as e:
        logger.error(f"Mail gönderilemedi: {e}")
        return False


# ── Mail şablonları ────────────────────────────────────────────────────────

def mail_order_received(order, lang: str = "tr") -> tuple[str, str]:
    """Müşteriye — sipariş alındı bildirimi"""
    items_html = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #f0f0f0'>{i.get('name','')}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center'>{i.get('qty','')}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right'>"
        f"{'%.2f' % (i.get('price',0)*i.get('qty',1))} ₺</td></tr>"
        for i in (order.items or [])
    )
    total = f"{order.total:.2f}" if order.total else "—"

    if lang == "tr":
        subject = f"Siparişiniz Alındı — #{order.id}"
        body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px">
          <div style="background:#1e40af;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">Laves Kimya</h1>
            <p style="color:#bfdbfe;margin:6px 0 0">Siparişiniz başarıyla alındı</p>
          </div>
          <div style="background:white;padding:24px;border-radius:0 0 12px 12px">
            <p style="color:#374151">Merhaba <strong>{order.customer_name}</strong>,</p>
            <p style="color:#374151">Siparişiniz alındı ve işleme konuldu. Sipariş numaranız: <strong>#{order.id}</strong></p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:13px">Ürün</th>
                  <th style="padding:10px 12px;text-align:center;color:#6b7280;font-size:13px">Adet</th>
                  <th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:13px">Tutar</th>
                </tr>
              </thead>
              <tbody>{items_html}</tbody>
              <tfoot>
                <tr style="background:#eff6ff">
                  <td colspan="2" style="padding:10px 12px;font-weight:bold;color:#1e40af">Toplam</td>
                  <td style="padding:10px 12px;font-weight:bold;color:#1e40af;text-align:right">{total} ₺</td>
                </tr>
              </tfoot>
            </table>
            <p style="color:#374151">Ödeme yöntemi: <strong>{'Havale / EFT' if order.payment_method == 'transfer' else 'Kredi Kartı'}</strong></p>
            <p style="color:#6b7280;font-size:13px">Siparişinizle ilgili sorularınız için bizimle iletişime geçebilirsiniz.</p>
            <div style="text-align:center;margin-top:20px">
              <a href="https://laveskimya.com/iletisim" style="background:#1e40af;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">İletişime Geç</a>
            </div>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">© Laves Kimya — laveskimya.com</p>
        </div>"""
    else:
        subject = f"Order Received — #{order.id}"
        body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px">
          <div style="background:#1e40af;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">Laves Kimya</h1>
            <p style="color:#bfdbfe;margin:6px 0 0">Your order has been received</p>
          </div>
          <div style="background:white;padding:24px;border-radius:0 0 12px 12px">
            <p style="color:#374151">Hello <strong>{order.customer_name}</strong>,</p>
            <p style="color:#374151">Your order has been received. Order number: <strong>#{order.id}</strong></p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:13px">Product</th>
                  <th style="padding:10px 12px;text-align:center;color:#6b7280;font-size:13px">Qty</th>
                  <th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:13px">Amount</th>
                </tr>
              </thead>
              <tbody>{items_html}</tbody>
              <tfoot>
                <tr style="background:#eff6ff">
                  <td colspan="2" style="padding:10px 12px;font-weight:bold;color:#1e40af">Total</td>
                  <td style="padding:10px 12px;font-weight:bold;color:#1e40af;text-align:right">{total} ₺</td>
                </tr>
              </tfoot>
            </table>
            <p style="color:#6b7280;font-size:13px">For questions about your order, please contact us.</p>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">© Laves Kimya — laveskimya.com</p>
        </div>"""
    return subject, body


def mail_order_shipped(order, lang: str = "tr") -> tuple[str, str]:
    """Müşteriye — kargoya verildi bildirimi"""
    if lang == "tr":
        subject = f"Siparişiniz Kargoya Verildi — #{order.id}"
        body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px">
          <div style="background:#059669;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">Laves Kimya</h1>
            <p style="color:#a7f3d0;margin:6px 0 0">Siparişiniz yola çıktı! 🚚</p>
          </div>
          <div style="background:white;padding:24px;border-radius:0 0 12px 12px">
            <p style="color:#374151">Merhaba <strong>{order.customer_name}</strong>,</p>
            <p style="color:#374151">
              <strong>#{order.id}</strong> numaralı siparişiniz kargoya verilmiştir.
              En kısa sürede adresinize teslim edilecektir.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
              <p style="color:#065f46;margin:0;font-weight:bold">📦 Teslimat Adresi</p>
              <p style="color:#374151;margin:8px 0 0">{order.customer_address}, {order.customer_city}</p>
            </div>
            <p style="color:#6b7280;font-size:13px">Herhangi bir sorunuz için bizimle iletişime geçebilirsiniz.</p>
            <div style="text-align:center;margin-top:20px">
              <a href="https://laveskimya.com/iletisim" style="background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">İletişime Geç</a>
            </div>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">© Laves Kimya — laveskimya.com</p>
        </div>"""
    else:
        subject = f"Your Order Has Been Shipped — #{order.id}"
        body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px">
          <div style="background:#059669;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">Laves Kimya</h1>
            <p style="color:#a7f3d0;margin:6px 0 0">Your order is on its way! 🚚</p>
          </div>
          <div style="background:white;padding:24px;border-radius:0 0 12px 12px">
            <p style="color:#374151">Hello <strong>{order.customer_name}</strong>,</p>
            <p style="color:#374151">Order <strong>#{order.id}</strong> has been shipped and will be delivered soon.</p>
            <p style="color:#6b7280;font-size:13px">For any questions, please contact us.</p>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">© Laves Kimya — laveskimya.com</p>
        </div>"""
    return subject, body


def mail_admin_new_order(order) -> tuple[str, str]:
    """Admin'e — yeni sipariş bildirimi"""
    items_text = "\n".join(
        f"  • {i.get('name','')} x{i.get('qty','')} — {i.get('price',0)*i.get('qty',1):.2f} ₺"
        for i in (order.items or [])
    )
    subject = f"🛒 Yeni Sipariş #{order.id} — {order.customer_name}"
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:20px">
      <div style="background:#1e40af;padding:20px;border-radius:12px 12px 0 0">
        <h2 style="color:white;margin:0">🛒 Yeni Sipariş Geldi!</h2>
      </div>
      <div style="background:white;padding:24px;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px">Sipariş No</td><td style="padding:6px 0;font-weight:bold">#{order.id}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Müşteri</td><td style="padding:6px 0">{order.customer_name}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">E-posta</td><td style="padding:6px 0">{order.customer_email}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Telefon</td><td style="padding:6px 0">{order.customer_phone or '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Adres</td><td style="padding:6px 0">{order.customer_address}, {order.customer_city}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Ödeme</td><td style="padding:6px 0">{'Havale / EFT' if order.payment_method == 'transfer' else 'Kredi Kartı'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Toplam</td><td style="padding:6px 0;font-weight:bold;color:#1e40af">{order.total:.2f} ₺</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:16px 0">
        <p style="color:#374151;font-weight:bold;margin-bottom:8px">Ürünler:</p>
        <pre style="background:#f9fafb;padding:12px;border-radius:8px;font-size:13px;color:#374151">{items_text}</pre>
        {f'<p style="color:#6b7280;font-size:13px">Not: {order.note}</p>' if order.note else ''}
        <div style="text-align:center;margin-top:20px">
          <a href="https://laveskimya.com/admin/orders" style="background:#1e40af;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Admin Panelinde Gör</a>
        </div>
      </div>
    </div>"""
    return subject, body
