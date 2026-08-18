import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Archive, ArrowLeft, ArrowRight, FileText, Home, Plus, Settings, Sparkles } from 'lucide-react'
import { blankDraft, emptyCompletion, starterExperiences, tags as tagVocabulary } from './data.js'
import { CaptureForm } from './components/CaptureForm.jsx'
import { ExperienceBank } from './components/ExperienceBank.jsx'
import { ExperienceDetail } from './components/ExperienceDetail.jsx'
import { CompleteExperienceForm } from './components/CompleteExperienceForm.jsx'
import { Toast } from './components/Toast.jsx'
import './styles.css'

function App() {
  const [experiences, setExperiences] = useState(
    () => JSON.parse(localStorage.getItem('experience-bank-items') || 'null') || starterExperiences
  )
  const [selectedId, setSelectedId] = useState(experiences[0]?.id)
  const [draft, setDraft] = useState(blankDraft)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [toast, setToast] = useState('')
  const [completionDraft, setCompletionDraft] = useState(emptyCompletion)
  const [screen, setScreen] = useState('capture')

  useEffect(() => localStorage.setItem('experience-bank-items', JSON.stringify(experiences)), [experiences])

  const selected = experiences.find((item) => item.id === selectedId)
  const filters = ['All', ...new Set(experiences.flatMap((item) => item.tags))]
  const visibleExperiences = useMemo(
    () => experiences.filter((item) =>
      (activeFilter === 'All' || item.tags.includes(activeFilter)) &&
      `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())
    ),
    [experiences, activeFilter, search]
  )

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }))
  const toggleTag = (tag) => setDraft((current) => ({
    ...current,
    tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
  }))

  const suggestTags = () => {
    const text = `${draft.title} ${draft.description} ${draft.impact}`.toLowerCase()
    const keywordsByTag = {
      Performance: ['performance', 'latency', 'slow'],
      Backend: ['query', 'database', 'api'],
      Leadership: ['led', 'mentor'],
      Reliability: ['outage', 'incident', 'reliab'],
      Communication: ['partner', 'stakeholder'],
      'Customer Impact': ['customer', 'user'],
      'Problem Solving': ['problem', 'investigated', 'issue'],
    }
    const suggestions = tagVocabulary.filter((tag) => (keywordsByTag[tag] || []).some((word) => text.includes(word)))
    setDraft((current) => ({
      ...current,
      tags: [...new Set([...current.tags, ...(suggestions.length ? suggestions : ['Ownership', 'Problem Solving'])])],
    }))
    notify('Suggested tags added — adjust anything you like')
  }

  const saveExperience = (event) => {
    event.preventDefault()
    const id = editingId || crypto.randomUUID()
    const item = { ...draft, id }
    setExperiences((current) =>
      editingId ? current.map((experience) => (experience.id === id ? { ...experience, ...item } : experience)) : [item, ...current]
    )
    setSelectedId(id)
    setDraft(blankDraft)
    setEditingId(null)
    setScreen('detail')
    notify(editingId ? 'Experience updated' : 'Experience saved to your Career Bank')
  }

  // Seeds the "Complete this experience" draft from whatever already
  // exists — including a first guess at Situation/Outcome pulled from the
  // raw capture, so people aren't re-typing what they already wrote.
  const startComplete = () => {
    if (!selected) return
    const s = selected.structured || {}
    const m = selected.metadata || {}
    setCompletionDraft({
      situation: s.situation || selected.description || '',
      challenge: s.challenge || '',
      role: s.role || '',
      actions: s.actions || '',
      outcome: s.outcome || selected.impact || '',
      collaborators: (selected.collaborators || []).join(', '),
      company: m.company || '',
      project: m.project || '',
      dateEnd: m.dateEnd || '',
      team: m.team || '',
      scopeUsers: m.scopeUsers || '',
      scopeRevenue: m.scopeRevenue || '',
      scopeSystems: m.scopeSystems || '',
      scopeTeamSize: m.scopeTeamSize || '',
    })
    setScreen('complete')
  }

  // The raw capture (description/impact) is never touched here — only
  // structured/collaborators/metadata are written, so the original note
  // is always preserved underneath whatever gets added on top of it.
  const saveComplete = (event) => {
    event.preventDefault()
    const d = completionDraft
    setExperiences((current) => current.map((item) => (item.id !== selectedId ? item : {
      ...item,
      structured: { situation: d.situation, challenge: d.challenge, role: d.role, actions: d.actions, outcome: d.outcome },
      collaborators: d.collaborators.split(',').map((name) => name.trim()).filter(Boolean),
      metadata: {
        company: d.company, project: d.project, dateEnd: d.dateEnd, team: d.team,
        scopeUsers: d.scopeUsers, scopeRevenue: d.scopeRevenue, scopeSystems: d.scopeSystems, scopeTeamSize: d.scopeTeamSize,
      },
    })))
    setScreen('detail')
    notify('Experience details saved')
  }

  const startEdit = () => {
    if (!selected) return
    setDraft({ title: selected.title, description: selected.description, impact: selected.impact, date: selected.date, tags: selected.tags })
    setEditingId(selected.id)
    setScreen('capture')
  }

  const removeExperience = () => {
    if (!selected) return
    const remaining = experiences.filter((item) => item.id !== selected.id)
    setExperiences(remaining)
    setSelectedId(remaining[0]?.id)
    setDraft(blankDraft)
    setEditingId(null)
    setScreen('bank')
    notify('Experience deleted')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Career Bank home"><Sparkles size={20} /></a>
        <nav className="nav-icons" aria-label="Main navigation">
          <button onClick={() => setScreen('capture')} aria-label="Quick capture"><Home /></button>
          <button className={screen === 'bank' || screen === 'detail' || screen === 'complete' ? 'active' : ''} onClick={() => setScreen('bank')} aria-label="Career Bank"><Archive /></button>
          <button aria-label="Opportunities"><FileText /></button>
        </nav>
        <button className="settings" aria-label="Settings"><Settings /></button>
        <div className="avatar">MJ</div>
      </aside>
      <main className={'screen-' + screen}>
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR CAREER BANK</p>
            <h1>Turn your work into stories worth telling.</h1>
          </div>
          {screen === 'capture' ? (
            <button className="ghost-button" onClick={() => setScreen('bank')}>View career bank <ArrowRight size={15} /></button>
          ) : screen === 'bank' ? (
            <button className="primary-button" onClick={() => { setDraft(blankDraft); setEditingId(null); setScreen('capture') }}><Plus size={15} />Add new entry</button>
          ) : (
            <button className="ghost-button" onClick={() => setScreen('bank')}><ArrowLeft size={15} />Back to Career Bank</button>
          )}
        </header>

        {screen === 'complete' && (
          <CompleteExperienceForm draft={completionDraft} setDraft={setCompletionDraft} onSave={saveComplete} onCancel={() => setScreen('detail')} />
        )}

        <section className="dashboard" aria-label="Experience capture workspace">
          <CaptureForm
            draft={draft}
            editing={Boolean(editingId)}
            setField={setField}
            toggleTag={toggleTag}
            suggestTags={suggestTags}
            clear={() => { setDraft(blankDraft); setEditingId(null) }}
            save={saveExperience}
          />
          <ExperienceBank
            experiences={visibleExperiences}
            selectedId={selectedId}
            setSelectedId={(id) => { setSelectedId(id); setScreen('detail') }}
            filters={filters}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            search={search}
            setSearch={setSearch}
            total={experiences.length}
          />
        </section>

        <ExperienceDetail experience={selected} onEdit={startEdit} onDelete={removeExperience} onComplete={startComplete} />
      </main>
      <Toast message={toast} />
    </div>
  )
}

export default App

createRoot(document.getElementById('root')).render(<App />)
