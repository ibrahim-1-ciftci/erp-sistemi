export default function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>{total} kayıt, sayfa {page}/{totalPages}</span>
      <div className="flex gap-2">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}
          className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Önceki</button>
        <button disabled={page === totalPages} onClick={() => onChange(page + 1)}
          className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100">Sonraki</button>
      </div>
    </div>
  )
}
