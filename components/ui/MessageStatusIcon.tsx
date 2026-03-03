"use client";

import React from "react";

// Одна галочка = не прочитано, две = прочитано
const CHECK = "M 2 10 L 6 6 L 10 2";

export function MessageStatusIcon({
  read,
  className,
  ...props
}: {
  read: boolean;
  className?: string;
} & React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width={read ? 20 : 14}
      height="14"
      viewBox={read ? "0 -2 20 14" : "0 -2 14 14"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      style={{ display: "block", flexShrink: 0 }}
      {...props}
    >
      <path d={CHECK} />
      {read && <path d={CHECK} transform="translate(8, 0)" />}
    </svg>
  );
}
