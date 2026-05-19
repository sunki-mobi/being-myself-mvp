# Being Myself — 내부 공유 문서 부록

> **본 부록은 [internal-overview-2026-05-19.md](internal-overview-2026-05-19.md)의 detail reference.** 메인 문서는 전체 그림·결정 근거 중심, 부록은 컬럼·스키마·라우트의 정확한 명세.
> 최종 갱신: 2026-05-19

---

## 목차

- [A. DB 전체 스키마](#a-db-전체-스키마)
  - [A.1 profiles](#a1-profiles-001)
  - [A.2 user_settings](#a2-user_settings-001)
  - [A.3 baseline_report](#a3-baseline_report-003)
  - [A.4 baseline_interview_progress](#a4-baseline_interview_progress-003)
  - [A.5 conversation](#a5-conversation-002)
  - [A.6 qa_pair](#a6-qa_pair-002--009)
  - [A.7 answer_card](#a7-answer_card-002--005-재정비)
  - [A.8 somyeong_user_okr](#a8-somyeong_user_okr-006)
  - [A.9 somyeong_entries](#a9-somyeong_entries-006)
  - [A.10 daily_digest](#a10-daily_digest-008)
  - [A.11 long_term_report](#a11-long_term_report-004)
  - [A.12 somyeong_usage_metrics (view)](#a12-somyeong_usage_metrics-view-006--007)
  - [A.13 공통 함수·트리거](#a13-공통-함수트리거)
- [B. API 라우트 전체](#b-api-라우트-전체)
  - [B.1 /api/me/chat](#b1-apimechat)
  - [B.2 /api/me/digest](#b2-apimedigest)
  - [B.3 /api/me/answer-card](#b3-apimeanswer-card)
  - [B.4 /api/me/transcribe](#b4-apimetranscribe)
  - [B.5 /api/me/baseline-interview/parse](#b5-apimebaseline-interviewparse)
  - [B.6 /api/me/baseline-interview/complete](#b6-apimebaseline-interviewcomplete)
  - [B.7 /api/me/baseline-interview/progress](#b7-apimebaseline-interviewprogress)
  - [B.8 /api/me/baseline-report](#b8-apimebaseline-report)
  - [B.9 /api/me/diary/synthesize](#b9-apimediarysynthesize)
  - [B.10 /api/me/diary/save](#b10-apimediarysave)
  - [B.11 /api/me/diary/okr](#b11-apimediaryokr)
  - [B.12 /api/me/long-term-report/refresh](#b12-apimelong-term-reportrefresh)
  - [B.13 /api/me/qa-pairs](#b13-apimeqa-pairs)
  - [B.14 /api/me/prepare-seen](#b14-apimeprepare-seen)
  - [B.15 /api/me/settings/goal](#b15-apimesettingsgoal)

---

# A. DB 전체 스키마

## 공통 사항

- **schema**: 모두 `public` (Supabase default).
- **timestamp**: 모든 `timestamptz`는 UTC 저장, 클라이언트에서 KST 변환.
- **soft delete 없음** — `on delete cascade`로 auth.users row 삭제 시 모두 정리.
- **RLS 정책 4종**: select / insert / update / (필요 시 delete). 모두 `auth.uid() = user_id` (또는 `= id`).
- **`updated_at` 자동 갱신**: 모든 mutable 테이블에 `touch_updated_at()` 트리거.
- **migration 이력**: [A.13](#a13-공통-함수트리거) 함수 정의 참고.

---

## A.1 `profiles` (001)

**역할**: `auth.users`와 1:1, 표시용 사용자 정보.

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `id` | uuid | PK, FK → `auth.users(id)` on delete cascade | — |
| `email` | text | not null | — |
| `display_name` | text | nullable | — |
| `created_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**Indexes**: PK only.

**RLS** (모두 `auth.uid() = id`):
- `profiles_select_own` (SELECT)
- `profiles_insert_own` (INSERT with check)
- `profiles_update_own` (UPDATE)

**Triggers**:
- `profiles_touch_updated_at` (before update) → `touch_updated_at()`
- `auth.users INSERT → handle_new_user()` (security definer, RLS bypass) → 자동 row 생성

**자동 생성 로직**:
```sql
insert into public.profiles (id, email, display_name)
values (
  new.id,
  new.email,
  nullif(new.raw_user_meta_data->>'display_name', '')
);
```

---

## A.2 `user_settings` (001)

**역할**: 사용자별 환경 설정 (약관 동의 여부, baseline 만드는 방법 등).

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `user_id` | uuid | PK, FK → `auth.users(id)` on delete cascade | — |
| `prepare_seen` | boolean | not null | `false` |
| `baseline_method` | text | check (in `'interview'`, `'import'`) | nullable |
| `created_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**Indexes**: PK only.

**RLS** (모두 `auth.uid() = user_id`): select / insert / update.

**Triggers**:
- `user_settings_touch_updated_at` (before update)
- `auth.users INSERT → handle_new_user()` → 자동 row 생성

---

## A.3 `baseline_report` (003)

**역할**: 사용자별 시작점 보고서. 한 사용자당 **1개** (user_id unique).

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `user_id` | uuid | **unique**, not null, FK → `auth.users(id)` on delete cascade | — |
| `source` | text | not null, check in (`'interview'`, `'import'`) | — |
| `report` | jsonb | not null | — |
| `version` | integer | not null | `1` |
| `generated_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**`report` 구조** — `BaselineShape` (`web/lib/me/baseline-shape.ts`):
```typescript
{
  headline: string;
  parts: [
    {
      partTitle: "가치 있는 것" | "좋아하는 것" | "잘하는 것";
      items: [{ title: string; description: string[] }];
      insight: string;
      keywords: string[];
    },
    // ...
  ];
}
```

**Indexes**: `baseline_report_user_idx (user_id)`.

**RLS** (모두 `auth.uid() = user_id`): select / insert / update.

**Triggers**: `baseline_report_touch_updated_at` (before update).

---

## A.4 `baseline_interview_progress` (003)

**역할**: 셀프인터뷰 진행 중 상태. 한 사용자당 1개 row (user_id PK).

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `user_id` | uuid | PK, FK → `auth.users(id)` on delete cascade | — |
| `current_step` | integer | not null | `0` |
| `answers` | jsonb | not null | `'{}'::jsonb` |
| `archived` | boolean | not null | `false` |
| `started_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**`current_step` 범위**: 0~5 (TOTAL_STEPS=6 — 3 질문 × (객관식 + 음성)).

**`answers` 구조 예시**:
```json
{
  "q1_choice": "알고있어요",
  "q1_answer": "...",
  "q2_choice": "잘모르겠어요",
  "q2_answer": "...",
  "q3_choice": "...",
  "q3_answer": "..."
}
```

**합성 완료 시**: `archived=true` 마킹 (또는 그대로 두기도 함).

**RLS** (모두 `auth.uid() = user_id`): select / insert / update.

**Triggers**: `baseline_progress_touch_updated_at` (before update).

---

## A.5 `conversation` (002)

**역할**: 한 대화 세션 = 한 row. **client-generated UUID** (idempotent upsert).

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `id` | uuid | PK (client `crypto.randomUUID()`) | — |
| `user_id` | uuid | not null, FK → `auth.users(id)` on delete cascade | — |
| `track` | text | not null, check in (`'me'`, `'baseline'`) | `'me'` |
| `is_complete` | boolean | not null | `false` |
| `started_at` | timestamptz | not null | `now()` |
| `completed_at` | timestamptz | nullable | — |
| `created_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**`track` 의미**:
- `'me'` — 매일 두 질문 (qa_pair 누적)
- `'baseline'` — 셀프인터뷰

**Indexes**: `conversation_user_started_idx (user_id, started_at desc)`.

**RLS** (모두 `auth.uid() = user_id`): select / insert / update.

**Triggers**: `conversation_touch_updated_at` (before update).

---

## A.6 `qa_pair` (002 + 009)

**역할**: 한 turn(질문 + 답변) = 한 row. (conversation_id, question_index) unique → 같은 turn 재호출 시 409 idempotent.

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `conversation_id` | uuid | not null, FK → `conversation(id)` on delete cascade | — |
| `user_id` | uuid | not null, FK → `auth.users(id)` on delete cascade | — |
| `question_index` | integer | not null | — |
| `question_text` | text | not null | — |
| `reaction_text` | text | nullable | — |
| `answer_text` | text | not null | — |
| `question_id` | text | nullable (009 추가) | — |
| `created_at` | timestamptz | not null | `now()` |

**`question_id` 의미**: Q2 큐레이션 풀(`lib/me/question-pool.ts`)에서 선택된 id (예: `"Q017"`). Q1·풀 외 turn은 NULL.

**Indexes**:
- `qa_pair_conv_question_unique (conversation_id, question_index)` unique
- `qa_pair_user_created_idx (user_id, created_at desc)`
- `qa_pair_user_question_id_idx (user_id, question_id) where question_id is not null` (partial, 009)

**RLS** (모두 `auth.uid() = user_id`): select / insert / update.

**Triggers**: 없음 (updated_at 없음).

---

## A.7 `answer_card` (002 → 005 재정비)

**역할**: qa_pair 답변을 LLM이 합성한 카드 캐시. qa_pair_id 1:1.

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `qa_pair_id` | uuid | PK, FK → `qa_pair(id)` on delete cascade | — |
| `user_id` | uuid | not null, FK → `auth.users(id)` on delete cascade | — |
| `card` | jsonb | not null | — |
| `generated_at` | timestamptz | not null | `now()` |

**`card` 구조** — LLM 출력 (`web/lib/ai/answer-card-prompt.ts` 참조):
```typescript
{
  subtopics: [
    { title: string; bullets: string[] }
  ];
  summary: string;
  keywords: string[];
}
```

**Indexes**: `answer_card_user_idx (user_id, generated_at desc)`.

**RLS** (모두 `auth.uid() = user_id`): select / insert / update.

**⚠️ 마이그레이션 이력**: 002에서 만든 구 스키마(`title`, `category`, `body`)가 LLM 실제 출력과 안 맞아 005에서 **drop + recreate**. prod 미적용 시 PGRST204 발생 (5/17 사고).

---

## A.8 `somyeong_user_okr` (006)

**역할**: 사용자별 분기 OKR. 일기 합성 컨텍스트 주입용. 없어도 동작.

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `user_id` | uuid | not null, FK → `auth.users(id)` on delete cascade | — |
| `quarter` | text | not null (예: `'2026-Q2'`) | — |
| `mission_text` | text | nullable | — |
| `weekly_goal` | text | nullable | — |
| `okr_data` | jsonb | not null | `'{}'::jsonb` |
| `effective_from` | date | not null | `current_date` |
| `effective_to` | date | nullable | — |
| `created_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**Indexes**: `somyeong_user_okr_user_quarter_unique (user_id, quarter)` unique.

**RLS** (모두 `auth.uid() = user_id`): select / insert / update / delete.

**Triggers**: `somyeong_user_okr_touch_updated_at` (before update).

---

## A.9 `somyeong_entries` (006)

**역할**: 일일 소명일기 entry. 하루 1개 (`(user_id, entry_date)` unique).

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `user_id` | uuid | not null, FK → `auth.users(id)` on delete cascade | — |
| `entry_date` | date | not null (사용자 시간대 YYYY-MM-DD) | — |
| `evening_report_text` | text | not null | — |
| `contribution_flow` | jsonb | not null | `'{}'::jsonb` |
| `ai_question` | text | nullable (HTML 가능) | — |
| `ai_question_source` | text | nullable (예: `'Direct contribution에서'`) | — |
| `answer` | text | nullable | — |
| `free_note` | text | nullable | — |
| `created_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**`contribution_flow` 구조**:
```typescript
{
  direct: [
    {
      kr_code: string;       // OKR KR 코드 매핑
      kr_title: string;
      total_time: string;
      items: [{ time: string; desc: string; duration: string }]
    }
  ];
  translated: [...];
  open_questions: string[];
  suggested_questions: [{ question: string; source: string }];
}
```

**Indexes**:
- `somyeong_entries_user_date_unique (user_id, entry_date)` unique
- `somyeong_entries_user_recent_idx (user_id, entry_date desc)`

**RLS** (모두 `auth.uid() = user_id`): select / insert / update / **delete** (사용자 직접 삭제 가능).

**Triggers**: `somyeong_entries_touch_updated_at` (before update).

---

## A.10 `daily_digest` (008)

**역할**: 매일 두 질문 정리 LLM 캐시. KST 기준 날짜.

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `id` | uuid | PK | `gen_random_uuid()` |
| `user_id` | uuid | not null, FK → `auth.users(id)` on delete cascade | — |
| `digest_date` | date | not null (KST) | — |
| `digest` | jsonb | not null | — |
| `qa_count` | integer | not null | `0` |
| `generated_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**`digest` 구조**:
```typescript
{
  summary: string;
  connections: [
    { partTitle: string; itemTitle: string; note: string }
  ];
  tension: string;
  nextThread: string;
}
```

**`qa_count`**: 합성 시점의 그날 qa_pair 수. 사용자가 같은 날 추가 답변하면 mismatch → 사용자가 "새로 만들기" 누를 때 update.

**Indexes**:
- `daily_digest_user_date_unique (user_id, digest_date)` unique
- `daily_digest_user_recent_idx (user_id, digest_date desc)`

**RLS** (모두 `auth.uid() = user_id`): select / insert / update / delete.

**Triggers**: `daily_digest_touch_updated_at` (before update).

---

## A.11 `long_term_report` (004)

**역할**: 4단계(현상·본질·가치·존재) 누적 보고서. 한 사용자당 1개 (user_id PK).

| 컬럼 | 타입 | 제약 | 기본값 |
|---|---|---|---|
| `user_id` | uuid | PK, FK → `auth.users(id)` on delete cascade | — |
| `shape` | jsonb | not null | — |
| `based_on_qa_count` | integer | not null | `0` |
| `generated_at` | timestamptz | not null | `now()` |
| `updated_at` | timestamptz | not null | `now()` |

**`shape` 구조** — `LongTermShape`:
```typescript
{
  headline: string;
  daySpan: number;
  totalAnswers: number;
  keywords: string[];
  layers: [
    {
      layer: "현상" | "본질" | "가치" | "존재";
      friendlyTitle: string;
      summary: string;
      quotes: [{ day: number; text: string }];
      keywords: string[];
    },
    // ...
  ];
}
```

**`based_on_qa_count`**: staleness 비교용. 이후 qa_pair가 N개 더 쌓이면 재합성 권장.

**RLS** (모두 `auth.uid() = user_id`): select / insert / update.

**Triggers**: `long_term_report_touch_updated_at` (before update).

**현재 상태**: 본인 합성 비활성. `/me/report` 흐름 tab은 페르소나 preview 표시.

---

## A.12 `somyeong_usage_metrics` (view, 006 + 007)

**역할**: 운영자 모니터링용 사용 수치 집계 view. **콘텐츠 접근 0**.

**DDL**:
```sql
create view public.somyeong_usage_metrics as
select
  user_id,
  date_trunc('day', created_at) as day,
  count(*)::integer as entries_created
from public.somyeong_entries
group by user_id, date_trunc('day', created_at);
```

**보안 (007 강화)**:
- `security_invoker = on` — view 호출자의 권한으로 실행 → underlying table RLS 적용
- anon, authenticated role에서 `SELECT REVOKE` — 클라이언트 SDK에서 노출 0
- 운영자 모니터링은 service_role key 또는 별도 admin role로만

**노출 컬럼**: `user_id`, `day`, `entries_created`. 답변·일기 본문은 안 보임.

---

## A.13 공통 함수·트리거

### `touch_updated_at()` (001)

```sql
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

전체 mutable 테이블에서 `before update` 트리거로 사용.

### `handle_new_user()` (001)

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'display_name', '')
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**security definer** — RLS bypass 필요. 가입 시 시스템(postgres 권한)이 row 생성.

---

# B. API 라우트 전체

## 공통 사항

- **모두 Node runtime** (Gemini SDK 호환). `export const runtime = "nodejs"`.
- **인증**: 모든 `/api/me/*` 라우트는 `supabase.auth.getUser()`로 인증 확인. 401 응답.
- **에러 처리**: LLM 호출 라우트는 `classifyGeminiError`로 quota·auth·timeout 분류.
- **request·response 검증**: Zod schemas.
- **structured output**: AI SDK v6 `generateText` + `Output.object({ schema })`.

---

## B.1 `/api/me/chat`

**파일**: `web/app/api/me/chat/route.ts`
**Method**: POST
**Runtime**: Node, default timeout

**역할**: 매일 두 질문 (Q1·Q2) 생성. 가장 묵직한 LLM flow.

**Request**:
```typescript
{
  userName: string;  // 1-40자
  history: Array<{
    role: "ai-question" | "user-answer" | "ai-reaction";
    text: string;
  }>;
  baselineId?: BaselineId;  // /demo 페르소나 (`'minister' | 'worker' | 'student'`)
  mode?: "me" | "demo";
}
```

**Response**:
```typescript
{
  reaction: string;
  question: string;
  isComplete: boolean;
  selectedQuestionId: string;  // Q2에서 풀에서 선택된 id, 그 외 빈 문자열
  suggestedAnswers: string[];  // demo 모드만 1-2개. me 모드는 항상 []
}
```

**LLM**: `gemini-2.5-flash` (chat 전용).

**Server logic**:
- 인증 사용자라면 본인 `baseline_report` + 최근 10개 `qa_pair` + 최근 5개 `somyeong_entries` 조회
- Q2 turn(`userTurns === 1`)에는 본인 `qa_pair.question_id` 최근 60개 조회 → 풀에서 cooldown 제외 → 상위 8개 후보 prompt에 주입
- `selectedQuestionId`가 후보 set에 없으면 server-side에서 빈 문자열로 sanitize
- Hard cap: `userTurns >= 2`면 `isComplete=true, question="", selectedQuestionId="", suggestedAnswers=[]`

**Prompt**: `lib/ai/pacemaker-prompt.ts` (`PACEMAKER_SYSTEM_PROMPT` + `buildContextHeader()`)

**호출 위치**: `web/lib/conversation.ts` (`callPacemaker`)

---

## B.2 `/api/me/digest`

**파일**: `web/app/api/me/digest/route.ts`
**Method**: POST

**역할**: 매일 두 질문 답변 → 정리 4 카드.

**Request**:
```typescript
{
  userName: string;
  todayAnswers: Array<{ question: string; answer: string }>;  // 1-6개
  baselineId?: BaselineId;  // /demo 트랙용
}
```

**Response**:
```typescript
{
  summary: string;
  connections: [
    { partTitle: string; itemTitle: string; note: string }
  ];
  tension: string;
  nextThread: string;
}
```

**LLM**: `gemini-2.5-flash-lite`. Prompt: `lib/ai/digest-prompt.ts`.

**캐시**: `daily_digest` 테이블 (user_id, digest_date KST) unique. miss이면 client가 fetch → DB insert (별도 라우트 아니라 client-side `useEffect`로 처리).

**호출 위치**: `web/app/me/report/MeReportClient.tsx` (DailyTab 안 `useEffect`).

---

## B.3 `/api/me/answer-card`

**파일**: `web/app/api/me/answer-card/route.ts`
**Method**: POST

**역할**: 개별 qa_pair 답변을 카드(subtopics·summary·keywords)로 합성.

**Request**:
```typescript
{
  question: string;  // 1-500자
  answer: string;    // 1-5000자
  qaPairId?: string; // 있으면 캐시 조회·저장. /demo 익명은 없음
}
```

**Response**:
```typescript
{
  subtopics: [
    { title: string; bullets: string[] }
  ];
  summary: string;
  keywords: string[];
}
```

**LLM**: `gemini-2.5-flash-lite`. Prompt: `lib/ai/answer-card-prompt.ts`.

**캐시**: `answer_card` 테이블 qa_pair_id PK. cache hit이면 LLM 호출 0.

**호출 위치**: `web/lib/me/use-answer-cards.ts` (`useAnswerCards` hook).

---

## B.4 `/api/me/transcribe`

**파일**: `web/app/api/me/transcribe/route.ts`
**Method**: POST (multipart/form-data)

**역할**: 음성 blob → 한국어 텍스트.

**Request** (FormData):
- `audio`: Blob (최대 8MB, audio/webm·ogg·mp4·mpeg·wav·m4a·aac)

**Response**:
```typescript
{ text: string }
```

**LLM**: `gemini-2.5-flash-lite` (multimodal).

**Prompt 핵심**: "타임스탬프(00:01 등)·화자 표시·머리말·꼬리말 절대 금지. 한국어 구어체 그대로." (이전 fix)

**호출 위치**:
- `web/app/me/baseline/interview/InterviewClient.tsx` (셀프인터뷰 음성 step)
- `web/components/ConversationStage.tsx` (매일 두 질문 음성 입력)

---

## B.5 `/api/me/baseline-interview/parse`

**파일**: `web/app/api/me/baseline-interview/parse/route.ts`
**Method**: POST

**역할**: import paste된 텍스트를 LLM이 3 part로 자동 분류 (BaselineShape JSON으로).

**Request**:
```typescript
{ text: string }  // 20-50000자
```

**Response** — `BaselineShape`:
```typescript
{
  headline: string;  // 5-60자
  parts: Array<{
    partTitle: "가치 있는 것" | "좋아하는 것" | "잘하는 것";
    items: [...];
    insight: string;
    keywords: string[];
  }>;
}
```

**LLM**: `gemini-2.5-flash-lite`.

**호출 위치**: Import 흐름 (`/me/baseline/import`).

> **주의**: 이 라우트 이름이 `interview/parse`지만 실제는 Import 텍스트 분류용. 셀프인터뷰 음성 답변 parsing은 별도 흐름.

---

## B.6 `/api/me/baseline-interview/complete`

**파일**: `web/app/api/me/baseline-interview/complete/route.ts`
**Method**: POST

**역할**: 6 step 셀프인터뷰 답변(`baseline_interview_progress.answers`)을 LLM이 BaselineShape으로 합성 → `baseline_report` upsert + `progress.archived=true`.

**Request**: 없음 (서버가 `progress` row 읽음).

**Precondition**: `current_step >= TOTAL_STEPS` (6 모두 완료).

**Response**:
```typescript
{ ok: true }
```

**LLM**: `gemini-2.5-flash-lite`. Output schema는 BaselineShape.

**멱등성**: 다시 호출돼도 baseline_report만 덮어쓰기.

---

## B.7 `/api/me/baseline-interview/progress`

**파일**: `web/app/api/me/baseline-interview/progress/route.ts`
**Method**: GET / POST

**역할**: 셀프인터뷰 진행 상태 read·save. **LLM 호출 없음** (DB only).

**GET**: 현재 `baseline_interview_progress` row 반환 (없으면 default).

**POST** (step별 즉시 저장):
```typescript
{
  current_step: number;
  answers: Record<string, string>;  // merge into existing
}
```

**효과**: 사용자가 이탈해도 다음 진입 시 정확히 그 자리에서 resume.

---

## B.8 `/api/me/baseline-report`

**파일**: `web/app/api/me/baseline-report/route.ts`
**Method**: POST

**역할**: 사용자가 검토·수정한 BaselineShape을 `baseline_report` 테이블에 upsert. **LLM 호출 없음**.

**Request** — Full BaselineShape + source:
```typescript
{
  source: "interview" | "import";
  report: BaselineShape;  // headline + parts(3)
}
```

**Response**: `{ ok: true }` 또는 에러.

**호출 위치**: Import 검토·수정 화면, 셀프인터뷰 합성 결과 편집 화면.

---

## B.9 `/api/me/diary/synthesize`

**파일**: `web/app/api/me/diary/synthesize/route.ts`
**Method**: POST
**Runtime**: Node + `maxDuration = 60`

**역할**: 사용자 paste 텍스트를 `contribution_flow` JSON으로 합성.

**Request**:
```typescript
{ evening_report: string }  // 30-10000자
```

**Response**:
```typescript
{
  contribution_flow: {
    direct: [...];     // OKR KR과 직접 매핑되는 일
    translated: [...]; // 의미 번역한 일
    open_questions: string[];
    suggested_questions: [{ question: string; source: string }];
  }
}
```

**LLM**: `gemini-2.5-flash-lite`.

**컨텍스트**: OKR(`somyeong_user_okr`) 있으면 KR 매핑 기준으로 주입. baseline(`baseline_report`) 있으면 Translated 의미 부여 보조.

**저장 안 함** — 별도 [save 라우트](#b10-apimediarysave) 호출.

---

## B.10 `/api/me/diary/save`

**파일**: `web/app/api/me/diary/save/route.ts`
**Method**: POST

**역할**: 일기 entry 저장. `(user_id, entry_date)` unique upsert.

**Request**:
```typescript
{
  entry_date: string;            // YYYY-MM-DD (KST)
  evening_report_text: string;
  contribution_flow: { ... };    // synthesize의 결과
  ai_question?: string;
  ai_question_source?: string;
  answer?: string;
  free_note?: string;
}
```

**Validation (application 단)**: `answer` 또는 `free_note` 중 하나는 채워져야 함.

**Response**: `{ ok: true }`.

**LLM**: 호출 없음 (DB only).

---

## B.11 `/api/me/diary/okr`

**파일**: `web/app/api/me/diary/okr/route.ts`
**Method**: GET / PUT

**역할**: 사용자별 OKR 조회·저장. **LLM 호출 없음**.

**GET**: 가장 최근 `somyeong_user_okr` row 반환 (없으면 null).

**PUT** — quarter 기준 upsert:
```typescript
{
  quarter: string;       // 예: "2026-Q2"
  mission_text?: string;
  weekly_goal?: string;
  okr_data: {
    objectives: [{ title; key_results: [...] }];
    사업부_okr: [...];
  };
}
```

---

## B.12 `/api/me/long-term-report/refresh`

**파일**: `web/app/api/me/long-term-report/refresh/route.ts`
**Method**: POST
**Runtime**: Node + `maxDuration = 60`

**역할**: 누적 답변 기반 LongTermShape 합성 → `long_term_report` upsert.

**Request**: 없음 (서버가 `baseline_report` + `qa_pair` 누적 조회).

**Response**: `{ ok: true }` 또는 에러.

**Precondition**: `baseline_report` 존재.

**LLM**: `gemini-2.5-flash-lite` (`lib/me/long-term-synthesis.ts`).

**Output**: LongTermShape (headline·layers[4]·keywords).

**현재 상태**: 본인 합성 비활성. `/me/report` 흐름 tab은 페르소나 preview 표시. 이 route는 양식 검증·시드용으로 유지.

---

## B.13 `/api/me/qa-pairs`

**파일**: `web/app/api/me/qa-pairs/route.ts`
**Method**: POST

**역할**: 매일 두 질문 한 turn 완성 시 fire-and-forget 누적 저장. **LLM 호출 없음**.

**Request**:
```typescript
{
  conversationId: string;       // client UUID
  questionIndex: number;
  questionText: string;
  reactionText?: string;
  answerText: string;
  isLast?: boolean;             // true면 conversation.is_complete=true
  questionId?: string;          // Q2 풀 선택 id (예: "Q017") 또는 ""
}
```

**Server logic**:
1. `conversation` upsert (idempotent on `id`)
2. `qa_pair` insert. `(conversation_id, question_index)` unique violation은 멱등으로 처리 (409 X, `{ ok: true, deduped: true }`)
3. `isLast`면 `conversation.is_complete=true + completed_at=now`

**Response**: `{ ok: true, qaPairId?: string, deduped?: true }`.

**호출 위치**: `web/lib/conversation.ts` (`persistQaPair`, fire-and-forget).

---

## B.14 `/api/me/prepare-seen`

**파일**: `web/app/api/me/prepare-seen/route.ts`
**Method**: POST

**역할**: `user_settings.prepare_seen = true` 마킹 (약관·동의 1회 확인). **LLM 호출 없음**.

**Request**: 없음.

**Response**: `{ ok: true }`.

**멱등**: 이미 true여도 OK.

**호출 위치**: `/me/baseline/prepare` 마지막 step CTA 클릭 시.

---

## B.15 `/api/me/settings/goal`

**파일**: `web/app/api/me/settings/goal/route.ts`
**Method**: POST

**역할**: "내 목표" 자유 텍스트 upsert. `somyeong_user_okr`에 저장 (테이블 generic 활용).

**Request**:
```typescript
{
  period?: string;  // 빈 문자열이면 "default"
  body: string;     // 최대 10000자
}
```

**저장 형태**:
- `quarter`: `period || "default"`
- `okr_data`: `{ raw_text: body }`
- `mission_text`, `weekly_goal`: null

**Response**: `{ ok: true }`.

**LLM 호출 없음**. 일기 합성 시 `okr_data.raw_text` 있을 때만 컨텍스트 주입.

---

## API 라우트 한눈에 (15개)

| # | Route | Method | LLM? | 캐시 | 인증 |
|---|---|---|---|---|---|
| 1 | `/api/me/chat` | POST | flash | — | ✅ |
| 2 | `/api/me/digest` | POST | flash-lite | `daily_digest` | ✅ |
| 3 | `/api/me/answer-card` | POST | flash-lite | `answer_card` | ✅ |
| 4 | `/api/me/transcribe` | POST | flash-lite | — | ✅ |
| 5 | `/api/me/baseline-interview/parse` | POST | flash-lite | — | ✅ |
| 6 | `/api/me/baseline-interview/complete` | POST | flash-lite | — | ✅ |
| 7 | `/api/me/baseline-interview/progress` | GET/POST | — | — | ✅ |
| 8 | `/api/me/baseline-report` | POST | — | — | ✅ |
| 9 | `/api/me/diary/synthesize` | POST | flash-lite | — | ✅ |
| 10 | `/api/me/diary/save` | POST | — | — | ✅ |
| 11 | `/api/me/diary/okr` | GET/PUT | — | — | ✅ |
| 12 | `/api/me/long-term-report/refresh` | POST | flash-lite | row 캐시 | ✅ |
| 13 | `/api/me/qa-pairs` | POST | — | — | ✅ |
| 14 | `/api/me/prepare-seen` | POST | — | — | ✅ |
| 15 | `/api/me/settings/goal` | POST | — | — | ✅ |

> **LLM-호출 라우트 8개**, DB-only 라우트 7개. LLM-호출 중 캐시되는 건 2개(digest, answer-card) + 1개는 row 자체가 캐시(long-term).
