import { useEffect, useState } from "react"
import api from "../api/axios"
import toast from "react-hot-toast"
import Modal from "../components/Modal"
import { Plus, Trash2, Package, TrendingUp, TrendingDown, DollarSign, ShoppingBag } from "lucide-react"

const TABS = ["Ozet", "Stok", "Alislar", "Satislar"]

const fmt = (n) => (n ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })

export default function Trade() {
  const [tab, setTab] = useState("Ozet")
  const [items, setItems] = useState([])
  const [purchases, setPurchases] = useState([])
  const [sales, setSales] = useState([])
  const [summary, setSummary] = useState(null)
  const [units, setUnits] = useState(["adet", "kg", "lt", "ton", "kutu"])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const [itemModal, setItemModal] = useState(false)
  const [itemForm, setItemForm] = useState({ name: "", unit: "adet", notes: "" })
  const [purchaseModal, setPurchaseModal] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({ trade_item_id: "", supplier: "", quantity: "", unit_price: "", purchase_date: new Date().toISOString().split("T")[0], notes: "" })
  const [saleModal, setSaleModal] = useState(false)
  const [saleForm, setSaleForm] = useState({ trade_item_id: "", customer: "", quantity: "", unit_price: "", commission_rate: "", sale_date: new Date().toISOString().split("T")[0], notes: "" })

  const loadAll = () => {
    api.get("/trade/items").then(r => setItems(r.data)).catch(() => {})
    api.get("/trade/purchases", { params: { month, year } }).then(r => setPurchases(r.data)).catch(() => {})
    api.get("/trade/sales", { params: { month, year } }).then(r => setSales(r.data)).catch(() => {})
    api.get("/trade/summary", { params: { month, year } }).then(r => setSummary(r.data)).catch(() => {})
    api.get("/settings").then(r => {
      const wu = r.data.weight_units || "kg,g,ton,lt,ml,adet,kutu,paket,metre,cm"
      setUnits(wu.split(",").filter(Boolean))
    }).catch(() => {})
  }

  useEffect(() => { loadAll() }, [month, year])

  const saveItem = async () => {
    if (!itemForm.name) return toast.error("Urun adi zorunlu")
    try {
      await api.post("/trade/items", itemForm)
      toast.success("Kalem eklendi"); setItemModal(false); setItemForm({ name: "", unit: "adet", notes: "" }); loadAll()
    } catch (e) { toast.error(e.response?.data?.detail || "Hata") }
  }

  const deleteItem = async (id) => {
    if (!confirm("Silmek istediginize emin misiniz?")) return
    try { await api.delete(`/trade/items/${id}`); toast.success("Silindi"); loadAll() } catch { toast.error("Hata") }
  }

  const savePurchase = async () => {
    if (!purchaseForm.trade_item_id || !purchaseForm.supplier || !purchaseForm.quantity || !purchaseForm.unit_price) return toast.error("Tum alanlari doldurun")
    try {
      await api.post("/trade/purchases", { ...purchaseForm, trade_item_id: Number(purchaseForm.trade_item_id), quantity: Number(purchaseForm.quantity), unit_price: Number(purchaseForm.unit_price) })
      toast.success("Alis kaydedildi"); setPurchaseModal(false); loadAll()
    } catch (e) { toast.error(e.response?.data?.detail || "Hata") }
  }

  const deletePurchase = async (id) => {
    if (!confirm("Silmek istediginize emin misiniz?")) return
    try { await api.delete(`/trade/purchases/${id}`); toast.success("Silindi"); loadAll() } catch { toast.error("Hata") }
  }

  const saveSale = async () => {
    if (!saleForm.trade_item_id || !saleForm.customer || !saleForm.quantity || !saleForm.unit_price) return toast.error("Tum alanlari doldurun")
    try {
      await api.post("/trade/sales", { ...saleForm, trade_item_id: Number(saleForm.trade_item_id), quantity: Number(saleForm.quantity), unit_price: Number(saleForm.unit_price), commission_rate: Number(saleForm.commission_rate || 0) })
      toast.success("Satis kaydedildi"); setSaleModal(false); loadAll()
    } catch (e) { toast.error(e.response?.data?.detail || "Hata") }
  }

  const deleteSale = async (id) => {
    if (!confirm("Silmek istediginize emin misiniz?")) return
    try { await api.delete(`/trade/sales/${id}`); toast.success("Silindi"); loadAll() } catch { toast.error("Hata") }
  }

  const months = ["Ocak","Subat","Mart","Nisan","Mayis","Haziran","Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik"]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Ticaret / Komisyon</h1>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit" style={{ backgroundColor: "var(--bg-table-head)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={tab === t ? { backgroundColor: "var(--bg-card)", color: "var(--accent)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "var(--text-secondary)" }}>
            {t === "Ozet" ? "Özet" : t === "Alislar" ? "Alışlar" : t === "Satislar" ? "Satışlar" : t}
          </button>
        ))}
      </div>

      {tab === "Ozet" && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShoppingBag, label: "Toplam Alış", value: `₺${fmt(summary.total_cost)}`, sub: `${summary.purchase_count} kayıt`, color: "from-orange-500 to-orange-600" },
              { icon: TrendingUp, label: "Toplam Satış", value: `₺${fmt(summary.total_revenue)}`, sub: `${summary.sale_count} kayıt`, color: "from-blue-500 to-blue-600" },
              { icon: DollarSign, label: "Komisyon Geliri", value: `₺${fmt(summary.total_commission)}`, sub: "Bu ay", color: "from-purple-500 to-purple-600" },
              { icon: TrendingDown, label: "Net Kâr", value: `₺${fmt(summary.net_profit)}`, sub: "Satış - Alış", color: summary.net_profit >= 0 ? "from-green-500 to-green-600" : "from-red-500 to-red-600" },
            ].map((c, i) => (
              <div key={i} className={`bg-gradient-to-br ${c.color} rounded-2xl p-5 text-white shadow-lg`}>
                <div className="p-2 bg-white/20 rounded-xl w-fit mb-3"><c.icon size={20} /></div>
                <p className="text-white/70 text-xs mb-1">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-white/60 text-xs mt-1">{c.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Bu Ay Alışlar</h3>
              {purchases.length === 0 ? <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Kayıt yok</p> : (
                <div className="space-y-2">
                  {purchases.slice(0, 5).map(p => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-primary)" }}>{p.item_name} — {p.supplier}</span>
                      <span className="font-medium" style={{ color: "var(--accent)" }}>₺{fmt(p.total_cost)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Bu Ay Satışlar</h3>
              {sales.length === 0 ? <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Kayıt yok</p> : (
                <div className="space-y-2">
                  {sales.slice(0, 5).map(s => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-primary)" }}>{s.item_name} — {s.customer}</span>
                      <span className="font-medium" style={{ color: "var(--accent)" }}>₺{fmt(s.total_revenue)} <span className="text-xs" style={{ color: "var(--text-secondary)" }}>(%{s.commission_rate})</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "Stok" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setItemModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}>
              <Plus size={15} /> Yeni Kalem
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: "var(--bg-table-head)", borderColor: "var(--border)" }}>
                <tr>{["Ürün Adı", "Birim", "Mevcut Stok", "Notlar", ""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-xs" style={{ color: "var(--text-secondary)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-sm" style={{ color: "var(--text-secondary)" }}>Henüz kalem yok</td></tr>}
                {items.map(item => (
                  <tr key={item.id} style={{ borderTop: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.stock <= 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {item.stock} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{item.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Alislar" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setPurchaseModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}>
              <Plus size={15} /> Alış Ekle
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: "var(--bg-table-head)", borderColor: "var(--border)" }}>
                <tr>{["Tarih", "Ürün", "Tedarikçi", "Miktar", "Birim Fiyat", "Toplam", ""].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-xs" style={{ color: "var(--text-secondary)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {purchases.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: "var(--text-secondary)" }}>Bu ay alış kaydı yok</td></tr>}
                {purchases.map(p => (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{p.purchase_date}</td>
                    <td className="px-4 py-3 font-medium">{p.item_name}</td>
                    <td className="px-4 py-3">{p.supplier}</td>
                    <td className="px-4 py-3">{p.quantity}</td>
                    <td className="px-4 py-3">₺{fmt(p.unit_price)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--accent)" }}>₺{fmt(p.total_cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deletePurchase(p.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Satislar" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setSaleModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}>
              <Plus size={15} /> Satış Ekle
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: "var(--bg-table-head)", borderColor: "var(--border)" }}>
                <tr>{["Tarih", "Ürün", "Müşteri", "Miktar", "Satış Fiyatı", "Komisyon %", "Komisyon ₺", "Toplam", ""].map(h => <th key={h} className="px-3 py-3 text-left font-medium text-xs" style={{ color: "var(--text-secondary)" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {sales.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-sm" style={{ color: "var(--text-secondary)" }}>Bu ay satış kaydı yok</td></tr>}
                {sales.map(s => (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <td className="px-3 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{s.sale_date}</td>
                    <td className="px-3 py-3 font-medium">{s.item_name}</td>
                    <td className="px-3 py-3">{s.customer}</td>
                    <td className="px-3 py-3">{s.quantity}</td>
                    <td className="px-3 py-3">₺{fmt(s.unit_price)}</td>
                    <td className="px-3 py-3">%{s.commission_rate}</td>
                    <td className="px-3 py-3 text-purple-600 font-medium">₺{fmt(s.commission_amount)}</td>
                    <td className="px-3 py-3 font-semibold" style={{ color: "var(--accent)" }}>₺{fmt(s.total_revenue)}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => deleteSale(s.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {itemModal && (
        <Modal title="Yeni Ticaret Kalemi" onClose={() => setItemModal(false)}>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Ürün Adı *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Birim</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))}>
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Notlar</label>
              <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" value={itemForm.notes} onChange={e => setItemForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveItem} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}>Kaydet</button>
            <button onClick={() => setItemModal(false)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {purchaseModal && (
        <Modal title="Alış Kaydı Ekle" onClose={() => setPurchaseModal(false)}>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Ürün *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={purchaseForm.trade_item_id} onChange={e => setPurchaseForm(f => ({ ...f, trade_item_id: e.target.value }))}>
                <option value="">Seçiniz</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stok: {i.stock} {i.unit})</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Tedarikçi *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={purchaseForm.supplier} onChange={e => setPurchaseForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Miktar *</label>
                <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={purchaseForm.quantity} onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium mb-1">Birim Fiyat (₺) *</label>
                <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={purchaseForm.unit_price} onChange={e => setPurchaseForm(f => ({ ...f, unit_price: e.target.value }))} /></div>
            </div>
            {purchaseForm.quantity && purchaseForm.unit_price && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium">
                Toplam: ₺{fmt(Number(purchaseForm.quantity) * Number(purchaseForm.unit_price))}
              </div>
            )}
            <div><label className="block text-sm font-medium mb-1">Tarih *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={purchaseForm.purchase_date} onChange={e => setPurchaseForm(f => ({ ...f, purchase_date: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Notlar</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={purchaseForm.notes} onChange={e => setPurchaseForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={savePurchase} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}>Kaydet</button>
            <button onClick={() => setPurchaseModal(false)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}

      {saleModal && (
        <Modal title="Satış Kaydı Ekle" onClose={() => setSaleModal(false)}>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Ürün *</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm" value={saleForm.trade_item_id} onChange={e => setSaleForm(f => ({ ...f, trade_item_id: e.target.value }))}>
                <option value="">Seçiniz</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stok: {i.stock} {i.unit})</option>)}
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Müşteri *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={saleForm.customer} onChange={e => setSaleForm(f => ({ ...f, customer: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Miktar *</label>
                <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={saleForm.quantity} onChange={e => setSaleForm(f => ({ ...f, quantity: e.target.value }))} /></div>
              <div><label className="block text-sm font-medium mb-1">Satış Fiyatı (₺) *</label>
                <input type="number" min="0" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={saleForm.unit_price} onChange={e => setSaleForm(f => ({ ...f, unit_price: e.target.value }))} /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Komisyon Oranı (%)</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" step="0.1" className="w-28 border rounded-lg px-3 py-2 text-sm" value={saleForm.commission_rate} onChange={e => setSaleForm(f => ({ ...f, commission_rate: e.target.value }))} />
                <div className="flex gap-1">
                  {[5, 10, 15, 20, 25].map(r => (
                    <button key={r} type="button" onClick={() => setSaleForm(f => ({ ...f, commission_rate: r }))}
                      className="text-xs px-2 py-1 rounded border"
                      style={Number(saleForm.commission_rate) === r ? { backgroundColor: "var(--accent)", color: "var(--accent-text)", borderColor: "var(--accent)" } : { color: "var(--accent)", borderColor: "var(--border)" }}>
                      %{r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {saleForm.quantity && saleForm.unit_price && (
              <div className="bg-purple-50 rounded-lg px-3 py-2 text-sm text-purple-700">
                Toplam: ₺{fmt(Number(saleForm.quantity) * Number(saleForm.unit_price))} |
                Komisyon: ₺{fmt(Number(saleForm.quantity) * Number(saleForm.unit_price) * Number(saleForm.commission_rate || 0) / 100)}
              </div>
            )}
            <div><label className="block text-sm font-medium mb-1">Tarih *</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={saleForm.sale_date} onChange={e => setSaleForm(f => ({ ...f, sale_date: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium mb-1">Notlar</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={saleForm.notes} onChange={e => setSaleForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveSale} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}>Kaydet</button>
            <button onClick={() => setSaleModal(false)} className="flex-1 border py-2 rounded-lg text-sm">İptal</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
