import { useState } from 'react'
import { Plus, Shield, Trash2, Clock } from 'lucide-react'
import { useZones, useCreateZone, useDeleteZone, useRules, useCreateRule, useDeleteRule, usePersons } from '../hooks/api'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import type { AccessRuleCreate, ZoneCreate } from '../types'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function Zones() {
  const [zoneModal, setZoneModal] = useState(false)
  const [ruleModal, setRuleModal] = useState(false)
  const [zoneForm, setZoneForm]   = useState<ZoneCreate>({ name: '', description: '' })
  const [ruleForm, setRuleForm]   = useState<AccessRuleCreate>({
    person_id: '', zone_id: '', time_from: '08:00', time_to: '22:00', days_of_week: [1,2,3,4,5],
  })

  const { data: zones, isLoading: zonesLoading } = useZones()
  const { data: rules, isLoading: rulesLoading } = useRules()
  const { data: persons }                         = usePersons(1, '')
  const createZone = useCreateZone()
  const deleteZone = useDeleteZone()
  const createRule = useCreateRule()
  const deleteRule = useDeleteRule()

  const toggleDay = (day: number) =>
    setRuleForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day)
        ? f.days_of_week.filter((d) => d !== day)
        : [...f.days_of_week, day].sort(),
    }))

  return (
    <div>
      <PageHeader title="Зоны и правила доступа" description="Управление зонами и расписанием доступа" />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        {/* Zones */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Зоны</h2>
            <button
              onClick={() => setZoneModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Добавить
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {zonesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !zones?.length ? (
              <EmptyState icon={Shield} title="Нет зон" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {zones.map((z) => (
                  <li key={z.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{z.name}</p>
                      {z.description && <p className="text-xs text-gray-500">{z.description}</p>}
                    </div>
                    <button
                      onClick={() => { if (confirm(`Удалить зону "${z.name}"?`)) deleteZone.mutate(z.id) }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Rules */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Правила доступа</h2>
            <button
              onClick={() => setRuleModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Добавить
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {rulesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !rules?.length ? (
              <EmptyState icon={Clock} title="Нет правил" description="Добавьте правила доступа для посетителей" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {rules.map((r) => (
                  <li key={r.id} className="flex items-start justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{r.person_name}</p>
                      <p className="text-xs text-gray-500">{r.zone_name}</p>
                      <div className="mt-1 flex gap-1">
                        {DAYS.map((d, i) => (
                          <span
                            key={i}
                            className={`rounded px-1 py-0.5 text-xs font-medium ${
                              r.days_of_week.includes(i + 1)
                                ? 'bg-brand-100 text-brand-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                        <span className="ml-1 text-xs text-gray-500">{r.time_from}–{r.time_to}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteRule.mutate(r.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Zone Modal */}
      <Modal
        title="Новая зона"
        open={zoneModal}
        onClose={() => setZoneModal(false)}
        footer={
          <>
            <button onClick={() => setZoneModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Отмена</button>
            <button
              onClick={async () => { await createZone.mutateAsync(zoneForm); setZoneModal(false) }}
              disabled={createZone.isPending || !zoneForm.name}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Создать
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Название *</label>
          <input
            value={zoneForm.name}
            onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="Основной зал"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Описание</label>
          <input
            value={zoneForm.description}
            onChange={(e) => setZoneForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </Modal>

      {/* Rule Modal */}
      <Modal
        title="Новое правило доступа"
        open={ruleModal}
        onClose={() => setRuleModal(false)}
        footer={
          <>
            <button onClick={() => setRuleModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">Отмена</button>
            <button
              onClick={async () => { await createRule.mutateAsync(ruleForm); setRuleModal(false) }}
              disabled={createRule.isPending || !ruleForm.person_id || !ruleForm.zone_id}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Сохранить
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Посетитель *</label>
          <select
            value={ruleForm.person_id}
            onChange={(e) => setRuleForm((f) => ({ ...f, person_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Выберите посетителя...</option>
            {persons?.items.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Зона *</label>
          <select
            value={ruleForm.zone_id}
            onChange={(e) => setRuleForm((f) => ({ ...f, zone_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Выберите зону...</option>
            {zones?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          {(['time_from', 'time_to'] as const).map((field) => (
            <div key={field} className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {field === 'time_from' ? 'С' : 'До'}
              </label>
              <input
                type="time"
                value={ruleForm[field]}
                onChange={(e) => setRuleForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Дни недели</label>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i + 1)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  ruleForm.days_of_week.includes(i + 1)
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
