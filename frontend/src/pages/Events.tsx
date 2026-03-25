import { useState } from 'react'
import { ClipboardList, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { useEvents, useZones } from '../hooks/api'
import { DecisionBadge } from '../components/Badge'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import type { Decision, EventFilters } from '../types'

const DECISIONS: { value: Decision | ''; label: string }[] = [
  { value: '', label: 'Все решения' },
  { value: 'allow', label: 'Разрешён' },
  { value: 'deny', label: 'Отказ' },
  { value: 'unknown', label: 'Неизвестен' },
]

export default function Events() {
  const [filters, setFilters] = useState<EventFilters>({ page: 1 })
  const { data: zones } = useZones()
  const { data, isLoading } = useEvents(filters)

  const set = (patch: Partial<EventFilters>) =>
    setFilters((f) => ({ ...f, ...patch, page: 1 }))

  return (
    <div>
      <PageHeader title="События доступа" description="Лог всех событий распознавания" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-white px-6 py-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filters.zone_id ?? ''}
          onChange={(e) => set({ zone_id: e.target.value || undefined })}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Все зоны</option>
          {zones?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <select
          value={filters.decision ?? ''}
          onChange={(e) => set({ decision: (e.target.value as Decision) || undefined })}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        >
          {DECISIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <input
          type="date"
          value={filters.date_from ?? ''}
          onChange={(e) => set({ date_from: e.target.value || undefined })}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
        <span className="text-gray-400 text-sm">—</span>
        <input
          type="date"
          value={filters.date_to ?? ''}
          onChange={(e) => set({ date_to: e.target.value || undefined })}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
        />
        {(filters.zone_id || filters.decision || filters.date_from || filters.date_to) && (
          <button
            onClick={() => setFilters({ page: 1 })}
            className="text-xs text-brand-600 hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="p-6">
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : !data?.items.length ? (
            <EmptyState icon={ClipboardList} title="Нет событий" description="Попробуйте изменить фильтры" />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Дата / время</th>
                    <th className="px-4 py-3 text-left">Посетитель</th>
                    <th className="px-4 py-3 text-left">Зона</th>
                    <th className="px-4 py-3 text-left">Камера</th>
                    <th className="px-4 py-3 text-left">Решение</th>
                    <th className="px-4 py-3 text-left">Уверенность</th>
                    <th className="px-4 py-3 text-left">Снимок</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {format(new Date(ev.created_at), 'dd.MM.yy HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {ev.person_name ?? <span className="text-gray-400 italic">Неизвестен</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{ev.zone_name}</td>
                      <td className="px-4 py-3 text-gray-500">{ev.camera_name}</td>
                      <td className="px-4 py-3"><DecisionBadge decision={ev.decision} /></td>
                      <td className="px-4 py-3 text-gray-500">
                        {ev.confidence != null ? `${(ev.confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {ev.snapshot_url ? (
                          <a href={ev.snapshot_url} target="_blank" rel="noreferrer">
                            <img src={ev.snapshot_url} className="h-8 w-12 rounded object-cover" />
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={data.page}
                pages={data.pages}
                total={data.total}
                onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
