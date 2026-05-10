/**
 * /me 트랙의 baseline 셀프인터뷰 보고서.
 *
 * 박람회 부스에서 사용자(방선기)가 직접 시연하는 시나리오 — 본인의 셀프인터뷰
 * 보고서가 이미 채워진 상태로 보이고, 그 위에 "매일 추가되는 답변"이 시연되는
 * 흐름. Phase B에서는 사용자별 데이터를 서버에서 로드.
 *
 * 데이터 출처: 사용자 본인이 제공한 셀프인터뷰 보고서 PDF.
 */

export type BaselineItem = {
  title: string;
  description: string[];
};

export type BaselineInsight = {
  text: string;
  keywords: string[];
};

export type BaselineQuestion = {
  question: string;
  // 객관식 선행 질문이 있으면 (Q. 알고 있나요? → 알고 있어요)
  meta?: string;
  // 정리된 항목들 (제목 + 2-3문장 설명)
  items: BaselineItem[];
  // 💡 인사이트 카드
  insight: BaselineInsight;
  // 코치인터뷰 — 원본 raw 답변. 토글로 보임.
  coachInterview: string[];
};

export type BaselinePart = {
  partTitle: string;
  partTitleEn: string;
  preface: string; // Part 안내문 (예: "좋아하는 것은, 인생에서 가장 큰 기쁨을 주고...")
  examples: string[]; // 예시 항목들 (예: "친구의 고민 들어주기")
  closing: string; // Part 끝 격려문
  questions: BaselineQuestion[];
};

export type BaselineReport = {
  userName: string;
  headline: string; // "기쁜 마음으로 아침을 시작할 수 있게 만들어주는 것"
  intro: string;
  parts: BaselinePart[];
  closingNote?: string; // 코치인터뷰 소감
};

export const BASELINE_REPORT: BaselineReport = {
  userName: "방선기",
  headline: "기쁜 마음으로 아침을 시작할 수 있게 만들어주는 것",
  intro:
    "다른 사람이 아닌, 오직 나만이 느끼고 알 수 있는 일이죠. 나의 일을 '내가 좋아하고 잘하고 가치 있는 것'으로 세팅하는 작업은 철저히 내게 달려 있습니다. 셀프인터뷰를 통해, 내가 답한 내용을 세부적으로 살펴보며 다시 한 번 깊게 고민하고 질문해보는 시간이 되시길 바랍니다.",

  parts: [
    /* ─────────── Part 1 ─────────── */
    {
      partTitle: "좋아하는 것",
      partTitleEn: "I Love It",
      preface:
        "좋아하는 것은, 인생에서 가장 큰 기쁨을 주고 성취감을 느끼게 하는 일이나 경험을 말합니다.",
      examples: [
        "친구의 고민 들어주기",
        "아침에 일어나 운동하기",
        "숨은 맛집을 찾아 방문하기",
        "새로운 사람들과 이야기하기",
        "좋아하는 스포츠 선수 응원하기",
      ],
      closing:
        "내가 잘하는 것인지, 세상이 필요로 하는 것인지, 대가를 받을 수 있는 것인지에 대한 고민들은 지우고 오로지 내가 무엇을 좋아하는지에만 집중해 보세요.",
      questions: [
        {
          question: "내가 정말 좋아하는 것은 무엇인가요?",
          meta: "내가 정말 좋아하는 것이 무엇인지 알고 있나요? — 알고 있어요",
          items: [
            {
              title: "사람의 성장을 보는 것",
              description: [
                "나를 통해 누군가가 이전보다 조금이라도 나아지는 것을 볼 때 굉장한 행복감을 느껴요.",
              ],
            },
            {
              title: "마음이 맞는 사람과의 대화",
              description: [
                "마음이 맞는 사람과 함께 시간을 보내고, 어떤 것에 대해 같이 고민하며 이야기하는 게 너무나도 행복해요.",
              ],
            },
            {
              title: "스포츠 — 보는 것과 하는 것",
              description: [
                "야구는 보는 걸 좋아하는데, 특히 한화 팀이 좋은 성적을 거두거나 감동적인 순간들을 볼 때 굉장히 행복해요.",
                "볼링은 직접 하는 걸 좋아하는데, 잘하기 위한 방법을 찾고 적용하면서 점수가 잘 나지 않더라도 연습한 게 구현될 때 행복함을 느껴요.",
              ],
            },
            {
              title: "맛있는 음식, 새로운 것 학습",
              description: [
                "아내와 함께 맛있는 음식을 먹으면서 둘 다 맛있다고 느끼는 소소한 순간을 정말 좋아해요.",
                "새로운 것을 학습하고 깊게 파고드는 것도 좋아해요.",
              ],
            },
          ],
          insight: {
            text: "선기님의 즐거움의 중심에는 '성장'과 '연결'이 있어요. 타인의 성장을 보는 것, 마음 맞는 사람과 대화하는 것, 스포츠에서 직접 성장을 경험하는 것 모두 같은 맥락으로 이어져 있어요.",
            keywords: [
              "타인의 성장",
              "마음 맞는 대화",
              "야구",
              "볼링",
              "소소한 행복",
            ],
          },
          coachInterview: [
            "마음이 맞는 사람과의 대화에서 행복감을 많이 느낀다. 그 사람과 함께 시간을 보내면서 나의 성장도 느끼고 그 사람의 성장도 부수적으로 따라오겠지만, 대화하는 것 자체가 목적이 있기보다는 행복하다는 생각이 든다.",
            "마음이 맞는 사람이란 — 내가 갖고 있는 상식, 방향성, 중요한 가치들이 충돌되지 않는 사람. 그래서 '맞지 맞지' 이야기할 수 있는 사람. 거기에 존경할 만하고 배울 수 있는 사람이면 더 좋다.",
            "전혀 방향이 다른 사람도 존경할 수 있고 배울 수 있는 게 있는 경우엔 행복하게 대화를 이어 나간다.",
            "첫 번째로는 상식과 방향성, 중요한 가치들이 맞는 사람. 그러고 나서 나머지가 시너지가 나는 사람.",
          ],
        },
      ],
    },

    /* ─────────── Part 2 ─────────── */
    {
      partTitle: "잘하는 것",
      partTitleEn: "I Am Great at It",
      preface:
        "우리가 집중해 볼 '잘하는 것'은, 내가 배우고 노력해서 얻은 스킬이 아니라 남들보다 자연스럽게 잘하는 나의 강점을 말합니다.",
      examples: [
        "공감하는 것",
        "대중 앞에서 연설하는 것",
        "무엇인가를 만들어내는 것",
        "체계적으로 분석하는 것",
        "주의 깊게 관찰하는 것",
      ],
      closing:
        "내가 어릴 때부터 타고난 재능일 수도 있고, 의도하지 않았는데 어느 순간 꽃을 피운 능력일 수도 있습니다. 크고 작은 성공 경험을 떠올리며 내가 무엇을 잘하는지에만 집중해 보세요.",
      questions: [
        {
          question: "내가 잘하는 것은 무엇인가요?",
          meta: "내가 잘하는 것이 무엇인지 알고 있나요? — 알고 있어요",
          items: [
            {
              title: "한 사람에 집중하고 파악하는 것",
              description: [
                "한 사람에게 집중하는 법을 잘 알고, 그 사람이 어떤 생각을 가지고 무엇을 원하는지를 퍼즐처럼 맞춰가는 경향이 있어요.",
                "1대1 대화에서 특히 그런 것들을 잘 파악하는 편이에요.",
              ],
            },
            {
              title: "의미 중심의 교육 설계",
              description: [
                "단순히 지식을 나열하는 게 아니라, 어떻게 해야 사람들이 이해할 수 있는지를 생각하며 교육의 의미와 의도를 전달하는 것을 잘해요.",
                "준비하지 않은 내용이라도 A를 설명하다가 B의 유사점을 가져와 예시로 드는 식의 즉흥적 연결도 자연스럽게 잘되는 편이에요.",
              ],
            },
            {
              title: "파편화된 지식을 연결하는 것",
              description: [
                "전혀 다른 두 분야에서 패턴과 공통점이 보이면 그것들을 연결 짓는 걸 잘해요.",
                "대화하는 과정에서 머릿속의 조각난 지식들이 연결되면서 하나의 지식처럼 말해지는 경험을 자주 해요.",
              ],
            },
            {
              title: "사람을 편안하게 만드는 것",
              description: [
                "대화할 때 상대방을 굉장히 편안하게 해주는 편이에요.",
                "그 사람이 일반적으로 잘 꺼내지 않는 속 얘기까지 꺼내게 만드는 것 같아요.",
              ],
            },
          ],
          insight: {
            text: "선기님은 사람을 깊이 이해하고, 그 이해를 바탕으로 교육하고 연결 짓는 능력이 핵심 강점이에요. 지식을 쌓는 것보다 지식 간의 관계를 보는 눈과, 사람을 편안하게 만드는 태도가 특히 두드러져요.",
            keywords: [
              "한 사람 집중",
              "교육 설계",
              "지식 연결",
              "편안한 분위기",
              "즉흥적 연결",
            ],
          },
          coachInterview: [
            "의미 중심의 교육 설계는 지금 갖고 있는 능력 중에서는 일순위. 교육 나가서 이 집단이 어떻게 이해할 수 있는가를 조금씩 수정하면서 진행한다. 결국 한 사람에 집중하고 파악하는 것을 잘하니까 가능한 것 아닌가.",
            "한 사람에 집중하는 것을 잘하게 된 계기 — 고등학교 때 교회 동생이랑 1대1 대화 많이 했고, 길게 듣는 게 그때부터 학습됐다. 한동대에서 사회복지를 첫 전공으로 했고 상담심리로 이어졌다.",
            "장애인 봉사활동을 하면서 일반인 중에 힘들어하는 사람이 많구나 깨달았고, 한 사람의 이야기를 듣는 것이 전공을 통해 이어졌다. 막혀 있는 지점들을 보고 해결했을 때 드라마틱하게 변하는 모습을 보면서 '내가 잘할 수 있는 거구나' 했다.",
            "캄보디아, 대학, HIS 학생들과 이야기하면서 강화됐고, 성동에서도 만져주는 계기가 있었다. 내 안에서 계속 강화된다.",
          ],
        },
      ],
    },

    /* ─────────── Part 3 ─────────── */
    {
      partTitle: "가치 있는 것",
      partTitleEn: "I Feel Valuable About It",
      preface:
        "내게 '가치 있는 것'은, 나에게 소중한 것, 내가 추구하는 모습 그리고 나의 가치관 같은 것을 말합니다.",
      examples: [
        "재미있게 사는 것",
        "내면을 단단하게 하는 것",
        "늘 새로운 경험을 즐기는 것",
        "다른 사람에게 인정받는 것",
        "일을 하면서 의미를 발견하는 것",
      ],
      closing:
        "좋아하고 잘하는 것은 나를 만족스럽게 할 수 있지만, 가치와 의미가 없다면 주변 환경에 의해 쉽게 변하고 무너지며 지속 가능하지 않게 됩니다. 마지막으로, 내게 가치 있는 것에만 집중해 보세요.",
      questions: [
        {
          question: "나는 이렇게 살고 싶다 하는 모습이 있나요?",
          meta: "내 인생에 있어 중요한 가치를 알고 있나요? — 알고 있어요",
          items: [
            {
              title: "재미있게 사는 삶 — 넓은 의미의 재미",
              description: [
                "단순한 도파민적 재미가 아니라, 성장하는 것도, 누군가와 대화하는 것도, 지식이 하나로 정리되는 순간도, 마음 맞는 사람들과 무언가를 만들어 가는 것도 모두 재미예요.",
                "흥미와 관심이 가는 모든 것이 재미라는 개념 안에 들어 있어요.",
              ],
            },
            {
              title: "누군가의 성장을 돕는 삶",
              description: [
                "지식적 성장뿐만 아니라 인격적 성장, 상처가 풀리면서 앞으로 나아가게 되는 것까지.",
                "그 사람이 지금보다 조금이라도 더 나아지는 데 내가 어떤 역할을 할 수 있다는 것 자체가 너무나 행복해요.",
              ],
            },
            {
              title: "신앙 안에서 이끌리는 삶",
              description: [
                "신앙인으로서 이끌어가시는 분을 전적으로 신뢰하고, 아브라함처럼 갈 바를 알지 못해도 그분이 이끄시는 대로 나아가는 삶을 살고 싶어요.",
                "본래 안정형이고 변화보다 현재를 선호하지만, 그럼에도 두려움 없이 나아갈 수 있는 사람이 되고 싶어요.",
              ],
            },
          ],
          insight: {
            text: "선기님은 '재미있게 사는 것'이 삶의 방향이지만, 그 재미는 매우 넓고 깊어요. 타인의 성장을 돕는 것, 신앙 안에서 이끌리는 것이 그 재미와 함께 삶을 구성하는 세 축이에요.",
            keywords: [
              "넓은 의미의 재미",
              "타인의 성장",
              "신앙",
              "이끌림",
              "안정 지향",
            ],
          },
          coachInterview: [
            "가장 이렇게 살고 싶다하는 모습은 신앙 안에서 이끌리는 삶이다. 아브라함처럼 갈 바를 알지 못해도 하나님께서 보내신 그곳에서 만난 사람들의 마음을 만져주는 것.",
            "그리고 누군가의 성장을 돕는 삶을 살면서 재미있게 살아가는 것. 성장은 지금보다 나아진 것 모두 성장이라고 본다. 내가 성장하게 해줄 수 있는 영역들이 점점 넓어진다.",
            "강의나 지식이나 도구라고 말한 이유는 사람들과의 1대1 대화를 통해서 응어리를 깨부수는 것이고, 기회가 된다면 신앙적으로 더 들어가는 것. 내가 할 수 있는 도구가 많다.",
            "재미있다는 것은 나에겐 굉장히 넓다. 흥미가 가는 것은 다 재미있다고 생각한다. 누군가가 나아지는 것을 보는 것이 내가 힘을 들여서 하는 것은 아니다. 행복해서 하는 것 — 재미의 영역으로 느낀다.",
            "재미는 다른 이유가 없이 그 자체로 만족감을 느낄 때, 목적 자체가 그 행위일 때 재미라고 생각한다.",
          ],
        },
        {
          question: "나는 다른 사람들에게 어떤 영향을 주고 싶나요?",
          items: [
            {
              title: "지금보다 나아지게 하는 것",
              description: [
                "지식적 성장, 인격적 성장, 상처가 풀려 앞으로 나아가게 되는 것까지.",
                "어느 방향이든 지금보다 조금 더 나은 삶과 생각을 갖게 하는 것이 내가 주고 싶은 영향이에요.",
              ],
            },
            {
              title: "교육과 깊은 대화를 통해",
              description: [
                "그래서 교육도 하고, 누군가와 대화할 때도 깊게 들어가며 그런 것들을 이야기하려고 해요.",
                "영향을 주는 방식이 거창한 것이 아니라, 함께 있는 시간 안에서 자연스럽게 이루어지는 것 같아요.",
              ],
            },
          ],
          insight: {
            text: "선기님은 타인이 지금보다 조금이라도 나아지게 하는 것, 그것이 이 사람이 세상에 주고 싶은 영향의 전부예요. 성장의 범위를 지식에 한정하지 않고 인격·치유·방향까지 넓게 보는 시각이 인상적이에요.",
            keywords: [
              "성장 조력",
              "지식·인격·치유",
              "교육",
              "깊은 대화",
              "자연스러운 영향",
            ],
          },
          coachInterview: [
            "지금보다 나아지게 하는 대상은 재미추구형 인간이라, 지금 내 눈 앞에 보이는 사람들 — 가족, 직장 동료, 교육장에서 보는 사람들. 내 눈앞에 있는 사람들에게 집중해서 닿아 있는 사람들이 좀 더 나아지면 좋겠다.",
            "내가 보일 때 들어가는 사람이고 도움을 줄 수 있는 것이 보이는 사람들이 우선순위가 높아진다. 그렇지 않은 경우엔 의도적으로 영향을 주기보다 관계를 유지하고 좋은 상황 속에서 기회가 생겼을 때 열린다.",
          ],
        },
      ],
    },
  ],

  closingNote:
    "코치인터뷰 좋다. 어느 정도 알고 있다고 생각했는데 파편화되어 있던 것이 대화를 통해 연결되고 스스로를 알아가는 게 즐거웠다. 내가 어떻게 행동하는구나, 하려고 하는구나를 좀 더 이해할 수 있게 되는. 이거 하면서 드는 생각은 마음 맞는 사람들이 여기 많고 재미있었구나 하는 것이었다.",
};

/**
 * digest 호출 시 system prompt 컨텍스트로 들어가는 가벼운 인덱스.
 * 풀 본문이 아니라 Part 제목 / item 제목 / keyword만 — LLM이 "어디와 연결되는지"
 * 판단할 만큼만.
 */
export type ReportIndexItem = {
  partTitle: string;
  itemTitle: string;
  keywords: string[];
};

/** 임의의 BaselineReport에서 Part·항목·키워드 인덱스 추출. */
export function indexBaseline(report: BaselineReport): ReportIndexItem[] {
  const out: ReportIndexItem[] = [];
  for (const part of report.parts) {
    for (const q of part.questions) {
      for (const item of q.items) {
        out.push({
          partTitle: part.partTitle,
          itemTitle: item.title,
          keywords: q.insight.keywords,
        });
      }
    }
  }
  return out;
}

/** 방선기 baseline 인덱스 — 기본 사용처 호환용 wrapper. */
export function getReportIndex(): ReportIndexItem[] {
  return indexBaseline(BASELINE_REPORT);
}

/** 임의의 BaselineReport에서 (partTitle, itemTitle) 쌍의 본문 찾기. */
export function findItemInBaseline(
  report: BaselineReport,
  partTitle: string,
  itemTitle: string,
): { description: string[] } | null {
  const part = report.parts.find((p) => p.partTitle === partTitle);
  if (!part) return null;
  for (const q of part.questions) {
    const item = q.items.find((i) => i.title === itemTitle);
    if (item) return { description: item.description };
  }
  return null;
}

/**
 * 방선기 baseline에서 (partTitle, itemTitle) 본문 찾기 — 기본 사용처 wrapper.
 * /me/report에서 connection 카드 표시할 때 사용.
 */
export function findBaselineItem(
  partTitle: string,
  itemTitle: string,
): { description: string[] } | null {
  return findItemInBaseline(BASELINE_REPORT, partTitle, itemTitle);
}

/**
 * 페이스메이커 system prompt에 주입하는 baseline 압축 요약.
 * 풀 본문이 아니라 Part 제목 / 항목 제목+첫 줄 / 인사이트 한 문장 / 키워드만.
 * 토큰비 적게 들면서 LLM이 "이 사람은 누구이고 어떤 결을 가졌는지" 파악 가능.
 *
 * 임의의 BaselineReport를 받아서 요약 — `/me`는 방선기, `/demo`는 페르소나.
 */
export function summarizeBaseline(report: BaselineReport): string {
  const lines: string[] = [];
  lines.push(`# ${report.userName}님 셀프인터뷰 보고서 요약`);
  lines.push("");
  lines.push(`## 한 줄 요약`);
  lines.push(`"내가 진정 하고 싶은 일은 ${report.headline} 이라고 합니다."`);
  lines.push("");

  for (const part of report.parts) {
    lines.push(`## ${part.partTitle} (${part.partTitleEn})`);
    for (const q of part.questions) {
      lines.push(`Q. ${q.question}`);
      for (const item of q.items) {
        const firstLine = item.description[0] ?? "";
        lines.push(`- **${item.title}**: ${firstLine}`);
      }
      lines.push(`💡 ${q.insight.text}`);
      lines.push(`키워드: ${q.insight.keywords.join(", ")}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

/** 방선기(skpan) baseline 요약 — 기본 사용처 호환용 wrapper. */
export function getReportSummary(): string {
  return summarizeBaseline(BASELINE_REPORT);
}
