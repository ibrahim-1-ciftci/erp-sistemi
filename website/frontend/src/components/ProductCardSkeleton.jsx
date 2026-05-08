export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-5 space-y-2.5">
        <div className="h-3 skeleton rounded-full w-1/3" />
        <div className="h-4 skeleton rounded-full w-3/4" />
        <div className="h-3 skeleton rounded-full w-full" />
        <div className="h-3 skeleton rounded-full w-2/3" />
      </div>
    </div>
  )
}
