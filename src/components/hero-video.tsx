"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hero's background film.
 *
 * Silent, looping and decorative, so it carries no controls and no
 * caption track. The poster covers the first frames, and stays put if
 * the browser refuses to autoplay or the visitor asked for less motion.
 */
export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Autoplay can still be refused; the poster simply remains.
    void video.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      tabIndex={-1}
      data-playing={playing}
      className="absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-70"
    />
  );
}
