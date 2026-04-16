export default function Table({ columns, data, emptyText = "Veri bulunamadı" }) {
  const rows = data || []
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
      <table className="w-full text-sm" style={{ color: 'var(--text-primary)' }}>
        <thead style={{ backgroundColor: 'var(--bg-table-head)', borderBottom: `1px solid var(--border)` }}>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left font-medium"
                style={{ color: 'var(--text-secondary)' }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center"
                style={{ color: 'var(--text-secondary)' }}>{emptyText}</td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={row?.id ?? i}
              style={{ borderTop: `1px solid var(--border)` }}
              className="transition-colors"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row) : (row[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
