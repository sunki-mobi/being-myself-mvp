# Being Myself — 내부 공유 문서

> **누가 보나요**: Mobinity 팀 11명 + 향후 합류자
> **목적**: 신규 합류자가 30분 안에 시스템 이해 + 현직 팀원이 의사결정 근거 참조
> **최종 갱신**: 2026-05-19 (master @ `2121395`)

---

## 목차

1. [제품 개요](#1-제품-개요)
2. [사용자 흐름](#2-사용자-흐름)
3. [개발 마일스톤 & 완성된 것](#3-개발-마일스톤--완성된-것)
4. [시스템 아키텍처 & 스택](#4-시스템-아키텍처--스택)
5. [DB 구조](#5-db-구조)
6. [LLM 로직 체계 (8 flow)](#6-llm-로직-체계-8-flow)
7. [ADR — Architecture Decision Records](#7-adr--architecture-decision-records)
8. [운영·배포·보안](#8-운영배포보안)
9. [알려진 한계 & 다음 단계](#9-알려진-한계--다음-단계)
10. [용어집](#10-용어집)
11. [링크 인덱스](#11-링크-인덱스)

> 더 상세한 컬럼·인덱스·zod 스키마는 [부록](internal-overview-2026-05-19-appendix.md)에 정리.

---

## 1. 제품 개요

### 한 줄 정의

> **하루 5분, 두 가지 질문에 답하면 자기 자신이 조금씩 선명해지는 서비스.**

매일 두 가지 질문에 답하면, 답변을 LLM이 카드로 정리해 보고서에 쌓아줘요. 처음 가입 시 15분 셀프인터뷰로 자기 시작점(좋아하는 것·잘하는 것·가치 있는 것)을 만들고, 그 위에 매일의 답변이 누적되면서 4단계 보고서(현상·본질·가치·존재)로 자라납니다.

### 왜 만들었나

**기존 자기 발견 도구의 빈 자리**:
- MBTI 등 1회성 진단 — 가볍고 재미있지만 16박스에 사람을 가둠
- 코칭 — 깊지만 비싸고 진입장벽 높음

**우리의 가설**: 짧고 꾸준한 의식이 사람을 가장 잘 발견하게 한다. 하루 5분, 두 가지 질문. 한 달·6개월·1년 모이면 "나는 어떤 사람인가"라는 질문에 가장 잘 답할 수 있는 사람은 결국 본인.

### 핵심 메타포

- **나에게 집중하는 시간** — 헤더 카피, 첫 진입 시 사용자가 보는 핵심 메시지
- **Being myself** — 제품 이름. "Being"이라는 큰 우산 아래의 한 도구
- **카드로 정리한다** — raw 답변을 LLM이 "제목+짧은 본문" 카드로 옮김. *내 답변을 누군가 정성껏 들어준 느낌*이 와우 모먼트의 핵심

### 와우 모먼트 — Echo-back

답변 후 AI가 만든 한 줄이 거울처럼 자기를 다시 비춤. 사용자가 한 말을 모은 한 줄에서 "*아, 내가 그런 사람이구나*" 깨달음이 일어나는 자리. 시작점의 `headline` 필드 + 매일 digest의 `summary`가 이 역할.

### 두 트랙

| 트랙 | 경로 | 용도 |
|---|---|---|
| **/me** | 로그인 사용자 본인 데이터 누적 | 실 서비스 (현재 11명 사용 중) |
| **/demo** | 페르소나 시작점 (직장인·중고생·기독교 사역자 3종) | 박람회·외부 시연. 게스트 익명, LocalStorage만 |

### 우리가 지키는 것

1. **사용자가 주체** — AI는 답변을 정리하는 도구. 평가·진단·라벨링 X
2. **데이터는 본인의 것** — RLS로 본인만 조회. 분석·평가용이 아닌 본인 발견용
3. **짧고 꾸준함** — 5분 cadence 우선. "한 번에 많이"보다 "매일 조금씩"
4. **종교·직군·문화 중립이 default** — 특정 audience 톤은 별도 pack(/demo 페르소나가 시초)

### 차별화 한 줄

> MBTI는 한 번 진단으로 박스에 넣고, 코칭은 비쌉니다. Being Myself는 **매일 5분으로 본인이 본인의 시작점을 자라게 하는 자리**예요.

---

## 2. 사용자 흐름

### 전체 그림

```
[방문] /auth/sign-up ─→ 회원가입 (이메일+비번)
   │
   ▼
[로그인됨] /me  ─── 셀프인터뷰 있음? ─NO─→ 셀프인터뷰 만들기 분기
   │                                    ├─ /me/baseline/interview (15분 음성)
   │                                    └─ /me/baseline/import (paste)
   │                                          │
   │ ◄────────────────────────────────────────┘ 합성 완료
   ▼
[/me 홈 — 2 카드]
   │
   ├─ /me/do  (오늘의 시간, 쓰기 모드)
   │    ├─ /me/conversation   매일의 두 질문 (Q1 자유 + Q2 풀에서)
   │    └─ /me/diary/new      소명일기 (오늘 한 일 paste)
   │
   └─ /me/report  (내 보고서, 읽기 모드, 4 tab)
        ├─ 매일       날짜 chip + 그 날 Q/A + AI digest
        ├─ 인터뷰    시작점 본문 (좋아함·잘함·가치 3 part)
        ├─ 흐름      장기 4단계 보고서 (현재 preview)
        └─ 일기      소명일기 누적
```

### 주요 흐름 6가지

#### A. 회원가입 & 첫 진입
- **Supabase Auth** (이메일+비번). Google OAuth는 Phase B.
- 가입 직후 DB 트리거가 `profiles`, `user_settings` row 자동 생성
- `/me/*` 진입 시 proxy 미들웨어가 비로그인 가드 → `/auth/sign-in?next=...`
- 첫 `/me` 진입에서 `baseline_report` 조회 → 없으면 **셀프인터뷰 만들기 분기 화면** (음성 셀프인터뷰 / Import 두 카드)

#### B. 셀프인터뷰 (시작점 만들기 V2)
- 6 step 흐름: 3개 질문 블록 × (객관식 카드 선택 → 음성 답변)
- **음성 인식**: `MediaRecorder` API로 녹음 → `/api/me/transcribe` (Gemini Flash-Lite) → 텍스트. 박람회 직후 V1(Web Speech API)에서 V2로 전면 교체 (모바일 호환성 이슈 해소)
- **이탈 후 resume**: 답변 단계마다 `baseline_interview_progress` 테이블에 즉시 저장 → 다음 진입 시 정확히 그 자리에서
- 마지막 단계에서 **LLM이 모든 답변을 `BaselineShape` JSON으로 합성** → `baseline_report.report` 컬럼에 저장

#### C. Import (기존 자료 가져오기)
- 이미 셀프인터뷰 자료를 갖고 있는 사람용 (PDF·메모·노트 통째로 paste)
- LLM이 자동으로 3 Part(좋아함·잘함·가치)로 분류·정리
- 사용자가 검토·수정 화면에서 직접 편집 후 저장
- 결과는 셀프인터뷰와 같은 `BaselineShape` 형식

#### D. 매일의 두 질문 (`/me/conversation`)
- 첫 진입 시 chat API 호출 → AI 환영 + Q1
- 사용자 답변 → AI reaction + Q2 → 사용자 답변 → 마무리 reaction
- **server hard cap**: 2턴 넘기면 무조건 마무리 ("매일 두 질문" 약속 강제)
- **Q1** = LLM 자유 생성 — QueSCo 6 유형 중 하나, 직전 답변·시작점·소명일기 컨텍스트 환기
- **Q2** = 139문 큐레이션 풀(`lib/me/question-pool.ts`)에서 선택 — recency cooldown N=60(약 2달 간격)으로 dedup
- 마무리 후 `?fresh=1`로 `/me/report` 자동 이동 → daily digest 생성 트리거

#### E. 소명일기 (`/me/diary/new`)
- 4 step state machine: **paste → review → choose → write**
- paste: 오늘 한 일을 통째로 입력 (≥30자)
- review: LLM이 시간순 `contribution_flow` JSON으로 정리. OKR 등록돼 있으면 비교 컨텍스트로 사용
- choose: AI가 제안한 질문 + source 출처 선택
- write: 답변 + 자유 노트 작성 → `somyeong_entries` 저장

#### F. 보고서 보기 (`/me/report`)
- **4 tab 통합 페이지** (V4부터 — 이전엔 `/me/report`, `/me/report/full`, `/me/long-term`, `/me/reports` 분산)
- URL deep link: `?tab=interview|long-term|diary`
- **매일 tab**: 날짜 chip strip + 선택된 날 Q/A 카드 + AI digest. 오늘이면 digest 클라이언트 fetch, 과거는 캐시만
- **인터뷰 tab**: 시작점 본문, sub-tab으로 part 전환 (좋아함 → 잘함 → 가치 순)
- **흐름 tab**: 4단계 보고서 (현재 페르소나 preview, 본인 합성은 다음 페이즈)
- **일기 tab**: `somyeong_entries` 카드 리스트 + "오늘 일기 쓰기" CTA

### LocalStorage vs DB

- **DB (Supabase)** = source of truth. 누적된 모든 데이터.
- **LocalStorage**는 in-session UX 유지만 (대화 진행 중 새로고침 대비 등). 시작 시 server qa_pair count와 mismatch면 자동 reset.
- `/demo` 트랙은 LocalStorage만, DB 안 씀 (게스트 익명).

---

## 3. 개발 마일스톤 & 완성된 것

### 타임라인

| 시기 | 단계 | 핵심 산출물 |
|---|---|---|
| ~2026-04 | **Phase A** (구상·박람회 준비) | /demo 3 페르소나, 부스 시연 흐름 |
| **2026-05-12 (화)** | Phase A 마무리 — 박람회 부스 시연 ✅ | 검증 완료 — "5분 시연으로 와우 모먼트 전달 가능" 확인 |
| **2026-05-13 (수)** | **Phase B 진입** — Phase 1·2·3·4a 한 번에 전환 | 회원가입 + 답변 누적 + 셀프인터뷰 + 4단계 보고서 — dev·prod 풀스택 동작. 하루 12 커밋, 4 prod 배포. |
| 2026-05-14~17 | Phase B 폴리시 (IA 재구조, 음성 V2, 코칭 prompt 정밀화) | 모바일 fix, Samsung 음성 fix, prompt Q1·Q2 분리 진화 |
| 2026-05-18~19 | Phase B — Q2 큐레이션 풀 + 보고서 4-tab 통합 | 139문 풀, recency cooldown N=60, /me/report 4 tab |

### 현재 완성된 기능 (2026-05-19 기준)

#### ✅ 사용자 진입
- 이메일+비번 회원가입·로그인 (Supabase Auth)
- 가입 시 `profiles`, `user_settings` 자동 생성 (DB 트리거)
- `/me/*` 비로그인 가드 (proxy 미들웨어)
- 로그아웃, 설정 페이지

#### ✅ 시작점 생성 — 두 갈래
- **음성 셀프인터뷰 V2** (`/me/baseline/interview`) — MediaRecorder + Gemini transcribe, 6 step, question 단위 resume
- **Import** (`/me/baseline/import`) — 풀텍스트 paste → LLM 자동 3 part 분류 → 사용자 검토·수정
- 둘 다 결과는 `baseline_report.report` 컬럼(JSON `BaselineShape`)

#### ✅ 매일의 두 질문
- `/me/conversation` 2턴 흐름, server hard cap (2턴 강제 마무리)
- **Q1**: 자유 생성 — QueSCo 6 유형, 직전 답변·시작점·일기 컨텍스트 환기
- **Q2**: 139문 풀에서 선택 — recency cooldown N=60(약 2달 간격)으로 영구 dedup
- `qa_pair` DB 저장 + question_id 누적 (migration 009)

#### ✅ 보고서 — 4 tab 통합 (`/me/report`)
- **매일** tab: 날짜 chip + 그 날 Q/A + AI digest (today만 fresh, 과거는 캐시)
- **인터뷰** tab: 시작점 본문 (좋아함 → 잘함 → 가치 sub-tab)
- **흐름** tab: 4단계 보고서 preview (페르소나 양식만, 본인 합성은 다음 페이즈)
- **일기** tab: 소명일기 누적 카드
- URL deep link `?tab=interview|long-term|diary`
- `/me/report/full`, `/me/long-term`, `/me/reports`는 redirect

#### ✅ 소명일기 V1 (`/me/diary`)
- 4 step: paste → review → choose → write
- `somyeong_entries` 누적 저장
- `/me/settings/goal`로 OKR 등록 → 일기 합성 컨텍스트에 주입

#### ✅ LLM 호출 캐시
- `answer_card` — 답변 카드 LLM 합성 결과 (migration 005)
- `daily_digest` — 매일 정리 LLM 합성 결과 (migration 008)
- 캐시 hit이면 LLM 호출 0, miss이면 client fetch + DB write

#### ✅ /demo 트랙 (박람회 검증 완료)
- 직장인 / 중고생 / 기독교 사역자 3 페르소나
- 게스트 익명, LocalStorage only
- 부스에서 5분 시연 검증

#### ✅ 운영 기반
- 약관·개인정보 동의 (prepare 단계)
- GA4 analytics (Vercel 환경변수 연동)
- `/me/error.tsx`·`/me/loading.tsx` 에러 경계
- Vercel prod 배포 (`https://being-myself-mvp.vercel.app`)
- 본인 계정·테스트 계정용 cleanup·seed SQL

### 미완성·다음 페이즈

| 항목 | 상태 | 메모 |
|---|---|---|
| 본인 흐름 보고서 활성화 | 🚧 양식 preview만 | `baseline + qa_pair` 누적 기반 합성 로직 필요. 답변이 충분히 쌓이는 시점에 활성 |
| Google OAuth | 📅 | 이메일+비번만 현재 지원 |
| Audience pack (skinning) | 📅 | 기독교 리더·청소년·예술가 등 톤 변형 |
| 공동체용 instance | 📅 | 교회·기업·학교가 가져갈 수 있는 framework화 |
| Q2 풀 확장 | 📅 | 139문 → 200+. 사용자 패턴 보고 카테고리 보강 |

> 상세한 한계·다음 단계는 [§9 알려진 한계](#9-알려진-한계--다음-단계) 참고.

---

## 4. 시스템 아키텍처 & 스택

### 한눈에

```
┌────────────────────────────────────────────────────────┐
│  Browser (iPad portrait 우선 · 모바일 · 데스크탑)         │
│  ├ Next.js SSR + client islands                        │
│  ├ MediaRecorder (음성 녹음)                            │
│  └ LocalStorage (in-session UX, conversation state)   │
└────────────────────────────┬───────────────────────────┘
                             │ HTTPS
                             ▼
┌────────────────────────────────────────────────────────┐
│  Vercel — Next.js 16 (App Router, Turbopack)          │
│  ├ Server Components — SSR + Supabase auth             │
│  ├ proxy.ts — 비로그인 가드                              │
│  ├ /api/me/chat            → Gemini Flash             │
│  ├ /api/me/digest          → Gemini Flash-Lite        │
│  ├ /api/me/transcribe      → Gemini Flash-Lite        │
│  ├ /api/me/answer-card     → Gemini Flash-Lite        │
│  ├ /api/me/diary/synthesize → Gemini Flash-Lite       │
│  ├ /api/me/baseline-*      → Gemini Flash-Lite        │
│  ├ /api/me/long-term-report/refresh → Gemini Flash-Lite│
│  └ /api/me/qa-pairs        → DB only (no LLM)         │
└──────┬────────────────────────────────────┬───────────┘
       │ Postgres + RLS                     │ HTTPS + key
       ▼                                    ▼
┌────────────────────────┐       ┌──────────────────────┐
│ Supabase               │       │ Google Gemini API    │
│ ├ Auth (이메일+비번)     │       │ ├ gemini-2.5-flash   │
│ ├ Postgres             │       │ │   (chat 전용)       │
│ ├ RLS 모든 user 테이블   │       │ └ gemini-2.5-flash-  │
│ ├ Triggers (touch ts)  │       │    lite (그 외)      │
│ ├ Storage   ─ 미사용     │       └──────────────────────┘
│ └ Realtime  ─ 미사용     │
└────────────────────────┘
```

### 스택

| 영역 | 기술 | 버전·주석 |
|---|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack) | 기존 Next 14·15와 API·구조 차이 큼 (`middleware` → `proxy` 등) |
| | React 19 + TypeScript | Server Component default |
| | Tailwind CSS v4 | `@apply` 대신 utility 직접, CSS variable token |
| **Backend** | Next.js Server Components + API Routes | Node runtime (Vercel) |
| | Zod | API request·response 스키마 |
| **DB / Auth** | Supabase Postgres + RLS | 모든 user 테이블 `auth.uid() = user_id` 정책 |
| | `@supabase/ssr` | Server-side 클라이언트 (RLS 강제) |
| **LLM** | Google Gemini (via Vercel AI SDK v6) | `@ai-sdk/google ^3.0`, `ai v6` |
| | `gemini-2.5-flash` | chat 호출만 (Q1·Q2 정밀화 필요) |
| | `gemini-2.5-flash-lite` | 그 외 LLM 호출 (Free tier ~1000/일) |
| **음성** | Browser MediaRecorder API | 모든 브라우저 호환. iOS Safari 포함 |
| | Gemini transcribe (Flash-Lite) | 음성 → 텍스트 변환 |
| **Hosting** | Vercel | master push → 자동 prod 배포 |
| **Analytics** | GA4 + `@vercel/analytics` | 사용자 흐름·전환 측정 |

### 환경 변수 (요점)

| 변수 | 위치 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase anon key (RLS에 의존) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | RLS bypass 필요할 때 (관리 작업) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | **server only** | Gemini API key. 클라이언트 노출 금지 |
| `NEXT_PUBLIC_GA4_ID` | client | GA4 측정 ID (optional) |

> dev: `web/.env.local`. prod: Vercel Dashboard → Settings → Environment Variables.

### 라우팅 패턴

- **App Router** (`app/` 디렉토리). Pages Router 안 씀.
- `app/me/*` — 인증 사용자 본인 데이터 트랙
- `app/demo/*` — 게스트 페르소나 트랙
- `app/auth/*` — sign-in·sign-up·callback
- `app/api/me/*` — 서버 API. 모두 Node runtime (Gemini SDK 호환).
- `proxy.ts` (구 middleware) — 비로그인 `/me/*` 가드, `/auth/sign-in?next=...`로 redirect

### Server vs Client 경계

- **Server component (default)** — DB 쿼리, baseline 조회, 페이지 진입 시 데이터 prefetch
- **Client component (`"use client"` 명시)** — useState·useEffect 필요한 인터랙션, audio recorder, conversation state
- **API route (Node runtime)** — Gemini 호출, qa_pair 저장, 인증 확인
- **NEVER from client**: Gemini API 직접 호출 (key 노출). Supabase RLS bypass.

### dev 서버 (Windows + Next 16)

> `web/AGENTS.md`에 dev 서버 함정 정리 — 신규 합류자 필독.

- `npm run dev`는 `0.0.0.0` bind. LAN 접근용 `allowedDevOrigins` 설정 필요(iPad 시연용)
- `localhost`보다 `127.0.0.1` 또는 LAN IP 사용 (Windows IPv6 `::1`에서 HMR 무한 reconnect 함정)
- dev 서버 켜진 채로 `npm install` 금지 (Turbopack 모듈 resolver 망가짐)

---

## 5. DB 구조

### 한눈에 — ER 그림

```
auth.users (Supabase Auth — id, email)
    │
    ├─1:1─ profiles                    (display_name, email)
    ├─1:1─ user_settings               (prepare_seen, baseline_method)
    ├─1:1─ baseline_report             ⭐ 시작점 JSON
    ├─1:1─ baseline_interview_progress  (셀프인터뷰 in-progress)
    ├─1:1─ long_term_report             (4단계 누적 JSON, 현재 본인 합성 비활성)
    ├─1:N─ somyeong_user_okr            (분기별 OKR)
    ├─1:N─ somyeong_entries             (일일 일기, 하루 1개)
    ├─1:N─ daily_digest                 (매일 두 질문 정리 캐시)
    └─1:N─ conversation                 (한 세션 = 한 row)
              │
              └─1:N─ qa_pair            (질문 + 답변 + question_id)
                        │
                        └─1:1─ answer_card  (LLM 합성 카드 캐시)
```

> View: `somyeong_usage_metrics` — 운영자 모니터링용 사용 수치 집계.
> `security_invoker=on` + anon/authenticated REVOKE — 콘텐츠 접근 0, 카운트만.

### 공통 규약

- **모든 user 테이블 RLS** — `auth.uid() = user_id` (또는 `= id`). 본인 row만 select·insert·update.
- **`updated_at` 자동 갱신** — `touch_updated_at()` 트리거 + before update.
- **신규 회원가입 자동 동기화** — `auth.users INSERT` 시 `profiles` + `user_settings` row 자동 생성 (security definer 트리거).
- **운영자도 콘텐츠 접근 불가** — `service_role` key는 서버에서만 사용. Supabase Dashboard에서 직접 raw 조회는 service role 권한 필요.

### 인증·설정

#### `profiles` (001)
- `auth.users`와 1:1. 표시용 사용자 정보.
- `id` (PK = auth.users.id), `email`, `display_name`
- 가입 시 트리거로 자동 생성. `display_name`은 `raw_user_meta_data.display_name` 있으면 사용.

#### `user_settings` (001)
- 사용자별 환경 설정.
- `user_id` (PK), `prepare_seen` (약관·동의 1회 확인 플래그), `baseline_method` ('interview' / 'import' / null)
- 가입 시 트리거로 자동 row 생성.

### 시작점 (셀프인터뷰)

#### `baseline_report` (003) ⭐
- 한 사용자당 **1개**의 시작점 (`user_id unique`).
- `source` ('interview' / 'import') — 셀프인터뷰 합성인지 Import인지
- `report` (jsonb) — `BaselineShape` JSON. headline + parts(좋아함·잘함·가치) 각각 items·insight·keywords
- `version` integer, `generated_at` — 재합성 추적
- 와우 모먼트의 `headline` 필드가 여기 저장됨.

#### `baseline_interview_progress` (003)
- 셀프인터뷰 in-progress 상태. 한 사용자당 1개 row (`user_id` PK).
- `current_step` (0~5), `answers` (jsonb — 객관식 선택 + 음성 답변 누적)
- step마다 즉시 저장 → 이탈 후 정확히 그 자리에서 resume.
- 합성 완료되면 `archived=true`로 마킹 (또는 그대로 둠).

### 매일 두 질문

#### `conversation` (002)
- 한 세션 = 한 row. **client-generated UUID** (`crypto.randomUUID`) — idempotent upsert.
- `id` (PK, client UUID), `track` ('me' / 'baseline'), `is_complete`, `started_at`, `completed_at`
- 트랙 분리는 같은 테이블 위에서 `track` 컬럼으로.

#### `qa_pair` (002 + 009)
- 한 turn = 한 row. `(conversation_id, question_index)` unique → 같은 turn 재호출 시 409 (멱등).
- `question_text`, `reaction_text` (AI 리액션), `answer_text`
- **`question_id`** (009 추가) — Q2 풀에서 선택된 id (`"Q017"` 등). Q1·풀 외 turn은 NULL.
- partial index `(user_id, question_id) where question_id is not null` — recency cooldown 조회 빠르게.

#### `answer_card` (002 → 005 재정비)
- 답변 카드 LLM 합성 결과 캐시. `qa_pair_id` (PK, FK on cascade delete).
- `card` (jsonb) — `{ subtopics, summary, keywords }` 형태
- ⚠️ 002의 컬럼(title·category·body)이 LLM 실제 출력과 안 맞아서 005에서 drop·recreate. 마이그레이션 이력에 주의.

### 매일 일기 (소명일기)

#### `somyeong_user_okr` (006)
- 사용자별 분기 OKR. `(user_id, quarter)` unique.
- `mission_text`, `weekly_goal`, `okr_data` (jsonb)
- 일기 합성 시 컨텍스트로 주입 — 사용자가 한 일이 OKR과 어떻게 매핑되는지.
- 없어도 동작 — fallback으로 `baseline_report` 참조.

#### `somyeong_entries` (006)
- 하루 한 entry. `(user_id, entry_date)` unique.
- `evening_report_text` — paste한 원문
- `contribution_flow` (jsonb) — LLM 합성 결과 (`direct·translated·open_questions·suggested_questions`)
- `ai_question`, `ai_question_source`, `answer`, `free_note` — 사용자가 선택·작성한 결과
- delete 정책도 있음 (사용자가 직접 삭제 가능)

### 누적 보고서

#### `long_term_report` (004)
- 4단계(현상·본질·가치·존재) 누적 보고서. `user_id` PK (1:1).
- `shape` (jsonb) — `LongTermShape` JSON. 4 layer 각각 friendly_title·summary·quotes·keywords
- `based_on_qa_count` — 합성 시점 qa_pair 수. staleness 판단 (이후 답변이 N개 더 쌓이면 재합성 권장)
- 현재 본인 합성 비활성 — `/me/report` 흐름 tab은 페르소나 preview 표시. (다음 페이즈에 활성화 예정)

#### `daily_digest` (008)
- 매일 두 질문 정리 캐시. `(user_id, digest_date)` unique. KST 기준 날짜.
- `digest` (jsonb) — `{ summary, connections, tension, nextThread }`
- `qa_count` — staleness 비교용
- 캐시 없으면 client에서 fetch + insert. 매번 LLM 호출 0.

### View — 사용 수치 (보안 강화)

#### `somyeong_usage_metrics` (006 + 007 보안)
- 사용자별 일자별 entry 카운트 집계. **콘텐츠 접근 X**.
- 007에서 `security_invoker=on` + anon/authenticated REVOKE — Postgres view 기본 함정 (소유자 권한 실행)을 막음. 클라이언트 SDK에서는 아예 노출 안 됨.
- 운영자 모니터링은 service_role 키 + 별도 admin role로만.

### 마이그레이션 순서

| # | 파일 | 내용 |
|---|---|---|
| 001 | `001_profiles_and_settings.sql` | profiles, user_settings, trigger |
| 002 | `002_conversation_schema.sql` | conversation, qa_pair, answer_card (구 스키마) |
| 003 | `003_baseline_report.sql` | baseline_report, baseline_interview_progress |
| 004 | `004_long_term_report.sql` | long_term_report |
| 005 | `005_answer_card_jsonb.sql` | answer_card 재정비 (drop + recreate with jsonb) |
| 006 | `006_somyeong_diary.sql` | somyeong_user_okr, somyeong_entries, usage_metrics view |
| 007 | `007_usage_metrics_security.sql` | view 보안 fix |
| 008 | `008_daily_digest.sql` | daily_digest |
| 009 | `009_qa_pair_question_id.sql` | qa_pair.question_id 추가 + partial index |

> Supabase SQL Editor에 순서대로 paste·Run. 005는 002의 answer_card를 drop하므로 prod에서 005 안 돌리면 PGRST204 에러 발생 (실제 5/17 발생 이력).

---

## 6. LLM 로직 체계 (8 flow)

### 공통 원칙

- **Vercel AI SDK v6** — `generateText` + `Output.object({ schema: zod })`로 structured output. 구 `generateObject`는 deprecated.
- **모델 분리** — `chat`만 `gemini-2.5-flash` (prompt 정밀도 필요). 그 외는 `gemini-2.5-flash-lite` (Free tier ~1000/일).
- **server only** — Gemini key는 `GOOGLE_GENERATIVE_AI_API_KEY` (Node runtime). 클라 직접 호출 금지.
- **에러 처리** — `lib/ai/error-helpers.ts`의 `classifyGeminiError`로 quota·auth·timeout 구분.
- **prompt 위치** — `lib/ai/pacemaker-prompt.ts` (chat) 외엔 각 route 내부에 inline.

### 한눈에 — 8 flow 표

| # | Flow | Route | 모델 | 캐시 | 트리거 |
|---|---|---|---|---|---|
| 1 | **chat (Q1·Q2)** | `/api/me/chat` | flash | X | 매일 두 질문 진행 |
| 2 | **셀프인터뷰 합성** | `/api/me/baseline-interview/complete` | flash-lite | X (1회) | 인터뷰 마지막 step 완료 |
| 3 | **음성 답변 parse** | `/api/me/baseline-interview/parse` | flash-lite | X | 인터뷰 step마다 |
| 4 | **digest** | `/api/me/digest` | flash-lite | ✅ `daily_digest` | 매일 두 질문 마무리 후 |
| 5 | **answer-card** | `/api/me/answer-card` | flash-lite | ✅ `answer_card` | 보고서 카드 첫 조회 시 |
| 6 | **transcribe** | `/api/me/transcribe` | flash-lite | X | 음성 녹음 종료 후 |
| 7 | **diary synthesize** | `/api/me/diary/synthesize` | flash-lite | X | 일기 paste 후 |
| 8 | **long-term refresh** | `/api/me/long-term-report/refresh` | flash-lite | row 자체가 캐시 | "보고서 새로 만들기" 누름 (현재 비활성) |

### 1. chat — 매일 두 질문 (Q1·Q2)

가장 묵직한 flow. 모든 prompt 디테일이 여기 들어감.

- **route**: `/api/me/chat`
- **prompt**: `lib/ai/pacemaker-prompt.ts` — `PACEMAKER_SYSTEM_PROMPT` + `buildContextHeader()`
- **context 주입** (server에서):
  - 사용자 이름, 현재 turn
  - baseline 요약 (`summarizeBaselineShape`)
  - 최근 qa_pair 10개 (Q1 환기 자료)
  - 최근 somyeong_entries 5개 (Q1 환기 자료)
- **Q1** (turn=0) — 6 카테고리(QueSCo 유형) 중 자유 선택. 컨텍스트 환기.
- **Q2** (turn=1) — **풀에서 선택**:
  - 사용자가 받았던 question_id 최근 60개 조회 (recency cooldown N=60)
  - `lib/me/question-pool.ts`의 139문 중 cooldown 제외
  - `scoreQuestion()`으로 ranking + 약한 shuffle → 상위 8개 후보
  - prompt에 후보 list 주입 → LLM이 1개 선택 + reaction + 미세 변형
  - 응답에 `selectedQuestionId` 포함 → server에서 후보 set에 있는지 검증
- **출력 schema**: `{ reaction, question, isComplete, selectedQuestionId, suggestedAnswers }`
- **hard cap**: server에서 `userTurns >= 2`면 무조건 `isComplete=true + question=""` (3턴 이상 늘리지 못하게)

### 2. 셀프인터뷰 합성 — `/api/me/baseline-interview/complete`

- 6 step 답변(`baseline_interview_progress.answers`)을 한 번에 LLM에 전달
- `BaselineShape` JSON 합성 (headline + 3 part 각각 items·insight·keywords)
- `baseline_report` 테이블에 `source='interview'`로 insert
- 1회성 — 재시도 시 같은 row update (`user_id` unique)

### 3. 음성 답변 parse — `/api/me/baseline-interview/parse`

- 셀프인터뷰 음성 단계마다 호출
- transcribed 텍스트를 의미 단위로 정돈 (UI 표시용)
- progress row의 `answers` jsonb에 누적 저장

### 4. digest — `/api/me/digest`

- 매일 두 질문 답변 → 정리 4 카드 (`summary`, `connections[]`, `tension`, `nextThread`)
- baseline 컨텍스트 활용해 "닿는 부분" 연결
- **캐시**: `daily_digest` 테이블 `(user_id, digest_date KST)` unique. miss이면 client에서 fetch → server가 LLM 호출 + insert
- 보고서 진입 시 캐시 hit이면 즉시 표시, miss이면 client fetch + skeleton 표시

### 5. answer-card — `/api/me/answer-card`

- 개별 qa_pair 답변을 카드(`subtopics`, `summary`, `keywords`)로 합성
- **캐시**: `answer_card` 테이블 `qa_pair_id` PK
- 보고서에서 답변 펼칠 때 — 캐시 miss인 카드만 client가 batch fetch (`useAnswerCards` hook)
- 5/17 prod 함정: migration 005 미적용으로 인한 PGRST204 발생 → 005 SQL 실행으로 복구

### 6. transcribe — `/api/me/transcribe`

- 음성 blob(webm/mp4/ogg) → 텍스트
- `gemini-2.5-flash-lite`로 transcribe. 한국어 우선
- prompt에 "타임스탬프·화자 표시·머리말·꼬리말 금지" 명시 (이전에 "00:01 00:02..." 타임스탬프 삽입 출력 이슈 fix)
- 셀프인터뷰·매일 두 질문 양쪽에서 사용 (둘 다 MediaRecorder + 이 route)

### 7. diary synthesize — `/api/me/diary/synthesize`

- 사용자 paste 텍스트(≥30자) → `contribution_flow` JSON
- 출력: `{ direct[], translated[], open_questions[], suggested_questions[] }`
- `direct` = 사용자가 한 일이 바로 OKR과 닿는 것. `translated` = AI가 의미 번역한 것.
- OKR 등록돼 있으면 컨텍스트로 주입 (`somyeong_user_okr`)

### 8. long-term refresh — `/api/me/long-term-report/refresh`

- `baseline_report` + `qa_pair` 누적 → `LongTermShape` JSON
- 4 layer 각각 friendly_title·summary·quotes·keywords 생성
- `maxDuration = 60` (LLM 합성 10~30s 걸릴 수 있음)
- 현재 **본인 합성 비활성** — `/me/report` 흐름 tab은 페르소나 preview 표시. 이 route는 양식 검증·시드용으로 유지.
- 활성화 시점: 사용자 누적 답변이 충분히 쌓이면 (~20개 이상)

### Prompt 진화 — chat 정밀화 (5/17~)

박람회 직후 Q1·Q2가 거의 같은 톤으로 생성되던 문제. 5단계로 정밀화:

1. **분리 prompt** (5/15) — Q1=환기, Q2=새 영역 가이드
2. **Flash 업그레이드** (5/17) — flash-lite → flash. prompt attention 강화. chat만 비용 3배.
3. **prompt 압축** (5/17) — 5000자 → 1700자. 학술 디테일은 `docs/research/`로 분리.
4. **카테고리 분리** (5/17) — 영역 tag → QueSCo 6 유형으로 기준 변경
5. **Q2 풀** (5/18) — prompt 강제론 한계. 구조적 해결: 139문 큐레이션 풀에서 선택 + recency cooldown.

> 자세한 결정 배경은 [§7 ADR](#7-adr--architecture-decision-records).

---

## 7. ADR — Architecture Decision Records

> 큰 단위 결정 10건. 각각 "이걸 왜 이렇게 했나"의 단일 source of truth. 미세 디테일은 §6, §8 참고.

### ADR-001: RLS 본인 격리 + 운영자도 콘텐츠 접근 불가

**결정**: 모든 user 테이블에 `auth.uid() = user_id` RLS 정책. service_role key는 서버에서만 사용. Supabase Dashboard에서 raw 조회는 service role 권한이 필요하게.

**배경**: Being Myself는 사용자의 가장 개인적인 답변을 수집함. "운영자가 마음만 먹으면 볼 수 있다"가 가능한 구조면 사용자가 진정성을 못 담음.

**대안**: (a) 클라이언트 단에서 암호화 — 운영 복잡도 큼, LLM 호출에서 풀려야 함. (b) 정책상으로만 "안 봅니다" — 신뢰성 떨어짐.

**결과**: 운영자가 실제로 못 봄 (의도적 우회 외엔). 사용 수치 모니터링은 `somyeong_usage_metrics` view로만 — `security_invoker=on` + anon/authenticated REVOKE (migration 007).

---

### ADR-002: 시작점은 한 사용자당 1개 (`baseline_report.user_id unique`)

**결정**: `baseline_report`에 `user_id` UNIQUE 제약. 재합성하면 같은 row update.

**배경**: 시작점은 "지금까지의 나"의 단일 자화상. 여러 row가 공존하면 어느 게 진짜인지 모호. 사용자가 한 번 더 셀프인터뷰 해도 그 row가 갱신되는 게 자연스러움.

**대안**: 버전별 row 누적 + `version` 컬럼만으로 최신 추적 — 조회 복잡도 ↑, 사용자 mental model과 안 맞음.

**결과**: 시작점 조회·갱신·삭제 모두 단순. `version` 컬럼은 남겨뒀지만 현재 1만 사용.

---

### ADR-003: LocalStorage는 in-session UX, DB가 source of truth

**결정**: 대화 진행 중 상태(현재 messages, conversationId)는 LocalStorage. 완료된 turn은 DB(`qa_pair`)로 누적. 진입 시 server DB count와 LocalStorage state mismatch면 자동 reset.

**배경**: 매일 두 질문 도중 새로고침해도 흐름 유지 ≠ 사용자 데이터 영속화. UX는 빠른 LocalStorage가 좋고, 누적 데이터는 DB.

**대안**: (a) 모든 turn을 즉시 DB write — 진행 중 답변까지 누적되어 정리 안 됨. (b) DB 안 쓰고 LocalStorage만 — 디바이스 바뀌면 데이터 손실.

**결과**: 깔끔한 분리. 단 — DB·LocalStorage mismatch 시(예: SQL로 데이터 비웠을 때) 자동 reset 로직이 필요 (`/me/conversation/ConversationPageClient.tsx`에 처리).

---

### ADR-004: LLM provider = Google Gemini (vs Claude·OpenAI)

**결정**: Vercel AI SDK v6 + `@ai-sdk/google`. `gemini-2.5-flash` + `flash-lite`.

**배경**: 11명 규모 + 솔로 개발자 + Free tier 활용 가능. Gemini Flash-Lite는 ~1000/일 무료. Claude·OpenAI는 첫 호출부터 비용 발생.

**대안**: (a) Claude API — 한국어 품질 가장 좋지만 비용. (b) OpenAI — 무료 tier 없음.

**결과**: 11명 규모에선 사실상 무료로 운영. Flash로 chat 정밀도 확보(11명 × 2 질문/일 = 22 호출/일, Free 20/일 초과해도 lite로 fallback 가능). 추후 Audience pack·공동체 확장 시 Claude 검토.

> 메모리에 "Phase B에 Claude API 검토" 명시.

---

### ADR-005: chat만 Flash, 나머지는 Flash-Lite

**결정**: `/api/me/chat`만 `gemini-2.5-flash`. baseline·digest·answer-card·transcribe·diary·long-term은 모두 `flash-lite`.

**배경**: chat은 Q1·Q2 역할 분리, 카테고리 선택, 풀에서 선택 등 prompt 디테일 정밀도가 가치를 가름. 다른 호출은 structured output 합성·번역·요약이라 lite로 충분.

**대안**: 전부 Flash — 토큰 비용 3배, 11명 × 8 flow × 다일·다회 → quota 즉시 초과.

**결과**: chat만 비용 3배 (11명 규모 월 ~₩540 추정 — 무시 가능). 다른 호출은 Free tier 안에서 운영.

---

### ADR-006: answer_card · daily_digest LLM 캐시 도입

**결정**: 두 LLM 호출은 결과를 DB에 캐시. 같은 qa_pair·같은 날짜 재조회 시 LLM 호출 0.

**배경**: 보고서 페이지 진입할 때마다 LLM이 새로 돌아 매번 결과가 미세하게 다름 + 토큰 낭비. 답변 자체가 고정이면 카드·digest도 고정이어야 신뢰성 ↑.

**대안**: (a) client-side 메모이제이션만 — 새 디바이스·새 세션이면 다시 호출. (b) 캐시 안 함 — 비용·일관성 둘 다 손해.

**결과**: 호출 횟수 대폭 감소. staleness 판단을 위해 `qa_count` 등 컬럼 추가. 사용자가 명시적 "새로 만들기" 누를 때만 재합성.

---

### ADR-007: AI 호칭 제거 + "페이스메이커" 메타포 폐기

**결정**: UI 카피에서 "AI", "페이스메이커" 단어 안 씀. 사용자 주체 카피로 (예: "나에게 집중하는 시간", "답변을 정리해드려요").

**배경**: 사용자가 AI한테 평가받는 느낌·AI가 주도하는 느낌이 나면 자기 발견에 방해. 메타포 자체가 너무 코칭스러움.

**대안**: "AI 코치", "페이스메이커" 같은 의인화 — 친밀감은 있지만 사용자 주체 결과 충돌.

**결과**: 사용자한테 노출되는 모든 카피 점검 + 정리. 단 코드 식별자(`PACEMAKER_SYSTEM_PROMPT`, `pacemaker-prompt.ts`)는 내부 이름이라 그대로 유지.

---

### ADR-008: Q1 = 자유 생성, Q2 = 큐레이션 풀(139문) + recency cooldown N=60

**결정**: Q1은 QueSCo 6 유형 자유 생성(컨텍스트 환기). Q2는 사용자 제공 139문 풀에서 선택. 받은 적 있는 question_id 최근 60개는 자동 제외 (약 2달 간격으로 재등장).

**배경**: prompt 강제만으로 Q1·Q2 분리가 안정적이지 않았음 — LLM이 자주 같은 카테고리로 이어감. 5단계 prompt 정밀화에도 한계.

**대안**: (a) 영구 dedup (cooldown 무한) — 풀 소진 시 막다른 골목. (b) Q2도 자유 생성 + 더 강한 prompt — 5단계 정밀화로도 안정 안 됨. (c) 처음 검토했던 14일 cooldown — 매주 같은 질문 받을 위험, 너무 짧음. → 매일 1개 페이스 가정 시 약 2달 간격으로 재등장하는 N=60으로 결정.

**결과**: prompt 정밀도와 무관하게 Q2가 새 영역으로 가는 게 구조적으로 보장. 풀 확장 가능 (139 → 200+) — 사용자 패턴 모니터링하면서. `qa_pair.question_id` 컬럼 (migration 009).

---

### ADR-009: 음성 인식 V2 — Web Speech API → MediaRecorder + Gemini transcribe

**결정**: 브라우저 native Web Speech API 폐기. MediaRecorder로 녹음 후 `/api/me/transcribe`(Gemini)로 변환.

**배경**: Samsung Internet·모바일 Chrome에서 Web Speech가 중복 인식("내가내가내가 살아든..."), iOS Safari 일부 미지원, 정확도 편차 큼. 박람회 직후 실 사용자 첫날에 발견.

**대안**: (a) UA 감지해 Samsung만 텍스트 폴백 — 다른 모바일도 깨질 위험. (b) 음성 인식 자체를 옵션화 — 셀프인터뷰 핵심 UX 손실.

**결과**: 모든 브라우저에서 동작 (iPad, 모바일 Chrome, Samsung, 데스크탑). transcribe LLM 비용은 발생하지만 Flash-Lite Free tier 안. 실시간 인식은 불가능(녹음 종료 후 변환) — UX 미세 trade-off지만 안정성 우선.

---

### ADR-010: /me/report = 4 tab 통합 (답변·인터뷰·흐름·일기)

**결정**: 흩어져 있던 `/me/report`, `/me/report/full`, `/me/long-term`, `/me/reports` 4 라우트를 `/me/report`의 4 tab으로 합침. 라벨: **매일 / 인터뷰 / 흐름 / 일기**.

**배경**: 외부 사용자 피드백 "depth 너무 깊다 / 어디 가야 할지 모르겠다". 실제 라우트 4개 + hub 1개로 흩어져 있었음.

**대안**: (a) hub 페이지 강화로 navigation만 개선 — depth는 그대로. (b) 모두 한 페이지 스크롤 — 무거움, mobile에 부담.

**결과**: depth 한 단계로 줄어듦. URL deep link `?tab=interview|long-term|diary` 유지. 옛 라우트는 redirect로 호환. 죽은 client 파일 3개 삭제.

> 자세한 일기 read vs write 분리, 셀프인터뷰 part 순서(좋아함→잘함→가치) 등 디테일은 commits `2121395` 참고.

---

## 8. 운영·배포·보안

### 배포 흐름

```
local dev (npm run dev)
    │
    ▼ git commit
    │
    ▼ git push origin master
    │
    ▼ (자동)
    │
Vercel — build + deploy
    │
    ▼
prod: https://being-myself-mvp.vercel.app
```

- **master push → 자동 prod 배포** (Vercel GitHub integration)
- 별도 staging 환경 없음 (dev = 노트북, prod = Vercel) — 11명 규모에 충분
- 빌드 실패 시 Vercel Dashboard에서 로그 확인 + master에 직접 fix push

### 환경 분리

| 환경 | 위치 | 데이터 |
|---|---|---|
| **dev (노트북)** | `npm run dev` → `127.0.0.1:3000` 또는 LAN IP | 같은 Supabase + 같은 Gemini key. 빠른 반영용 |
| **prod (Vercel)** | `https://being-myself-mvp.vercel.app` | 같은 Supabase + 같은 Gemini key |

> dev·prod가 **같은 Supabase 인스턴스**를 공유. 솔로 개발 + 11명 규모라 분리 안 함. 추후 사용자 늘면 dev 전용 Supabase 분리 검토.

### 환경 변수

| 변수 | dev | prod | 노출 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Vercel env | client OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Vercel env | client OK (RLS에 의존) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | Vercel env | **server only** |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `.env.local` | Vercel env | **server only** |
| `NEXT_PUBLIC_GA4_ID` | optional | Vercel env | client OK |

> Vercel env 갱신 후 **redeploy** 해야 반영됨 (변수만 바꾼다고 자동 적용 X).

### DB migration 적용 흐름

1. `web/supabase/migrations/NNN_*.sql` 작성 (commit)
2. Supabase Dashboard → SQL Editor에 **순서대로** paste & Run
3. dev·prod **같은 Supabase**라 한 번만 돌리면 됨
4. 적용 안 한 migration 있으면 LLM cache write 등 곳곳에서 에러 발생 (5/17 PGRST204 사고 — migration 005 미적용)

> 적용 안 된 migration 추적용 별도 도구 없음. 신규 환경 셋업 시 001~009 순서대로 paste.

### 시드·cleanup SQL

`web/supabase/seeds/` 아래:

| 파일 | 용도 |
|---|---|
| `demo_seed_self_account.sql` | 본인 계정 시연용 — baseline backup + 3일치 답변·일기 시드. cleanup 블록 포함 |
| `demo_seed_test_account.sql` | test 계정용 — baseline + 5일치 답변·일기, Q2 question_id 5건 누적. 이메일 한 줄만 바꾸면 됨 |
| `demo_clear_today.sql` | KST 오늘 데이터 리셋 — 본인 계정 답변·일기·digest 비우기 |

시연·테스트 후 cleanup 블록 주석 풀어 Run하면 깨끗하게 복원.

### Analytics

- **GA4** (`NEXT_PUBLIC_GA4_ID`) — 페이지 진입, 사용자 흐름, 전환 측정
- `@vercel/analytics` — Vercel 자체 dashboard 측정
- 콘텐츠(답변 내용 등)는 절대 analytics에 안 보냄. URL pathname·이벤트 이름만.

### 보안 정책 (요약)

세 단계 격리:
1. **RLS** — 모든 user 테이블 `auth.uid() = user_id`. 클라이언트는 본인 row만 조회.
2. **Server-only key** — `service_role`, Gemini key는 Node API route에서만 사용. 클라 노출 0.
3. **운영자도 콘텐츠 X** — Supabase Dashboard에서 raw 조회는 service role 필요. 사용 수치 view(`somyeong_usage_metrics`)는 카운트만 노출.

자세한 거버넌스: [ADR-001](#adr-001-rls-본인-격리--운영자도-콘텐츠-접근-불가).

### 인시던트 대응 (이력)

| 날짜 | 인시던트 | 원인 | 해결 |
|---|---|---|---|
| 2026-05-17 | answer-card LLM cache write 실패 (PGRST204) | migration 005 prod 미적용. 002의 구 스키마(title·category·body) 그대로 | SQL Editor에서 005 paste·Run → 정상 |
| 2026-05-16 | 모바일에서 카드 텍스트 깨짐 | CSS 일부 변경 후 mobile 미점검 | 즉시 fix + 모바일 검증 추가 |
| 2026-05-16 | Samsung Internet 음성 인식 중복("내가내가내가...") | Web Speech API 구현 차이 | UA 감지 → 텍스트 폴백. 며칠 뒤 V2(MediaRecorder)로 전면 교체 |

> dev 셋업 함정(Windows IPv6, allowedDevOrigins, npm install 충돌 등)은 인시던트가 아니라 환경 함정 — [§4 dev 서버](#dev-서버-windows--next-16) 및 `web/AGENTS.md` 참고.

### 모니터링

- **Vercel Dashboard** — 빌드 로그, 함수 실행 시간, 에러 카운트
- **Vercel logs** — `[chat] context for user: {...}` 같은 server-side console.log 확인
- **GA4** — 사용자 흐름·이탈 지점
- **Supabase Dashboard** — DB row 수, 인증 사용자 수, RLS 위반 여부

> 별도 alerting 없음. 사고는 사용자 피드백·본인 dogfooding으로 발견.

---

## 9. 알려진 한계 & 다음 단계

### 현재 한계

#### 코칭·콘텐츠

- **본인 흐름(장기) 보고서 비활성** — 양식 preview만. 누적 답변 기반 본인 합성은 다음 페이즈. 활성 임계점은 ~20개 답변 정도로 검토 중.
- **Q1 prompt 정밀도 한계** — 자유 생성이라 가끔 결이 어긋남. Q2처럼 풀 구조화는 안 함(이전 답변 환기가 핵심 가치라). prompt 디테일 의존.
- **Q2 풀 139문 소진 임박 가능성** — cooldown N=60 적용 후 가용 후보 ~80개. 매일 1개씩 받으면 ~80일 후엔 동일 후보 풀에서만 뽑힘. 풀 200+로 확장 필요.
- **Audience pack 1개만** (/demo 3 페르소나) — 일반 default 외에 기독교 리더·청소년·예술가 등 톤 변형 부재.

#### 인프라·운영

- **dev·prod 같은 Supabase 공유** — 솔로 개발에 효율적이지만 사용자 늘면 분리 필요.
- **별도 alerting 없음** — Vercel logs·Supabase Dashboard 수동 확인. quota 초과·에러 폭증 자동 감지 X.
- **migration 적용 추적 도구 없음** — Supabase에 어떤 migration이 적용됐는지 자동 확인 못 함. 신규 환경 셋업 시 수동 paste·Run.
- **Vercel hobby plan 함수 timeout 10s** — `long-term refresh`만 `maxDuration=60`으로 우회. 다른 LLM 호출은 10s 안에 끝나야.

#### 모바일·UX

- **음성 인식 실시간성 손실** (V2) — 녹음 종료 후 transcribe. 사용자가 말하는 동안 화면에 글이 떠오르는 V1 UX는 포기.
- **디바이스 간 in-progress 동기화 없음** — 매일 두 질문 대화 중 다른 디바이스로 이동하면 LocalStorage 손실. 완료된 turn은 DB라 안전, 진행 중만 영향.
- **답변 카드 캐시 invalidation 없음** — baseline 변경해도 캐시된 카드 그대로. 사용자가 baseline 자주 안 바꾸는 가정. 자주 바뀌면 수동 cleanup 필요.

#### 데이터·정책

- **사용자 데이터 export·삭제 기능 없음** — GDPR·개인정보 요청 시 수동. Phase B에서 자동화.
- **비밀번호 재설정 UX 미완성** — Supabase Auth 기본 흐름만, 카피·디자인 안 손봤음.

---

### 다음 단계 (우선순위 + 시기)

#### 단기 (2~4주)

| 항목 | 트리거 | 영향 |
|---|---|---|
| **본인 장기 보고서 활성화** | 답변 누적 평균 ~20개 도달 시 | "흐름" tab이 진짜 본인 데이터로 채워짐. 와우 모먼트 ↑ |
| **Q2 풀 200+ 확장** | 가용 후보 줄어드는 게 보이면 | 1년+ 누적 사용자도 신선한 질문 받음 |
| **사용자 피드백 채널** | 11명 일주일 사용 후 | 매주 짧은 인앱 질문 또는 채팅 채널 |
| **카피·디자인 미세 폴리시** | 사용 피드백 따라 | 사용자 마찰 지점 fix |

#### 중기 (1~3개월)

| 항목 | 메모 |
|---|---|
| **Google OAuth 추가** | 가입 마찰 ↓ — 이메일+비번만 현재 |
| **Audience pack 신규 1~2개** | 기독교 리더·청소년 우선 검토 |
| **dev·prod Supabase 분리** | 사용자 30+ 넘으면 |
| **디바이스 간 sync 강화** | LocalStorage 의존도 ↓, 진행 중 state도 DB로 옮길지 검토 |
| **데이터 export·삭제 UI** | `/me/settings/data`. GDPR·개인정보 요청 자동화 |
| **모니터링·alerting** | quota·에러 자동 감지 (Sentry·Vercel alert 등) |

#### 장기 (Phase B+)

| 항목 | 메모 |
|---|---|
| **Claude API 검토** | 한국어 품질 정점이 필요한 시점 (사용자 100+ 또는 외부 확장) |
| **공동체용 instance** | 교회·기업·학교가 가져가는 framework 형태. multi-tenant·관리자 콘솔 |
| **Audience pack 시스템화** | 일반 default + skinning 구조 — 페르소나·메타포·시각화 결을 외부에서 주입 가능하게 |
| **장기 보고서 진화 알고리즘** | 답변 누적 곡선 따라 layer별 깊이가 자동 조정되는 합성 정책 |

---

### 우선순위 한 줄

> 단기는 **콘텐츠·UX 마찰 fix**, 중기는 **운영 기반 강화 + audience 확장**, 장기는 **framework화·외부 확장**.

---

## 10. 용어집

> 팀원이 같은 단어를 같은 의미로 쓰기 위함. 사용자 노출 카피와 코드 식별자가 다를 수 있어 매핑 명시.

### 제품·브랜드

| 한국어 | 영어/코드 | 의미 |
|---|---|---|
| **Being** | — | 우산 브랜드명. "Being myself"·"Being us"(가상) 등 도구를 포함 |
| **Being myself** | — | Being 안의 첫 도구. 매일 두 질문 + 누적 보고서 |
| **나에게 집중하는 시간** | — | 헤더 카피, 첫 진입 시 사용자가 보는 핵심 메시지 |
| **매일 두 질문** | "매일의 두 질문" / chat | 5분 daily loop. Q1 + Q2 |
| **소명일기** | "내 일기" / `somyeong_entries` | 매일 저녁 자유 reflection. write·read 분리 |

### 데이터·결과물

| 한국어 | 영어/코드 | 의미 |
|---|---|---|
| **시작점** | `baseline_report.report` (BaselineShape) | 처음 셀프인터뷰로 만든 자기 자화상. 한 사용자당 1개 |
| **시작점 3 part** | `parts[]` | 좋아하는 것 / 잘하는 것 / 가치 있는 것 (인터뷰 순서 = 표시 순서) |
| **4단계 보고서** | `long_term_report.shape` (LongTermShape) | 현상·본질·가치·존재 layer 누적 합성 |
| **매일 digest** | `daily_digest.digest` | summary·connections·tension·nextThread 4 카드 |
| **답변 카드** | `answer_card.card` | qa_pair 답변을 subtopics·summary·keywords로 정리한 LLM 합성 결과 |
| **기여 흐름** | `somyeong_entries.contribution_flow` | 일기 paste 후 AI가 direct·translated·open_questions·suggested_questions로 정돈 |
| **헤드라인** | `headline` 필드 | 와우 모먼트 한 줄. 시작점 또는 4단계 보고서 상단에 |

### 코칭·질문

| 한국어 | 영어/코드 | 의미 |
|---|---|---|
| **Q1** | turn=0 | 매일 두 질문 첫째. **자유 생성** — 이전 답변·시작점·일기 컨텍스트 환기 |
| **Q2** | turn=1 | 매일 두 질문 둘째. **풀에서 선택** — Q1과 다른 영역 |
| **QueSCo 6 유형** | — | 경험탐색 / 과거성공 / 본질추출 / 패턴연결 / 시점이동 / 미래가능성. 코칭 질문 카테고리 분류 |
| **Q2 큐레이션 풀** | `lib/me/question-pool.ts` | 139문. 사용자가 직접 작성한 질문 데이터 |
| **recency cooldown N=60** | `RECENT_DEDUP_WINDOW = 60` | 최근 60개 turn 안에 받은 question_id 풀에서 제외 → 약 2달 간격으로 재등장 |
| **question_id** | `qa_pair.question_id` | Q2 풀에서 선택된 id (예: "Q017"). Q1·풀 외 turn은 NULL |
| **페이스메이커** | `PACEMAKER_SYSTEM_PROMPT` | (메타포는 폐기) 코드 식별자만 잔존. 사용자 카피엔 안 씀 |

### 트랙·페이즈

| 한국어 | 영어/코드 | 의미 |
|---|---|---|
| **/me 트랙** | `conversation.track='me'` | 로그인 사용자 매일 두 질문. DB 누적 |
| **셀프인터뷰 트랙** | `conversation.track='baseline'` | 시작점 만드는 6 step 인터뷰. DB 누적 |
| **/demo 트랙** | (DB 안 씀) | 게스트 익명, LocalStorage only. 박람회·외부 시연 |
| **Phase A** | — | 박람회 시연까지의 구상·구현 단계 (~2026-05-12) |
| **Phase B** | — | 실 서비스 전환 이후. Google OAuth, Claude API, Audience pack 등 |
| **Audience pack** | — (구상 중) | 일반 default 외 특정 결(기독교 리더·청소년 등)에 맞춘 톤·메타포 변형 |
| **Skinning** | — (구상 중) | Audience pack을 framework화한 외부 확장 구조 |

### 와우 모먼트

| 한국어 | 영어/코드 | 의미 |
|---|---|---|
| **와우 모먼트** | — | 사용자가 "아, 내가 그런 사람이구나" 깨닫는 자리 |
| **Echo-back** | — | AI가 사용자 답변을 거울처럼 비추는 패턴. 시작점 headline + 매일 digest summary |

### 코드 type 이름 (자주 나오는)

| Type | 위치 | 의미 |
|---|---|---|
| `BaselineShape` | `lib/me/baseline-shape.ts` | 시작점 JSON 구조. DB 저장형 |
| `BaselineReport` | `lib/me/baseline-report.ts` | 시작점 + UI 메타. `shapeToFullReport()`로 변환 |
| `LongTermShape` | `lib/me/long-term-report.ts` | 4단계 보고서 JSON 구조 |
| `LongTermReport` | `lib/me/long-term-report.ts` | LongTermShape + 메타. /me/report 흐름 tab에서 사용 |
| `Question` | `lib/me/question-pool.ts` | 139문 풀의 단일 entry. id·category·text·areas·time·depth·journey |
| `DayEntry`, `DayPair`, `Digest` | `app/me/report/page.tsx` | 보고서 매일 tab에 들어가는 그룹 데이터 |

---

## 11. 링크 인덱스

### 외부 시스템

| 항목 | 위치 |
|---|---|
| **GitHub repo** | `https://github.com/sunki-mobi/being-myself-mvp` |
| **Vercel 프로젝트** | Vercel Dashboard → `being-myself-mvp` (회사 organization) |
| **Vercel prod** | `https://being-myself-mvp.vercel.app` |
| **Supabase 프로젝트** | Supabase Dashboard → 회사 organization 내 프로젝트 |
| **Google AI Studio (Gemini)** | `https://aistudio.google.com/apikey` — Gemini key 발급·관리 |
| **GA4** | Google Analytics — `NEXT_PUBLIC_GA4_ID` 변수에 연결된 property |

### 핵심 코드 위치

| 영역 | 위치 |
|---|---|
| **pacemaker prompt** | `web/lib/ai/pacemaker-prompt.ts` |
| **Q2 풀 데이터** | `web/lib/me/question-pool.ts` |
| **시작점 type/shape** | `web/lib/me/baseline-shape.ts`, `baseline-report.ts`, `baseline-adapter.ts` |
| **장기 보고서 합성** | `web/lib/me/long-term-synthesis.ts` |
| **대화 state (LocalStorage)** | `web/lib/conversation.ts` |
| **Supabase server client** | `web/lib/supabase/server.ts` |
| **proxy.ts (구 middleware)** | `web/proxy.ts` — 비로그인 가드 |
| **/me hub** | `web/app/me/MeLandingClient.tsx` |
| **/me/report 4 tab** | `web/app/me/report/MeReportClient.tsx` |
| **/me/conversation** | `web/app/me/conversation/ConversationPageClient.tsx` |
| **셀프인터뷰** | `web/app/me/baseline/interview/InterviewClient.tsx` |
| **소명일기 작성** | `web/app/me/diary/new/NewDiaryClient.tsx` |

### API 라우트

```
/api/me/chat                            ← 매일 두 질문 (LLM)
/api/me/digest                          ← 매일 정리 (LLM, 캐시)
/api/me/answer-card                     ← 답변 카드 (LLM, 캐시)
/api/me/transcribe                      ← 음성 → 텍스트 (LLM)
/api/me/baseline-interview/parse        ← 인터뷰 음성 parse (LLM)
/api/me/baseline-interview/complete     ← 인터뷰 합성 (LLM)
/api/me/baseline-interview/progress     ← 진행 상태 save (DB)
/api/me/baseline-report                 ← Import (LLM)
/api/me/diary/synthesize                ← 일기 paste 합성 (LLM)
/api/me/diary/save                      ← 일기 저장 (DB)
/api/me/diary/okr                       ← OKR 등록 (DB)
/api/me/long-term-report/refresh        ← 4단계 보고서 재합성 (LLM)
/api/me/qa-pairs                        ← 매일 답변 누적 (DB)
/api/me/prepare-seen                    ← 약관 동의 (DB)
/api/me/settings/goal                   ← 목표 설정 (DB)
```

### DB migration

`web/supabase/migrations/` — `001` ~ `009` 순서대로.

### 시드·cleanup SQL

`web/supabase/seeds/` — `demo_seed_self_account.sql`, `demo_seed_test_account.sql`, `demo_clear_today.sql`.

### 문서

| 파일 | 내용 |
|---|---|
| `docs/being-myself-introduction.md` | 외부 공유용 제품 소개 (마케팅·투자자 톤) |
| `docs/me-real-service-plan.md` | 실 서비스 전환 계획 (5/13 직전 작성) |
| `docs/progress-2026-05-13.md` | 5/13 박람회 직후 실 서비스 전환 진행 보고 |
| `docs/progress-2026-05-19.md` | 5/14~5/19 일주일 진행 보고 |
| `docs/internal-overview-2026-05-19.md` | **본 문서** — 내부 공유 종합 |
| `docs/internal-overview-2026-05-19-appendix.md` | **본 문서 부록** — DB 전체 스키마 + API 라우트 15개 상세 |
| `docs/features/` | feature별 detail spec (각 phase별) |
| `docs/research/` | QueSCo·coaching 학술 reference |
| `web/CLAUDE.md` → `AGENTS.md` | Claude Code·신규 합류자용 코드 onboarding 메모 |

