# /me 실 서비스 전환 플랜 (Phase B 진입)

박람회(2026-05-12) 종료 후 `/me` 트랙을 단일 사용자 시연(방선기 baseline 하드코딩)에서 **다중 사용자 실 서비스**로 전환.

박람회 중 dev에서 시작했고 push는 안 함. 데모(`/demo`)는 그대로 master에서 운영.

---

## 결정사항 (locked)

| 영역 | 선택 | 이유 |
|---|---|---|
| **DB** | Supabase (Postgres) | Auth·DB·Storage 통합, free tier OK |
| **Auth** | Supabase Auth (Google OAuth) | Supabase RLS·세션 통합 자연스러움. Auth.js 안 씀 |
| **데이터 액세스** | `@supabase/supabase-js` + `@supabase/ssr` | RLS로 인가. Drizzle·Prisma 안 씀 |
| **음성 인터뷰 UX** | 질문별 분리 (객관식 → 음성 → 다음) | LLM 컨텍스트 분리, 사용자 부담 적음 |
| **Baseline 채우기 — 신규** | 15분 음성 셀프인터뷰 (질문 시퀀스 아래) | 첫날부터 baseline 보이는 게 와우 코어 |
| **Baseline 채우기 — 기존 보유자** | 풀텍스트 paste → LLM 파싱 → 검토 화면 | PDF/메모 통째 입력 가능 |

### 셀프인터뷰 질문 시퀀스

3 Q-block. 각 block: **객관식 1 → 음성 답변 1**.

**Q1. 내가 정말 좋아하는 것이 무엇인지 알고 있나요?**
- 알고 있어요 → **Q1-1. 내가 정말 좋아하는 것은 무엇인가요?** (음성)
- 잘 모르겠어요 → **Q1-2. 그럼, 내가 즐겁고 설레는 것은 무엇인가요?** (음성)

**Q2. 내가 잘하는 것이 무엇인지 알고 있나요?**
- 알고 있어요 → **Q2-1. 내가 잘하는 것은 무엇인가요?** (음성)
- 잘 모르겠어요 → **Q2-2. 그럼, 주변 사람들이 나에게 잘한다고 칭찬했던 것은 무엇인가요?** (음성)

**Q3. 내 인생에 있어 중요한 가치를 알고 있나요?**
- 알고 있어요 → **Q3-1. '나는 이렇게 살고 싶다' 하는 모습이 있나요?** (음성)
- 잘 모르겠어요 → **Q3-2. [⚠ 미결정]** 원문이 Q3-1과 동일한 문구("그럼, 나는 이렇게 살고 싶다 하는 모습이 있나요?")로 적혀 있었음. `web/lib/me/baseline-report.ts` Part 3 두 번째 질문인 **"나는 다른 사람들에게 어떤 영향을 주고 싶나요?"** 가 의도일 가능성 큼. 첫 코드 작업 전 사용자에게 재확인 필요.

---

## Phase 1 — 인증 + DB + 사용자 데이터

### A. 외부 셋업 (사용자가 직접 처리)

1. **Supabase 프로젝트 생성** — supabase.com 가입 → 새 프로젝트
   - 이름: `being-myself-dev`
   - 리전: `ap-northeast-2` (서울)
   - free tier
2. **Google Cloud OAuth client 생성** — console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 client ID
   - Authorized redirect URIs: `{SUPABASE_URL}/auth/v1/callback`
3. **Supabase에서 Google provider 활성화** — Authentication → Providers → Google → Client ID·Secret 입력

완료되면 사용자가 Claude에 알려주는 값:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

→ `web/.env.local`에 추가.

### B. 코드 작업

1. `@supabase/supabase-js` + `@supabase/ssr` 설치
2. `lib/supabase/{client,server,middleware}.ts` 3종 클라이언트 (Next 16 server components·middleware·browser 분리)
3. `web/middleware.ts` — `/me/*` 경로 보호. 비로그인이면 `/auth/sign-in`으로 redirect
4. `/auth/sign-in` 페이지 — Google 로그인 버튼
5. `/auth/callback` route handler — Supabase 콜백 수신
6. `/auth/sign-out` route handler
7. Supabase 스키마 SQL migration:
   - `profiles` (auth.users 1:1, id·email·display_name·avatar_url·created_at) + RLS 정책 (본인만 read/write)
   - `user_settings` (user_id PK, prepare_seen boolean, baseline_method enum('interview'|'import'|null)) + RLS
8. `/me` 페이지 — 로그인 사용자명 표시 + 빈 baseline 상태 (Phase 3에서 인터뷰 진입 CTA 채움)
9. `/demo/prepare/[step]` — 로그인 사용자면 `user_settings.prepare_seen` 체크해서 본 적 있으면 skip
10. 첫 prepare 완료 시 `prepare_seen=true` 마킹 (server action)

### Phase 1 완료 상태
- 사용자가 Google 로그인 → `/me` 진입 → 빈 baseline 화면 (Phase 3에서 인터뷰 진입 추가) → 로그아웃 가능
- prepare는 1회만 보임
- DB에 profile + settings row가 사용자당 1개씩

---

## Phase 2 — 답변 누적 DB로 (~1주)

- 스키마: `conversation`, `qa_pair`(질문 + 답변), `answer_card`(LLM 결과 캐시)
- 현재 LocalStorage 기반 `useConversation` → server-backed `useConversationRemote`로 마이그레이션
- `/api/me/conversations`, `/api/me/qa-pairs` API route
- `/me/report`에 누적 답변 카드 표시

## Phase 3 — Baseline 합성 (~1.5주)

- 첫 진입 시 진입점 분기: "처음 시작하기" / "이미 인터뷰 자료가 있어요"
- **음성 인터뷰 경로**: 위 질문 시퀀스 흐름 + MediaRecorder + Gemini multimodal STT
- **Import 경로**: 텍스트 입력 → LLM 파싱 → 사용자 검토·수정 화면
- 스키마: `baseline_report` (BaselineReport JSON 형태로 저장 + version + generated_at)
- `/me/report`·`/me/report/full`에 본인 baseline 표시 (기존 SKPAN 하드코딩 제거 — `web/lib/me/baseline-report.ts`)

## Phase 4 — Long-Term 보고서 합성 (~1.5주)

- 누적 QA가 일정 임계점(예: 14일 또는 20쌍) 넘으면 4-layer 합성 가능
- 트리거: 사용자가 보고서 페이지 진입 시 "마지막 합성 이후 N개 새 답변이 있으면 재합성"
- 스키마: `long_term_report` (+ generation 메타 — 토큰 비용, 모델, 생성 시점)
- `/me/report/full`에 합성 결과

---

## Phase 1 끝나기 전에 결정 필요한 운영 측 사항

- **개인정보 동의** — 실 사용자 답변이 Gemini에 전달됨. 회원가입 시 동의 체크박스 + 약관 텍스트(임시라도) 필요.
- **LLM 모델 검토** — 현재 Gemini 2.5 Flash. Phase B 메모리에 Claude API 검토 명시. Phase 4 진입 전 비용·품질 비교.
- **환경 분리** — Supabase는 한 프로젝트 = 한 DB. dev/prod 분리하려면 프로젝트 두 개. 박람회 중엔 dev만, prod는 박람회 후.

---

## 시작 순서 (다음 세션에서)

1. **외부 셋업** (A.1~A.3) — 사용자 직접, 약 15분
2. **Q3-2 의도 확인** — Q3-1과 같은 문구가 의도인지, baseline 두 번째 질문(영향)이 의도인지
3. `SUPABASE_URL` + `anon key` 전달 → `web/.env.local` 채우기
4. 코드 작업 **B.1 → B.10** 진행
5. dev에서 로그인 + prepare skip + `/me` 빈 화면 확인하면 Phase 1 완료

---

## 참고 파일 (코드에서 미리 살피기 좋은 곳)

- 현재 LocalStorage 기반 세션·대화 — `web/lib/session.ts`, `web/lib/conversation.ts`
- 하드코딩된 baseline (Phase 3에서 제거할 대상) — `web/lib/me/baseline-report.ts`, `web/lib/me/baselines.ts`
- LLM prompt들 (Phase 3·4 합성에서 참고) — `web/lib/ai/{digest-prompt,answer-card-prompt,pacemaker-prompt}.ts`
- Prepare 4-step 온보딩 (1회 제한 추가할 대상) — `web/app/demo/prepare/[step]/page.tsx`
- 음성 입력 작업 시 참고 — Memory `project_stt.md` (STT = MediaRecorder + Gemini multimodal)
