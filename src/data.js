export const tags = [
  'Leadership', 'Ownership', 'Collaboration', 'Communication', 'Mentoring',
  'Backend', 'Performance', 'Systems Design', 'Problem Solving',
  'Customer Impact', 'Reliability', 'Process',
]

export const starterExperiences = [
  {
    id: 'audience-engine',
    title: 'Optimized Audience Engine Queries',
    description: 'Investigated slow queries on the Audience Engine. Found a data skew issue in crowd tables causing cartesian joins. Optimized schema, added indexes, and improved query patterns.',
    impact: 'P95 latency dropped from 3.2s to 480ms. The change improved dashboard responsiveness and reduced infrastructure cost.',
    date: '2024-05',
    tags: ['Performance', 'Backend', 'Problem Solving', 'Customer Impact'],
  },
  {
    id: 'event-migration',
    title: 'Led Migration to Event-Driven Architecture',
    description: 'Coordinated a staged migration from a synchronous workflow to an event-driven architecture, partnering with platform and product teams to protect customer-facing reliability.',
    impact: 'Reduced delivery bottlenecks and created a safer path for independent service releases.',
    date: '2024-02',
    tags: ['Leadership', 'Systems Design', 'Collaboration'],
  },
  {
    id: 'outage',
    title: 'Handled Production Outage Root Cause',
    description: 'Led incident response for a production outage, established customer communication, identified the root cause, and introduced monitoring to prevent regression.',
    impact: 'Restored service quickly and improved the team’s incident playbook.',
    date: '2023-12',
    tags: ['Ownership', 'Reliability', 'Communication'],
  },
  {
    id: 'mentoring',
    title: 'Mentored Two Engineers to Level Up',
    description: 'Created a structured mentorship plan with regular pairing sessions, scoped project ownership, and feedback routines for two growing engineers.',
    impact: 'Both engineers took on larger technical ownership and improved team delivery capacity.',
    date: '2023-11',
    tags: ['Mentoring', 'Leadership', 'Communication'],
  },
]

export const blankDraft = { title: '', description: '', impact: '', date: '', tags: [] }

export const emptyStructure = { situation: '', challenge: '', role: '', actions: '', outcome: '' }
export const emptyMetadata = {
  company: '', project: '', dateEnd: '', team: '',
  scopeUsers: '', scopeRevenue: '', scopeSystems: '', scopeTeamSize: '',
}
export const emptyCompletion = { ...emptyStructure, collaborators: '', ...emptyMetadata }

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date yet'
