import type {
  Person, Camera, Zone, AccessEvent, AccessRule,
  DashboardStats, HourlyStats, Page,
} from '../types'

export const mockZones: Zone[] = [
  { id: 'z1', name: 'Основной зал', description: 'Тренажёрный зал, 1 этаж' },
  { id: 'z2', name: 'Бассейн', description: 'Плавательный комплекс' },
  { id: 'z3', name: 'Сауна', description: 'Финская и турецкая баня' },
  { id: 'z4', name: 'Рецепция', description: 'Главный вход' },
]

export const mockPersons: Person[] = [
  { id: 'p1', full_name: 'Иванов Иван Иванович',   phone: '+7 900 123-45-67', email: 'ivanov@mail.ru',  photo_url: null, is_active: true,  created_at: '2026-01-10T09:00:00Z', has_face: true  },
  { id: 'p2', full_name: 'Петрова Анна Сергеевна',  phone: '+7 901 234-56-78', email: 'petrova@mail.ru', photo_url: null, is_active: true,  created_at: '2026-01-15T10:30:00Z', has_face: true  },
  { id: 'p3', full_name: 'Сидоров Дмитрий Олегович',phone: '+7 902 345-67-89', email: null,              photo_url: null, is_active: true,  created_at: '2026-02-01T08:00:00Z', has_face: false },
  { id: 'p4', full_name: 'Козлова Мария Павловна',  phone: '+7 903 456-78-90', email: 'kozlova@mail.ru', photo_url: null, is_active: false, created_at: '2026-02-14T11:00:00Z', has_face: true  },
  { id: 'p5', full_name: 'Новиков Алексей Игоревич',phone: '+7 904 567-89-01', email: null,              photo_url: null, is_active: true,  created_at: '2026-03-01T07:30:00Z', has_face: true  },
  { id: 'p6', full_name: 'Морозова Елена Викторовна',phone:'+7 905 678-90-12', email: 'morozova@mail.ru',photo_url: null, is_active: true,  created_at: '2026-03-10T09:15:00Z', has_face: false },
]

export const mockPersonsPage: Page<Person> = {
  items: mockPersons, total: 6, page: 1, page_size: 20, pages: 1,
}

export const mockCameras: Camera[] = [
  { id: 'c1', name: 'Главный вход',   rtsp_url: 'rtsp://192.168.1.101/stream', zone_id: 'z4', zone_name: 'Рецепция',     is_active: true, is_running: true  },
  { id: 'c2', name: 'Зал — север',   rtsp_url: 'rtsp://192.168.1.102/stream', zone_id: 'z1', zone_name: 'Основной зал', is_active: true, is_running: true  },
  { id: 'c3', name: 'Зал — юг',      rtsp_url: 'rtsp://192.168.1.103/stream', zone_id: 'z1', zone_name: 'Основной зал', is_active: true, is_running: false },
  { id: 'c4', name: 'Бассейн вход',  rtsp_url: 'rtsp://192.168.1.104/stream', zone_id: 'z2', zone_name: 'Бассейн',      is_active: true, is_running: true  },
]

export const mockEvents: AccessEvent[] = [
  { id: 'e1',  person_id: 'p1', person_name: 'Иванов Иван Иванович',    camera_id: 'c1', camera_name: 'Главный вход',  zone_id: 'z4', zone_name: 'Рецепция',     decision: 'allow',   confidence: 0.94, snapshot_url: null, created_at: '2026-03-25T08:01:00Z' },
  { id: 'e2',  person_id: 'p2', person_name: 'Петрова Анна Сергеевна',  camera_id: 'c1', camera_name: 'Главный вход',  zone_id: 'z4', zone_name: 'Рецепция',     decision: 'allow',   confidence: 0.91, snapshot_url: null, created_at: '2026-03-25T08:15:00Z' },
  { id: 'e3',  person_id: null, person_name: null,                       camera_id: 'c2', camera_name: 'Зал — север',  zone_id: 'z1', zone_name: 'Основной зал', decision: 'unknown', confidence: null, snapshot_url: null, created_at: '2026-03-25T08:32:00Z' },
  { id: 'e4',  person_id: 'p4', person_name: 'Козлова Мария Павловна',  camera_id: 'c1', camera_name: 'Главный вход',  zone_id: 'z4', zone_name: 'Рецепция',     decision: 'deny',    confidence: 0.88, snapshot_url: null, created_at: '2026-03-25T09:05:00Z' },
  { id: 'e5',  person_id: 'p5', person_name: 'Новиков Алексей Игоревич',camera_id: 'c4', camera_name: 'Бассейн вход', zone_id: 'z2', zone_name: 'Бассейн',      decision: 'allow',   confidence: 0.96, snapshot_url: null, created_at: '2026-03-25T09:20:00Z' },
  { id: 'e6',  person_id: 'p1', person_name: 'Иванов Иван Иванович',    camera_id: 'c2', camera_name: 'Зал — север',  zone_id: 'z1', zone_name: 'Основной зал', decision: 'allow',   confidence: 0.93, snapshot_url: null, created_at: '2026-03-25T09:45:00Z' },
  { id: 'e7',  person_id: 'p3', person_name: 'Сидоров Дмитрий Олегович',camera_id: 'c1', camera_name: 'Главный вход', zone_id: 'z4', zone_name: 'Рецепция',     decision: 'deny',    confidence: 0.72, snapshot_url: null, created_at: '2026-03-25T10:10:00Z' },
  { id: 'e8',  person_id: 'p2', person_name: 'Петрова Анна Сергеевна',  camera_id: 'c4', camera_name: 'Бассейн вход', zone_id: 'z2', zone_name: 'Бассейн',      decision: 'allow',   confidence: 0.89, snapshot_url: null, created_at: '2026-03-25T10:30:00Z' },
  { id: 'e9',  person_id: null, person_name: null,                       camera_id: 'c3', camera_name: 'Зал — юг',    zone_id: 'z1', zone_name: 'Основной зал', decision: 'unknown', confidence: null, snapshot_url: null, created_at: '2026-03-25T11:00:00Z' },
  { id: 'e10', person_id: 'p6', person_name: 'Морозова Елена Викторовна',camera_id:'c1', camera_name: 'Главный вход', zone_id: 'z4', zone_name: 'Рецепция',     decision: 'allow',   confidence: 0.97, snapshot_url: null, created_at: '2026-03-25T11:20:00Z' },
]

export const mockEventsPage: Page<AccessEvent> = {
  items: mockEvents, total: 10, page: 1, page_size: 25, pages: 1,
}

export const mockRules: AccessRule[] = [
  { id: 'r1', person_id: 'p1', person_name: 'Иванов Иван Иванович',    zone_id: 'z1', zone_name: 'Основной зал', time_from: '07:00', time_to: '22:00', days_of_week: [1,2,3,4,5,6,7], is_active: true },
  { id: 'r2', person_id: 'p2', person_name: 'Петрова Анна Сергеевна',  zone_id: 'z2', zone_name: 'Бассейн',      time_from: '08:00', time_to: '21:00', days_of_week: [1,2,3,4,5],     is_active: true },
  { id: 'r3', person_id: 'p5', person_name: 'Новиков Алексей Игоревич',zone_id: 'z1', zone_name: 'Основной зал', time_from: '06:00', time_to: '23:00', days_of_week: [1,3,5],         is_active: true },
]

export const mockStats: DashboardStats = {
  total_persons: 6,
  active_persons: 5,
  total_cameras: 4,
  running_cameras: 3,
  events_today: 10,
  allow_today: 7,
  deny_today: 2,
  unknown_today: 1,
}

export const mockHourly: HourlyStats[] = [
  { hour: 6,  allow: 0, deny: 0, unknown: 0 },
  { hour: 7,  allow: 2, deny: 0, unknown: 0 },
  { hour: 8,  allow: 5, deny: 1, unknown: 1 },
  { hour: 9,  allow: 8, deny: 2, unknown: 0 },
  { hour: 10, allow: 6, deny: 1, unknown: 2 },
  { hour: 11, allow: 9, deny: 0, unknown: 1 },
  { hour: 12, allow: 4, deny: 1, unknown: 0 },
  { hour: 13, allow: 3, deny: 0, unknown: 1 },
  { hour: 14, allow: 7, deny: 2, unknown: 0 },
  { hour: 15, allow: 5, deny: 1, unknown: 0 },
  { hour: 16, allow: 8, deny: 0, unknown: 1 },
  { hour: 17, allow: 11,deny: 1, unknown: 2 },
  { hour: 18, allow: 14,deny: 3, unknown: 1 },
  { hour: 19, allow: 9, deny: 1, unknown: 0 },
  { hour: 20, allow: 4, deny: 0, unknown: 1 },
  { hour: 21, allow: 2, deny: 0, unknown: 0 },
]
