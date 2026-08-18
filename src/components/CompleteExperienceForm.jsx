import { ArrowRight, Sparkles } from 'lucide-react'

const STORY_FIELDS = [
  ['situation', 'Situation / context', 'What was at stake?'],
  ['challenge', 'Challenge', 'What made this hard or important?'],
  ['role', 'Your role', 'What did you personally own?'],
  ['actions', 'What you did', 'What decisions or tradeoffs did you make?'],
  ['outcome', 'Outcome / impact', 'What changed because of your work? Include numbers if you have them.'],
]

export function CompleteExperienceForm({ draft, setDraft, onSave, onCancel }) {
  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }))

  return (
    <section className="structure-card panel">
      <div className="panel-heading">
        <div className="heading-icon"><Sparkles size={17} /></div>
        <div>
          <p className="eyebrow">COMPLETE THIS EXPERIENCE</p>
          <h2>Build the evidence behind your story</h2>
        </div>
        <span className="save-status">Draft</span>
      </div>
      <p className="intro">
        Your original capture stays exactly as you wrote it — these answers make it easier to find,
        trust, and turn into interview material later.
      </p>
      <form onSubmit={onSave}>
        <h3 className="form-section-heading">Tell the story</h3>
        {STORY_FIELDS.map(([key, label, hint]) => (
          <label key={key}>
            <span>{label}</span>
            <textarea
              className="structure-area"
              value={draft[key]}
              onChange={(event) => setField(key, event.target.value)}
              placeholder={hint}
            />
          </label>
        ))}

        <label>
          <span>Who did you work with? <em>Optional</em></span>
          <input
            value={draft.collaborators}
            onChange={(event) => setField('collaborators', event.target.value)}
            placeholder="e.g. Alex (Data Eng), Priya (PM), Sam (SRE)"
          />
        </label>

        <h3 className="form-section-heading">Add the details</h3>
        <div className="two-columns-even">
          <label>
            <span>Company <em>Optional</em></span>
            <input value={draft.company} onChange={(event) => setField('company', event.target.value)} placeholder="e.g. Acme Corp" />
          </label>
          <label>
            <span>Project <em>Optional</em></span>
            <input value={draft.project} onChange={(event) => setField('project', event.target.value)} placeholder="e.g. Audience Engine" />
          </label>
        </div>
        <div className="two-columns-even">
          <label>
            <span>Team <em>Optional</em></span>
            <input value={draft.team} onChange={(event) => setField('team', event.target.value)} placeholder="e.g. Backend, Data Platform" />
          </label>
          <label>
            <span>End date <em>Optional — if this ran over time</em></span>
            <input type="date" value={draft.dateEnd} onChange={(event) => setField('dateEnd', event.target.value)} />
          </label>
        </div>

        <div className="label-row"><span>Scope <em>Optional</em></span></div>
        <div className="two-columns-even">
          <label>
            <span>Users affected</span>
            <input value={draft.scopeUsers} onChange={(event) => setField('scopeUsers', event.target.value)} placeholder="e.g. 500K monthly users" />
          </label>
          <label>
            <span>Revenue / cost impact</span>
            <input value={draft.scopeRevenue} onChange={(event) => setField('scopeRevenue', event.target.value)} placeholder="e.g. $12K/month saved" />
          </label>
        </div>
        <div className="two-columns-even">
          <label>
            <span>Systems involved</span>
            <input value={draft.scopeSystems} onChange={(event) => setField('scopeSystems', event.target.value)} placeholder="e.g. Audience Engine, Postgres" />
          </label>
          <label>
            <span>Team size</span>
            <input value={draft.scopeTeamSize} onChange={(event) => setField('scopeTeamSize', event.target.value)} placeholder="e.g. 6 engineers" />
          </label>
        </div>

        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" type="submit">Save details <ArrowRight size={15} /></button>
        </div>
      </form>
    </section>
  )
}
