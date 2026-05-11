import { useEffect, useState } from 'react'
import { Save, RefreshCw, Plus, Trash2, UserCheck, UserX, Key, Users } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import { useAuthStore } from '../store/auth'
import { api, getSystemSettings, updateSystemSettings } from '../hooks/api'


interface UserOut {
  id: string
  username: string
  role: 'admin' | 'operator'
  is_active: boolean
}

interface SettingsForm {
  face_threshold: number
  frame_interval_ms: number
  webhook_url: string
  webhook_enabled: boolean
  snapshot_retention_days: number
}


const fetchUsers = () => api.get<UserOut[]>('/users').then((r: { data: UserOut[] }) => r.data)

const createUser = (data: { username: string; password: string; role: string }) =>
  api.post<UserOut>('/users', data).then((r: { data: UserOut }) => r.data)

const deleteUser = (id: string) => api.delete(`/users/${id}`)

const toggleUser = (id: string) => api.patch<UserOut>(`/users/${id}/toggle`).then((r: { data: UserOut }) => r.data)

const changePassword = (data: { current_password: string; new_password: string }) =>
  api.post('/users/me/password', data)


export default function Settings() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [form, setForm] = useState<SettingsForm>({
    face_threshold: 0.40,
    frame_interval_ms: 500,
    webhook_url: '',
    webhook_enabled: false,
    snapshot_retention_days: 30,
  })
  const [saved, setSaved] = useState(false)

  const [createModal, setCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' })

  const [pwModal, setPwModal] = useState(false)
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwDone, setPwDone] = useState(false)

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isAdmin,
  })

  const { data: systemSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
    enabled: isAdmin,
  })

  useEffect(() => {
    if (systemSettings) setForm(systemSettings)
  }, [systemSettings])

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setCreateModal(false)
      setNewUser({ username: '', password: '', role: 'operator' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const pwMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPwDone(true)
      setPwError('')
      setTimeout(() => {
        setPwModal(false)
        setPwDone(false)
        setPwForm({ current_password: '', new_password: '', confirm: '' })
      }, 1500)
    },
    onError: (e: any) => {
      setPwError(e?.response?.data?.detail ?? 'Ошибка смены пароля')
    },
  })

  const settingsMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: (data) => {
      qc.setQueryData(['system-settings'], data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleSave = () => {
    if (!isAdmin) return
    settingsMutation.mutate(form)
  }

  const handlePwSubmit = () => {
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('Пароли не совпадают')
      return
    }
    if (pwForm.new_password.length < 6) {
      setPwError('Минимум 6 символов')
      return
    }
    setPwError('')
    pwMutation.mutate({ current_password: pwForm.current_password, new_password: pwForm.new_password })
  }

  return (
    <div>
      <PageHeader title="Настройки" description="Конфигурация системы распознавания" />

      <div className="p-6 max-w-2xl space-y-6">

        {isAdmin && (
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Users className="h-4 w-4 text-brand-600" /> Управление пользователями
              </h2>
              <button
                onClick={() => setCreateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                <Plus className="h-3.5 w-3.5" /> Добавить
              </button>
            </div>

            {usersLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {users?.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{u.username}</span>
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {u.role === 'admin' ? 'Администратор' : 'Оператор'}
                      </span>
                      {!u.is_active && (
                        <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Неактивен
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {u.id !== user?.id && (
                        <>
                          <button
                            onClick={() => toggleMutation.mutate(u.id)}
                            disabled={toggleMutation.isPending}
                            title={u.is_active ? 'Деактивировать' : 'Активировать'}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                          >
                            {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Удалить пользователя «${u.username}»?`)) {
                                deleteMutation.mutate(u.id)
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {u.id === user?.id && (
                        <span className="text-xs text-gray-400">(вы)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Key className="h-4 w-4 text-brand-600" /> Смена пароля
          </h2>
          <button
            onClick={() => setPwModal(true)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Изменить пароль
          </button>
        </section>

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

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!isAdmin || settingsLoading || settingsMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
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

      <Modal
        title="Добавить пользователя"
        open={createModal}
        onClose={() => setCreateModal(false)}
        footer={
          <>
            <button onClick={() => setCreateModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              Отмена
            </button>
            <button
              onClick={() => createMutation.mutate(newUser)}
              disabled={createMutation.isPending || !newUser.username || !newUser.password}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Spinner className="h-4 w-4" />}
              Создать
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Имя пользователя *</label>
          <input
            value={newUser.username}
            onChange={(e) => setNewUser((u) => ({ ...u, username: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="operator1"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Пароль *</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Роль</label>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="operator">Оператор</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        {createMutation.isError && (
          <p className="text-xs text-red-600">{(createMutation.error as any)?.response?.data?.detail ?? 'Ошибка'}</p>
        )}
      </Modal>

      <Modal
        title="Смена пароля"
        open={pwModal}
        onClose={() => { setPwModal(false); setPwError(''); setPwDone(false); setPwForm({ current_password: '', new_password: '', confirm: '' }) }}
        footer={
          <>
            <button onClick={() => setPwModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50">
              Отмена
            </button>
            <button
              onClick={handlePwSubmit}
              disabled={pwMutation.isPending || pwDone}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {pwMutation.isPending && <Spinner className="h-4 w-4" />}
              {pwDone ? 'Изменён!' : 'Сохранить'}
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Текущий пароль</label>
          <input
            type="password"
            value={pwForm.current_password}
            onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Новый пароль</label>
          <input
            type="password"
            value={pwForm.new_password}
            onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Повторите пароль</label>
          <input
            type="password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {pwError && <p className="text-xs text-red-600">{pwError}</p>}
      </Modal>
    </div>
  )
}
