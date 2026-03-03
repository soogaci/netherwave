"use client";

import React from "react";
import { motion } from "framer-motion";

const PULL_THRESHOLD = 56;
const PULL_MAX = 95;
const RESISTANCE = 0.45;

type Props = {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
};

export function PullToRefresh({ onRefresh, children, className = "" }: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (refreshing) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 2) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      e.preventDefault();
      setPullY(Math.min(delta * RESISTANCE, PULL_MAX));
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    if (pullY >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullY(0);
      try {
        await Promise.resolve(onRefresh());
      } finally {
        setRefreshing(false);
      }
    } else {
      setPullY(0);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (refreshing || e.pointerType !== "mouse") return;
    startY.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (refreshing || e.pointerType !== "mouse" || !e.buttons) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 2) return;
    const delta = e.clientY - startY.current;
    if (delta > 0) {
      setPullY(Math.min(delta * RESISTANCE, PULL_MAX));
    }
  };

  const handlePointerUp = async () => {
    if (refreshing) return;
    if (pullY >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullY(0);
      try {
        await Promise.resolve(onRefresh());
      } finally {
        setRefreshing(false);
      }
    } else {
      setPullY(0);
    }
  };

  return (
    <div className={`relative flex flex-col min-h-0 flex-1 ${className}`}>
      <motion.div
        className="absolute left-0 right-0 top-0 flex justify-center items-center z-10 pointer-events-none"
        initial={false}
        animate={{ y: pullY - 44 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        <motion.div
          className="w-9 h-9 rounded-full border-2 border-primary/50 flex items-center justify-center bg-background/90 backdrop-blur shadow-sm"
          initial={false}
          animate={{
            rotate: refreshing ? 360 : 0,
            scale: Math.min(1, pullY / PULL_THRESHOLD) * 0.35 + 0.8,
          }}
          transition={
            refreshing
              ? { rotate: { duration: 0.9, repeat: Infinity, ease: "linear" } }
              : { type: "spring", stiffness: 400, damping: 28 }
          }
        >
          {refreshing ? (
            <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </motion.div>
      </motion.div>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <motion.div
          initial={false}
          animate={{ paddingTop: pullY }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
