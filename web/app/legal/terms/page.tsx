import Link from "next/link";

/**
 * /legal/terms — 서비스 이용약관 (임시).
 *
 * 11명 사내 베타 대상 MVP 수준. 법무 검토 후 정식 약관으로 교체 예정.
 */
export const metadata = {
  title: "이용약관 — Being Myself",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper py-12 px-6">
      <article className="w-full max-w-2xl flex flex-col gap-6 text-fg-light">
        <div>
          <Link
            href="/auth/sign-up"
            className="text-xs text-fg-light-soft hover:text-fg-light"
          >
            ← 돌아가기
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            이용약관
          </h1>
          <p className="mt-2 text-xs text-fg-light-muted">
            최종 업데이트: 2026-05-14 · 베타 임시본
          </p>
        </div>

        <p className="text-sm text-fg-light-soft leading-relaxed">
          본 약관은 모비니티(MOBINITY, 이하 “회사”)가 제공하는 셀프인터뷰
          기반 자기 발견 서비스 “Being Myself”(이하 “서비스”)의 이용에 관한
          기본 조건을 규정합니다. 현재 본 약관은 비공개 베타 단계의 임시본이며,
          정식 출시 전 법무 검토를 통해 갱신될 예정입니다.
        </p>

        <Section title="1. 서비스 소개">
          <p>
            Being Myself는 사용자가 매일 짧은 질문에 답하며 자기 자신을 정리·
            발견할 수 있도록 돕는 셀프인터뷰 서비스입니다. 사용자가 답한 내용은
            정리된 카드와 누적 보고서 형태로 사용자 본인에게만 제공됩니다.
          </p>
        </Section>

        <Section title="2. 가입과 계정">
          <p>
            서비스는 만 14세 이상 자연인이 이용할 수 있으며, 사용자는 정확한
            정보로 가입해야 합니다. 가입 시 제공하는 이메일은 본인 인증과 서비스
            안내에 사용됩니다. 계정 정보는 본인이 안전하게 관리해야 하며,
            제3자에게 양도·공유할 수 없습니다.
          </p>
        </Section>

        <Section title="3. 콘텐츠와 데이터">
          <p>
            사용자가 작성·녹음·입력한 모든 답변은 본인의 자기 발견을 위한
            자료로만 사용됩니다. 회사는 사용자의 동의 없이 답변 원문을 제3자에게
            공개하지 않으며, 자세한 처리 방침은{" "}
            <Link
              href="/legal/privacy"
              className="text-brand-600 underline-offset-4 hover:underline"
            >
              개인정보 처리방침
            </Link>
            을 참조하세요.
          </p>
        </Section>

        <Section title="4. 책임 한계">
          <p>
            서비스는 자기 발견을 돕는 도구이며 의학적·심리적 진단·처방을
            대신하지 않습니다. AI(LLM)로 정리된 내용은 사용자의 답변을 바탕으로
            한 해석이며 절대적 사실이 아닙니다. 베타 기간 동안 서비스는 사전
            공지 없이 변경·중단될 수 있습니다.
          </p>
        </Section>

        <Section title="5. 약관 변경">
          <p>
            본 약관은 베타 단계 중 수시로 갱신될 수 있으며, 중요한 변경 사항이
            있을 경우 가입한 이메일을 통해 안내합니다.
          </p>
        </Section>

        <Section title="6. 문의">
          <p>
            서비스에 관한 문의는 운영자(edu@mobinity.io)로 부탁드립니다.
          </p>
        </Section>

        <p className="mt-4 text-xs text-fg-light-muted">
          © 2026 MOBINITY. All Rights Reserved.
        </p>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold text-fg-light">{title}</h2>
      <div className="text-sm text-fg-light-soft leading-relaxed">
        {children}
      </div>
    </section>
  );
}
