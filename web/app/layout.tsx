import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Being Myself — 하루 15분, 나에게 집중하는 시간",
  description:
    "AI 페이스메이커와의 대화로 나의 소명을 발견하는 시간. Being Myself MVP.",
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
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-surface-light text-fg-light">
        {children}
      </body>
    </html>
  );
}
