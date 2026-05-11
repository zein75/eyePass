export interface Person {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  photo_url: string | null
  is_active: boolean
  created_at: string
  has_face: boolean
}

export interface PersonCreate {
  full_name: string
  phone?: string
  email?: string
}

export interface Camera {
  id: string
  name: string
  rtsp_url: string
  zone_id: string
  zone_name: string
  is_active: boolean
  is_running: boolean
  error?: string | null
}

export interface CameraCreate {
  name: string
  rtsp_url: string
  zone_id: string
}

export interface Zone {
  id: string
  name: string
  description: string | null
}

export interface ZoneCreate {
  name: string
  description?: string
}

export type Decision = 'allow' | 'deny' | 'unknown'

export interface AccessEvent {
  id: string
  person_id: string | null
  person_name: string | null
  camera_id: string
  camera_name: string
  zone_id: string
  zone_name: string
  decision: Decision
  confidence: number | null
  snapshot_url: string | null
  created_at: string
}

export interface EventFilters {
  zone_id?: string
  decision?: Decision
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export interface AccessRule {
  id: string
  person_id: string
  person_name: string
  zone_id: string
  zone_name: string
  time_from: string
  time_to: string
  days_of_week: number[]
  is_active: boolean
}

export interface AccessRuleCreate {
  person_id: string
  zone_id: string
  time_from: string
  time_to: string
  days_of_week: number[]
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  username: string
  role: 'admin' | 'operator'
}

export interface SystemSettings {
  face_threshold: number
  frame_interval_ms: number
  webhook_url: string
  webhook_enabled: boolean
  snapshot_retention_days: number
}

export interface DashboardStats {
  total_persons: number
  active_persons: number
  total_cameras: number
  running_cameras: number
  events_today: number
  allow_today: number
  deny_today: number
  unknown_today: number
}

export interface HourlyStats {
  hour: number
  allow: number
  deny: number
  unknown: number
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}
