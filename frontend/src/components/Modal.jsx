import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}
            className="hover:opacity-70 transition-opacity"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
