import { ArrowRight, Sparkles, X } from 'lucide-react'
import { tags } from '../data.js'

export function CaptureForm({ draft, editing, setField, toggleTag, suggestTags, clear, save }) {
  return (
    <section className="capture-card panel" aria-labelledby="capture-title">
      <div className="panel-heading">
        <div className="heading-icon"><Sparkles size={17} /></div>
        <div>
          <p className="eyebrow">{editing ? 'EDIT EXPERIENCE' : 'QUICK CAPTURE'}</p>
          <h2 id="capture-title">{editing ? 'Refine this experience' : 'Capture an experience'}</h2>
        </div>
        <span className="save-status">{editing ? 'Editing' : 'Ready'}</span>
      </div>
      <p className="intro">Save the meaningful work now. You can make it interview-ready later.</p>
      <form onSubmit={save}>
        <label>
          <span>What happened?</span>
          <textarea
            required
            value={draft.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="Describe a project, challenge, decision, or moment that mattered…"
          />
        </label>
        <div className="two-columns">
          <label>
            <span>Experience title</span>
            <input
              required
              value={draft.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="e.g. Improved checkout reliability"
            />
          </label>
          <label>
            <span>When?</span>
            <input type="date" value={draft.date} onChange={(event) => setField('date', event.target.value)} />
          </label>
        </div>
        <label>
          <span>Why did it matter? <em>Optional</em></span>
          <textarea
            className="small-area"
            value={draft.impact}
            onChange={(event) => setField('impact', event.target.value)}
            placeholder="A metric, customer impact, learning, or business result…"
          />
        </label>
        <div className="tag-section">
          <div className="label-row">
            <span>Tags</span>
            <button type="button" className="text-button" onClick={suggestTags}>
              Suggest tags <Sparkles size={12} />
            </button>
          </div>
          <div className="selected-tags">
            {draft.tags.length ? (
              draft.tags.map((tag) => (
                <button type="button" className="tag-chip selected" key={tag} onClick={() => toggleTag(tag)}>
                  {tag}<X size={11} />
                </button>
              ))
            ) : (
              <span className="empty-tags">Add a few tags to make this easy to find later.</span>
            )}
          </div>
          <div className="tag-options">
            {tags.map((tag) => (
              <button
                type="button"
                className={`tag-chip ${draft.tags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
                key={tag}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={clear}>Cancel</button>
          <button className="primary-button" type="submit">
            {editing ? 'Update experience' : 'Save experience'} <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </section>
  )
}
