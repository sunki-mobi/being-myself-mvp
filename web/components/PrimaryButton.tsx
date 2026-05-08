"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({ children, className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`
        w-full py-4 rounded-full
        bg-brand-500 hover:bg-brand-600 active:bg-brand-700
        text-white text-base font-semibold
        transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed
        no-select
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`
        w-full py-4 rounded-full
        bg-transparent border border-border-strong/40
        text-fg-light hover:bg-surface-card
        text-base font-medium
        transition-colors
        no-select
        ${className}
      `}
    >
      {children}
    </button>
  );
}
