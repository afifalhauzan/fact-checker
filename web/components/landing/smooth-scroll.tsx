"use client";

import React from "react";
import Lenis from "lenis";

/** Smooth, eased scrolling for the landing page only. Renders nothing; it just drives the page's scroll. */
export function SmoothScroll() {
  React.useEffect(() => {
    // Leave native scrolling alone for visitors who asked for less motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // anchors: lets in-page links such as #cara-kerja glide instead of jumping
    const lenis = new Lenis({ anchors: true });

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
