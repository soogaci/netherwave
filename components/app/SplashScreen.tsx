"use client";

import React from "react";
import { motion } from "framer-motion";
export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          FeelReal
        </span>
      </div>
      <motion.div
        className="h-1 w-24 rounded-full bg-muted overflow-hidden"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: ["0%", "70%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
