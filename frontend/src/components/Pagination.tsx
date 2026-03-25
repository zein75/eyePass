import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  pages: number
  total: number
  onPage: (p: number) => void
}

export default function Pagination({ page, pages, total, onPage }: Props) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
      <span>Всего: {total}</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-medium text-gray-700">{page} / {pages}</span>
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
