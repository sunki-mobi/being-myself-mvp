/**
 * Being Myself — Q2 큐레이션 질문 풀.
 *
 * docs/research/being-myself-questions.md (v1.1) 원본을 TypeScript 데이터로
 * 옮긴 것. Q2 generate 시 server에서 본인이 받은 question_id list를 제외하고
 * filter한 풀을 LLM에 전달 → LLM이 1개 선택 + reaction + 사용자 표현 미세
 * 변형.
 *
 * 영구 중복 차단 — 사용자가 한 번 받은 질문은 다시 안 나옴.
 * 다 소진되면 풀 확장 필요 (사용자 작업 숙제).
 *
 * 4축 tag 시스템:
 * - areas: 영역 (멀티)
 * - time: 시간 (단일)
 * - depth: 깊이 (단일)
 * - journey: 여정 단계 (멀티)
 */

export type AreaTag =
  | "정체성"
  | "강점"
  | "가치관"
  | "소명"
  | "관계"
  | "역경"
  | "일상";

export type TimeTag = "과거" | "현재" | "미래";
export type DepthTag = "가벼움" | "중간" | "깊음";
export type JourneyTag = "방황" | "발견" | "검증" | "실현" | "공통";

/** 카테고리 번호 — 영역 분류 (1-8) */
export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const CATEGORY_NAMES: Record<CategoryId, string> = {
  1: "일상",
  2: "정체성",
  3: "강점",
  4: "가치관",
  5: "소명",
  6: "미래·가능성",
  7: "관계",
  8: "역경",
};

export type Question = {
  id: string;
  category: CategoryId;
  text: string;
  areas: AreaTag[];
  time: TimeTag;
  depth: DepthTag;
  journey: JourneyTag[];
};

export const QUESTION_POOL: Question[] = [
  // ══════════════════════════════════════════════
  // 카테고리 1 — 일상 (낯선 각도)
  // ══════════════════════════════════════════════
  // 1-A. 역방향 관찰
  {
    id: "Q001",
    category: 1,
    text: "최근에 하려다가 결국 안 한 것 중에 기억에 남는 게 있나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q002",
    category: 1,
    text: "요즘 왠지 피하고 있는 게 있나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q003",
    category: 1,
    text: "별로라고 생각했는데 의외로 좋았던 경험이 있나요?",
    areas: ["일상"],
    time: "과거",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q004",
    category: 1,
    text: "최근에 \"이건 내 스타일 아닌데\"라고 느낀 순간이 있나요?",
    areas: ["일상", "정체성"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  // 1-B. 반복 신호 포착
  {
    id: "Q005",
    category: 1,
    text: "요즘 자꾸 눈이 가는 주제나 분야가 있나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q006",
    category: 1,
    text: "최근에 두 번 이상 찾아본 영상이나 글이 있나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q007",
    category: 1,
    text: "요즘 자꾸 사게 되거나 모으게 되는 게 있나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q008",
    category: 1,
    text: "최근에 누군가한테 한 번 이상 얘기한 주제가 있나요?",
    areas: ["일상", "강점"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  // 1-C. 감각과 장소
  {
    id: "Q009",
    category: 1,
    text: "요즘 자주 가게 되는 장소가 있나요? 왜 그곳이 편한 것 같나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q010",
    category: 1,
    text: "오늘 몸이 가장 편안했던 순간이 있었나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q011",
    category: 1,
    text: "최근에 \"여기 오래 있고 싶다\"는 생각이 든 공간이 있나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  // 1-D. 타인 반응 관찰
  {
    id: "Q012",
    category: 1,
    text: "누군가랑 얘기하다가 내가 더 신나진 적이 최근에 있나요?",
    areas: ["일상", "강점"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q013",
    category: 1,
    text: "최근에 내 말이나 행동이 예상 밖의 반응을 불러온 적 있나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q014",
    category: 1,
    text: "요즘 나를 보고 놀라는 사람이 있나요? 어떤 면에서요?",
    areas: ["일상", "정체성"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 2 — 정체성
  // ══════════════════════════════════════════════
  // 2-A. 진짜 나의 순간
  {
    id: "Q015",
    category: 2,
    text: "어떤 상황에서 \"이게 진짜 나다\"라는 느낌이 드나요?",
    areas: ["정체성"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q016",
    category: 2,
    text: "가장 자연스러운 내 모습이 나오는 곳은 어디인가요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q017",
    category: 2,
    text: "아무도 안 볼 때 혼자 하게 되는 것이 있나요?",
    areas: ["정체성"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q018",
    category: 2,
    text: "\"나답지 않다\"는 느낌이 드는 상황은 언제인가요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  // 2-B. 패턴 발견
  {
    id: "Q019",
    category: 2,
    text: "어린 시절부터 지금까지 꾸준히 좋아하는 것이 있나요?",
    areas: ["정체성"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q020",
    category: 2,
    text: "살면서 여러 번 비슷한 역할을 맡게 된 것이 있나요?",
    areas: ["정체성"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q021",
    category: 2,
    text: "어떤 상황에서 화가 나거나 에너지가 떨어지나요? 공통점이 있나요?",
    areas: ["정체성"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q022",
    category: 2,
    text: "주변 사람들이 나에게 자주 하는 말 중에 공통된 것이 있나요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  // 2-C. 가면과 진짜
  {
    id: "Q023",
    category: 2,
    text: "지금 쓰고 있는 '가면'이 있다면 — 그 가면이 지키려는 것은 뭔가요?",
    areas: ["정체성"],
    time: "현재",
    depth: "깊음",
    journey: ["방황", "발견"],
  },
  {
    id: "Q024",
    category: 2,
    text: "타인의 기대와 내가 원하는 것이 다를 때 어떻게 하나요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q025",
    category: 2,
    text: "지금의 내 모습 중 가장 자신 있는 면과 가장 불편한 면은 뭔가요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q026",
    category: 2,
    text: "10년 전의 나와 지금의 나 — 가장 달라진 것은 뭔가요?",
    areas: ["정체성"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  // 2-D. 타인의 시선
  {
    id: "Q027",
    category: 2,
    text: "가장 신뢰하는 사람이 나를 세 단어로 표현한다면 뭐라고 할까요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q028",
    category: 2,
    text: "나를 처음 만난 사람이 나에 대해 가장 먼저 알아채는 것은 뭘까요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q029",
    category: 2,
    text: "내가 없을 때 사람들이 나를 어떻게 기억해줬으면 하나요?",
    areas: ["정체성"],
    time: "미래",
    depth: "깊음",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 3 — 강점
  // ══════════════════════════════════════════════
  // 3-A. 에너지 포착
  {
    id: "Q030",
    category: 3,
    text: "어떤 일을 할 때 시간이 가장 빨리 가나요?",
    areas: ["강점"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q031",
    category: 3,
    text: "힘든 상황에서도 계속하게 되는 것이 있나요? 뭐가 그렇게 만드나요?",
    areas: ["강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q032",
    category: 3,
    text: "에너지가 없을 때도 이것만큼은 할 수 있다 싶은 게 있나요?",
    areas: ["강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q033",
    category: 3,
    text: "어떤 일을 마쳤을 때 뿌듯함보다 아쉬움이 남는 것이 있나요?",
    areas: ["강점"],
    time: "과거",
    depth: "가벼움",
    journey: ["공통"],
  },
  // 3-B. 자연스러운 역량
  {
    id: "Q034",
    category: 3,
    text: "타인이 어려워하는데 나는 자연스럽게 되는 것이 있나요?",
    areas: ["강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q035",
    category: 3,
    text: "누군가에게 가장 자주 도움을 요청받는 것은 무엇인가요?",
    areas: ["강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q036",
    category: 3,
    text: "\"어떻게 그렇게 잘해요?\"라는 말을 들어본 적 있나요? 어떤 일에서요?",
    areas: ["강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q037",
    category: 3,
    text: "처음 해보는 일인데 금방 잘 됐던 경험이 있나요?",
    areas: ["강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  // 3-C. 최고의 순간
  {
    id: "Q038",
    category: 3,
    text: "지금까지 가장 자랑스러웠던 순간을 떠올려보세요. 그때 무엇이 작동하고 있었나요?",
    areas: ["강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q039",
    category: 3,
    text: "내 인생에서 가장 잘한 결정이 있다면요? 그 결정에서 어떤 강점을 썼나요?",
    areas: ["강점"],
    time: "과거",
    depth: "깊음",
    journey: ["공통"],
  },
  {
    id: "Q040",
    category: 3,
    text: "팀이나 관계에서 내가 가장 빛났던 순간은 언제인가요?",
    areas: ["강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  // 3-D. 강점과 일의 연결
  {
    id: "Q041",
    category: 3,
    text: "지금 하는 일에서 내가 가장 잘하는 부분은 어디인가요?",
    areas: ["강점"],
    time: "현재",
    depth: "중간",
    journey: ["검증", "실현"],
  },
  {
    id: "Q042",
    category: 3,
    text: "지금 하는 일에서 나만 할 수 있다고 느끼는 부분이 있나요?",
    areas: ["강점"],
    time: "현재",
    depth: "중간",
    journey: ["검증", "실현"],
  },
  {
    id: "Q043",
    category: 3,
    text: "이 강점을 지금보다 더 많이 쓸 수 있다면 무엇이 달라질까요?",
    areas: ["강점"],
    time: "미래",
    depth: "중간",
    journey: ["검증", "실현"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 4 — 가치관
  // ══════════════════════════════════════════════
  // 4-A. 선택의 기준
  {
    id: "Q044",
    category: 4,
    text: "살면서 가장 후회 없는 결정이 있다면요? 그때 무엇을 따랐나요?",
    areas: ["가치관"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q045",
    category: 4,
    text: "\"이건 아니다\"라는 느낌이 즉각적으로 든 순간이 있나요? 어떤 상황이었나요?",
    areas: ["가치관"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q046",
    category: 4,
    text: "타인의 의견에도 흔들리지 않았던 결정이 있나요? 뭐가 그렇게 만들었나요?",
    areas: ["가치관"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  // 4-B. 가치관과 현실의 간극
  {
    id: "Q047",
    category: 4,
    text: "지금 가장 많은 시간을 쓰는 것과 가장 중요하다고 느끼는 것이 일치하나요?",
    areas: ["가치관"],
    time: "현재",
    depth: "중간",
    journey: ["검증"],
  },
  {
    id: "Q048",
    category: 4,
    text: "지금 생활에서 \"이건 내 가치관과 맞지 않는데\"라고 느끼는 부분이 있나요?",
    areas: ["가치관"],
    time: "현재",
    depth: "깊음",
    journey: ["방황", "발견"],
  },
  {
    id: "Q049",
    category: 4,
    text: "최근에 마음이 불편했던 결정이 있나요? 무엇이 불편하게 만들었나요?",
    areas: ["가치관"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  // 4-C. 가치관 심화
  {
    id: "Q050",
    category: 4,
    text: "당신에게 '자유'가 중요하다면 — 자유가 없을 때 무엇이 사라지는 느낌인가요?",
    areas: ["가치관"],
    time: "현재",
    depth: "깊음",
    journey: ["공통"],
  },
  {
    id: "Q051",
    category: 4,
    text: "인생에서 절대 타협하지 않을 것이 있다면 뭔가요?",
    areas: ["가치관"],
    time: "현재",
    depth: "깊음",
    journey: ["공통"],
  },
  {
    id: "Q052",
    category: 4,
    text: "어떤 환경에서 가장 나답게 일할 수 있나요?",
    areas: ["가치관"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q053",
    category: 4,
    text: "돈, 시간, 관계 중 지금 가장 아깝다고 느끼는 것은 뭔가요?",
    areas: ["가치관"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 5 — 소명 탐색
  // ══════════════════════════════════════════════
  // 5-A. 끌림과 두려움
  {
    id: "Q054",
    category: 5,
    text: "지금 하는 일 중에 \"해야 해서\" 하는 것과 \"하고 싶어서\" 하는 것을 나눠본다면 어떤가요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["방황", "발견"],
  },
  {
    id: "Q055",
    category: 5,
    text: "요즘 가장 끌리는 것은 뭔가요? 그 끌림이 어디서 오는 것 같나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q056",
    category: 5,
    text: "두렵지만 계속 마음에 걸리는 것이 있나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["방황", "발견"],
  },
  {
    id: "Q057",
    category: 5,
    text: "지금 하는 일을 \"왜 하는가\"라고 스스로에게 물으면 어떤 답이 나오나요?",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["검증"],
  },
  // 5-B. 의미와 기여
  {
    id: "Q058",
    category: 5,
    text: "내 일이 누군가에게 실제로 도움이 됐다고 느낀 순간이 있나요?",
    areas: ["소명"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q059",
    category: 5,
    text: "어떤 문제가 해결되면 세상이 조금이라도 나아진다고 느끼나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["방황", "발견"],
  },
  {
    id: "Q060",
    category: 5,
    text: "타인에게 가장 자주 해주는 것이 있다면요? 그게 왜 자연스럽게 나오는 것 같나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q061",
    category: 5,
    text: "아무 대가 없이도 계속 하고 싶은 것이 있나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["방황", "발견"],
  },
  // 5-C. 소명 인식
  {
    id: "Q062",
    category: 5,
    text: "\"이걸 하기 위해 여기 있구나\"라는 느낌이 든 적 있나요?",
    areas: ["소명"],
    time: "과거",
    depth: "중간",
    journey: ["발견"],
  },
  {
    id: "Q063",
    category: 5,
    text: "어떤 일을 할 때 시간 가는 줄 모르고 완전히 빠져드나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["발견"],
  },
  {
    id: "Q064",
    category: 5,
    text: "지금 하는 일에서 가장 의미 있다고 느끼는 순간은 언제인가요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["검증", "실현"],
  },
  {
    id: "Q065",
    category: 5,
    text: "이 일을 계속 해야 하는 이유가 뭔가요? 솔직하게요.",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["검증"],
  },
  // 5-D. 소명 검증
  {
    id: "Q066",
    category: 5,
    text: "지금 가는 방향이 맞는지 어떻게 알 수 있을까요?",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["검증"],
  },
  {
    id: "Q067",
    category: 5,
    text: "지금의 일이 5년 후에도 의미 있을 것 같나요?",
    areas: ["소명"],
    time: "미래",
    depth: "중간",
    journey: ["검증"],
  },
  {
    id: "Q068",
    category: 5,
    text: "지금 하는 일에서 가장 살아있다고 느끼는 순간과 가장 공허한 순간은요?",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["검증"],
  },
  {
    id: "Q069",
    category: 5,
    text: "지금 가는 방향이 끌림에서 오는 건가요, 두려움에서 오는 건가요?",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["검증"],
  },
  // 5-E. 소명 실현
  {
    id: "Q070",
    category: 5,
    text: "오늘 하루 중 소명과 가장 가까웠던 순간은 언제인가요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["실현"],
  },
  {
    id: "Q071",
    category: 5,
    text: "지금 하는 일이 당신이 원하는 방식으로 세상에 기여하고 있나요?",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["실현"],
  },
  {
    id: "Q072",
    category: 5,
    text: "소명대로 살고 있다고 느낄 때와 그렇지 않을 때의 차이는 무엇인가요?",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["실현"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 6 — 미래와 가능성
  // ══════════════════════════════════════════════
  // 6-A. 미래 상상
  {
    id: "Q073",
    category: 6,
    text: "5년 후 가장 바라는 하루는 어떤 모습인가요?",
    areas: ["정체성", "소명"],
    time: "미래",
    depth: "깊음",
    journey: ["방황", "발견"],
  },
  {
    id: "Q074",
    category: 6,
    text: "지금보다 더 나다운 삶이 있다면 어떤 모습일까요?",
    areas: ["정체성"],
    time: "미래",
    depth: "중간",
    journey: ["방황", "발견"],
  },
  {
    id: "Q075",
    category: 6,
    text: "실패가 없다면 지금 당장 해보고 싶은 것이 있나요?",
    areas: ["소명"],
    time: "미래",
    depth: "중간",
    journey: ["방황", "발견"],
  },
  {
    id: "Q076",
    category: 6,
    text: "10년 후의 내가 지금의 나에게 해줄 말이 있다면 뭘까요?",
    areas: ["정체성", "소명"],
    time: "미래",
    depth: "깊음",
    journey: ["공통"],
  },
  // 6-B. 가능성 재프레이밍
  {
    id: "Q077",
    category: 6,
    text: "지금 가장 어려운 것이 오히려 강점이 될 수 있다면 어떤 방식으로 가능할까요?",
    areas: ["강점", "소명"],
    time: "미래",
    depth: "깊음",
    journey: ["공통"],
  },
  {
    id: "Q078",
    category: 6,
    text: "지금까지의 경험이 모두 의미 있었다면 — 어떤 이야기가 만들어지나요?",
    areas: ["정체성", "소명"],
    time: "과거",
    depth: "깊음",
    journey: ["공통"],
  },
  {
    id: "Q079",
    category: 6,
    text: "지금 멈춰있다면 — 무엇이 다음 걸음을 방해하고 있나요?",
    areas: ["소명"],
    time: "현재",
    depth: "깊음",
    journey: ["방황"],
  },
  // 6-C. 오디세이 플랜
  {
    id: "Q080",
    category: 6,
    text: "지금 가는 길 말고 전혀 다른 삶이 있다면 어떤 모습일까요?",
    areas: ["소명"],
    time: "미래",
    depth: "깊음",
    journey: ["방황", "발견"],
  },
  {
    id: "Q081",
    category: 6,
    text: "지금의 일을 하지 않는다면 무엇을 하고 있을까요?",
    areas: ["소명", "강점"],
    time: "미래",
    depth: "중간",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 1 추가 — 일상
  // ══════════════════════════════════════════════
  // 1-E. 시간과 선택
  {
    id: "Q082",
    category: 1,
    text: "최근에 예상보다 훨씬 오래 한 것이 있나요?",
    areas: ["일상", "강점"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q083",
    category: 1,
    text: "오늘 하루 중 가장 집중이 잘 됐던 시간대는 언제인가요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q084",
    category: 1,
    text: "요즘 \"이건 꼭 해야겠다\"고 미루지 않고 하게 되는 게 있나요?",
    areas: ["일상", "소명"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q085",
    category: 1,
    text: "최근에 아무것도 안 하고 싶었던 순간이 있었나요? 그때 뭘 하게 됐나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  // 1-F. 소비와 취향
  {
    id: "Q086",
    category: 1,
    text: "최근에 돈이 아깝지 않았던 소비가 있나요?",
    areas: ["일상", "가치관"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q087",
    category: 1,
    text: "요즘 꽂혀 있는 콘텐츠(책, 영상, 음악 등)가 있나요? 왜 그게 끌리는 것 같나요?",
    areas: ["일상", "정체성"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q088",
    category: 1,
    text: "누군가에게 꼭 추천하고 싶은 게 최근에 생겼나요?",
    areas: ["일상"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 2 추가 — 정체성
  // ══════════════════════════════════════════════
  // 2-E. 에너지와 컨디션
  {
    id: "Q089",
    category: 2,
    text: "어떤 하루를 보냈을 때 잠들기 전 가장 만족스러운가요?",
    areas: ["정체성", "가치관"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q090",
    category: 2,
    text: "에너지가 가장 넘치는 상태일 때 주로 무엇을 하고 있나요?",
    areas: ["정체성", "강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q091",
    category: 2,
    text: "어떤 환경에 있을 때 가장 예민해지나요? 그 이유가 뭘까요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  // 2-F. 생각과 표현 방식
  {
    id: "Q092",
    category: 2,
    text: "무언가를 이해할 때 어떤 방식이 가장 잘 맞나요? (직접 해보기, 읽기, 대화하기 등)",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q093",
    category: 2,
    text: "내 생각이 가장 잘 정리되는 순간은 언제인가요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q094",
    category: 2,
    text: "말로 표현하기 어렵지만 오래 마음에 남는 것이 있나요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q095",
    category: 2,
    text: "나는 어떤 질문을 받을 때 가장 오래 생각하게 되나요?",
    areas: ["정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 3 추가 — 강점
  // ══════════════════════════════════════════════
  // 3-E. 배움과 성장
  {
    id: "Q096",
    category: 3,
    text: "가장 빠르게 배웠던 분야나 기술이 있나요? 왜 그게 빨리 됐을까요?",
    areas: ["강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q097",
    category: 3,
    text: "실력이 늘고 있다는 걸 느낄 때 어떤 신호가 오나요?",
    areas: ["강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q098",
    category: 3,
    text: "누군가를 도왔을 때 가장 보람을 느끼는 방식은 무엇인가요?",
    areas: ["강점", "소명"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  // 3-F. 강점의 그림자
  {
    id: "Q099",
    category: 3,
    text: "내 장점이 때로 단점이 되는 상황이 있나요?",
    areas: ["강점", "정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q100",
    category: 3,
    text: "잘한다는 이유로 정작 원하지 않는 역할을 맡게 된 적 있나요?",
    areas: ["강점", "가치관"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 4 추가 — 가치관
  // ══════════════════════════════════════════════
  // 4-D. 돈과 일의 관계
  {
    id: "Q101",
    category: 4,
    text: "일이 주는 것 중에 돈보다 더 중요하게 느끼는 것이 있나요?",
    areas: ["가치관", "소명"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q102",
    category: 4,
    text: "어떤 일이라면 돈이 조금 적어도 괜찮다고 느껴지나요?",
    areas: ["가치관", "소명"],
    time: "현재",
    depth: "중간",
    journey: ["방황", "발견"],
  },
  {
    id: "Q103",
    category: 4,
    text: "지금 하는 일에서 경제적 보상 외에 얻는 것이 있다면요?",
    areas: ["가치관", "소명"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  // 4-E. 경계와 거절
  {
    id: "Q104",
    category: 4,
    text: "최근에 거절했던 것 중에 잘했다고 느끼는 것이 있나요?",
    areas: ["가치관"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q105",
    category: 4,
    text: "어떤 요청은 거절하기 어렵고 어떤 요청은 쉽게 거절되나요? 차이가 뭔가요?",
    areas: ["가치관", "정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q106",
    category: 4,
    text: "\"이건 내가 해야 하는 일이 아니다\"라고 느낀 순간이 있나요?",
    areas: ["가치관", "소명"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 5 추가 — 소명
  // ══════════════════════════════════════════════
  // 5-F. 소명의 일상화
  {
    id: "Q107",
    category: 5,
    text: "오늘 하루 중 \"이런 순간을 위해 일하는구나\"라는 생각이 든 때가 있나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["실현"],
  },
  {
    id: "Q108",
    category: 5,
    text: "지금 하는 일에서 아무도 시키지 않아도 더 하게 되는 것이 있나요?",
    areas: ["소명", "강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q109",
    category: 5,
    text: "지금 하는 일 중에 없어지면 아쉬울 것 같은 부분은 어떤 건가요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["검증", "실현"],
  },
  {
    id: "Q110",
    category: 5,
    text: "일하면서 가장 자주 \"왜 이게 중요한가\"를 떠올리게 되는 순간은 언제인가요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["검증"],
  },
  // 5-G. 소명과 환경
  {
    id: "Q111",
    category: 5,
    text: "어떤 환경에 있을 때 내 일이 가장 의미 있게 느껴지나요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q112",
    category: 5,
    text: "지금 소명을 향해 가는 데 가장 도움이 되는 것은 무엇인가요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["검증", "실현"],
  },
  {
    id: "Q113",
    category: 5,
    text: "반대로 가장 방해가 되는 것은 무엇인가요?",
    areas: ["소명"],
    time: "현재",
    depth: "중간",
    journey: ["검증"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 6 추가 — 미래와 가능성
  // ══════════════════════════════════════════════
  // 6-D. 작은 실험
  {
    id: "Q114",
    category: 6,
    text: "지금 당장 작게 실험해볼 수 있는 것이 있나요?",
    areas: ["소명", "강점"],
    time: "미래",
    depth: "중간",
    journey: ["발견", "검증"],
  },
  {
    id: "Q115",
    category: 6,
    text: "요즘 \"한번 해볼까\" 하고 생각만 하고 있는 것이 있나요?",
    areas: ["소명"],
    time: "미래",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q116",
    category: 6,
    text: "완벽하지 않아도 지금 시작할 수 있는 것이 있다면요?",
    areas: ["소명"],
    time: "미래",
    depth: "중간",
    journey: ["방황", "발견"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 7 — 관계
  // ══════════════════════════════════════════════
  // 7-A. 나를 드러내는 관계
  {
    id: "Q117",
    category: 7,
    text: "어떤 사람과 함께할 때 가장 에너지가 올라가나요?",
    areas: ["관계", "정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q118",
    category: 7,
    text: "대화 후에 충전된 느낌이 드는 사람이 있나요? 그 사람과 무엇을 이야기하나요?",
    areas: ["관계", "정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q119",
    category: 7,
    text: "반대로 어떤 관계에서 가장 소진되나요? 공통점이 있나요?",
    areas: ["관계", "가치관"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q120",
    category: 7,
    text: "가장 오래된 관계 중에 지금도 이어지는 것이 있다면요? 그 관계가 지속되는 이유가 뭘까요?",
    areas: ["관계", "정체성"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  // 7-B. 내가 하는 역할
  {
    id: "Q121",
    category: 7,
    text: "모임이나 팀에서 자연스럽게 맡게 되는 역할이 있나요?",
    areas: ["관계", "강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q122",
    category: 7,
    text: "누군가 힘들 때 나는 어떻게 반응하는 편인가요?",
    areas: ["관계", "정체성", "강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q123",
    category: 7,
    text: "내가 없으면 잘 안 되는 것이 관계나 팀에서 있나요?",
    areas: ["관계", "강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q124",
    category: 7,
    text: "나는 주로 받는 사람인가요, 주는 사람인가요? 그 패턴이 어디서 왔을까요?",
    areas: ["관계", "정체성"],
    time: "현재",
    depth: "깊음",
    journey: ["공통"],
  },
  // 7-C. 관계와 소명
  {
    id: "Q125",
    category: 7,
    text: "내가 존재해서 누군가의 삶이 달라졌다고 느낀 순간이 있나요?",
    areas: ["관계", "소명"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q126",
    category: 7,
    text: "어떤 사람을 보면 \"저 사람처럼 살고 싶다\"는 생각이 드나요? 어떤 점에서요?",
    areas: ["관계", "소명", "정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q127",
    category: 7,
    text: "내 주변에서 가장 소명대로 살고 있다고 느끼는 사람은 누구인가요? 어떤 모습에서 그게 보이나요?",
    areas: ["관계", "소명"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  // 7-D. 혼자와 함께
  {
    id: "Q128",
    category: 7,
    text: "혼자 있을 때 가장 자연스럽게 하는 것은 무엇인가요?",
    areas: ["관계", "정체성"],
    time: "현재",
    depth: "가벼움",
    journey: ["공통"],
  },
  {
    id: "Q129",
    category: 7,
    text: "혼자 결정할 때와 누군가와 함께 결정할 때, 더 잘 되는 영역이 따로 있나요?",
    areas: ["관계", "강점"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },

  // ══════════════════════════════════════════════
  // 카테고리 8 — 실패와 역경
  // ══════════════════════════════════════════════
  // 8-A. 실패에서 배운 것
  {
    id: "Q130",
    category: 8,
    text: "지금까지 가장 크게 실패했다고 느낀 경험이 있나요? 그때 무엇을 알게 됐나요?",
    areas: ["역경", "정체성"],
    time: "과거",
    depth: "깊음",
    journey: ["공통"],
  },
  {
    id: "Q131",
    category: 8,
    text: "잘 안 됐던 경험 중에 지금 생각하면 오히려 잘됐다 싶은 게 있나요?",
    areas: ["역경", "소명"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q132",
    category: 8,
    text: "실수나 실패 후에 나는 어떻게 회복하는 편인가요?",
    areas: ["역경", "정체성", "강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q133",
    category: 8,
    text: "그 실패가 없었다면 지금의 내가 달랐을까요? 어떤 방식으로요?",
    areas: ["역경", "정체성"],
    time: "과거",
    depth: "깊음",
    journey: ["공통"],
  },
  // 8-B. 힘든 순간의 나
  {
    id: "Q134",
    category: 8,
    text: "가장 힘들었던 시기에 나를 버티게 한 것은 무엇이었나요?",
    areas: ["역경", "강점", "가치관"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q135",
    category: 8,
    text: "힘들 때 가장 먼저 찾게 되는 것이 있나요? 사람, 장소, 활동 등",
    areas: ["역경", "정체성"],
    time: "현재",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q136",
    category: 8,
    text: "어려운 상황에서 나도 몰랐던 내 강점이 드러난 적 있나요?",
    areas: ["역경", "강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  // 8-C. 포기와 지속
  {
    id: "Q137",
    category: 8,
    text: "힘들어도 포기하지 않았던 것이 있나요? 무엇이 계속하게 했나요?",
    areas: ["역경", "소명", "강점"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q138",
    category: 8,
    text: "반대로 포기하고 나서 오히려 홀가분했던 것이 있나요?",
    areas: ["역경", "가치관"],
    time: "과거",
    depth: "중간",
    journey: ["공통"],
  },
  {
    id: "Q139",
    category: 8,
    text: "지금 힘든 것이 있다면 — 그게 성장통인지 잘못된 방향인지 어떻게 구분하나요?",
    areas: ["역경", "소명"],
    time: "현재",
    depth: "깊음",
    journey: ["검증"],
  },
];

/**
 * Recency dedup window — 최근 N개 received question_id 안에 든 질문만 차단.
 * N=60: 매일 1 Q2 페이스 가정 시 약 2달 간격으로 재등장. 풀 139에서 가용
 * 후보 ~79개라 변주 충분.
 *
 * 영구 차단(N=∞)은 풀 소진 시 막다른 골목이라 cooldown 모델로 전환.
 * 풀이 커지면 비율 유지하며 같이 키우면 됨.
 */
export const RECENT_DEDUP_WINDOW = 60;

/**
 * 사용자가 최근 N개 turn 안에 받은 question_id 제외 후 풀 반환.
 * Set는 chat route에서 `qa_pair.created_at desc limit N`으로 만들어 전달.
 */
export function filterUnused(recentUsedIds: Set<string>): Question[] {
  return QUESTION_POOL.filter((q) => !recentUsedIds.has(q.id));
}

/**
 * 사용자 컨텍스트 기반 score — 여정 단계·깊이·영역 가중치.
 * 높은 점수 순으로 정렬해 상위 N개를 LLM에 전달.
 *
 * V1은 단순 — 여정 단계 매칭 + 직전 Q1 영역 제외만.
 * 추후 사용자 누적 패턴 학습으로 확장 가능.
 */
export function scoreQuestion(
  q: Question,
  ctx: {
    /** 사용자 현재 여정 단계 추정 (V1은 공통 fallback) */
    journey?: JourneyTag;
    /** 직전 Q1이 다룬 영역 — 같은 영역 점수 down */
    q1Areas?: AreaTag[];
    /** 직전 Q1의 깊이 — 비슷한 깊이 권장 */
    q1Depth?: DepthTag;
  },
): number {
  let score = 1;

  // 여정 매칭 +2 (공통 +1)
  if (ctx.journey) {
    if (q.journey.includes(ctx.journey)) score += 2;
    else if (q.journey.includes("공통")) score += 1;
  } else {
    if (q.journey.includes("공통")) score += 1;
  }

  // 직전 Q1과 같은 영역 -1 (Q1·Q2 영역 분리 유도)
  if (ctx.q1Areas && ctx.q1Areas.length > 0) {
    const overlap = q.areas.some((a) => ctx.q1Areas!.includes(a));
    if (overlap) score -= 1;
  }

  // 깊이 매칭 약하게
  if (ctx.q1Depth) {
    if (q.depth === ctx.q1Depth) score += 0.5;
  }

  return score;
}
