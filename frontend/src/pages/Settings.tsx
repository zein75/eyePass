import { useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'

interface SettingsForm {
  face_threshold: number
  frame_interval_ms: number
  webhook_url: string
  webhook_enabled: boolean
  snapshot_retention_days: number
}

export default function Settings() {
  const [form, setForm] = useState<SettingsForm>({
    face_threshold: 0.40,
    frame_interval_ms: 500,
    webhook_url: '',
    webhook_enabled: false,
    snapshot_retention_days: 30,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // TODO: POST /api/v1/settings
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Настройки" description="Конфигурация системы распознавания" />

      <div className="p-6 max-w-2xl space-y-6">
        {/* Face recognition */}
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Распознавание лиц</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Порог схожести: <span className="text-brand-600 font-semibold">{form.face_threshold.toFixed(2)}</span>
              </label>
              <input
                type="range" min={0.2} max={0.7} step={0.01}
                value={form.face_threshold}
                onChange={(e) => setForm((f) => ({ ...f, face_threshold: +e.target.value }))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.20 — менее строгий</span>
                <span>0.70 — более строгий</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Интервал захвата кадра (мс)
              </label>
              <input
                type="number" min={100} max={5000} step={100}
                value={form.frame_interval_ms}
                onChange={(e) => setForm((f) => ({ ...f, frame_interval_ms: +e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Хранить снимки (дней)
              </label>
              <input
                type="number" min={1} max={365}
                value={form.snapshot_retention_days}
                onChange={(e) => setForm((f) => ({ ...f, snapshot_retention_days: +e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </section>

        {/* Webhook */}
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Интеграция СКУД (Webhook)</h2>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-xs text-gray-500">Включить</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.webhook_enabled}
                  onChange={(e) => setForm((f) => ({ ...f, webhook_enabled: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`h-5 w-9 rounded-full transition-colors ${form.webhook_enabled ? 'bg-brand-600' : 'bg-gray-200'}`} />
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.webhook_enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">URL вебхука</label>
            <input
              value={form.webhook_url}
              onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))}
              disabled={!form.webhook_enabled}
              placeholder="https://your-skud.example.com/webhook"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Save className="h-4 w-4" />
            {saved ? 'Сохранено!' : 'Сохранить'}
          </button>
          <button
            onClick={() => setForm({ face_threshold: 0.40, frame_interval_ms: 500, webhook_url: '', webhook_enabled: false, snapshot_retention_days: 30 })}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Сбросить
          </button>
        </div>
      </div>
    </div>
  )
}
