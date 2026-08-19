# Career Bank — Product Doc

*Turn your work into stories worth telling.*

## 1. Vision

Career Bank is a personal, structured record of the work someone actually does. The core bet: if capturing an experience is nearly frictionless, people will do it in the moment — and if the app takes on the work of structuring, tagging, and connecting those entries later, a year of scattered accomplishments turns into interview-ready material without anyone having to sit down and "write their resume" from a blank page.

## 2. Problem

People do meaningful work constantly and forget the specifics by the time they need them — performance reviews, interviews, promotion packets. Two things get in the way of fixing this: capture has too much friction in the moment (nobody wants to fill out a form mid-incident), and structuring/tagging/dating an entry after the fact is tedious enough that it never happens. This doc is about attacking both.

## 3. End-to-end flow (north star)

1. **Capture** an experience quickly, in whatever form is fastest.
2. It becomes part of the **Career Bank** — structured, tagged, and dated with minimal manual effort.
3. **Input a job/opportunity** — paste a JD and interview process.
4. Career Bank **analyzes fit & evidence** against everything captured.
5. Get an **Interview Prep Package** — tailored STAR stories, talking points, resume, elevator pitch, likely follow-up questions.

Steps 3–5 are a later phase (opportunity fit analysis and prep-package generation aren't built yet). This doc covers step 1–2: making capture effortless and making the Career Bank fill itself in.

## 4. Shipped so far

**Phase 1 — Quick Capture (MVP).** Manual form: description, title, date, impact, tags (keyword-based suggestions). Career Bank list with search and tag filter. Detail view with edit/delete.

**Phase 2 — Structured Experience Detail.** Every entry can be expanded into Situation / Challenge / Your Role / What You Did / Outcome via a guided "Complete this experience" flow with prompts like *what was at stake?* and *what did you personally own?*. Metadata: company, project, dates, team, scope (users/revenue/systems/team size), collaborators. Deterministic completeness guidance (e.g. "Outcome is missing"). The raw capture is never overwritten — structure is additive. Rebuilt on Next.js + TypeScript + Tailwind + shadcn/ui.

**Phase 3 — STAR Story Generation.** Pick a structured experience and an interview theme (reuses the existing tag vocabulary — Leadership, Ownership, Performance, etc.), and get an editable Situation/Task/Action/Result draft, deterministically assembled from the structured fields with theme-appropriate framing. Fully editable before saving; an experience can hold multiple STAR variants for different themes.

Everything shipped so far is deterministic — no AI/LLM calls, no backend. That changes with this phase.

## 5. Phase 4 — remove capture friction, let AI fill in the rest

Build sequence within this phase, per §10: **4a Onboarding** (shipped) → **4b Simplified Quick Capture + AI auto-fill & company matching** (shipped) → 4c polish (open questions in §11, not yet built).

**Status:** 4a shipped a first-run/settings profile form (name, current role, repeatable work-history rows) that never gates capture. 4b shipped together with auto-fill rather than as a separate step, since a one-field capture form only makes sense once something else is filling in the rest: Quick Capture is now just a "What happened?" textarea plus a voice toggle (Web Speech API, feature-detected, falls back to a disabled button with an explanatory note in unsupported browsers); on save, `lib/autofill.ts` deterministically derives title (first sentence), date (explicit month/year/relative-time mentions, else today), tags (keyword match against the existing vocabulary), and — when the capture's text or date lines up with a work-history entry — `metadata.company`. Enrichment currently runs synchronously on save rather than the async "quiet enriching…" pattern floated in 5.2; worth revisiting per the Success signals in §9 once there's real usage to look at. The full multi-field form still exists and is used for edits, so nothing about editing changed.

### 5.1 Why Quick Capture still isn't quick enough

Phase 1's Quick Capture asks for title, description, date, impact, and tags before it'll save anything. That's exactly the friction that stops someone from capturing in the moment — the whole point of "quick capture" was to beat the moment you forget, and a five-field form doesn't do that.

### 5.2 The new Quick Capture

Cut it down to one field and one action:

- **A single text input** — "What happened?" — expandable, no required title/date/tags/impact at capture time.
- **A voice option** — a mic button that transcribes speech into the same field (or captures audio and transcribes on save). Voice and text are equally first-class; neither is a fallback for the other.
- **One button: Save.**

Everything else the current form asks for — title, date, tags, company/project — gets inferred afterward by AI and shown as editable, not final. This extends a pattern the product already uses ("Suggested tags added — adjust anything you like") rather than introducing a new trust model.

Open question worth deciding before building: should enrichment block the save (capture feels slower but arrives "done") or happen asynchronously (save is instant, fields fill in moments later with a quiet "enriching…" state)? Async keeps faith with "quick" and is the better default.

### 5.3 What AI fills in

On top of the raw capture, without ever touching or overwriting it:

- **Title** — a short label generated from the text.
- **Date** — defaults to capture time, but should pick up an explicit date/timeframe mentioned in the text ("back in March," "last quarter").
- **Tags** — real inference against the existing tag vocabulary, replacing today's keyword-matching `suggestTags`.
- **Company / project** — see 5.4.
- **Impact/metrics** — pull out numbers if they're mentioned.
- Optionally, a first-pass guess at the structured fields (Situation/Outcome), pre-filling the existing "Complete this experience" flow instead of leaving it blank.

All of it stays editable and removable, same as today's tag suggestions.

### 5.4 Company/role matching — the Shopify example

If someone says, by voice, that they resolved a security audit issue while at Shopify, the entry should land already attached to their Shopify work experience — not sitting unassigned waiting for them to fill in "Company" by hand later. For that to work, two things have to exist:

1. **Work history from onboarding** (5.5) — company, role, and date range for each job the user has held.
2. **A matching step on save** — Career Bank checks the capture for company signals. Explicit mentions ("at Shopify," "on the Shopify team") are the strong signal; where there's no explicit mention, the capture's date can be matched against work-history date ranges as a weaker, suggested match. A confident match populates `metadata.company` / `metadata.project` / `metadata.team` (already part of the Phase 2 data model) instead of leaving them blank. An unclear match is left unassigned, exactly like today — this only removes work the user would otherwise have to do by hand, it doesn't guess wildly.

### 5.5 Onboarding

A first-run flow to collect what 5.4 needs, and to generally tailor the product to the person using it.

**Needed now:**
- Name
- Current role/title
- Work history — repeatable list of `{ company, title, start date, end date or "current" }`

**Worth collecting for later phases** (fit analysis and prep-package generation from the original roadmap will want these too):
- Target roles / industries they're interviewing for
- Key skills / tech stack
- Resume upload or LinkedIn URL, as a shortcut to auto-extract work history instead of typing it in by hand

Onboarding shouldn't gate capture — someone should be able to capture an experience with zero profile info on day one. The better sequencing: let capture work immediately, and prompt for work history the first time it would actually help (e.g., a nudge in the Career Bank — "Add your work history so entries can be auto-tagged by company") rather than a mandatory multi-step wizard before first use.

## 6. Data model changes this implies

- New `UserProfile`: `{ name, currentRole, workHistory: WorkHistoryEntry[], targetRoles?, skills?, resumeText? }`
- New `WorkHistoryEntry`: `{ id, company, title, startDate, endDate | null }`
- `Experience.metadata.company` / `.project` (already exist from Phase 2) shift from purely manual to AI-populated-then-editable.
- Each experience needs a lightweight way to mark which fields were AI-suggested vs. user-written (e.g. `aiSuggestedFields: string[]`), so the UI can visually distinguish the two — a natural extension of the existing completeness-badge concept, not a new system.
- If enrichment is async, an experience needs an enrichment status (`pending` / `done`) so the UI can show the "filling in…" state.

## 7. Before / after

**Before:** description, title, date, impact, tags — five fields, one button.
**After:** one text field with an inline mic button — one field, one button. Title, date, tags, and company appear moments later, AI-filled, and editable like everything else in the product.

## 8. Non-goals for this phase

- Opportunity input / fit analysis / Interview Prep Package generation (later roadmap phase).
- Resume or elevator pitch generation.
- Polished real-time voice streaming UI — a first pass of record → transcribe → fill field is enough.
- A full profile/settings management surface beyond the onboarding capture itself.

## 9. Success signals

- Share of captures made via voice vs. text.
- Time-to-save on Quick Capture (should drop sharply from today's multi-field form).
- Share of AI-assigned company/tags accepted without edits (a direct read on matching quality).
- Onboarding completion rate, and how many work-history entries people actually add.

## 10. Decisions

- **AI approach: deterministic heuristics, not LLM calls (for now).** Tagging, title generation, and company matching extend the same rule-based pattern as today's `suggestTags` and the STAR generator — no backend, no API key, ships immediately. Revisit real LLM calls once the deterministic version's matching quality is measured (see Success signals) and found wanting.
- **Voice transcription: Web Speech API.** Browser-native, free, no backend — consistent with "no server dependency yet." Accepted tradeoff: spottier support in Safari/Firefox than Chrome/Edge; revisit a hosted transcription API if that turns out to matter for the user base.
- **Build order: Onboarding first.** Work history collection ships before simplified capture and AI auto-fill, since company matching depends on it and it's the lowest-risk slice. Onboarding must not block first capture — someone can capture with an empty profile from day one; the app nudges toward adding work history rather than requiring it upfront.

## 11. Open questions

- **Correcting a bad AI match.** "Not added yet" isn't the right empty state anymore once AI is guessing — a wrong guess needs its own affordance ("We think this was at Shopify — right?"), not just a blank field to fill in.
- **Overlapping work history.** Someone contracting at two companies at once, or between roles, breaks simple date-range matching. Worth deciding how ambiguous matches surface (pick one, ask, or leave unassigned) before relying on dates alone.
