import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Camera, ClipboardList,
  Shield, Settings, LogOut, Eye,
} from 'lucide-react'
import { useAuthStore } from '../store/auth'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/persons',   icon: Users,           label: 'Посетители' },
  { to: '/cameras',   icon: Camera,          label: 'Камеры' },
  { to: '/events',    icon: ClipboardList,   label: 'События' },
  { to: '/zones',     icon: Shield,          label: 'Зоны и правила' },
  { to: '/settings',  icon: Settings,        label: 'Настройки' },
]

export default function Layout() {
  const logout = useAuthStore((s) => s.logout)
  const user   = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 flex-col bg-gray-900 text-white">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-800">
          <Eye className="h-6 w-6 text-brand-500" />
          <span className="text-lg font-semibold tracking-tight">eyePass</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-3 mb-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-800 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.username ?? 'Admin'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role ?? 'admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
