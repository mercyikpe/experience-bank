"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Loader2, Mic, Sparkles, Square, X } from "lucide-react"
import { toast } from "sonner"
import { tags } from "@/lib/data"
import type { Draft } from "@/lib/types"
import { transcribeAudio } from "@/lib/actions/transcribe"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Preference order for MediaRecorder's output format — webm/opus is the
// smallest and most broadly supported (Chrome/Edge/Firefox); Safari needs
// mp4/aac instead. Picked once per recording since browser support doesn't
// change mid-session.
function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return ""
  return ["audio/webm", "audio/mp4", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported(type)) || ""
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a"
  if (mimeType.includes("ogg")) return "ogg"
  return "webm"
}

/** Records one clip at a time — click to talk, click again to stop — then
 * uploads it to lib/actions/transcribe.ts for backend transcription
 * (OpenAI's gpt-transcribe, per the product doc's §5.6). Uses MediaRecorder
 * rather than the old SpeechRecognition-based approach: MediaRecorder only
 * has to record audio, not understand it, so it works in Safari/Firefox
 * too, not just Chrome/Edge — a real transcription model does the actual
 * listening, server-side. Voice and typing stay equally first-class: this
 * only ever appends to whatever text is already there, never replaces it. */
function useVoiceCapture(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [supported, setSupported] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef("")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time feature detection on mount, unavoidable (browser API presence can't be known during render)
    setSupported(
      typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined"
    )
  }, [])

  const start = async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      toast("Couldn't access your microphone — check this site's permission in your browser settings.")
      return
    }

    const mimeType = pickMimeType()
    mimeTypeRef.current = mimeType
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = async () => {
      // Always release the mic, whether or not the upload below succeeds.
      stream.getTracks().forEach((track) => track.stop())
      setRecording(false)

      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" })
      if (blob.size === 0) return

      setTranscribing(true)
      try {
        const formData = new FormData()
        formData.append("audio", blob, `capture.${extensionFor(mimeTypeRef.current)}`)
        const { text } = await transcribeAudio(formData)
        onTranscript(text)
      } catch (error) {
        console.error("Voice transcription failed", error)
        toast("Couldn't transcribe that — try again, or type it instead.")
      } finally {
        setTranscribing(false)
      }
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  const toggle = () => {
    if (transcribing) return
    if (recording) {
      mediaRecorderRef.current?.stop()
    } else {
      start()
    }
  }

  return { recording, transcribing, supported, toggle }
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
    <Card className="capture-card p-6.5" aria-labelledby="capture-title">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7d67ff,#503bd8)] text-white">
          <Sparkles size={17} />
        </div>
        <div>
          <p className="mb-1.75 text-[11px] font-bold tracking-[.11em] text-(--color-muted-fg)">
            {editing ? "EDIT EXPERIENCE" : "QUICK CAPTURE"}
          </p>
          <h2 id="capture-title" className="m-0 text-[17px] tracking-[-.02em]">
            {editing ? "Refine this experience" : "Capture an experience"}
          </h2>
        </div>
      </div>
      <p className="my-5 text-[13px] leading-[1.45] text-(--color-muted-fg)">
        {editing
          ? "Fix anything below — including whatever we guessed for you."
          : "Type it or say it. We'll fill in the title, date, tags, and company for you."}
      </p>

      {editing ? (
        <form onSubmit={save}>
          <label className="mb-4.25 block">
            <span className="mb-2 block text-xs font-bold">What happened?</span>
            <Textarea
              required
              value={draft.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Describe a project, challenge, decision, or moment that mattered…"
            />
          </label>
          <div className="mb-4.25 grid grid-cols-[1fr_130px] gap-3 max-[600px]:grid-cols-1">
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
          <label className="mb-4.25 block">
            <span className="mb-2 block text-xs font-bold">
              Why did it matter? <em className="font-normal text-(--color-faint-fg)">Optional</em>
            </span>
            <Textarea
              className="min-h-17.5"
              value={draft.impact}
              onChange={(event) => setField("impact", event.target.value)}
              placeholder="A metric, customer impact, learning, or business result…"
            />
          </label>
          <div className="my-0.25 mb-6">
            <div className="flex justify-between">
              <span className="mb-2 block text-xs font-bold">Tags</span>
              <button
                type="button"
                className="flex items-center gap-0.75 border-0 bg-transparent p-0 text-[11px] font-semibold text-(--color-accent)"
                onClick={suggestTags}
              >
                Suggest tags <Sparkles size={12} />
              </button>
            </div>
            <div className="mb-2.5 flex min-h-6.25 flex-wrap gap-1.75">
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
                <span className="text-[11px] text-(--color-faint-fg)">
                  Add a few tags to make this easy to find later.
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.75">
              {tags.map((tag) => (
                <button type="button" onClick={() => toggleTag(tag)} key={tag}>
                  <Badge variant={draft.tags.includes(tag) ? "tag-selected" : "tag"} className="cursor-pointer">
                    {tag}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2.25 border-t border-(--color-border-hairline) pt-4.5">
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
              className="min-h-40"
              value={draft.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Describe a project, challenge, decision, or moment that mattered… or just hit record and say it."
            />
          </label>

          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={voice.toggle}
              disabled={!voice.supported || voice.transcribing}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                voice.recording
                  ? "border-transparent bg-[#e2453a] text-white"
                  : "border-(--color-tag-border) bg-(--color-tag-bg) text-(--color-tag-fg) hover:bg-(--color-tag-selected) hover:text-white"
              )}
            >
              {voice.transcribing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : voice.recording ? (
                <Square size={13} />
              ) : (
                <Mic size={14} />
              )}
              {voice.transcribing ? "Transcribing…" : voice.recording ? "Listening… tap to stop" : "Speak"}
            </button>
            {!voice.supported && (
              <span className="text-[11px] text-(--color-faint-fg)">
                Voice capture isn&apos;t supported in this browser.
              </span>
            )}
          </div>

          <div className="flex justify-end gap-2.25 border-t border-(--color-border-hairline) pt-4.5">
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
