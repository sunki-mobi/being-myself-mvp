"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * MediaRecorder 기반 음성 녹음 hook. iPad Safari·Chrome 모두 동작.
 *
 * Safari는 audio/webm 미지원이라 audio/mp4(또는 audio/aac)로 떨어지고, Chrome은
 * audio/webm;codecs=opus를 받음. 첫 supported MIME을 자동 선택.
 *
 * - state: 'idle' | 'requesting' | 'recording' | 'stopped' | 'error'
 * - blob: 녹음 종료 시 채워짐
 * - mimeType: 실제 사용된 MIME (transcribe 호출 시 그대로 보냄)
 * - durationMs: 녹음 길이
 * - start(): 권한 요청 → 녹음 시작
 * - stop(): 녹음 종료 (blob 생성)
 * - reset(): 다음 녹음 위해 상태 초기화
 */
export type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "stopped"
  | "error";

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/aac",
];

function pickSupportedMimeType(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  // Safari에서는 isTypeSupported가 false를 줘도 빈 옵션으로 default mp4 받음.
  return undefined;
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    recorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    setDurationMs(0);
    chunksRef.current = [];

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setError("이 브라우저는 마이크 입력을 지원하지 않아요.");
      return;
    }

    setState("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setState("error");
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("마이크 권한이 필요해요. 브라우저 권한을 허용해 주세요.");
      } else {
        setError("마이크를 켤 수 없어요. 잠시 뒤 다시 시도해 주세요.");
      }
      return;
    }
    streamRef.current = stream;

    const picked = pickSupportedMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = picked
        ? new MediaRecorder(stream, { mimeType: picked })
        : new MediaRecorder(stream);
    } catch (err) {
      cleanup();
      setState("error");
      setError(`녹음을 시작할 수 없어요. (${String(err)})`);
      return;
    }

    recorderRef.current = recorder;
    setMimeType(recorder.mimeType || picked || "audio/webm");

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const finalType =
        recorder.mimeType || picked || "audio/webm";
      const merged = new Blob(chunksRef.current, { type: finalType });
      setBlob(merged);
      setDurationMs(Date.now() - startedAtRef.current);
      setState("stopped");
      cleanup();
    };
    recorder.onerror = (e) => {
      setError(`녹음 중 오류가 났어요. (${String((e as ErrorEvent).error)})`);
      setState("error");
      cleanup();
    };

    startedAtRef.current = Date.now();
    recorder.start();
    setState("recording");

    // 1초마다 duration 갱신 (UI에서 진행 시간 표시)
    tickRef.current = window.setInterval(() => {
      setDurationMs(Date.now() - startedAtRef.current);
    }, 250);
  }, [cleanup]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch (err) {
      console.error("[recorder] stop failed", err);
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setState("idle");
    setError(null);
    setBlob(null);
    setMimeType(null);
    setDurationMs(0);
    chunksRef.current = [];
  }, [cleanup]);

  return { state, error, blob, mimeType, durationMs, start, stop, reset };
}
