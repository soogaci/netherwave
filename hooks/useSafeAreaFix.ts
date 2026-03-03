"use client";

import { useEffect } from "react";

export function useSafeAreaFix() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.navigator.standalone) return;

    function measure() {
      const probe = document.createElement("div");
      probe.style.cssText = [
        "position:fixed",
        "bottom:0",
        "left:0",
        "width:1px",
        "height:env(safe-area-inset-bottom,0px)",
        "pointer-events:none",
        "visibility:hidden",
        "z-index:-1",
      ].join(";");
      document.body.appendChild(probe);
      const fromCSS = probe.getBoundingClientRect().height;
      document.body.removeChild(probe);

      const diff = screen.height - window.innerHeight;
      const fromDiff = diff > 0 && diff < 150 ? Math.max(diff - 44, 0) : 0;

      const sab = fromCSS > 0 ? fromCSS : fromDiff > 0 ? fromDiff : 34;

      document.documentElement.style.setProperty("--sab-override", `${sab}px`);
    }

    measure();
    const onOrient = () => setTimeout(measure, 300);
    window.addEventListener("orientationchange", onOrient);
    return () => window.removeEventListener("orientationchange", onOrient);
  }, []);
}
