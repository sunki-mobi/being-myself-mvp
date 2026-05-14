# 소명일기 — Being Myself 통합 기능 스펙

**대상**: Being Myself 개발 세션
**작성**: 2026-05-13
**스택 가정**: React + Supabase (Being Myself와 동일)
**디자인**: Being Myself 디자인 시스템 따름 (이 문서는 시각 결정 포함 안 함)

---

## 1. Overview — 무엇을 추가하는가

Being Myself 안에 **소명일기** 기능을 추가한다. 매일 저녁 사용자가 퇴근 보고를 paste하면, AI가 그날의 일을 *기여 흐름*으로 묶어 보여주고, 사용자는 그 위에서 일기를 쓴다.

**한 줄 정의**: 일하는 사람이 자기 일에서 의미를 발견하도록 돕는 일일 reflection 기능. AI는 평가자가 아니라 분석가.

**위치**: Being Myself 내 별도 섹션/탭/페이지 (정확한 IA는 Being Myself 디자인 따름).

**일일 사용 시간**: ~5분.

---

## 2. Non-negotiable Principles (불변)

이 5개가 깨지면 product가 무너진다. 구현 시 모든 결정의 기준.

1. **AI는 평가자가 아니라 분석가**
   - 점수, 정합도, "high/medium/low", 차트, 게이지 — **금지**
   - "분류" 어조도 금지: "anchored vs floating", "on-target vs off-target" 같은 라벨링 안 됨
   - 출력은 *분석*과 *질문*만

2. **본인만 본다** (가시성)
   - 사용자가 입력한 모든 답변은 그 사용자만 볼 수 있다
   - 매니저, 팀장, HR, 운영자, 동료 — 모두 접근 불가
   - Supabase RLS로 코드 수준에서 강제 (정책 예시는 §6 참조)
   - 회사가 볼 수 있는 건 단 하나: **사용 수치** (몇 명이 며칠 작성했는가). 콘텐츠는 0.

3. **Open question 정직성**
   - AI가 모르는 일은 강제로 분류하지 않는다
   - "Open question" 섹션이 빈 일이 있어도 정상 — 그게 정직함의 신호
   - 모든 일에 억지 의미 라벨 붙이는 건 evaluator로 회귀하는 길

4. **5분 안에**
   - 입력부터 일기 저장까지 5분 이내가 목표
   - 빠른 진입 (한 번의 paste로 시작)
   - 답변 입력 둘 다 선택 (필수 아님)

5. **선택의 자유**
   - 일기는 두 입력창 — *질문에 답*, *자유 작성*. 둘 다 (선택)
   - 둘 다 비면 저장 button만 disabled
   - 강제 prompt 없음

---

## 3. User Flow

```
START
  ↓
[Step 1] 퇴근 보고 paste                  ← 사용자 입력
  ↓ click "기여 흐름 만들기"
[AI 처리] ~3-5초                          ← Claude API call
  ↓
[Step 2] 기여 흐름 보기                   ← AI 출력 read
  ↓ click "오늘의 한 줄로"
[Step 3] AI 질문 + 답변 입력 (둘 다 선택)  ← 사용자 입력
  ↓ click "오늘 마무리"
[저장] 본인 history에 추가                ← Supabase write
  ↓
[완료] 확인 화면 + 내 일기로 navigation
```

**별도 view: 내 일기 (history)**
- 과거 entries 카드 list
- 각 카드: 날짜, AI 질문, 사용자 답변, 자유 일기
- 비어 있는 칸은 표시 안 함

---

## 4. Data Model (Supabase)

### Table: `somyeong_entries`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | gen_random_uuid() |
| `user_id` | uuid (fk → auth.users) | RLS pivot |
| `entry_date` | date | YYYY-MM-DD (사용자 시간대) |
| `evening_report_text` | text | 사용자가 paste한 퇴근 보고 원문 |
| `contribution_flow` | jsonb | AI 출력 (§5 schema 참조) |
| `ai_question` | text | AI가 던진 질문 (HTML 가능) |
| `ai_question_source` | text | "Direct contribution에서" 등 |
| `answer` | text | nullable — 질문에 대한 답 |
| `free_note` | text | nullable — 자유 일기 |
| `created_at` | timestamptz | now() |
| `updated_at` | timestamptz | trigger로 갱신 |

**Constraints**:
- `unique (user_id, entry_date)` — 하루 한 entry. 재작성은 update.
- `check (answer is not null or free_note is not null)` — 둘 다 비면 저장 불가

### Table: `somyeong_user_okr`

각 사용자의 현재 분기 OKR. AI가 기여 매핑에 참조.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `user_id` | uuid (fk) | |
| `quarter` | text | "2026-Q2" 같은 형식 |
| `mission_text` | text | 사업부 미션 (긴 문장) |
| `weekly_goal` | text | 금주 소명 목표 |
| `okr_data` | jsonb | KR 목록 (구조는 아래 참조) |
| `effective_from` | date | |
| `effective_to` | date | |

`okr_data` 구조:
```json
{
  "objectives": [
    {
      "title": "Obj 1 — Being 문화와 도구",
      "key_results": [
        {
          "code": "KR1",
          "title": "소명대로 일하는 것이 무엇인가에 대한 정의를 내린다",
          "owner": "선기"
        },
        { "code": "KR2", "title": "Being Myself 모비니티용 제작 + 10일·3개선", "owner": "선기" },
        ...
      ]
    }
  ],
  "사업부_okr": [
    { "code": "사업부 KR2", "title": "Being Myself 출시·운영", "owner": "선기" }
  ]
}
```

OKR은 분기에 1번 사용자가 입력 (또는 운영자가 사전 등록). 매일 reflection 시 AI가 자동 참조.

---

## 5. AI Behavior Spec

### Input

```typescript
{
  evening_report: string,      // 사용자가 paste한 퇴근 보고 원문
  okr_context: {
    mission: string,
    weekly_goal: string,
    objectives: [...],         // §4의 okr_data 구조
  },
  user_name: string,           // 호명용 (e.g., "선기님")
}
```

### Output (`contribution_flow` JSON 저장됨)

```typescript
{
  direct: [
    {
      kr_code: string,         // "KR2", "사업부 KR2"
      kr_title: string,        // 짧은 제목
      total_time: string,      // "5h 9m"
      items: [
        { time: "08:36~09:25", desc: "Being Myself demo 수정", duration: "49분" },
        ...
      ]
    },
    ...
  ],
  translated: [
    {
      meaning: string,         // AI가 이름 붙인 단위 (e.g., "미션 호흡", "사람 돌봄")
      total_time: string,
      items: [...],
      ai_note: string,         // 왜 이게 회사에 닿는 일인지 짧은 설명 (1-2문장)
    },
    ...
  ],
  open_questions: [
    {
      task: string,            // 문제의 작업
      prompt: string,          // 사용자에게 묻고 싶은 것
    }
    // 빈 배열일 수 있음 — OK
  ],
  suggested_questions: [
    {
      source: string,          // "Direct contribution에서" / "Translated contribution에서" / "전체 그림에서"
      body: string,            // HTML 포함 가능 (<strong>, <em> 사용)
    },
    // 정확히 3개 생성 (다양한 결로)
  ]
}
```

### Prompt Design

System prompt 핵심 instruction:

```
당신은 사용자가 한 일을 의미 있게 보여주는 reflection 분석가입니다.
사용자의 일을 평가하지 마세요. 점수도 정합도도 분류도 출력하지 마세요.

당신의 일은 세 가지:

1. Direct contribution: 사용자의 OKR에 명확히 매핑되는 일을 KR별로 묶고
   시간을 합산. 자연스러운 매핑만 — 억지 매핑 금지.

2. Translated contribution: OKR에 직접 매핑되지 않지만 회사 미션·동료·환경에
   닿는 일을 의미 단위로 묶고 짧은 이름을 붙여주세요. 예: "청소" → "환경 돌봄",
   "동료 점심 함께" → "관계 돌봄". 외부에선 의미 없어 보이지만 회사가
   기능하기 위해 필요한 일들.

3. Open question: 위 둘 어디에도 자연스럽게 들어가지 않는 일은 사용자에게
   직접 물어보세요. "이 일은 오늘 당신에게 어떤 자리였어요?" 강제 분류 금지.
   모르는 게 정직함입니다.

추가로 일기 prompt 질문 3개 생성:
- Direct contribution에서 1개 (시간이 가장 길었던 KR 기반)
- Translated contribution에서 1개 (의미 있게 번역된 일 기반)
- 전체 그림에서 1개 (계획에 없던 일, 야근, 이슈 메모 등 텍스처가 풍부한 곳)

질문 어조: 발견을 돕는 분석가. 평가 금지. "어땠어요?"보다 "어느 매듭을
풀어줬어요?" 같은 구체적인 질문. 본인이 적은 메모는 인용 (italic)하고,
시간·KR 코드는 강조 (bold)하세요.
```

### Edge Cases

- **Open question이 빈 경우**: UI에 *"오늘은 모두 분류됐어요. 다행이에요 — 또는 AI가 너무 자신만만한 걸 수도 있어요."* 같은 정직한 빈 상태 표시
- **퇴근 보고가 너무 짧은 경우** (<30자): 입력 단계에서 *"좀 더 적어주세요"* — 의미 있는 분석 불가
- **OKR이 없는 사용자**: Translated contribution만 출력, Direct는 빈 배열 (또는 사용자에게 OKR 입력 권유)
- **AI가 시간 합산 실패**: items만 출력, total_time은 "—" 또는 생략

### Model 선택

Claude Sonnet 4.6 권장 (4.7도 가능 — 비용 vs 품질 trade-off).
일 1회 × 사용자 수 × 30일 = 적은 호출량. 비용 부담 작음.

Prompt caching 권장: system prompt + OKR context는 user-level cache (4-시간 TTL).

---

## 6. Governance — 본인만 본다 (Code-level enforcement)

### Supabase RLS 정책

```sql
-- 본인 entry만 read 가능
CREATE POLICY "users_can_read_own_entries" ON somyeong_entries
  FOR SELECT USING (auth.uid() = user_id);

-- 본인 entry만 insert 가능
CREATE POLICY "users_can_insert_own_entries" ON somyeong_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 entry만 update 가능 (같은 날짜 재작성)
CREATE POLICY "users_can_update_own_entries" ON somyeong_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인 entry만 delete 가능
CREATE POLICY "users_can_delete_own_entries" ON somyeong_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 동일 정책 somyeong_user_okr에도 적용
```

### 운영자 access 정책

- **운영자/관리자에게도 콘텐츠 access 권한 주지 않음** — service_role key를 admin dashboard에 노출하지 않음
- 운영자가 볼 수 있는 건 단일 view: 사용 수치 집계 (count of entries by user_id and date — 콘텐츠 없음)

### 사용 수치 view (콘텐츠 0)

```sql
CREATE VIEW somyeong_usage_metrics AS
SELECT
  user_id,
  date_trunc('day', created_at) AS day,
  COUNT(*) AS entries_created,
  -- 콘텐츠는 절대 SELECT 안 함
FROM somyeong_entries
GROUP BY user_id, date_trunc('day', created_at);
```

이 view에 admin role만 read 권한. 콘텐츠는 어디에도 노출 안 됨.

### 사용자 export / delete 권한

- 본인 일기 전체 export (마크다운 또는 JSON) — Settings 메뉴
- 개별 entry 삭제 / 전체 삭제 — Settings 메뉴
- 회사 떠날 때 export 후 모든 데이터 삭제 (또는 보관 선택)

---

## 7. UX Behavior Spec (디자인 시스템 무관)

### Step 1: 입력
- 단일 textarea (퇴근 보고 paste)
- placeholder 예시 텍스트 (도움 글)
- OKR reference (collapsible, 옆에 또는 아래)
- Primary button: "기여 흐름 만들기"
- Validation: 최소 30자 이상 (실용 임계)

### AI 처리 중
- Loading state (spinner 또는 pulse) ~3-5초
- 메시지: "AI가 당신의 하루를 읽고 있어요"

### Step 2: 기여 흐름 출력
- 3 섹션 (Direct / Translated / Open question) 시각적으로 구분
- 각 섹션 안 KR 코드는 mono font 권장
- Translated의 ai_note는 italic 권장
- Open question 빈 상태 honest 메시지 표시
- Primary button: "오늘의 한 줄로 마무리"
- (선택) "다른 결의 질문 보기" — 3개 suggested_questions cycle

### Step 3: 일기 입력
- AI 질문 prominent display (큰 활자 권장 — Being Myself 디자인 따름)
- 두 textarea:
  1. 라벨: "질문에 답해보기 (선택)"
  2. 라벨: "자유롭게 적기 (선택)"
- placeholder 차이로 두 자리의 의도 구분
- Primary button: "오늘 마무리하기" — disabled until 둘 중 하나라도 ≥2자
- 글자수 카운터 **없음** (의도적 — 짧게 쓰든 길게 쓰든 같은 무게)
- 가시성 표시: "본인만 봅니다"

### Step 4: 완료
- "오늘의 일기가 저장됐어요"
- 거버넌스 강조: "본인만 봅니다. 회사의 누구도 접근 불가"
- 두 액션: "내 일기 보기" / "처음부터 다시"

### History view
- 카드 list (newest first)
- 각 카드:
  - 날짜 + 요일 + 시간
  - 상대 시간 ("오늘", "어제", "3일 전")
  - 기여 흐름 요약 1줄
  - AI 질문 + source
  - 답변 (있는 경우만)
  - 자유 일기 (있는 경우만)
- 통계 (선택): 누적 일기 수, 연속 작성 일, 이번 달 등

---

## 8. Sample Data (실제 사용자 입력 — 테스트용)

### 입력 — 한 사용자의 퇴근 보고 (선기, 2026-05-13)

```
08:36 ~ 9:25 Being Myself demo 수정사항 정리 / 새싹 전달사항 확인 및 내부 전달
10:00 ~ 11:23 소명씽크 참여
10:45 ~ 12:00 장신대 박람회 세팅 / Being Myself demo 개발
12:00 ~ 16:20 장신대 박람회 참여
14:40 ~ 15:30 Being Myself 실서비스 개발
19:20 ~ 21:35 Being Myself 실서비스 개발
21:35 ~ 21:47 퇴근 보고

이슈 및 보고사항
오늘은 이동에 소요됐던 시간들이 많아 목표했던 개발 작업 완료하기 위해 위 시간까지 진행했습니다.
내일은 사무실 출근 예정입니다.
5/14 민방위 예정입니다.
5/15 서산 꿈의 학교에서 교육 예정입니다.
```

### 사용자 OKR (예시)

```json
{
  "mission_text": "ACX 사업부는 닿는 모든 사람과 조직이 자신의 소명을 발견해 성장하도록 돕고, 정체성과 소명대로 일하며 지치지 않고 행복하게 일하는 문화를 만들고 전파합니다.",
  "weekly_goal": "모비니티가 먼저 소명대로 일할 수 있는 서비스 제작 및 구축",
  "okr_data": {
    "objectives": [{
      "title": "Being 문화와 도구로 우리 안에서 시작",
      "key_results": [
        { "code": "KR1", "title": "소명대로 일하는 것의 정의", "owner": "선기" },
        { "code": "KR2", "title": "Being Myself 모비니티용 + 10일·3개선", "owner": "선기" },
        { "code": "KR3", "title": "Being Us 분기 3회 플레이테스트", "owner": "선기" },
        { "code": "KR4", "title": "Being 생태계 서비스 4개 이상", "owner": "선기" }
      ]
    }],
    "사업부_okr": [
      { "code": "사업부 KR2", "title": "Being Myself 출시·운영", "owner": "선기" }
    ]
  }
}
```

### 기대 AI 출력

```json
{
  "direct": [
    {
      "kr_code": "KR2",
      "kr_title": "Being Myself 모비니티용",
      "total_time": "5h 9m",
      "items": [
        { "time": "08:36~09:25", "desc": "Being Myself demo 수정", "duration": "49분" },
        { "time": "10:45~12:00", "desc": "장신대 박람회 세팅 + Being Myself demo 개발", "duration": "1h 15m" },
        { "time": "14:40~15:30", "desc": "Being Myself 실서비스 개발", "duration": "50분" },
        { "time": "19:20~21:35", "desc": "Being Myself 실서비스 개발 (야근)", "duration": "2h 15m" }
      ]
    },
    {
      "kr_code": "사업부 KR2",
      "kr_title": "Being Myself 출시·운영",
      "total_time": "4h 20m",
      "items": [
        { "time": "12:00~16:20", "desc": "장신대 박람회 참여 (Init 1 — 30명 베타테스트 모집)", "duration": "4h 20m" }
      ]
    }
  ],
  "translated": [
    {
      "meaning": "미션 호흡",
      "total_time": "1h 23m",
      "items": [
        { "time": "10:00~11:23", "desc": "소명씽크 참여", "duration": "1h 23m" }
      ],
      "ai_note": "ACX 미션 '정체성과 소명대로 일하는 문화'를 동료들과 함께 만드는 자리. KR에 직접 매핑되진 않지만 회사가 소명대로 일한다는 게 무엇인지를 정의하는 시간."
    },
    {
      "meaning": "내부 소통",
      "total_time": "포함",
      "items": [
        { "time": "08:36 블록", "desc": "새싹 전달사항 확인 및 내부 전달", "duration": "—" }
      ],
      "ai_note": "정보가 막힘없이 흐르도록 돕는 일. 외부에선 안 보이지만 팀이 같은 그림을 보는 데 필요한 호흡."
    }
  ],
  "open_questions": [],
  "suggested_questions": [
    {
      "source": "Direct contribution에서",
      "body": "오늘 <strong>Being Myself에 5h 9m</strong>, 그 중 야근으로 <strong>2h 15m</strong>을 쓰셨어요. 본인 메모: <em>\"이동 시간이 많아 목표했던 개발 작업 완료하기 위해.\"</em><br /><br />이 야근 시간이 본인 <strong>KR2</strong>의 어느 매듭을 풀어줬어요? 무엇을 위해 끝까지 머물렀나요?"
    },
    {
      "source": "Translated contribution에서",
      "body": "오늘 <strong>소명씽크에 1h 23m</strong>을 쓰셨어요. 이 시간이 OKR엔 직접 안 잡히지만, 미션의 호흡을 같이 만드는 자리라고 봤어요.<br /><br />오늘 소명씽크에서 누구의 어떤 말이 가장 마음에 남았어요?"
    },
    {
      "source": "전체 그림에서",
      "body": "오늘 <strong>박람회 참여 4h 20m</strong>이 가장 긴 블록이었어요. 사업부 KR2 Init 1의 핵심 행사였죠.<br /><br />4시간 20분 동안 가장 기억에 남는 한 사람의 반응이 있다면 누구였어요? 그 반응이 KR2 다음 단계에 어떤 단서를 줘요?"
    }
  ]
}
```

이 sample을 그대로 prompt engineering 검증에 쓸 수 있다. AI 출력이 위와 가깝게 나오면 prompt가 잘 작동하는 신호.

---

## 9. Open Questions (Being Myself 세션이 결정해야)

이 부분은 우리가 결정하지 못하고 넘김. Being Myself 통합 컨텍스트에서 답이 분명해질 가능성이 큼.

1. **IA 위치**: Being Myself 메뉴 안 어디에 들어가나? (별도 탭? 매일 알림? sidebar?)
2. **알림 timing**: 언제 사용자에게 "오늘 소명일기 작성하시겠어요?" 알림? (저녁 6-9시? 사용자 설정?)
3. **다른 에이전트와의 데이터 공유**: 한 줄 출근방·OKR·퇴근 보고를 처리하는 별도 에이전트가 있다고 들음. 그 에이전트의 데이터를 직접 import할 수 있으면 paste 단계 자동화 가능. 협업 협의 필요.
4. **시범 대상 5명 결정**: 지민, 선기 + 3명. Being Myself 시범 사용자와 겹치는지?
5. **OKR 입력 UX**: 사용자가 직접 입력? 운영자가 사전 등록? 다른 에이전트에서 가져옴?
6. **History export 형식**: 마크다운? JSON? PDF?
7. **연속 작성 통계 노출 여부**: gamification 위험 — 발견 도구 어조와 맞는지 검토.

---

## 10. 검증해야 할 가설 (시범 첫 2주)

V1 출시 후 측정 — Being Myself analytics에 추가 권장:

1. **사용 가설**: 시범 5명 중 30% 이상이 7일 연속 자발적 사용
2. **묶기 품질**: AI의 Translated contribution 라벨 70% 이상 사용자 평가 *"맞다, 그렇게 봤다"* (간단 thumbs up/down 충분)
3. **Open question 정직성**: AI가 매일 평균 1개 이상 Open question 인정 (모든 일을 강제 분류하지 않음)
4. **답변 비율**: entries 중 answer 또는 free_note가 채워진 비율 70% 이상
5. **거버넌스 신뢰**: 사용자 인터뷰에서 *"이 답이 정말 본인만 보이느냐"* 신뢰도 9/10 이상

---

## 11. Background — 왜 이렇게 디자인됐나 (Being Myself 팀 read-only 컨텍스트)

이 섹션은 결정의 history. 구현에 직접 영향 없지만 *왜 이런 형태인가*가 궁금할 때.

### 출발점
지민(직원) 초기 사고: AI가 한 줄 출근방을 받아 정합도를 점수로 채점하는 구조. 그런데 *"AI는 평가자가 아니라 분석 파트너다"*로 사고를 바꿈. 평가는 결과를 내리고 분석은 재료를 제공한다.

### 진화 — 4번의 큰 결정
1. **통합 vision → narrowed wedge** (이전 세션에서 한 줄 출근방·OKR·퇴근 보고까지 통합하려다 → 다른 에이전트가 그것 처리. 우리는 reflection layer만)
2. **위치시킨 질문 → 기여 흐름** (V1-α의 한 질문 한 줄 → 묶기가 핵심이라는 발견. 일기는 그 위에 옴)
3. **OKR만 → OKR + 회사 기여 번역** (지민 통찰: 청소처럼 OKR 밖이지만 회사에 닿는 일도 의미 있게 보여줘야)
4. **단순 입력 → 두 입력창 (선택)** (질문 답 + 자유. 둘 다 선택. 강제 안 함)

### 존중되어야 할 정신
- 평가 어조 절대 금지 (점수, 분류, 정합도)
- 본인만 본다는 약속이 코드 수준에서 강제
- AI가 모르는 일은 정직하게 모른다고 표시
- 5분 이내, 가벼움

이 정신이 깨지면 product가 무너집니다. 어떤 기능 추가도 이 5개 원칙을 깨지 않는 한 OK.

---

## 12. Reference Artifacts (이 폴더 안)

이 세션에서 만든 파일들. Being Myself 세션이 참고할 수 있음:

- `mvp.html` — V1 functional prototype (warm paper aesthetic). 흐름과 동작 검증용. 디자인은 무시 가능.
- `index.html` — V1-α 통합 vision prototype. 장기 reference (다른 에이전트가 통합되는 모습 미리보기).
- `design-preview.html` — Cinema Evening 디자인 시도. **Being Myself 디자인 따라가니 이건 무시 OK.**
- `DESIGN.md` — Cinema Evening 디자인 시스템. **무시 OK.**
- (이 문서) `HANDOFF-TO-BEING-MYSELF.md` — 기능 스펙

---

## 13. Single Sentence Summary

> 매일 저녁 사용자가 퇴근 보고를 paste하면, AI가 그날의 일을 *기여 흐름* (OKR 직접 매핑 + OKR 밖 회사 기여 번역 + AI도 모르는 Open question)으로 묶어 보여주고, 사용자는 그 위에서 일기를 쓴다. 답변은 본인만 본다.

---

**STATUS**: handoff-ready. Being Myself 세션에 그대로 전달 가능.
**연락**: 결정해야 할 open questions (§9)는 Being Myself IA 결정 후 자연스럽게 풀림.
