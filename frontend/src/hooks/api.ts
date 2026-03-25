import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AccessEvent, AccessRule, AccessRuleCreate, Camera, CameraCreate,
  DashboardStats, EventFilters, HourlyStats, Page, Person,
  PersonCreate, TokenResponse, Zone, ZoneCreate,
} from '../types'
import { useAuthStore } from '../store/auth'
import * as mock from '../mocks/data'

const DEMO = import.meta.env.VITE_DEMO === 'true'

// Хук-заглушка для демо-режима: возвращает статичные данные
function demoQuery<T>(data: T) {
  return useQuery<T>({ queryKey: ['demo'], queryFn: () => Promise.resolve(data), initialData: data })
}

// Заглушка мутации для демо-режима
function demoMutation<TVar = void>() {
  return useMutation<void, Error, TVar>({ mutationFn: () => Promise.resolve() })
}

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

export const usePersons = (page = 1, search = '') => {
  if (DEMO) return demoQuery(mock.mockPersonsPage)
  return useQuery({
    queryKey: [...personKeys.list(page), search],
    queryFn: () =>
      api.get<Page<Person>>('/persons', { params: { page, page_size: 20, search } })
        .then((r) => r.data),
  })
}

export const usePerson = (id: string) => {
  if (DEMO) return demoQuery(mock.mockPersons.find((p) => p.id === id) ?? mock.mockPersons[0])
  return useQuery({
    queryKey: personKeys.detail(id),
    queryFn: () => api.get<Person>(`/persons/${id}`).then((r) => r.data),
  })
}

export const useCreatePerson = () => {
  if (DEMO) return demoMutation<PersonCreate>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PersonCreate) =>
      api.post<Person>('/persons', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: personKeys.all }),
  })
}

export const useTogglePerson = () => {
  if (DEMO) return demoMutation<{ id: string; is_active: boolean }>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.put<Person>(`/persons/${id}`, { is_active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: personKeys.all }),
  })
}

export const useUploadFace = (personId: string) => {
  if (DEMO) return demoMutation<File[]>()
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
  if (DEMO) return demoMutation()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete(`/persons/${personId}/faces`),
    onSuccess: () => qc.invalidateQueries({ queryKey: personKeys.detail(personId) }),
  })
}

// ─── Cameras ──────────────────────────────────────────────────────────────────
const camKeys = { all: ['cameras'] as const }

export const useCameras = () => {
  if (DEMO) return demoQuery(mock.mockCameras)
  return useQuery({
    queryKey: camKeys.all,
    queryFn: () => api.get<Camera[]>('/cameras').then((r) => r.data),
  })
}

export const useCreateCamera = () => {
  if (DEMO) return demoMutation<CameraCreate>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CameraCreate) =>
      api.post<Camera>('/cameras', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: camKeys.all }),
  })
}

export const useDeleteCamera = () => {
  if (DEMO) return demoMutation<string>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cameras/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: camKeys.all }),
  })
}

export const useToggleCameraStream = () => {
  if (DEMO) return demoMutation<{ id: string; running: boolean }>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, running }: { id: string; running: boolean }) =>
      api.post(`/cameras/${id}/${running ? 'start' : 'stop'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: camKeys.all }),
  })
}

// ─── Zones ────────────────────────────────────────────────────────────────────
const zoneKeys = { all: ['zones'] as const }

export const useZones = () => {
  if (DEMO) return demoQuery(mock.mockZones)
  return useQuery({
    queryKey: zoneKeys.all,
    queryFn: () => api.get<Zone[]>('/zones').then((r) => r.data),
  })
}

export const useCreateZone = () => {
  if (DEMO) return demoMutation<ZoneCreate>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ZoneCreate) =>
      api.post<Zone>('/zones', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: zoneKeys.all }),
  })
}

export const useDeleteZone = () => {
  if (DEMO) return demoMutation<string>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/zones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: zoneKeys.all }),
  })
}

// ─── Access Rules ─────────────────────────────────────────────────────────────
const ruleKeys = { all: ['rules'] as const }

export const useRules = () => {
  if (DEMO) return demoQuery(mock.mockRules)
  return useQuery({
    queryKey: ruleKeys.all,
    queryFn: () => api.get<AccessRule[]>('/rules').then((r) => r.data),
  })
}

export const useCreateRule = () => {
  if (DEMO) return demoMutation<AccessRuleCreate>()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AccessRuleCreate) =>
      api.post<AccessRule>('/rules', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ruleKeys.all }),
  })
}

export const useDeleteRule = () => {
  if (DEMO) return demoMutation<string>()
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

export const useEvents = (filters: EventFilters = {}) => {
  if (DEMO) return demoQuery(mock.mockEventsPage)
  return useQuery({
    queryKey: eventKeys.filtered(filters),
    queryFn: () =>
      api.get<Page<AccessEvent>>('/events', { params: { ...filters, page_size: 25 } })
        .then((r) => r.data),
  })
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export const useDashboardStats = () => {
  if (DEMO) return demoQuery(mock.mockStats)
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.get<DashboardStats>('/events/stats').then((r) => r.data),
    refetchInterval: 30_000,
  })
}

export const useHourlyStats = () => {
  if (DEMO) return demoQuery(mock.mockHourly)
  return useQuery({
    queryKey: ['stats', 'hourly'],
    queryFn: () => api.get<HourlyStats[]>('/events/stats/hourly').then((r) => r.data),
    refetchInterval: 60_000,
  })
}
