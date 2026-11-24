import interviewMock from "@/mocks/interview.json";
import resultsMock from "@/mocks/results.json";
import type {
  ApiErrorBody,
  EligibilityResult,
  InterviewNext,
  OptimizeResponse,
  Profile,
  ProfileFieldName,
  Scheme,
  SlotCandidate,
} from "@/lib/types";
import type { Locale } from "@/lib/i18n";

// Mocks are on unless NEXT_PUBLIC_USE_MOCKS is exactly "false".
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const MOCK_DELAY_MS = 250;

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const failure = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      failure?.error.code ?? "http_error",
      failure?.error.message ?? `Request failed with status ${response.status}`,
    );
  }
  return (await response.json()) as T;
}

async function mockReply<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return structuredClone(value);
}

// GET /schemes. The results screen needs names, amounts and sources to show each verdict.
export function getSchemes(): Promise<Scheme[]> {
  if (USE_MOCKS) return mockReply(resultsMock.schemes as Scheme[]);
  return request<Scheme[]>("GET", "/schemes");
}

// True when the built-in sample data is used instead of the API.
export const usingMocks = USE_MOCKS;

export function getSchemeCount(): Promise<number> {
  if (USE_MOCKS) return mockReply(interviewMock.total_schemes);
  return getSchemes().then((schemes) => schemes.length);
}

export async function evaluate(profile: Profile): Promise<EligibilityResult[]> {
  if (USE_MOCKS) return mockReply(resultsMock.results as EligibilityResult[]);
  const reply = await request<{ results: EligibilityResult[] }>("POST", "/eligibility/evaluate", {
    profile,
  });
  return reply.results;
}

export async function interviewNext(profile: Profile, lang: Locale): Promise<InterviewNext> {
  if (USE_MOCKS) {
    const next = (interviewMock.questions as InterviewNext[]).find(
      (question) => question.field && !profile[question.field as ProfileFieldName]?.confirmed,
    );
    return mockReply(next ?? { field: null, question: "", choices: null, resolves_estimate: 0 });
  }
  return request<InterviewNext>("POST", "/interview/next", { profile, lang });
}

export function optimize(profile: Profile): Promise<OptimizeResponse> {
  if (USE_MOCKS) return mockReply(resultsMock.optimize as OptimizeResponse);
  return request<OptimizeResponse>("POST", "/optimize", { profile });
}

// Voice. There is no mock for these: with mocks on they fail and the UI falls back to tapping.
export const voiceAvailable = !USE_MOCKS;

async function voiceRequest(path: string, init: RequestInit): Promise<Response> {
  if (USE_MOCKS) throw new ApiError("voice_unavailable", "Voice needs the API (mocks are on)");
  const response = await fetch(`${BASE_URL}/api${path}`, { method: "POST", ...init });
  if (!response.ok) {
    const failure = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      failure?.error.code ?? "http_error",
      failure?.error.message ?? `Request failed with status ${response.status}`,
    );
  }
  return response;
}

// POST /voice/transcribe. The audio goes to our API only, which proxies it and keeps nothing.
export async function transcribe(audio: Blob, lang: Locale): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, audio.type.includes("mp4") ? "answer.mp4" : "answer.webm");
  form.append("lang", lang);
  const reply = await voiceRequest("/voice/transcribe", { body: form });
  return ((await reply.json()) as { text: string }).text;
}

// POST /slots/extract. Values are only candidates; the read-back confirms them.
export async function extractSlots(
  transcript: string,
  expectingField: ProfileFieldName | null,
  lang: Locale,
): Promise<SlotCandidate[]> {
  const reply = await voiceRequest("/slots/extract", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, expecting_field: expectingField, lang }),
  });
  return ((await reply.json()) as { fields: SlotCandidate[] }).fields;
}

// POST /voice/speak. Returns MP3 audio.
export async function speak(text: string, lang: Locale): Promise<Blob> {
  const reply = await voiceRequest("/voice/speak", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  });
  return reply.blob();
}
