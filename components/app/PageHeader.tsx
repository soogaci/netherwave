"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type Props = {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

/** Центр — FeelReal. Слева — опционально кнопка назад или заголовок. Справа — кнопки. */
export function PageHeader({ title, subtitle, left, right }: Props) {
  return (
    <header className="mb-4 flex flex-nowrap items-center min-w-0 min-h-[2.5rem] shrink-0">
      <div className="w-12 shrink-0 min-w-0 md:w-16 flex items-center">
        {left != null ? left : (title != null || subtitle != null) ? (
          <div className="min-w-0">
            {title != null && <div className="text-base font-semibold leading-tight truncate">{title}</div>}
            {subtitle != null && <div className="text-sm text-muted-foreground truncate">{subtitle}</div>}
          </div>
        ) : null}
      </div>
      <div className="flex-1 flex justify-center min-w-0">
        <span className="font-heading text-base font-semibold tracking-tight text-foreground">
          FeelReal
        </span>
      </div>
      <div className="shrink-0 flex items-center justify-end gap-2 min-w-0">
        {right != null && right}
      </div>
    </header>
  );
}

export function HeaderBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="p-1 -ml-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
      aria-label="Назад"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );
}
