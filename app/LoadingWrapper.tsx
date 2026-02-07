"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const LoadingAnimation = dynamic(() => import("./components/LoadingAnimation"), {
  ssr: false,
});

export default function LoadingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [useLightLoader, setUseLightLoader] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSmallMobile = window.innerWidth <= 820;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setUseLightLoader(isIOS || isSmallMobile || prefersReducedMotion);
  }, []);

  useEffect(() => {
    // 10 Second Cinematic Lock
    const timer = setTimeout(() => {
      setIsLoaded(true);
      // Slight offset for the smooth blur-in reveal
      setTimeout(() => setShowUI(true), 100);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {!showUI && (
        <div
          className={`fixed inset-0 z-[100] transition-all duration-[1500ms] cubic-bezier(0.23, 1, 0.32, 1) ${
            isLoaded ? "opacity-0 scale-150 blur-3xl" : "opacity-100 scale-100"
          }`}
        >
          {/* {useLightLoader ? (
            <div className="flex h-full w-full items-center justify-center bg-black">
              <p className="text-2xl font-semibold tracking-[0.2em] text-white/90">
                DEGEN TERMINAL
              </p>
            </div>
          ) : ( */}
            <LoadingAnimation />
          {/* )} */}
        </div>
      )}

      <main
        className={`transition-all duration-[2000ms] ${
          showUI ? "opacity-100 filter-none" : "opacity-0 blur-[50px] scale-95"
        }`}
      >
        {children}
      </main>
    </>
  );
}
