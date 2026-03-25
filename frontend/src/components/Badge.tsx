import type { Decision } from '../types'

const decisionStyles: Record<Decision, string> = {
  allow:   'bg-green-100 text-green-800',
  deny:    'bg-red-100 text-red-800',
  unknown: 'bg-yellow-100 text-yellow-800',
}
const decisionLabels: Record<Decision, string> = {
  allow: 'Разрешён', deny: 'Отказ', unknown: 'Неизвестен',
}

export function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${decisionStyles[decision]}`}>
      {decisionLabels[decision]}
    </span>
  )
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
      {active ? 'Активен' : 'Неактивен'}
    </span>
  )
}
