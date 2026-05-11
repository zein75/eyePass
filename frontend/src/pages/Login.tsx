import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Lock, User, FlaskConical } from 'lucide-react'
import { getCurrentUser, login } from '../hooks/api'
import { useAuthStore } from '../store/auth'
import Spinner from '../components/Spinner'

const DEMO = import.meta.env.VITE_DEMO === 'true'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const setToken = useAuthStore((s) => s.setToken)
  const setUser  = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const handleDemo = () => {
    setToken('demo-token')
    setUser({ id: 'demo', username: 'demo', role: 'admin' })
    navigate('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      setToken(data.access_token)
      const user = await getCurrentUser()
      setUser(user)
      navigate('/dashboard')
    } catch {
      setError('РќРµРІРµСЂРЅРѕРµ РёРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РёР»Рё РїР°СЂРѕР»СЊ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <Eye className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">eyePass</h1>
          <p className="mt-1 text-sm text-gray-500">РџР°РЅРµР»СЊ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂР°</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                РРјСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                РџР°СЂРѕР»СЊ
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading && <Spinner className="h-4 w-4" />}
              Р’РѕР№С‚Рё
            </button>

            {DEMO && (
              <button
                type="button"
                onClick={handleDemo}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100"
              >
                <FlaskConical className="h-4 w-4" />
                Р”РµРјРѕ-СЂРµР¶РёРј (Р±РµР· СЃРµСЂРІРµСЂР°)
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
