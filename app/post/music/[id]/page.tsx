"use client";

import React from "react";
import Link from "next/link";
import { Music } from "lucide-react";

export default function PostMusicPlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Music className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold text-center">Музыка — скоро</h1>
      <p className="text-sm text-muted-foreground text-center mt-2 max-w-[280px]">
        Раздел с треками и плейлистами появится в Netherwave позже. Сейчас фокус на ленте и постах.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-foreground underline hover:no-underline"
      >
        На главную
      </Link>
    </div>
  );
}
