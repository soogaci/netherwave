"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
  className?: string;
  /** Размер по высоте (ширина масштабируется). */
  size?: "sm" | "md" | "lg";
};

const heightMap = { sm: 24, md: 30, lg: 36 };
const widthMap = { sm: 56, md: 76, lg: 92 };

export function WaveAccent({ className = "", size = "md" }: Props) {
  const h = heightMap[size];
  const w = widthMap[size];

  return (
    <div
      className={`overflow-visible pointer-events-none flex items-center justify-center shrink-0 ${className}`}
      style={{ width: w, height: h }}
      aria-hidden
    >
      <svg
        viewBox="0 0 200 44"
        fill="none"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="wave-accent-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--wave-from, #f472b6)" />
            <stop offset="40%" stopColor="var(--wave-mid, #fb923c)" />
            <stop offset="100%" stopColor="var(--wave-to, #ec4899)" />
          </linearGradient>
        </defs>
        {/* Верхняя волна */}
        <motion.g animate={{ x: [0, 6, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
          <path
            d="M0 14 Q25 6 50 14 T100 14 T150 14 T200 14"
            stroke="url(#wave-accent-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity={0.5}
          />
        </motion.g>
        {/* Средняя волна */}
        <motion.g animate={{ x: [0, -5, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}>
          <path
            d="M0 22 Q50 10 100 22 T200 22"
            stroke="url(#wave-accent-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeOpacity={0.85}
          />
        </motion.g>
        {/* Нижняя волна */}
        <motion.g animate={{ x: [0, 5, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}>
          <path
            d="M0 32 Q25 24 50 32 T100 32 T150 32 T200 32"
            stroke="url(#wave-accent-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeOpacity={0.5}
          />
        </motion.g>
      </svg>
    </div>
  );
}
