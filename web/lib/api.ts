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
