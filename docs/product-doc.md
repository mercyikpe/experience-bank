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

Everything through Phase 3 was deterministic and client-only — no AI/LLM calls, no backend. Phase 4 (below) started out keeping the "no LLM calls" decision (see §10) for its first two slices, then revisited it in 4c — real LLM calls now power title/tag/company/impact enrichment. The app has since gained a real backend: Postgres (via Drizzle ORM) and Google sign-in via Supabase Auth replace the original localStorage-only persistence. Every user's profile, work history, experiences, and STAR stories are now stored server-side and scoped to their account — Server Actions re-derive the signed-in user from the session on every call, with Postgres Row Level Security as a second layer of protection.

## 5. Phase 4 — remove capture friction, let AI fill in the rest

Build sequence within this phase, per §10: **4a Onboarding** (shipped) → **4b Simplified Quick Capture + AI auto-fill & company matching** (shipped) → **4c Real AI enrichment (title/tags/company/impact) + AI-match confirm/deny** (shipped) → **4d Backend audio transcription** (shipped — see 5.6) → **4e "Add entry" per-role shortcut** (shipped — see 5.4).

**Next up:** structured-field seeding from AI enrichment output (§5.3's last bullet) and resume/CV import (§11) — the two items prioritized to build next. Ambiguous work-history UI (§11) stays open but isn't prioritized right now.

**Status:** 4a shipped a first-run/settings profile form (name, current role, repeatable work-history rows) that never gates capture. 4b shipped together with auto-fill rather than as a separate step, since a one-field capture form only makes sense once something else is filling in the rest: Quick Capture is now just a "What happened?" textarea plus a voice toggle (Web Speech API, feature-detected, falls back to a disabled button with an explanatory note in unsupported browsers); on save, `lib/autofill.ts` deterministically derives title (first sentence), date (explicit month/year/relative-time mentions, else today), tags (keyword match against the existing vocabulary), and — when the capture's text or date lines up with a work-history entry — `metadata.company`. Enrichment currently runs synchronously on save rather than the async "quiet enriching…" pattern floated in 5.2; worth revisiting per the Success signals in §9 once there's real usage to look at. The full multi-field form still exists and is used for edits, so nothing about editing changed.

**4c status:** two of §11's open questions are now addressed. First, company-match correction: the experience detail view shows an active confirm/deny prompt ("We think this was at Shopify — right?" / "Not quite") the moment an AI-matched company hasn't been confirmed yet, instead of only the passive "AI guess" badge from before — see the updated §11. Second, and bigger: Quick Capture's enrichment is no longer purely the deterministic `lib/autofill.ts` heuristics. A new Server Action (`lib/actions/enrich.ts`) calls a real LLM — OpenAI's GPT-5.6 family via the Responses API, defaulting to the cheapest "Luna" tier (`DEFAULT_MODEL` constant), overridable per-deployment with an `OPENAI_MODEL` env var without a code change — to infer title, tags (constrained to the existing vocabulary via a strict JSON-schema enum, so it can't invent a new tag), company (constrained the same way to the person's actual work-history companies), and impact/metrics (the one field in §5.3 that was previously unimplemented). This also finally builds the async "quiet enriching…" pattern floated in 5.2 and never built for the deterministic version: saving is instant, the new entry gets an `enrichmentStatus: "pending"` row (Postgres column, defaults to `"done"` for back-compat with rows saved before it existed) and a pulsing "Enriching…" state in both the bank list and detail view, and the AI call resolves in the background a few seconds later. If the LLM call fails for any reason, the experience falls back automatically to the original deterministic heuristics rather than getting stuck — `lib/autofill.ts` isn't dead code, it's the safety net. Date inference is the one field that deliberately stayed deterministic — the §10 rationale (regex-based explicit-date parsing doesn't need an LLM) still holds.

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

- **Title** — a short label generated from the text. *(Shipped via real LLM inference in `lib/actions/enrich.ts` — the deterministic first-sentence heuristic, `inferTitle` in `lib/autofill.ts`, is now only the fallback used if the AI call fails.)*
- **Date** — defaults to capture time, but should pick up an explicit date/timeframe mentioned in the text ("back in March," "last quarter"). *(Stays deterministic by design — see §10 — computed synchronously at save time regardless of how the rest of enrichment goes.)*
- **Tags** — real inference against the existing tag vocabulary, replacing today's keyword-matching `suggestTags`. *(Shipped: the LLM call's JSON schema constrains `tags` to an enum of the actual vocabulary, so it can't return anything outside it. Falls back to the old keyword-matching `inferTags` if the AI call fails.)*
- **Company / project** — see 5.4.
- **Impact/metrics** — pull out numbers if they're mentioned. *(Shipped — the same LLM call now extracts a short impact/metric phrase when the text supports one, and returns an empty string rather than inventing a number when it doesn't. This was the one field the deterministic version never implemented at all.)*
- Optionally, a first-pass guess at the structured fields (Situation/Outcome), pre-filling the existing "Complete this experience" flow instead of leaving it blank. *(Partially in place — starting that flow already seeds Situation from the raw capture and Outcome from the impact field when they haven't been filled in yet; this happens when that step is opened, not at capture-save time. It still doesn't use anything the AI enrichment call already extracted (title, impact) — **next up to build**: have "Complete this experience" seed from the enrichment output first, falling back to the raw capture/impact field only when enrichment hasn't run or came up empty.)*

All of it stays editable and removable, same as today's tag suggestions.

### 5.4 Company/role matching — the Shopify example

If someone says, by voice, that they resolved a security audit issue while at Shopify, the entry should land already attached to their Shopify work experience — not sitting unassigned waiting for them to fill in "Company" by hand later. For that to work, two things have to exist:

1. **Work history from onboarding** (5.5) — company, role, and date range for each job the user has held. *(Shipped, and the profile view goes further than this spec: it now groups every experience under its matched work-history role, with a count of how many entries still aren't linked to any company.)*
2. **A matching step on save** — Career Bank checks the capture for company signals. Explicit mentions ("at Shopify," "on the Shopify team") are the strong signal; where there's no explicit mention, the capture's date can be matched against work-history date ranges as a weaker, suggested match. A confident match populates `metadata.company` / `metadata.project` / `metadata.team` (already part of the Phase 2 data model) instead of leaving them blank. An unclear match is left unassigned, exactly like today — this only removes work the user would otherwise have to do by hand, it doesn't guess wildly. *(Shipped, then extended in 4c: `matchCompany()`'s explicit-mention/date-range logic in `lib/autofill.ts` is now the fallback path. The primary path is the LLM call, which reads the capture's plain-language meaning against the work-history list — catching paraphrased references (e.g. "the checkout team" → Shopify) the deterministic keyword match would miss — while still being constrained to only ever return one of the person's actual companies or nothing. Either path lands on the same confirm/deny affordance now shipped — see §11.)*

3. **4e — "Add entry" per-role shortcut (shipped).** Each work-history role card in the profile view now has an "Add entry" button that opens Quick Capture pre-seeded with an explicit company mention ("At {company}, ") instead of a blank field. This sidesteps matching altogether rather than adding new plumbing: an explicit mention is already the strong signal both `matchCompany()` and the AI enrichment call trust unconditionally, so an entry started this way is virtually guaranteed to land linked to the right role. Solves the same underlying problem as 5.4's matching step, just from the other direction — instead of inferring the company from free text, it lets the person supply the anchor and write the rest around it. Doesn't touch the ambiguous-overlap case in §11: an "Add entry" capture still goes through normal enrichment/confirm-deny once saved.

### 5.5 Onboarding

A first-run flow to collect what 5.4 needs, and to generally tailor the product to the person using it.

**Needed now:**
- Name
- Current role/title
- Work history — repeatable list of `{ company, title, start date, end date or "current" }`

**Worth collecting for later phases** (fit analysis and prep-package generation from the original roadmap will want these too):
- Target roles / industries they're interviewing for
- Key skills / tech stack
- Resume/CV upload or LinkedIn URL, as a shortcut to auto-extract work history instead of typing it in by hand — and potentially to seed a first batch of Experience entries from resume bullets, so a new user's Career Bank isn't empty on day one. See the open question below on why these are two different problems.

Onboarding shouldn't gate capture — someone should be able to capture an experience with zero profile info on day one. The better sequencing: let capture work immediately, and prompt for work history the first time it would actually help (e.g., a nudge in the Career Bank — "Add your work history so entries can be auto-tagged by company") rather than a mandatory multi-step wizard before first use.

### 5.6 Voice capture — from browser transcription to backend audio (shipped)

The Web Speech API decision in §10 traded accuracy and cross-browser support for "no backend, ships immediately" — a reasonable call when the rest of the product had no backend either. That's no longer true (4c added a real backend LLM call for enrichment), so the constraint that justified Web Speech API is gone, and it's worth revisiting the same way title/tags/company/impact were.

**What's wrong with the current approach.** `SpeechRecognition` runs entirely in the browser — no audio ever leaves the device, transcription quality depends on whatever engine that particular browser ships, and it's effectively Chrome/Edge-only: Safari and Firefox get a disabled mic button with an explanatory note, per `components/capture-form.tsx`'s feature detection. That's a meaningful chunk of users who can't use voice capture at all today.

**The planned change.** Replace `SpeechRecognition` with the browser's `MediaRecorder` API (broadly supported, including Safari/Firefox — it just records audio, it doesn't transcribe) to capture a short clip, send that clip to a new Server Action once recording stops, and have the server call a hosted transcription model instead of relying on the browser to do it. Concretely:

- **Client:** swap `useVoiceCapture`'s `SpeechRecognition` calls for `MediaRecorder`, capturing to a `Blob` (`audio/webm` or `audio/mp4` depending on browser support) instead of getting a transcript directly. The mic button's states (idle → listening → transcribing) stay the same from the person's point of view; only what happens under the hood changes.
- **Transfer:** upload the recorded blob to a new Server Action (e.g. `lib/actions/transcribe.ts`), same auth pattern as `enrichExperience` in 4c — re-derive the signed-in user from the session, reject if signed out.
- **Server:** call OpenAI's audio transcription endpoint — `client.audio.transcriptions.create({ model: "gpt-transcribe", file, response_format: "json" })`, the current Whisper successor for uploaded-file transcription (as opposed to `gpt-live-transcribe`, which is for continuous streaming and isn't needed here, since this stays record-then-transcribe, not live). Reuses the `OPENAI_API_KEY` already configured for enrichment; a separate `OPENAI_TRANSCRIBE_MODEL` env var, mirroring `OPENAI_MODEL`'s pattern from 4c, if the transcription model ever needs to be swapped independently of the enrichment model.
- **Client, again:** the returned transcript fills the same `description` field the old `SpeechRecognition` transcript used to — everything downstream (save, deterministic date inference, LLM enrichment) is unchanged, since none of it cares how the text arrived.

**Non-goal, unchanged from §8:** this is still record → transcribe → fill field, not live streaming transcription-while-speaking — `gpt-live-transcribe` exists for that, but isn't part of this plan.

**Resolved:** `SpeechRecognition` was dropped entirely rather than kept as a fallback. `lib/actions/transcribe.ts` now calls `gpt-transcribe` on every voice capture; a failed/offline call surfaces a toast ("Couldn't transcribe that — try again, or type it instead") rather than falling back to the browser's own recognizer. There's no deterministic fallback for transcription the way there is for enrichment — nothing to fall back *to* — so this was the simpler, lower-maintenance choice over keeping two transcription code paths alive.

## 6. Data model changes this implies

- New `UserProfile`: `{ name, currentRole, workHistory: WorkHistoryEntry[], targetRoles?, skills?, resumeText? }`
- New `WorkHistoryEntry`: `{ id, company, title, startDate, endDate | null }`
- `Experience.metadata.company` / `.project` (already exist from Phase 2) shift from purely manual to AI-populated-then-editable.
- Each experience needs a lightweight way to mark which fields were AI-suggested vs. user-written (e.g. `aiSuggestedFields: string[]`), so the UI can visually distinguish the two — a natural extension of the existing completeness-badge concept, not a new system.
- If enrichment is async, an experience needs an enrichment status (`pending` / `done`) so the UI can show the "filling in…" state. *(Shipped: `Experience.enrichmentStatus?: "pending" | "done"`, backed by a Postgres `enrichment_status` column defaulting to `"done"` so rows saved before this column existed are never mistaken for stuck-enriching.)*

## 7. Before / after

**Before:** description, title, date, impact, tags — five fields, one button.
**After:** one text field with an inline mic button — one field, one button. Title, date, tags, and company appear moments later, AI-filled, and editable like everything else in the product.

## 8. Non-goals for this phase

- Opportunity input / fit analysis / Interview Prep Package generation (later roadmap phase).
- Resume or elevator pitch generation.
- Polished real-time voice streaming UI — a first pass of record → transcribe → fill field is enough. *(Still true after 5.6's shipped move to backend transcription: that's still record → send → transcribe → fill, not live streaming.)*
- A full profile/settings management surface beyond the onboarding capture itself.

## 9. Success signals

- Share of captures made via voice vs. text.
- Time-to-save on Quick Capture (should drop sharply from today's multi-field form).
- Share of AI-assigned company/tags accepted without edits (a direct read on matching quality).
- Onboarding completion rate, and how many work-history entries people actually add.

## 10. Decisions

- **AI approach: deterministic heuristics, not LLM calls (for now).** Tagging, title generation, and company matching extend the same rule-based pattern as today's `suggestTags` and the STAR generator — no backend, no API key, ships immediately. Revisit real LLM calls once the deterministic version's matching quality is measured (see Success signals) and found wanting. *(Revisited in 4c — real LLM calls now power title/tags/company/impact, via a new Server Action calling OpenAI's GPT-5.6 family, JSON-schema-constrained so tags/company can never be invented outside the known vocabulary/work-history. Model defaults to the cheapest "Luna" tier, overridable via `OPENAI_MODEL` without a code change. This was a direct product call rather than one driven by the Success-signal measurement originally proposed here, so matching-quality data from real usage is still worth gathering to judge whether Luna is the right default tier going forward. The original deterministic heuristics in `lib/autofill.ts` weren't deleted — they're now the automatic fallback if the LLM call fails, so nothing regresses on an API outage.)*
- **Voice transcription: Web Speech API.** Browser-native, free, no backend — consistent with "no server dependency yet." Accepted tradeoff: spottier support in Safari/Firefox than Chrome/Edge; revisit a hosted transcription API if that turns out to matter for the user base. *(Resolved: replaced entirely, not just revisited. See §5.6 — Web Speech API is gone; all voice capture now goes through backend transcription via OpenAI's `gpt-transcribe`.)*
- **Build order: Onboarding first.** Work history collection ships before simplified capture and AI auto-fill, since company matching depends on it and it's the lowest-risk slice. Onboarding must not block first capture — someone can capture with an empty profile from day one; the app nudges toward adding work history rather than requiring it upfront.

## 11. Open questions

- **Correcting a bad AI match — RESOLVED.** "Not added yet" isn't the right empty state anymore once AI is guessing — a wrong guess needs its own affordance ("We think this was at Shopify — right?"), not just a blank field to fill in. *(Shipped: the experience detail view now shows exactly that — an active "We think this was at Shopify — right?" prompt with "Yes, that's right" / "Not quite" buttons, the moment an AI-matched company hasn't been confirmed yet. "Yes" clears the unconfirmed flag and leaves the value as-is; "Not quite" opens the same inline Fix editor that was already there. Once confirmed (or corrected), it reverts to a plain value with no lingering badge.)*
- **Overlapping work history.** Someone contracting at two companies at once, or between roles, breaks simple date-range matching. Worth deciding how ambiguous matches surface (pick one, ask, or leave unassigned) before relying on dates alone. *(The matching logic already resolves this conservatively — `matchCompany()` leaves the capture unassigned whenever a date falls inside more than one role's range rather than guessing — but there's still no UI moment that surfaces the ambiguity to the user, so the "ask" option here remains unbuilt.)*
- **Resume/CV import — next up. Work history is straightforward, entries are trickier.** Extracting `{company, title, dates}` from a resume is a good fit for the deterministic approach already in use elsewhere — resumes have fairly consistent structure (company/title lines, date ranges), similar in shape to the work-history form itself. Turning resume bullets into Experience entries is a different problem: bullets are already condensed and pre-polished (action verb + metric), which reads like a finished Outcome but is usually thin on Situation/Challenge — the texture that makes a story reusable in an interview later. If we build this, resume-derived entries should probably be visually marked ("From resume — worth fleshing out") and nudged toward "Complete this experience" rather than treated as equivalent to a fresh capture. Parsing free-form bullets out of arbitrary resume layouts is also a harder problem than anything shipped so far — title/date/tag inference all operate on a single, known-shape string (one capture's text), whereas a resume is multi-section and inconsistently formatted across templates. This may end up being the first place where the "deterministic heuristics, not LLM calls" decision in §10 is worth revisiting, even if work-history extraction alone can probably stay rule-based.
