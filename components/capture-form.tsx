"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Mic, Sparkles, Square, X } from "lucide-react"
import { tags } from "@/lib/data"
import type { Draft } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Minimal Web Speech API surface — not in TS's default DOM lib, and only
// some browsers implement it (Chrome/Edge; patchy-to-absent in Safari/
// Firefox), so this is feature-detected at runtime rather than assumed.
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
  const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition
  return SpeechRecognitionCtor ? new SpeechRecognitionCtor() : null
}

/** Records one utterance at a time and appends the transcript to whatever
 * text is already there — click to talk, click again (or pause) to stop.
 * Voice and typing are equally first-class: this never replaces text the
 * person already wrote. */
function useVoiceCapture(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time feature detection on mount, unavoidable (browser API presence can't be known during render)
    setSupported(Boolean(getSpeechRecognition()))
  }, [])

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = getSpeechRecognition()
    if (!recognition) return
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) onTranscript(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return { listening, supported, toggle }
}

export function CaptureForm({
  draft,
  editing,
  setField,
  toggleTag,
  suggestTags,
  clear,
  save,
}: {
  draft: Draft
  editing: boolean
  setField: (field: keyof Draft, value: string) => void
  toggleTag: (tag: string) => void
  suggestTags: () => void
  clear: () => void
  save: (event: React.FormEvent) => void
}) {
  const handleTranscript = (text: string) =>
    setField("description", draft.description ? `${draft.description} ${text}` : text)
  const voice = useVoiceCapture(handleTranscript)

  return (
    <Card className="capture-card p-[26px]" aria-labelledby="capture-title">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7d67ff,#503bd8)] text-white">
          <Sparkles size={17} />
        </div>
        <div>
          <p className="mb-[7px] text-[11px] font-bold tracking-[.11em] text-[var(--color-muted-fg)]">
            {editing ? "EDIT EXPERIENCE" : "QUICK CAPTURE"}
          </p>
          <h2 id="capture-title" className="m-0 text-[17px] tracking-[-.02em]">
            {editing ? "Refine this experience" : "Capture an experience"}
          </h2>
        </div>
        <span className="ml-auto rounded-[20px] bg-[var(--color-success-bg)] px-[9px] py-[5px] text-[10px] font-bold text-[var(--color-success-fg)]">
          {editing ? "Editing" : "Ready"}
        </span>
      </div>
      <p className="my-5 text-[13px] leading-[1.45] text-[var(--color-muted-fg)]">
        {editing
          ? "Fix anything below — including whatever we guessed for you."
          : "Type it or say it. We'll fill in the title, date, tags, and company for you."}
      </p>

      {editing ? (
        <form onSubmit={save}>
          <label className="mb-[17px] block">
            <span className="mb-2 block text-xs font-bold">What happened?</span>
            <Textarea
              required
              value={draft.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Describe a project, challenge, decision, or moment that mattered…"
            />
          </label>
          <div className="mb-[17px] grid grid-cols-[1fr_130px] gap-3 max-[600px]:grid-cols-1">
            <label className="block">
              <span className="mb-2 block text-xs font-bold">Experience title</span>
              <Input
                required
                value={draft.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="e.g. Improved checkout reliability"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold">When?</span>
              <Input type="date" value={draft.date} onChange={(event) => setField("date", event.target.value)} />
            </label>
          </div>
          <label className="mb-[17px] block">
            <span className="mb-2 block text-xs font-bold">
              Why did it matter? <em className="font-normal text-[var(--color-faint-fg)]">Optional</em>
            </span>
            <Textarea
              className="min-h-[70px]"
              value={draft.impact}
              onChange={(event) => setField("impact", event.target.value)}
              placeholder="A metric, customer impact, learning, or business result…"
            />
          </label>
          <div className="my-[1px] mb-6">
            <div className="flex justify-between">
              <span className="mb-2 block text-xs font-bold">Tags</span>
              <button
                type="button"
                className="flex items-center gap-[3px] border-0 bg-transparent p-0 text-[11px] font-semibold text-[var(--color-accent)]"
                onClick={suggestTags}
              >
                Suggest tags <Sparkles size={12} />
              </button>
            </div>
            <div className="mb-[10px] flex min-h-[25px] flex-wrap gap-[7px]">
              {draft.tags.length ? (
                draft.tags.map((tag) => (
                  <button type="button" key={tag} onClick={() => toggleTag(tag)}>
                    <Badge variant="tag-selected" className="cursor-pointer">
                      {tag}
                      <X size={11} />
                    </Badge>
                  </button>
                ))
              ) : (
                <span className="text-[11px] text-[var(--color-faint-fg)]">
                  Add a few tags to make this easy to find later.
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-[7px]">
              {tags.map((tag) => (
                <button type="button" onClick={() => toggleTag(tag)} key={tag}>
                  <Badge variant={draft.tags.includes(tag) ? "tag-selected" : "tag"} className="cursor-pointer">
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-[9px] border-t border-[var(--color-border-hairline)] pt-[18px]">
            <Button variant="secondary" type="button" onClick={clear}>
              Cancel
            </Button>
            <Button type="submit">
              Update experience <ArrowRight size={15} />
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={save}>
          <label className="mb-3 block">
            <span className="mb-2 block text-xs font-bold">What happened?</span>
            <Textarea
              required
              autoFocus
              className="min-h-[160px]"
              value={draft.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Describe a project, challenge, decision, or moment that mattered… or just hit record and say it."
            />
          </label>

          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={voice.toggle}
              disabled={!voice.supported}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                voice.listening
                  ? "border-transparent bg-[#e2453a] text-white"
                  : "border-[var(--color-tag-border)] bg-[var(--color-tag-bg)] text-[var(--color-tag-fg)] hover:bg-[var(--color-tag-selected)] hover:text-white"
              )}
            >
              {voice.listening ? <Square size={13} /> : <Mic size={14} />}
              {voice.listening ? "Listening… tap to stop" : "Speak instead"}
            </button>
            {!voice.supported && (
              <span className="text-[11px] text-[var(--color-faint-fg)]">
                Voice capture isn&apos;t supported in this browser — try Chrome or Edge.
              </span>
            )}
          </div>

          <div className="flex justify-end gap-[9px] border-t border-[var(--color-border-hairline)] pt-[18px]">
            <Button variant="secondary" type="button" onClick={clear}>
              Cancel
            </Button>
            <Button type="submit">
              Save experience <ArrowRight size={15} />
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
