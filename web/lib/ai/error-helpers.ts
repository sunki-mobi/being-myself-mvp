/**
 * Gemini API 호출 시 에러를 사용자 친화적으로 분류.
 *
 * 가장 자주 만날 함정 — Free tier 일일 호출 한도(`gemini-2.5-flash`은 20/일,
 * `gemini-2.5-flash-lite`은 ~1000/일). 한도 초과 시 status 429 + RESOURCE_EXHAUSTED
 * 에러. ai SDK는 retry-after 따라 3번 자동 재시도 후 AI_RetryError로 떨어짐.
 */

export type ApiErrorBody = {
  error: string;
  detail?: string;
};

export function classifyGeminiError(err: unknown): {
  status: number;
  body: ApiErrorBody;
} {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lc = message.toLowerCase();

  if (
    lc.includes("resource_exhausted") ||
    lc.includes("quota exceeded") ||
    lc.includes("free_tier")
  ) {
    return {
      status: 429,
      body: {
        error:
          "오늘 AI 호출 한도를 모두 썼어요. 잠시 뒤 다시 시도하거나, 박람회 운영자에게 알려주세요.",
        detail: "Gemini API daily quota exceeded.",
      },
    };
  }

  if (lc.includes("auth") || lc.includes("unauthorized") || lc.includes("api key")) {
    return {
      status: 500,
      body: {
        error: "AI 키 설정에 문제가 있어요. 박람회 운영자에게 알려주세요.",
        detail: "Gemini API auth failed.",
      },
    };
  }

  return {
    status: 502,
    body: {
      error: "AI 호출 중 일시적인 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
      detail: message.slice(0, 200),
    },
  };
}
