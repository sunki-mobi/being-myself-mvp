import Link from "next/link";

/**
 * /legal/privacy — 개인정보 처리방침 (임시).
 *
 * 11명 사내 베타 대상 MVP 수준. 법무 검토 후 정식 처리방침으로 교체 예정.
 */
export const metadata = {
  title: "개인정보 처리방침 — Being Myself",
};

export default function PrivacyPage() {
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
            개인정보 처리방침
          </h1>
          <p className="mt-2 text-xs text-fg-light-muted">
            최종 업데이트: 2026-05-14 · 베타 임시본
          </p>
        </div>

        <p className="text-sm text-fg-light-soft leading-relaxed">
          모비니티(MOBINITY, 이하 “회사”)는 셀프인터뷰 서비스 “Being Myself”
          (이하 “서비스”)에서 사용자의 개인정보를 다음과 같이 처리합니다. 본
          처리방침은 비공개 베타 단계의 임시본이며, 정식 출시 전 법무 검토를
          통해 갱신될 예정입니다.
        </p>

        <Section title="1. 수집하는 개인정보">
          <ul className="list-disc pl-5 space-y-1">
            <li>이메일 주소 (회원 식별·인증·서비스 안내용)</li>
            <li>표시 이름 (선택, 사용자가 입력한 호칭)</li>
            <li>
              셀프인터뷰 답변 — 음성 인식 결과 또는 직접 입력한 텍스트, 매일의
              질문 응답
            </li>
            <li>서비스 이용 기록 (로그인 시각, 답변 시각 등)</li>
          </ul>
        </Section>

        <Section title="2. 수집 목적">
          <ul className="list-disc pl-5 space-y-1">
            <li>본인 식별·인증 (이메일)</li>
            <li>사용자별 셀프인터뷰 보고서 생성·표시</li>
            <li>답변 누적에 따른 4단계 누적 보고서(현상·본질·가치·존재) 합성</li>
            <li>서비스 안정성 모니터링·오류 추적</li>
          </ul>
        </Section>

        <Section title="3. 제3자 제공 — AI 처리 (중요)">
          <p>
            답변을 정리·합성하기 위해 다음 외부 서비스에 답변 데이터가 전달됩니다:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <b>Google Gemini API</b> — 답변을 정리한 카드, 셀프인터뷰
              베이스라인 보고서, 4단계 누적 보고서를 합성하기 위해 답변 텍스트가
              전달됩니다.
            </li>
            <li>
              <b>Supabase (데이터베이스 호스팅)</b> — 사용자 계정·답변·보고서가
              저장됩니다.
            </li>
          </ul>
          <p className="mt-2">
            각 서비스는 자체 개인정보 정책에 따라 데이터를 처리하며, 회사는
            사용자의 동의 없이 답변 원문을 그 외 제3자에게 제공하지 않습니다.
          </p>
        </Section>

        <Section title="4. 보유 기간">
          <p>
            사용자 답변·보고서는 사용자가 계정을 유지하는 동안 보관됩니다.
            사용자가 탈퇴를 요청하면 30일 이내에 모든 데이터를 삭제합니다.
            법령에 따라 보관이 필요한 일부 정보는 해당 법령이 정한 기간 동안만
            보관됩니다.
          </p>
        </Section>

        <Section title="5. 사용자 권리">
          <ul className="list-disc pl-5 space-y-1">
            <li>본인 데이터 열람·정정·삭제 요청</li>
            <li>회원 탈퇴 (계정 삭제 시 답변·보고서 모두 삭제)</li>
            <li>개인정보 처리에 대한 동의 철회</li>
          </ul>
          <p className="mt-2">
            위 권리 행사는 운영자(edu@mobinity.io)에게 요청하시면 처리해
            드립니다.
          </p>
        </Section>

        <Section title="6. 정책 변경">
          <p>
            본 처리방침은 베타 단계 중 수시로 갱신될 수 있으며, 중요한 변경
            사항이 있을 경우 가입한 이메일을 통해 안내합니다.
          </p>
        </Section>

        <Section title="7. 문의">
          <p>
            개인정보 처리에 관한 문의는 운영자(edu@mobinity.io)로 부탁드립니다.
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
