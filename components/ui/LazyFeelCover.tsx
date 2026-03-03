"use client";

import React from "react";

/** Показывает видео только когда элемент в зоне видимости — обложки в профиле грузятся по мере скролла */
export function LazyFeelCover({
  videoUrl,
  className,
  children,
}: {
  videoUrl: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [src, setSrc] = React.useState<string | null>(null);
  const [videoError, setVideoError] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setSrc(videoUrl);
      },
      { rootMargin: "80px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [videoUrl]);

  const handleVideoError = () => {
    setVideoError(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {src && !videoError ? (
        <video
          src={src}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onError={handleVideoError}
          onLoadedData={() => setVideoError(false)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 animate-pulse" />
      )}
      {children}
    </div>
  );
}
