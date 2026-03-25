import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, UserCircle } from 'lucide-react'
import { usePerson, useUploadFace, useDeleteFace, useEvents } from '../hooks/api'
import { StatusBadge, DecisionBadge } from '../components/Badge'
import FaceUploader from '../components/FaceUploader'
import Spinner from '../components/Spinner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: person, isLoading } = usePerson(id!)
  const { data: events } = useEvents({ page: 1, page_size: 10 })
  const uploadFace = useUploadFace(id!)
  const deleteFace = useDeleteFace(id!)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!person) return <p className="p-8 text-gray-500">Посетитель не найден</p>

  const personEvents = events?.items.filter((e) => e.person_id === id) ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 bg-white px-8 py-5">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{person.full_name}</h1>
          <p className="text-sm text-gray-500">
            Добавлен {format(new Date(person.created_at), 'd MMM yyyy', { locale: ru })}
          </p>
        </div>
        <StatusBadge active={person.is_active} />
      </div>

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {/* Left — info + face */}
        <div className="space-y-5 lg:col-span-1">
          {/* Avatar */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm text-center">
            {person.photo_url ? (
              <img src={person.photo_url} className="mx-auto h-28 w-28 rounded-full object-cover" />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
                <UserCircle className="h-16 w-16 text-gray-300" />
              </div>
            )}
            <h2 className="mt-3 font-semibold text-gray-900">{person.full_name}</h2>
            {person.phone && <p className="text-sm text-gray-500">{person.phone}</p>}
            {person.email && <p className="text-sm text-gray-500">{person.email}</p>}
          </div>

          {/* Biometrics */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Биометрия</h2>
              {person.has_face && (
                <button
                  onClick={() => deleteFace.mutate()}
                  disabled={deleteFace.isPending}
                  className="flex items-center gap-1 rounded text-xs text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" /> Удалить
                </button>
              )}
            </div>
            {person.has_face ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Лицо зарегистрировано
              </div>
            ) : (
              <FaceUploader
                onUpload={async (files) => { await uploadFace.mutateAsync(files) }}
                loading={uploadFace.isPending}
              />
            )}
          </div>
        </div>

        {/* Right — visit history */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700">История визитов</h2>
            </div>
            {personEvents.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Нет событий</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Дата</th>
                    <th className="px-4 py-3 text-left">Зона</th>
                    <th className="px-4 py-3 text-left">Камера</th>
                    <th className="px-4 py-3 text-left">Решение</th>
                    <th className="px-4 py-3 text-left">Уверенность</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {personEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td className="px-4 py-3 text-gray-500">
                        {format(new Date(ev.created_at), 'dd.MM.yy HH:mm')}
                      </td>
                      <td className="px-4 py-3">{ev.zone_name}</td>
                      <td className="px-4 py-3 text-gray-500">{ev.camera_name}</td>
                      <td className="px-4 py-3"><DecisionBadge decision={ev.decision} /></td>
                      <td className="px-4 py-3 text-gray-500">
                        {ev.confidence != null ? `${(ev.confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
