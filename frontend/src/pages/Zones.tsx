import { useState } from 'react'
import { Plus, Shield, Trash2, Clock } from 'lucide-react'
import { useZones, useCreateZone, useDeleteZone, useRules, useCreateRule, useDeleteRule, usePersons } from '../hooks/api'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import type { AccessRuleCreate, ZoneCreate } from '../types'

const DAYS = ['РџРЅ', 'Р’С‚', 'РЎСЂ', 'Р§С‚', 'РџС‚', 'РЎР±', 'Р’СЃ']

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
      <PageHeader title="Р—РѕРЅС‹ Рё РїСЂР°РІРёР»Р° РґРѕСЃС‚СѓРїР°" description="РЈРїСЂР°РІР»РµРЅРёРµ Р·РѕРЅР°РјРё Рё СЂР°СЃРїРёСЃР°РЅРёРµРј РґРѕСЃС‚СѓРїР°" />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Р—РѕРЅС‹</h2>
            <button
              onClick={() => setZoneModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Р”РѕР±Р°РІРёС‚СЊ
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {zonesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !zones?.length ? (
              <EmptyState icon={Shield} title="РќРµС‚ Р·РѕРЅ" />
            ) : (
              <ul className="divide-y divide-gray-50">
                {zones.map((z) => (
                  <li key={z.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{z.name}</p>
                      {z.description && <p className="text-xs text-gray-500">{z.description}</p>}
                    </div>
                    <button
                      onClick={() => { if (confirm(`РЈРґР°Р»РёС‚СЊ Р·РѕРЅСѓ "${z.name}"?`)) deleteZone.mutate(z.id) }}
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

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">РџСЂР°РІРёР»Р° РґРѕСЃС‚СѓРїР°</h2>
            <button
              onClick={() => setRuleModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" /> Р”РѕР±Р°РІРёС‚СЊ
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {rulesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : !rules?.length ? (
              <EmptyState icon={Clock} title="РќРµС‚ РїСЂР°РІРёР»" description="Р”РѕР±Р°РІСЊС‚Рµ РїСЂР°РІРёР»Р° РґРѕСЃС‚СѓРїР° РґР»СЏ РїРѕСЃРµС‚РёС‚РµР»РµР№" />
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
                        <span className="ml-1 text-xs text-gray-500">{r.time_from}вЂ“{r.time_to}</span>
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

      <Modal
        title="РќРѕРІР°СЏ Р·РѕРЅР°"
        open={zoneModal}
        onClose={() => setZoneModal(false)}
        footer={
          <>
            <button onClick={() => setZoneModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">РћС‚РјРµРЅР°</button>
            <button
              onClick={async () => { await createZone.mutateAsync(zoneForm); setZoneModal(false) }}
              disabled={createZone.isPending || !zoneForm.name}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              РЎРѕР·РґР°С‚СЊ
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">РќР°Р·РІР°РЅРёРµ *</label>
          <input
            value={zoneForm.name}
            onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="РћСЃРЅРѕРІРЅРѕР№ Р·Р°Р»"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">РћРїРёСЃР°РЅРёРµ</label>
          <input
            value={zoneForm.description}
            onChange={(e) => setZoneForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </Modal>

      <Modal
        title="РќРѕРІРѕРµ РїСЂР°РІРёР»Рѕ РґРѕСЃС‚СѓРїР°"
        open={ruleModal}
        onClose={() => setRuleModal(false)}
        footer={
          <>
            <button onClick={() => setRuleModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">РћС‚РјРµРЅР°</button>
            <button
              onClick={async () => { await createRule.mutateAsync(ruleForm); setRuleModal(false) }}
              disabled={createRule.isPending || !ruleForm.person_id || !ruleForm.zone_id}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              РЎРѕС…СЂР°РЅРёС‚СЊ
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">РџРѕСЃРµС‚РёС‚РµР»СЊ *</label>
          <select
            value={ruleForm.person_id}
            onChange={(e) => setRuleForm((f) => ({ ...f, person_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Р’С‹Р±РµСЂРёС‚Рµ РїРѕСЃРµС‚РёС‚РµР»СЏ...</option>
            {persons?.items.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Р—РѕРЅР° *</label>
          <select
            value={ruleForm.zone_id}
            onChange={(e) => setRuleForm((f) => ({ ...f, zone_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Р’С‹Р±РµСЂРёС‚Рµ Р·РѕРЅСѓ...</option>
            {zones?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          {(['time_from', 'time_to'] as const).map((field) => (
            <div key={field} className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {field === 'time_from' ? 'РЎ' : 'Р”Рѕ'}
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
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Р”РЅРё РЅРµРґРµР»Рё</label>
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
