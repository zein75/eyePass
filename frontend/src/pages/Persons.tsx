import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import { usePersons, useCreatePerson, useTogglePerson } from '../hooks/api'
import { StatusBadge } from '../components/Badge'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Pagination from '../components/Pagination'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import type { PersonCreate } from '../types'

export default function Persons() {
  const navigate = useNavigate()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState<PersonCreate>({ full_name: '', phone: '', email: '' })

  const { data, isLoading } = usePersons(page, search)
  const create  = useCreatePerson()
  const toggle  = useTogglePerson()

  const handleCreate = async () => {
    await create.mutateAsync(form)
    setModal(false)
    setForm({ full_name: '', phone: '', email: '' })
  }

  return (
    <div>
      <PageHeader
        title="Посетители"
        description="База зарегистрированных лиц"
        action={
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Добавить
          </button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Поиск по имени..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : !data?.items.length ? (
            <EmptyState icon={Users} title="Нет посетителей" description="Добавьте первого посетителя" />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3">Имя</th>
                    <th className="px-4 py-3">Телефон</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Биометрия</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/persons/${p.id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{p.full_name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{p.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${p.has_face ? 'text-green-600' : 'text-gray-400'}`}>
                          {p.has_face ? '✓ Есть' : '✗ Нет'}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge active={p.is_active} /></td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggle.mutate({ id: p.id, is_active: !p.is_active })}
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          {p.is_active ? 'Деактивировать' : 'Активировать'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      <Modal
        title="Новый посетитель"
        open={modal}
        onClose={() => setModal(false)}
        footer={
          <>
            <button onClick={() => setModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={create.isPending || !form.full_name}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {create.isPending && <Spinner className="h-4 w-4" />}
              Создать
            </button>
          </>
        }
      >
        {(['full_name', 'phone', 'email'] as const).map((field) => (
          <div key={field}>
            <label className="mb-1 block text-sm font-medium text-gray-700 capitalize">
              {field === 'full_name' ? 'Полное имя *' : field === 'phone' ? 'Телефон' : 'Email'}
            </label>
            <input
              value={form[field] ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        ))}
      </Modal>
    </div>
  )
}
