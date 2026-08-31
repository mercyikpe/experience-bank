"use server"

// Backend audio transcription for Quick Capture's voice option — per the
// product doc's §5.6 plan, replacing the old browser-only SpeechRecognition
// approach (Chrome/Edge only) with MediaRecorder on the client (broadly
// supported, including Safari/Firefox) and a real transcription model here
// on the server. Mirrors lib/actions/enrich.ts's auth pattern: re-derive
// the signed-in user from the session so this can't be invoked by a
// signed-out request, and never let the API key reach the client.

import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

// The current Whisper successor for uploaded-file transcription (as
// opposed to gpt-live-transcribe, which is for continuous streaming and
// isn't needed here — this stays record-then-transcribe, not live).
// Override with OPENAI_TRANSCRIBE_MODEL in .env.local without a code
// change, mirroring how OPENAI_MODEL overrides the enrichment model.
const DEFAULT_MODEL = "gpt-transcribe"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not signed in")
}

export async function transcribeAudio(formData: FormData): Promise<{ text: string }> {
  await requireUser()

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured")

  const file = formData.get("audio")
  if (!(file instanceof File)) throw new Error("No audio file provided")
  if (file.size === 0) throw new Error("Empty recording")

  const client = new OpenAI({ apiKey })

  const result = await client.audio.transcriptions.create({
    model: process.env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_MODEL,
    file,
    response_format: "json",
  })

  const text = (result.text || "").trim()
  if (!text) throw new Error("Transcription came back empty")

  return { text }
}
