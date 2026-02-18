"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
  className?: string;
};

export function WaveAccent({ className = "" }: Props) {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`}>
      <svg viewBox="0 0 200 24" fill="none" className="w-full h-6">
        <defs>
          <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 12 Q25 4 50 12 T100 12 T150 12 T200 12"
          stroke="url(#wave-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
