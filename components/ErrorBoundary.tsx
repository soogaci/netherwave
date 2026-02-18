"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import BottomNav from "./app/BottomNav";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

export class ErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; error?: Error }
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-6 flex flex-col items-center justify-center min-h-[70vh]">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-center">Что-то пошло не так</h1>
          <p className="text-sm text-muted-foreground text-center mt-2 max-w-[280px]">
            Ошибка при загрузке. Попробуй обновить страницу.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
          <BottomNav />
        </main>
      );
    }
    return this.props.children;
  }
}
