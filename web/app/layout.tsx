import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Being Myself — 하루 5분, 나에게 집중하는 시간",
  description:
    "두 가지 질문에 답하며 나의 여정과 소명을 정리해가는 셀프인터뷰. Being Myself MVP.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0e0b1f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="antialiased">
      <body className="min-h-screen bg-surface-light text-fg-light">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
