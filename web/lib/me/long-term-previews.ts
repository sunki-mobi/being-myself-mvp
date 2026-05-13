/**
 * 페르소나별 6개월 누적 보고서 hardcoded preview.
 *
 * 박람회 게스트가 /demo/report/full 진입 시 보는 "이 사람이 6개월 누적되면
 * 이런 모습입니다" 시연 양식. 본문은 데모 페르소나 Q1·Q2 답변(personas.ts의
 * suggestedAnswers)을 시드로 가상의 누적 답변을 펼친 시안.
 *
 * /me 트랙에서는 박람회 후 사용자 누적 답변에서 합성. 같은 `LongTermReport`
 * 타입 공유.
 *
 * Design doc: skpan-master-design-20260510-191649.md
 */

import type { BaselineId } from "./baselines";
import type { LongTermReport } from "./long-term-report";

const minister: LongTermReport = {
  userName: "최병호",
  headline: "한 구절을 길게 묵상하고 한 사람의 마음을 길게 듣는 일",
  keywords: [
    "묵상",
    "경청",
    "한 구절",
    "한 사람",
    "공동체",
    "오래 머물기",
    "인내",
  ],
  totalAnswers: 247,
  daySpan: 180,
  layers: [
    {
      layer: "현상",
      friendlyTitle: "나의 일상",
      summary:
        "최병호 목사님의 하루는 새벽 묵상에서 시작해 심방 자리에서 마무리돼요. 주일 설교 본문 한 구절에 며칠을 머물고, 교인 한 사람 앞에서 한 시간을 머물러요. 빠르게 결론 내리지 않고 오래 머무는 호흡이 일상이에요.",
      quotes: [
        {
          day: 12,
          text: "주일 설교 본문을 묵상하다가 한 구절에 깊이 들어갔을 때 시간 가는 줄 몰랐어요",
        },
        {
          day: 47,
          text: "예배 인도 후 함께 기도하던 한 성도의 표정에서 회복이 보였을 때",
        },
      ],
      keywords: ["묵상", "심방", "오래 머물기"],
    },
    {
      layer: "본질",
      friendlyTitle: "나를 움직이는 것",
      summary:
        "목사님이 자연스럽게 잘하는 일은 '오래 머무는 것'이에요. 한 구절에 며칠을 머물고, 한 사람 앞에서 끝까지 기다려요. 빠른 답을 주려고 하지 않으니 오히려 사람들이 자기 마음을 다 풀어놓게 돼요. 그게 사역의 깊이를 만들어요.",
      quotes: [
        {
          day: 28,
          text: "한 사람을 만나면 그분이 다 풀어놓을 때까지 기다리는 게 자연스러워요",
        },
        {
          day: 89,
          text: "한 구절을 며칠씩 묵상하다 보면 처음에는 안 보이던 의미가 보여요",
        },
      ],
      keywords: ["기다림", "깊이"],
    },
    {
      layer: "가치",
      friendlyTitle: "나에게 소중한 것",
      summary:
        "가장 소중히 여기는 건 '한 사람이 진짜로 변하는 시간'이에요. 백 명에게 멋진 설교보다 한 사람에게 진짜 닿는 한 마디. 빠른 성장보다 깊은 변화. 공동체가 한 사람씩 진짜로 자라가는 걸음을 가장 귀하게 여겨요.",
      quotes: [
        {
          day: 56,
          text: "교인 한 명이 진짜로 변할 수 있도록 길게 함께 가는 시간이 가장 귀해요",
        },
        {
          day: 142,
          text: "설교가 멋있는 것보다 한 사람이라도 진짜로 들었으면 좋겠어요",
        },
      ],
      keywords: ["한 사람", "진정성", "길게 함께"],
    },
    {
      layer: "존재",
      friendlyTitle: "되고 싶은 나의 모습",
      summary:
        "되고 싶은 모습은 '끝까지 듣는 목자'예요. 빠른 답을 주는 사람이 아니라 한 사람의 마음이 다 풀릴 때까지 곁에 있는 사람. 그 시간 자체가 누군가의 인생에 흔적이 되는 자리. 6개월 답변에서 그 자리로 한 걸음씩 가고 계셨어요.",
      quotes: [
        {
          day: 95,
          text: "급하게 답하지 않고 끝까지 듣는 사람이 되고 싶어요",
        },
        {
          day: 178,
          text: "교회가 다 흩어진 뒤에도 누군가 '그 시간이 인생을 바꿨다'고 기억해줬으면 해요",
        },
      ],
      keywords: ["끝까지 듣는", "곁에 있는 목자"],
    },
  ],
};

const worker: LongTermReport = {
  userName: "정다은",
  headline: "일 안에서 사람의 마음을 읽고 잇는 일",
  keywords: [
    "통찰",
    "공감",
    "마음 읽기",
    "사람과 일이 함께",
    "차분한 관점",
    "표정 알아채기",
    "사람을 놓치지 않는",
  ],
  totalAnswers: 247,
  daySpan: 180,
  layers: [
    {
      layer: "현상",
      friendlyTitle: "나의 일상",
      summary:
        "다은님의 하루는 두 흐름이 함께 흘러요. 회의실의 일, 그리고 퇴근 후 좋아하는 일에 푹 빠지는 자기만의 시간. 그 사이에 동료가 '다은님은 어떻게 보세요?'라고 자연스레 묻는 순간들이 있어요. 일과 사람이 따로 가지 않아요.",
      quotes: [
        {
          day: 12,
          text: "퇴근 후 좋아하는 일을 하다 보니 시간이 훌쩍 지났어요",
        },
        {
          day: 47,
          text: "회의가 막혔을 때 '다은님은 어떻게 보세요?'라고 물어왔던 순간",
        },
      ],
      keywords: ["자기 시간", "차분한 관점"],
    },
    {
      layer: "본질",
      friendlyTitle: "나를 움직이는 것",
      summary:
        "다은님이 자연스럽게 잘하는 건 '말로 안 한 것을 알아채는 일'이에요. 동료 표정 한 번에, 회의 분위기 한 번에 무엇이 막혔는지 보여요. 그래서 사람들이 다은님 앞에서는 자연스럽게 마음을 풀어놓게 돼요. 마음을 읽는 감각이 강점이에요.",
      quotes: [
        {
          day: 28,
          text: "동료가 말 안 해도 표정만 봐도 뭔가 있구나 알아져요",
        },
        {
          day: 89,
          text: "회의에서 의견이 부딪혀도 그 사람이 진짜 무엇 때문에 그러는지 보여요",
        },
      ],
      keywords: ["마음 읽기", "표정 알아채기"],
    },
    {
      layer: "가치",
      friendlyTitle: "나에게 소중한 것",
      summary:
        "가장 소중히 여기는 건 '일이 사람을 잃지 않는 자리'예요. 성과 숫자만 보는 회사가 아니라 한 사람 한 사람의 마음이 살아 있는 자리. 일과 사람이 따로 가지 않고 평일 책상 위에도 함께 흐르는 모습. 그게 6개월 답변 곳곳에 있었어요.",
      quotes: [
        {
          day: 56,
          text: "성과 숫자만 보는 게 아니라 사람을 보는 회사 안의 사람이고 싶어요",
        },
        {
          day: 142,
          text: "사람을 보는 시선이 회의실 밖에만 있는 게 아니라 책상 위에도 흐르면 좋겠어요",
        },
      ],
      keywords: ["사람 우선", "사람과 일이 함께"],
    },
    {
      layer: "존재",
      friendlyTitle: "되고 싶은 나의 모습",
      summary:
        "되고 싶은 모습은 '일이 사람을 잃지 않게 만드는 사람'이에요. 다은님이 있는 회의실, 다은님이 함께한 프로젝트가 한 사람의 마음이 살아 있는 자리가 되는 모습. 일과 사람이 하나로 흐르는 모습. 그 자리로 가까워지는 6개월이었어요.",
      quotes: [
        {
          day: 95,
          text: "일이 사람을 잃지 않게 만드는 사람이고 싶어요",
        },
        {
          day: 178,
          text: "일과 사람이 하나로 흐르는 사람이 되고 싶어요",
        },
      ],
      keywords: ["사람을 놓치지 않는", "마음을 잇는 사람"],
    },
  ],
};

const student: LongTermReport = {
  userName: "이준혁",
  headline: "내가 있으면 마음이 편해지는 자리를 만드는 일",
  keywords: [
    "친구",
    "게임",
    "듣기",
    "곁에 있기",
    "편안함",
    "탐색",
    "마음 편한 사이",
  ],
  totalAnswers: 247,
  daySpan: 180,
  layers: [
    {
      layer: "현상",
      friendlyTitle: "나의 일상",
      summary:
        "준혁님의 하루는 학교 쉬는 시간이 핵심이에요. 친구들과 게임하면서 시간 가는 줄 모르고, 친구가 힘들어 보이면 옆에 가서 앉아요. 그 두 가지가 하루를 채워요. 아직 진로는 탐색 중이지만 사람과 함께 있는 시간이 자연스러워요.",
      quotes: [
        {
          day: 12,
          text: "쉬는 시간에 친구들과 게임하다가 시간 가는 줄 몰랐을 때",
        },
        {
          day: 47,
          text: "친구가 '너랑 이야기하면 마음이 편해진다'고 말해준 순간",
        },
      ],
      keywords: ["친구", "게임"],
    },
    {
      layer: "본질",
      friendlyTitle: "나를 움직이는 것",
      summary:
        "준혁님이 자연스럽게 잘하는 건 '같이 있어주는 일'이에요. 뭐라고 해줘야 한다고 생각 안 하고 그냥 옆에 앉아요. 그래서 친구들이 자연스럽게 자기 이야기를 풀어놔요. 말보다 자리를 내어주는 게 강점이에요.",
      quotes: [
        {
          day: 28,
          text: "친구가 슬퍼 보이면 그냥 옆에 앉아 있게 돼요",
        },
        {
          day: 89,
          text: "꼭 뭐라 해야 한다고 생각 안 해요, 그냥 같이 있으면 되거든요",
        },
      ],
      keywords: ["같이 있기", "듣기"],
    },
    {
      layer: "가치",
      friendlyTitle: "나에게 소중한 것",
      summary:
        "가장 소중히 여기는 건 '마음 편한 친구 관계'예요. 겉으로만 친한 게 아니라 진짜 다 이야기할 수 있는 사이. 학교 안에서 '여기 있어도 괜찮다'고 느껴지는 자리. 6개월 답변에 그 모습이 계속 나왔어요.",
      quotes: [
        {
          day: 56,
          text: "친구들과 진짜로 친한 게 가장 좋아요",
        },
        {
          day: 142,
          text: "겉으로만 친한 거 말고 마음 편하게 다 이야기할 수 있는 사이가 좋아요",
        },
      ],
      keywords: ["진짜 친구", "마음 편한 사이"],
    },
    {
      layer: "존재",
      friendlyTitle: "되고 싶은 나의 모습",
      summary:
        "되고 싶은 모습은 '같이 있으면 마음이 편한 사람'이에요. 친구가 힘들 때 자연스레 떠오르는 사람. 어른이 되어도 그 모습이 변하지 않는 사람. 학교에서 시작된 그 자리가 6개월 답변에 자라고 있었어요.",
      quotes: [
        {
          day: 95,
          text: "내가 있으면 사람들이 편해지는 사람이 되고 싶어요",
        },
        {
          day: 178,
          text: "어른이 되어도 친구가 마음 풀고 이야기할 수 있는 사람이 됐으면 좋겠어요",
        },
      ],
      keywords: ["편한 자리", "곁에 있는 사람"],
    },
  ],
};

/**
 * BaselineId와 동일 키 사용 — 페르소나는 baseline + long-term 두 양식을 쌍으로
 * 가짐. skpan(/me)은 박람회 후 누적 합성에서 채워질 예정 — 지금은 미정의.
 */
type LongTermPreviewId = Exclude<BaselineId, "skpan">;

export const LONG_TERM_PREVIEWS: Record<LongTermPreviewId, LongTermReport> = {
  minister,
  worker,
  student,
};

/**
 * BaselineId로 LongTermReport 조회. skpan(/me 본인 시연) 진입 시에는 null —
 * 호출부에서 fallback 처리 (박람회 D-2엔 /demo만 이 함수 사용).
 */
export function getLongTermPreview(id: BaselineId): LongTermReport | null {
  if (id === "skpan") return null;
  return LONG_TERM_PREVIEWS[id];
}
