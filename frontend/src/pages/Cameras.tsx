import { useState } from 'react'
import { Plus, Camera as CameraIcon, Play, Square, Trash2, AlertCircle } from 'lucide-react'
import { useCameras, useZones, useCreateCamera, useDeleteCamera, useToggleCameraStream } from '../hooks/api'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import type { CameraCreate } from '../types'

export default function Cameras() {
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState<CameraCreate>({ name: '', rtsp_url: '', zone_id: '' })

  const { data: cameras, isLoading } = useCameras()
  const { data: zones }              = useZones()
  const create = useCreateCamera()
  const remove = useDeleteCamera()
  const toggle = useToggleCameraStream()

  const handleCreate = async () => {
    await create.mutateAsync(form)
    setModal(false)
    setForm({ name: '', rtsp_url: '', zone_id: '' })
  }

  return (
    <div>
      <PageHeader
        title="РљР°РјРµСЂС‹"
        description="РЈРїСЂР°РІР»РµРЅРёРµ IP-РєР°РјРµСЂР°РјРё РІРёРґРµРѕРЅР°Р±Р»СЋРґРµРЅРёСЏ"
        action={
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Р”РѕР±Р°РІРёС‚СЊ РєР°РјРµСЂСѓ
          </button>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : !cameras?.length ? (
          <EmptyState icon={CameraIcon} title="РќРµС‚ РєР°РјРµСЂ" description="Р”РѕР±Р°РІСЊС‚Рµ РїРµСЂРІСѓСЋ IP-РєР°РјРµСЂСѓ" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cameras.map((cam) => (
              <div key={cam.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="relative mb-4 h-36 overflow-hidden rounded-lg bg-gray-900">
                  {cam.is_running ? (
                    <>
                      <img
                        src={`/api/v1/cameras/${cam.id}/stream`}
                        className="h-full w-full object-cover"
                        alt={cam.name}
                      />
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-green-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>
                        LIVE
                      </span>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CameraIcon className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                </div>

                {cam.error && (
                  <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {cam.error}
                  </div>
                )}
                <h3 className="font-semibold text-gray-900">{cam.name}</h3>
                <p className="mt-0.5 text-xs text-gray-400 truncate">{cam.rtsp_url}</p>
                <p className="mt-0.5 text-xs text-gray-500">Р—РѕРЅР°: {cam.zone_name}</p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => toggle.mutate({ id: cam.id, running: !cam.is_running })}
                    disabled={toggle.isPending}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                      cam.is_running
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {cam.is_running
                      ? <><Square className="h-3.5 w-3.5" /> РћСЃС‚Р°РЅРѕРІРёС‚СЊ</>
                      : <><Play className="h-3.5 w-3.5" /> Р—Р°РїСѓСЃС‚РёС‚СЊ</>
                    }
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`РЈРґР°Р»РёС‚СЊ РєР°РјРµСЂСѓ "${cam.name}"?`)) remove.mutate(cam.id)
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title="Р”РѕР±Р°РІРёС‚СЊ РєР°РјРµСЂСѓ"
        open={modal}
        onClose={() => setModal(false)}
        footer={
          <>
            <button onClick={() => setModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              РћС‚РјРµРЅР°
            </button>
            <button
              onClick={handleCreate}
              disabled={create.isPending || !form.name || !form.rtsp_url || !form.zone_id}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {create.isPending && <Spinner className="h-4 w-4" />}
              Р”РѕР±Р°РІРёС‚СЊ
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">РќР°Р·РІР°РЅРёРµ *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="РљР°РјРµСЂР° вЂ” Р“Р»Р°РІРЅС‹Р№ РІС…РѕРґ"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">RTSP URL *</label>
          <input
            value={form.rtsp_url}
            onChange={(e) => setForm((f) => ({ ...f, rtsp_url: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="rtsp://192.168.1.100/stream"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Р—РѕРЅР° *</label>
          <select
            value={form.zone_id}
            onChange={(e) => setForm((f) => ({ ...f, zone_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Р’С‹Р±РµСЂРёС‚Рµ Р·РѕРЅСѓ...</option>
            {zones?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  )
}
