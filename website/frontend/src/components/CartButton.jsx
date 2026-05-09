import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { cartStore } from '../store/cartStore'

export default function CartButton({ transparent }) {
  const navigate = useNavigate()
  const [count, setCount] = useState(cartStore.getCount())

  useEffect(() => {
    const handler = () => setCount(cartStore.getCount())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  if (count === 0) return null

  return (
    <button
      onClick={() => navigate('/sepet')}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors flex-shrink-0 ${
        transparent
          ? 'border-white/40 text-white hover:bg-white/15'
          : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
      }`}>
      <ShoppingCart size={16} />
      <span className="text-xs font-bold">{count}</span>
    </button>
  )
}
