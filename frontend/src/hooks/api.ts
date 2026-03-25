import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AccessEvent, AccessRule, AccessRuleCreate, Camera, CameraCreate,
  DashboardStats, EventFilters, HourlyStats, Page, Person,
  PersonCreate, TokenResponse, Zone, ZoneCreate,
} from '../types'
import { useAuthStore } from '../store/auth'

// ─── Axios instance ───────────────────────────────────────────────────────────
export const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().logout()
    return Promise.reject(err)
  },
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post<TokenResponse>('/auth/login', new URLSearchParams({ username, password }))
    .then((r) => r.data)

// ─── Persons ──────────────────────────────────────────────────────────────────
const personKeys = {
  all: ['persons'] as const,
  list: (p?: number) => [...personKeys.all, 'list', p] as const,
  detail: (id: string) => [...personKeys.all, id] as const,
}

export const usePersons = (page = 1, search = '') =>
  useQuery({
    queryKey: [...personKeys.list(page), search],
    queryFn: () =>
      api.get<Page<Person>>('/persons', { params: { page, page_size: 20, search } })
        .then((r) => r.data),
  })

export const usePerson = (id: string) =>
  useQuery({
    queryKey: personKeys.detail(id),
    queryFn: () => api.get<Person>(`/persons/${id}`).then((r) => r.data),
  })

export const useCreatePerson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PersonCreate) =>
      api.post<Person>('/persons', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: personKeys.all }),
  })
}

export const useTogglePerson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.put<Person>(`/persons/${id}`, { is_active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: personKeys.all }),
  })
}

export const useUploadFace = (personId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (files: File[]) => {
      const form = new FormData()
      files.forEach((f) => form.append('files', f))
      return api.post(`/persons/${personId}/faces`, form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: personKeys.detail(personId) }),
  })
}

export const useDeleteFace = (personId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/persons/${personId}/faces`),
    onSuccess: () => qc.invalidateQueries({ queryKey: personKeys.detail(personId) }),
  })
}

// ─── Cameras ──────────────────────────────────────────────────────────────────
const camKeys = { all: ['cameras'] as const }

export const useCameras = () =>
  useQuery({
    queryKey: camKeys.all,
    queryFn: () => api.get<Camera[]>('/cameras').then((r) => r.data),
  })

export const useCreateCamera = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CameraCreate) =>
      api.post<Camera>('/cameras', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: camKeys.all }),
  })
}

export const useDeleteCamera = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cameras/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: camKeys.all }),
  })
}

export const useToggleCameraStream = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, running }: { id: string; running: boolean }) =>
      api.post(`/cameras/${id}/${running ? 'start' : 'stop'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: camKeys.all }),
  })
}

// ─── Zones ────────────────────────────────────────────────────────────────────
const zoneKeys = { all: ['zones'] as const }

export const useZones = () =>
  useQuery({
    queryKey: zoneKeys.all,
    queryFn: () => api.get<Zone[]>('/zones').then((r) => r.data),
  })

export const useCreateZone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ZoneCreate) =>
      api.post<Zone>('/zones', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: zoneKeys.all }),
  })
}

export const useDeleteZone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/zones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: zoneKeys.all }),
  })
}

// ─── Access Rules ─────────────────────────────────────────────────────────────
const ruleKeys = { all: ['rules'] as const }

export const useRules = () =>
  useQuery({
    queryKey: ruleKeys.all,
    queryFn: () => api.get<AccessRule[]>('/rules').then((r) => r.data),
  })

export const useCreateRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AccessRuleCreate) =>
      api.post<AccessRule>('/rules', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ruleKeys.all }),
  })
}

export const useDeleteRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ruleKeys.all }),
  })
}

// ─── Events ───────────────────────────────────────────────────────────────────
const eventKeys = {
  all: ['events'] as const,
  filtered: (f: EventFilters) => [...eventKeys.all, f] as const,
}

export const useEvents = (filters: EventFilters = {}) =>
  useQuery({
    queryKey: eventKeys.filtered(filters),
    queryFn: () =>
      api.get<Page<AccessEvent>>('/events', { params: { ...filters, page_size: 25 } })
        .then((r) => r.data),
  })

// ─── Stats ────────────────────────────────────────────────────────────────────
export const useDashboardStats = () =>
  useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.get<DashboardStats>('/events/stats').then((r) => r.data),
    refetchInterval: 30_000,
  })

export const useHourlyStats = () =>
  useQuery({
    queryKey: ['stats', 'hourly'],
    queryFn: () => api.get<HourlyStats[]>('/events/stats/hourly').then((r) => r.data),
    refetchInterval: 60_000,
  })
