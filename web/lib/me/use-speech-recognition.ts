"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 브라우저 내장 SpeechRecognition wrapper — 한국어 실시간 transcription.
 *
 * - Chrome/Edge/Safari/iPadOS Safari 지원. Firefox 한국어 미지원 케이스 있음.
 * - Secure context 필요 (https 또는 127.0.0.1·localhost).
 * - interimTranscript = 말하는 동안 갱신, finalTranscript = 발화 종료 후 확정.
 *   sum을 외부로 노출 (`transcript`) — UI는 이걸 표시.
 *
 * 사용:
 *   const { isSupported, isListening, transcript, error, start, stop, reset } =
 *     useSpeechRecognition({ lang: "ko-KR" });
 */

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(options: { lang?: string } = {}) {
  const lang = options.lang ?? "ko-KR";

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // start() 호출 직후 onend가 자동 호출되는 케이스(브라우저별)를 위해, 사용자 의도로
  // 멈춘 건지 추적.
  const stoppedByUserRef = useRef(false);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: unknown) => {
      // event.results is SpeechRecognitionResultList.
      // 일부 모바일 브라우저(Samsung Internet 등)는 매 onresult에서 누적된
      // results 전체를 다시 보내며 resultIndex를 0으로 리셋하는 케이스가 있음.
      // 그래서 prev + chunk 누적 방식은 같은 final이 여러 번 더해져 중복됨.
      // 대신 매번 results 전체를 처음부터 훑어 final 전체 텍스트로 set.
      const ev = event as {
        resultIndex: number;
        results: {
          length: number;
          [i: number]: {
            isFinal: boolean;
            [j: number]: { transcript: string };
          };
        };
      };
      let allFinal = "";
      let interim = "";
      for (let i = 0; i < ev.results.length; i++) {
        const result = ev.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          allFinal += transcript;
        } else {
          interim += transcript;
        }
      }
      setFinalTranscript(allFinal);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: unknown) => {
      const ev = event as { error?: string };
      const code = ev.error ?? "unknown";
      // 'aborted' = 사용자가 stop 호출 → silent. 그 외는 모두 시각화 (no-speech 포함).
      if (code !== "aborted") {
        setError(translateError(code));
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      stoppedByUserRef.current = true;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setFinalTranscript("");
    setInterimTranscript("");
    stoppedByUserRef.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // 이미 start 호출된 상태에서 다시 부르면 throw
      setError("이미 인식 중이에요. 잠시 후 다시 시도해주세요.");
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    stoppedByUserRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  // transcript = final + interim (UI 한 줄로 표시하기 좋게)
  const transcript = (finalTranscript + interimTranscript).trim();

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}

function translateError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "마이크 권한이 필요해요. 주소창 좌측 자물쇠 아이콘에서 허용해주세요.";
    case "audio-capture":
      return "마이크를 찾을 수 없어요. 시스템 사운드 설정에서 입력 장치를 확인해주세요.";
    case "no-speech":
      return "말씀이 감지되지 않았어요. 마이크가 멀거나 작게 말한 것 같아요.";
    case "network":
      return "Google 음성 서버에 연결할 수 없어요. 회사망·VPN·확장 프로그램을 확인해보세요.";
    case "language-not-supported":
      return "이 브라우저는 한국어 음성 인식을 지원하지 않아요.";
    default:
      return `음성 인식 오류 (${code})`;
  }
}
