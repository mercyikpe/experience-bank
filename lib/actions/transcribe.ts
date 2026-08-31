"use server"

// Backend audio transcription for Quick Capture's voice option (replaces
// the old browser-only SpeechRecognition approach, which didn't work in
// Safari/Firefox). Same auth pattern as lib/actions/enrich.ts.

import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

// Whisper's successor for uploaded-file transcription. Override via
// OPENAI_TRANSCRIBE_MODEL if needed.
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
