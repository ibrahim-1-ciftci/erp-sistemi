// Sepet yönetimi — localStorage tabanlı
const CART_KEY = 'laves_cart'

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]') } catch { return [] }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-updated'))
}

export const cartStore = {
  getItems: getCart,

  addItem(product, qty = 1) {
    const items = getCart()
    const existing = items.find(i => i.id === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      items.push({
        id: product.id,
        name_tr: product.name_tr,
        name_en: product.name_en,
        image: product.image,
        price: product.price || 0,
        qty,
      })
    }
    saveCart(items)
  },

  removeItem(id) {
    saveCart(getCart().filter(i => i.id !== id))
  },

  updateQty(id, qty) {
    if (qty <= 0) { this.removeItem(id); return }
    const items = getCart()
    const item = items.find(i => i.id === id)
    if (item) { item.qty = qty; saveCart(items) }
  },

  clear() { saveCart([]) },

  getCount() { return getCart().reduce((s, i) => s + i.qty, 0) },

  getTotal() { return getCart().reduce((s, i) => s + (i.price * i.qty), 0) },
}
