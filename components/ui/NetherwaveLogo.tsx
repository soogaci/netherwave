"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

const sizes = { sm: 32, md: 44, lg: 56 };

export function NetherwaveLogo({ size = "md", showText = false, className = "" }: Props) {
  const s = sizes[size];

  return (
    <div className={`inline-flex flex-col items-start gap-0.5 overflow-visible ${className}`}>
      <motion.div
        className="relative overflow-visible"
        style={{ width: s, height: s * 0.75, minWidth: s, minHeight: s * 0.75 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <svg viewBox="-6 -2 76 50" className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="nw-wave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          {/* Wave 1 */}
          <motion.path
            d="M0 32 Q16 24 32 32 T64 32"
            stroke="url(#nw-wave)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            strokeOpacity={0.4}
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Wave 2 */}
          <motion.path
            d="M0 36 Q16 28 32 36 T64 36"
            stroke="url(#nw-wave)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            strokeOpacity={0.7}
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          {/* Wave 3 */}
          <motion.path
            d="M0 40 Q16 32 32 40 T64 40"
            stroke="url(#nw-wave)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeOpacity={1}
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
        </svg>
      </motion.div>

      {showText && (
        <motion.span
          className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          netherwave
        </motion.span>
      )}
    </div>
  );
}
