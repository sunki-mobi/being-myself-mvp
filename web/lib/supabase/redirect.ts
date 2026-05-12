import { type NextRequest } from "next/server";

/**
 * 서버 측 redirect용 안전한 origin 추출.
 *
 * `request.url`의 origin을 그대로 쓰면, 사용자가 `http://0.0.0.0:3000`처럼
 * bind-all 주소로 접속한 경우 Chrome이 그 hostname으로의 redirect를
 * `ERR_ADDRESS_INVALID`로 거부함. 0.0.0.0을 127.0.0.1로 치환해 안전한
 * client-navigable origin으로 변환.
 */
export function safeOrigin(request: NextRequest): string {
  const url = new URL(request.url);
  if (url.hostname === "0.0.0.0") {
    url.hostname = "127.0.0.1";
  }
  return url.origin;
}
