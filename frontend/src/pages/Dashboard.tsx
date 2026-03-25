import { useEffect, useRef, useState } from 'react'
import { Users, Camera, CheckCircle, XCircle, HelpCircle, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useDashboardStats, useHourlyStats } from '../hooks/api'
import StatCard from '../components/StatCard'
import { DecisionBadge } from '../components/Badge'
import type { AccessEvent } from '../types'
import Spinner from '../components/Spinner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: hourly } = useHourlyStats()
  const [liveEvents, setLiveEvents] = useState<AccessEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  // WebSocket — живая лента событий
  useEffect(() => {
    const ws = new WebSocket(`ws://${location.host}/ws/events`)
    wsRef.current = ws
    ws.onmessage = (e) => {
      const event: AccessEvent = JSON.parse(e.data)
      setLiveEvents((prev) => [event, ...prev].slice(0, 20))
    }
    return () => ws.close()
  }, [])

  if (statsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), 'd MMMM yyyy', { locale: ru })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Посетителей"
          value={stats?.active_persons ?? 0}
          icon={Users}
          sub={`всего ${stats?.total_persons ?? 0}`}
        />
        <StatCard
          label="Камер активно"
          value={`${stats?.running_cameras ?? 0} / ${stats?.total_cameras ?? 0}`}
          icon={Camera}
          color="text-blue-500"
        />
        <StatCard
          label="Разрешений сегодня"
          value={stats?.allow_today ?? 0}
          icon={CheckCircle}
          color="text-green-500"
        />
        <StatCard
          label="Отказов сегодня"
          value={stats?.deny_today ?? 0}
          icon={XCircle}
          color="text-red-500"
          sub={`неизвестных: ${stats?.unknown_today ?? 0}`}
        />
      </div>

      {/* Chart + Live Feed */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hourly chart */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Активность по часам</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourly ?? []} barSize={8}>
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="allow"   name="Разрешён"   fill="#4ade80" radius={4} />
              <Bar dataKey="deny"    name="Отказ"      fill="#f87171" radius={4} />
              <Bar dataKey="unknown" name="Неизвестен" fill="#fbbf24" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live events */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <h2 className="text-sm font-semibold text-gray-700">Живая лента</h2>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[220px] scrollbar-thin">
            {liveEvents.length === 0 && (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <Activity className="h-6 w-6 mb-2" />
                <p className="text-sm">Ожидание событий...</p>
              </div>
            )}
            {liveEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {ev.person_name ?? 'Неизвестный'}
                  </p>
                  <p className="text-xs text-gray-400">{ev.zone_name} · {ev.camera_name}</p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
                  <DecisionBadge decision={ev.decision} />
                  <span className="text-xs text-gray-400">
                    {format(new Date(ev.created_at), 'HH:mm:ss')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
