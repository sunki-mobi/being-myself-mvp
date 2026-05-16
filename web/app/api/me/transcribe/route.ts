import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { classifyGeminiError } from "@/lib/ai/error-helpers";

export const runtime = "nodejs";

// 박람회 부스 한 답변 분량 충분 — 약 8MB까지 (audio/mp4 기준 5분쯤).
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mpeg",
  "audio/wav",
  "audio/x-m4a",
  "audio/aac",
]);

/**
 * 음성 → 한국어 텍스트.
 *
 * MediaRecorder가 보낸 audio Blob을 Gemini multimodal로 전달, 한국어 구어체 그대로
 * 받아 적게 함. /me/conversation 답변 입력에서 호출. 사용자가 받은 텍스트를
 * textarea에서 다듬은 뒤 [다음] 제출하는 흐름.
 */
export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      {
        error: "AI 키 설정에 문제가 있어요. 박람회 운영자에게 알려주세요.",
        detail: "GOOGLE_GENERATIVE_AI_API_KEY missing.",
      },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    return Response.json(
      { error: "잘못된 요청 형식이에요.", detail: String(err) },
      { status: 400 },
    );
  }

  const file = formData.get("audio");
  if (!(file instanceof Blob)) {
    return Response.json(
      { error: "audio 파일이 없어요. 다시 녹음해 주세요." },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return Response.json(
      { error: "녹음이 비어 있어요. 다시 시도해 주세요." },
      { status: 400 },
    );
  }

  if (file.size > MAX_AUDIO_BYTES) {
    return Response.json(
      { error: "녹음이 너무 길어요 (8MB 제한). 한 답변은 짧게 잘라 주세요." },
      { status: 413 },
    );
  }

  // 일부 브라우저 (특히 Safari)는 MIME에 codec 파라미터가 붙거나 audio/x-m4a 같은
  // 변종을 내보냄. base mediaType으로 normalize.
  const rawType = file.type || "audio/webm";
  const baseType = rawType.split(";")[0]!.trim();
  const mediaType = ALLOWED_TYPES.has(rawType)
    ? rawType
    : ALLOWED_TYPES.has(baseType)
      ? baseType
      : "audio/webm";

  let audioBuffer: Uint8Array;
  try {
    audioBuffer = new Uint8Array(await file.arrayBuffer());
  } catch (err) {
    return Response.json(
      { error: "음성 파일을 읽을 수 없어요.", detail: String(err) },
      { status: 400 },
    );
  }

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "다음 음성을 한국어 텍스트로 그대로 받아 적어 주세요. " +
                "구어체와 어투(~것 같아요, ~거든요 등)는 살리고, 음 / 어 / 그 같은 군더더기 망설임은 자연스럽게 빼 주세요. " +
                "추측해서 문장을 만들어내지 말고 들리는 그대로만. " +
                "⚠️ 절대 금지: 시간 표기(00:00, 00:01 같은 타임스탬프), 화자 표시([speaker], 화자: 등), 따옴표·머리말·꼬리말. " +
                "자연스러운 한국어 본문만, 시간 표기 없이 한 덩어리 텍스트로 출력하세요.",
            },
            {
              type: "file",
              data: audioBuffer,
              mediaType,
            },
          ],
        },
      ],
    });

    const transcript = text.trim();
    if (!transcript) {
      return Response.json(
        {
          error: "음성에서 텍스트를 읽지 못했어요. 한 번 더 또렷하게 말씀해 주세요.",
        },
        { status: 422 },
      );
    }

    return Response.json({ text: transcript });
  } catch (err) {
    console.error("[/api/me/transcribe] gemini error", err);
    const { status, body } = classifyGeminiError(err);
    return Response.json(body, { status });
  }
}
