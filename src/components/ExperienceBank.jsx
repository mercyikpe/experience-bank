import { Search } from 'lucide-react'
import { formatDate } from '../data.js'
import { getCompletenessColor } from '../lib/completeness.js'

export function ExperienceBank({
  experiences, selectedId, setSelectedId, filters, activeFilter, setActiveFilter, search, setSearch, total,
}) {
  return (
    <section className="bank-card panel" id="bank">
      <div className="bank-header">
        <div>
          <p className="eyebrow">YOUR LIBRARY</p>
          <h2>Career Bank</h2>
        </div>
        <span className="experience-count">{total} saved</span>
      </div>
      <div className="search-wrap">
        <Search size={15} />
        <input
          aria-label="Search experiences"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search experiences…"
        />
      </div>
      <div className="filter-row">
        {filters.map((tag) => (
          <button key={tag} className={`filter ${tag === activeFilter ? 'active' : ''}`} onClick={() => setActiveFilter(tag)}>
            {tag}
          </button>
        ))}
      </div>
      <div className="experience-list">
        {experiences.length ? (
          experiences.map((item) => (
            <article
              className={`experience ${item.id === selectedId ? 'current' : ''}`}
              onClick={() => setSelectedId(item.id)}
              key={item.id}
            >
              <div className="experience-top">
                <span className="experience-dot" style={{ background: getCompletenessColor(item) }} />
                <p className="experience-title">{item.title}</p>
                <time>{formatDate(item.date)}</time>
              </div>
              <p className="experience-preview">{item.description}</p>
              <div className="mini-tags">
                {item.tags.slice(0, 3).map((tag) => <span className="mini-tag" key={tag}>{tag}</span>)}
              </div>
            </article>
          ))
        ) : (
          <p className="no-results">No experiences found. Try another search or tag.</p>
        )}
      </div>
    </section>
  )
}
