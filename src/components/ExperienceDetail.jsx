import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '../data.js'
import { getCompletenessFlags, getCompletenessScore } from '../lib/completeness.js'
import { CompletenessBadges } from './CompletenessBadges.jsx'

const STRUCTURE_SECTIONS = [
  ['situation', 'Situation / context', 'What was at stake?'],
  ['challenge', 'Challenge', 'What made this hard or important?'],
  ['role', 'Your role', 'What did you personally own?'],
  ['actions', 'What you did', 'What decisions or tradeoffs did you make?'],
  ['outcome', 'Outcome / impact', 'What changed because of your work?'],
]

const SCOPE_LABELS = { scopeUsers: 'Users', scopeRevenue: 'Revenue / cost', scopeSystems: 'Systems', scopeTeamSize: 'Team size' }

export function ExperienceDetail({ experience, onEdit, onDelete, onComplete }) {
  if (!experience) {
    return <section className="detail-card panel"><div className="detail-empty">Select an experience to see its details.</div></section>
  }

  const structured = experience.structured || {}
  const metadata = experience.metadata || {}
  const score = getCompletenessScore(experience)
  const flags = getCompletenessFlags(experience)
  const hasAnyStructure = score > 0
  const scopeEntries = Object.entries(SCOPE_LABELS).filter(([key]) => metadata[key]?.trim())
  const dateRange = [formatDate(experience.date), metadata.dateEnd ? formatDate(metadata.dateEnd) : null]
    .filter(Boolean).join(' – ')

  return (
    <section className="detail-card panel">
      <div>
        <div className="detail-meta">EXPERIENCE DETAIL <span>•</span> {dateRange}</div>
        <h2>{experience.title}</h2>

        <CompletenessBadges flags={flags} />

        <div className="structured-sections">
          {STRUCTURE_SECTIONS.map(([key, label, hint]) => (
            <div className="structured-section" key={key}>
              <h3>{label}</h3>
              {structured[key]?.trim() ? (
                <p>{structured[key]}</p>
              ) : (
                <p className="placeholder">Not added yet — {hint}</p>
              )}
            </div>
          ))}
        </div>

        <details className="raw-capture">
          <summary>Original capture (preserved as written)</summary>
          <p className="detail-text">{experience.description}</p>
          {experience.impact && (
            <div className="impact-block">
              <p>WHY IT MATTERED</p>
              <span>{experience.impact}</span>
            </div>
          )}
        </details>
      </div>

      <aside className="detail-side">
        <h3>SKILLS & THEMES</h3>
        <div className="detail-tags">
          {experience.tags.length
            ? experience.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)
            : <p className="placeholder">Not added yet.</p>}
        </div>

        <h3>WHO WORKED ON THIS</h3>
        {experience.collaborators?.length ? (
          <div className="detail-tags">
            {experience.collaborators.map((person) => <span className="tag-chip" key={person}>{person}</span>)}
          </div>
        ) : (
          <p className="placeholder">Not added yet.</p>
        )}

        <h3>DETAILS</h3>
        {metadata.company || metadata.project || metadata.team || scopeEntries.length ? (
          <dl className="meta-list">
            {metadata.company && <><dt>Company</dt><dd>{metadata.company}</dd></>}
            {metadata.project && <><dt>Project</dt><dd>{metadata.project}</dd></>}
            {metadata.team && <><dt>Team</dt><dd>{metadata.team}</dd></>}
            {scopeEntries.map(([key, label]) => <span key={key}><dt>{label}</dt><dd>{metadata[key]}</dd></span>)}
          </dl>
        ) : (
          <p className="placeholder">Not added yet.</p>
        )}

        <h3>STRUCTURE</h3>
        <p>
          {hasAnyStructure
            ? `${score}% complete — keep filling this in for stronger STAR stories later.`
            : 'Add context, ownership, actions, and outcome to strengthen this story.'}
        </p>
        <button className="primary-button" onClick={onComplete}>
          {hasAnyStructure ? 'Edit details' : 'Complete this experience'} <ArrowRight size={14} />
        </button>

        <div className="detail-actions">
          <button className="secondary-button" onClick={onEdit}><Pencil size={14} />Edit capture</button>
          <button className="delete-button" onClick={onDelete}><Trash2 size={14} />Delete</button>
        </div>
      </aside>
    </section>
  )
}
