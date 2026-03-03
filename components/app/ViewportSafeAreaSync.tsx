"use client";

import React from "react";

/**
 * Синхронизирует высоту viewport, safe-area и смещение при клавиатуре (--vvh, --sab, --vb-bottom).
 * На iOS при открытой клавиатуре: fixed bottom привязываем к низу visualViewport, safe-area обнуляем,
 * чтобы под меню не оставалась «заплатка».
 */
function setViewportVars() {
  if (typeof window === "undefined") return;

  const vv = window.visualViewport;
  const innerH = window.innerHeight;
  const h = vv ? vv.height : innerH;

  if (h > 0) {
    document.documentElement.style.setProperty("--vvh", `${Math.round(h)}px`);
  }

  // Клавиатура открыта: видимая высота заметно меньше экрана
  const keyboardOpen = vv && innerH > 0 && vv.height < innerH * 0.85;

  if (keyboardOpen && vv) {
    const bottomOffset = innerH - vv.offsetTop - vv.height;
    document.documentElement.style.setProperty("--vb-bottom", `${Math.round(bottomOffset)}px`);
    document.documentElement.style.setProperty("--sab", "0px");
  } else {
    document.documentElement.style.setProperty("--vb-bottom", "0px");
    const d = document.createElement("div");
    d.style.cssText =
      "position:fixed;bottom:0;left:-9999px;width:0;height:0;padding-bottom:env(safe-area-inset-bottom);pointer-events:none;";
    document.body.appendChild(d);
    const sab = getComputedStyle(d).paddingBottom;
    document.body.removeChild(d);
    document.documentElement.style.setProperty("--sab", sab || "0px");
  }
}

function isIOS26() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /OS 26|OS_26/.test(ua);
}

export function ViewportSafeAreaSync() {
  React.useEffect(() => {
    if (isIOS26()) {
      document.documentElement.setAttribute("data-ios26", "");
    }
    setViewportVars();

    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => setViewportVars();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    window.addEventListener("resize", onResize);
    // Фокус в поле ввода (клавиатура) — пересчёт после анимации клавиатуры
    const onFocus = () => {
      setTimeout(setViewportVars, 100);
      setTimeout(setViewportVars, 350);
    };
    const onBlur = () => setTimeout(setViewportVars, 100);
    window.addEventListener("focusin", onFocus);
    window.addEventListener("focusout", onBlur);

    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("focusin", onFocus);
      window.removeEventListener("focusout", onBlur);
    };
  }, []);

  return null;
}
