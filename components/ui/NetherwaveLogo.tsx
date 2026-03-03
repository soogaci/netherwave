"use client";

import React from "react";

type Props = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizeClass = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

export function NetherwaveLogo({ size = "md", showText = false, className = "" }: Props) {
  return (
    <div className={`inline-flex flex-col items-center gap-0.5 ${className}`}>
      <span className={`font-heading font-semibold tracking-tight text-foreground ${sizeClass[size]}`}>
        FeelReal
      </span>
      {showText && (
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          feelreal
        </span>
      )}
    </div>
  );
}
