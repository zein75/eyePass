import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Persons from './pages/Persons'
import PersonDetail from './pages/PersonDetail'
import Cameras from './pages/Cameras'
import Events from './pages/Events'
import Zones from './pages/Zones'
import Settings from './pages/Settings'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="persons" element={<Persons />} />
          <Route path="persons/:id" element={<PersonDetail />} />
          <Route path="cameras" element={<Cameras />} />
          <Route path="events" element={<Events />} />
          <Route path="zones" element={<Zones />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
