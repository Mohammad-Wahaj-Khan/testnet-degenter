"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const STAKED_ZIG_DENOM =
  "coin.zig109f7g2rzl2aqee7z6gffn8kfe9cpqx0mjkk7ethmx8m2hq4xpe9snmaam2.stzig";

export interface RankingItem {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
  tx: number;
  tokenId?: string;
  color?: string;
  textGradient?: string;
}

export interface Token {
  id: string;
  rank?: number;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
  tx: number;
  tokenId?: string;
}

const MIN_RANKING_ROWS = 5;
const MAX_RANKING_ROWS = 5;
const RANKING_REPEAT_GROUPS = 60;

const isStakedZig = (token: Token) => {
  const symbolLower = (token.symbol || "").toLowerCase();
  const idLower = (token.id || "").toLowerCase();
  return symbolLower === "stzig" || idLower === STAKED_ZIG_DENOM;
};

const RankingComponent: React.FC<{
  rankedTokens: Token[];
  loading?: boolean;
}> = ({ rankedTokens, loading = false }) => {
  const safeRankedTokens = rankedTokens || [];
  const sortedRankedTokens = useMemo(
    () =>
      [...safeRankedTokens].sort(
        (a, b) => (b.total_volume || 0) - (a.total_volume || 0)
      ),
    [safeRankedTokens]
  );
  const availableCount = Math.min(MAX_RANKING_ROWS, sortedRankedTokens.length);
  const desiredCount = Math.max(MIN_RANKING_ROWS, availableCount);
  const visibleTokens = sortedRankedTokens.slice(0, availableCount);
  const filledRankTokens = [...visibleTokens];

  const defaultToken: RankingItem = {
    id: "0",
    rank: 0,
    name: "Loading...",
    symbol: "N/A",
    current_price: 0,
    price_change_percentage_24h: 0,
    market_cap: 0,
    total_volume: 0,
    image: "",
    tx: 0,
    color: "from-gray-500 to-gray-600",
    textGradient: "from-gray-400 to-gray-500",
  };

  while (filledRankTokens.length < desiredCount) {
    filledRankTokens.push({
      ...defaultToken,
      rank: filledRankTokens.length + 1,
    });
  }

  const rankings: RankingItem[] = filledRankTokens.map((token, index) => ({
    id: token.id || `${index + 1}`,
    rank: token.rank ?? index + 1,
    name: token.name || "N/A",
    symbol: token.symbol || "N/A",
    current_price: token.current_price || 0,
    price_change_percentage_24h: token.price_change_percentage_24h || 0,
    market_cap: token.market_cap || 0,
    total_volume: token.total_volume || 0,
    image: token.image || "",
    tx: token.tx || 0,
    tokenId: token.tokenId,
    color:
      index === 0
        ? "from-[#FF4D00] via-[#FA4E30] to-[#FF4D00]/90"
        : index === 1
        ? "from-[#0B1008] via-[#0B3F27] to-[#16CF78]"
        : index === 2
        ? // ? "from-[#120216] via-[#6B1D65] to-[#E830C9]"
          "from-[#0B1008] via-[#0B3F27] to-[#16CF78]"
        : index === 3
        ? "from-[#060A0D] via-[#06381A] to-[#0CBD83]"
        : "from-[#060A0D] via-[#06381A] to-[#0CBD83]",
    textGradient:
      index === 0
        ? "from-[#FFD178] to-[#FF7F2A]"
        : index === 1
        ? "from-[#42F5C3] to-[#0B7B46]"
        : index === 2
        ? "from-[#E59AEF] to-[#561B4A]"
        : index === 3
        ? "from-[#ADADAD] to-[#1A1A1A]"
        : "from-[#ADADAD] to-[#1A1A1A]",
  }));

  const threeRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Three.js background effect
  useEffect(() => {
    if (!threeRef.current) return;
    const el = threeRef.current;

    // --- SAFETY GUARD: DO NOT INIT THREE IF WEBGL IS NOT AVAILABLE ---
    if (!isWebGLAvailable()) {
      console.warn("WebGL not available, skipping Three.js background");
      return;
    }

    let renderer: any;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: true,
      });
    } catch (err) {
      console.warn("Failed to initialize WebGLRenderer:", err);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    let width = el.clientWidth || 400;
    let height = el.clientHeight || 500;
    renderer.setSize(width, height);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0.1,
      1000
    );
    camera.position.z = 10;

    const boxCount = Math.max(1, rankings.length);
    const meshes: Array<any> = [];
    const boxWidth = 120;
    const boxHeight = 40;

    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, 20);
    const baseMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
    });

    const angleStep = (Math.PI * 2) / boxCount;
    let radius = Math.min(width, height) * 0.28;
    let centerX = -width / 2 + boxWidth / 2 + 20;
    let centerY = 0;

    for (let i = 0; i < boxCount; i++) {
      const mesh = new THREE.Mesh(boxGeometry, baseMaterial.clone());
      const baseAngle = -Math.PI / 2 + i * angleStep;
      mesh.userData = { index: i, baseAngle };
      mesh.position.x = centerX + Math.cos(baseAngle) * radius;
      mesh.position.y = centerY + Math.sin(baseAngle) * radius;
      scene.add(mesh);
      meshes.push(mesh);
    }

    let activeIndex = 0;
    let targetRotation = 0;
    let currentRotation = 0;

    function updateTargetsForActive(idx: number) {
      if (!boxCount) return;
      const targetIdx = ((idx % boxCount) + boxCount) % boxCount;
      const diff = targetIdx - activeIndex;
      if (diff === 0) {
        activeIndex = targetIdx;
        return;
      }
      let signedDiff = diff;
      if (signedDiff > boxCount / 2) signedDiff -= boxCount;
      if (signedDiff < -boxCount / 2) signedDiff += boxCount;
      targetRotation += signedDiff * angleStep;
      activeIndex = targetIdx;
    }

    updateTargetsForActive(activeIndex);

    let rafId: number;
    function animate() {
      currentRotation += (targetRotation - currentRotation) * 0.08;
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        const baseAngle = (mesh.userData as { baseAngle: number }).baseAngle;
        const angle = baseAngle + currentRotation;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        mesh.position.x += (x - mesh.position.x) * 0.12;
        mesh.position.y += (y - mesh.position.y) * 0.12;

        const closeness = Math.cos(angle + Math.PI / 2);
        const closenessNorm = Math.max(0, closeness);
        const targetScale = 1 + 0.28 * closenessNorm;
        mesh.scale.x += (targetScale - mesh.scale.x) * 0.12;
        mesh.scale.y += (targetScale - mesh.scale.y) * 0.12;

        const mat = mesh.material as { opacity: number };
        const targetOpacity = 0.08 + 0.32 * closenessNorm;
        mat.opacity += (targetOpacity - mat.opacity) * 0.12;

        mesh.position.z += (5 * closenessNorm - mesh.position.z) * 0.12;
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    }
    animate();

    function onResize() {
      width = el.clientWidth || 400;
      height = el.clientHeight || 500;
      renderer.setSize(width, height);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      radius = Math.min(width, height) * 0.28;
      centerX = -width / 2 + boxWidth / 2 + 20;
      centerY = 0;
      updateTargetsForActive(activeIndex);
    }

    window.addEventListener("resize", onResize);
    onResize();

    let pending = false;
    function findActiveIndex() {
      if (!listRef.current) return;
      const container = listRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      let bestIdx = activeIndex;
      let bestDist = Infinity;

      for (let i = 0; i < itemRefs.current.length; i++) {
        const elItem = itemRefs.current[i];
        if (!elItem) continue;
        const rect = elItem.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const dist = Math.abs(itemCenter - containerCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }

      if (bestIdx !== activeIndex) {
        updateTargetsForActive(bestIdx);
      }
    }

    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        findActiveIndex();
      });
    };

    if (listRef.current) {
      listRef.current.addEventListener("scroll", onScroll, { passive: true });
    }

    findActiveIndex();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      if (listRef.current)
        listRef.current.removeEventListener("scroll", onScroll);
      boxGeometry.dispose();
      meshes.forEach((mesh) => {
        (mesh.material as { dispose?: () => void }).dispose?.();
        scene.remove(mesh);
      });
      (baseMaterial as { dispose?: () => void }).dispose?.();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, [rankedTokens, rankings.length]);

  const getRankDisplay = (rank: number) => {
    const suffixes = ["st", "nd", "rd", "th"];
    const suffix = rank <= 3 ? suffixes[rank - 1] : suffixes[3];
    return { number: rank, suffix };
  };

  if (loading) {
    return (
      <div className="bg-black/30 rounded-lg border border-[#808080]/20 px-6 py-6 lg:min-h-[500px] lg:max-h-[500px] overflow-hidden relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center justify-center space-x-2 w-full">
            <div className="w-5 h-5 bg-white/10 rounded-full animate-pulse"></div>
            <h2 className="h-6 bg-white/10 rounded w-32 animate-pulse"></h2>
          </div>
        </div>

        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="relative h-[70px] rounded-3xl overflow-visible"
            >
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl" />

              <div className="relative z-20 p-4 h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-white/10 rounded animate-pulse w-24"></div>
                      <div className="h-3 bg-white/10 rounded animate-pulse w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded animate-pulse w-20"></div>
                      <div className="h-3 bg-white/10 rounded animate-pulse w-12 ml-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  itemRefs.current = [];

  // ===== TILT BACK INTO SCREEN ANIMATION =====
  // Rows stay horizontal (2D), but tilt BACKWARDS on X-axis, scale down, and fade as they scroll away from center
  React.useEffect(() => {
    if (!listRef.current) return;
    const container = listRef.current;
    let rafId = 0;

    // State for smooth interpolation per element
    const state: Array<{
      rotateX: number;
      scale: number;
      translateZ: number;
      opacity: number;
      zIdx: number;
    }> = Array.from({ length: Math.max(1, itemRefs.current.length) }).map(
      () => ({
        rotateX: 0,
        scale: 1,
        translateZ: 0,
        opacity: 1,
        zIdx: 1000,
      })
    );

    const smoothing = 0.08; // Lerp factor - buttery smooth, slower updates

    const step = () => {
      const containerHeight = container.clientHeight || 1;
      const scrollTop = container.scrollTop;
      const centerOffset = containerHeight * 0.12; // lift the dial slightly higher toward the viewer
      const center = scrollTop + containerHeight / 2 - centerOffset;

      // Animation configuration
      const maxRotateX = 55; // Max tilt backwards in degrees
      const minScale = 0.78; // Minimum scale when fully tilted back
      const maxTranslateZ = -70; // How far back items go into the screen (closer)
      const minOpacity = 0.1; // Minimum opacity

      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        const itemTop = el.offsetTop;
        const itemHeight = el.offsetHeight;
        const itemCenter = itemTop + itemHeight / 2;

        // Distance from center (-1 to 1 range, can exceed)
        const distanceFromCenter =
          (itemCenter - center) / (containerHeight / 2);
        const absDistance = Math.abs(distanceFromCenter);

        // Clamp for smooth falloff
        const clampedDistance = Math.min(absDistance, 1.5);

        // === ROTATE X - TILT BACKWARDS INTO SCREEN ===
        // Items above center tilt backward, items below tilt toward the viewer so the row always falls onto its back
        const tiltDirection = distanceFromCenter > 0 ? -1 : 1;
        const tiltAmount = Math.pow(clampedDistance, 1.2); // Exponential for more dramatic effect at edges
        const targetRotateX = tiltDirection * tiltAmount * maxRotateX;

        // === SCALE - SHRINK AS THEY TILT BACK ===
        const scaleAmount = 1 - clampedDistance * (1 - minScale);
        const targetScale = Math.max(minScale, scaleAmount);

        // === TRANSLATE Z - PUSH BACK INTO SCREEN ===
        const depthAmount = Math.pow(Math.min(clampedDistance, 1), 0.9);
        const targetTranslateZ = depthAmount * maxTranslateZ;

        // === OPACITY - FADE AS THEY GO BACK ===
        const opacityAmount = 1 - clampedDistance * (1 - minOpacity);
        const targetOpacity = Math.max(minOpacity, opacityAmount);

        // === Z-INDEX - CLOSER ITEMS ON TOP ===
        const targetZIdx = Math.round(1000 - absDistance * 500);

        // Get or initialize state
        const s = state[i] || {
          rotateX: 0,
          scale: 1,
          translateZ: 0,
          opacity: 1,
          zIdx: 1000,
        };

        // Smooth interpolation (lerp)
        s.rotateX += (targetRotateX - s.rotateX) * smoothing;
        s.scale += (targetScale - s.scale) * smoothing;
        s.translateZ += (targetTranslateZ - s.translateZ) * smoothing;
        s.opacity += (targetOpacity - s.opacity) * smoothing;
        s.zIdx = targetZIdx;

        // Apply transforms - row stays horizontal, just tilts on X-axis (backwards/forwards)
        el.style.willChange = "transform, opacity";
        el.style.transform = `
          perspective(1000px)
          translateZ(${s.translateZ}px)
          rotateX(${s.rotateX}deg)
          scale(${s.scale})
        `;
        el.style.opacity = `${s.opacity}`;
        el.style.zIndex = `${s.zIdx}`;
        el.style.pointerEvents = s.opacity > 0.3 ? "auto" : "none";
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(step);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [rankings.length]);

  React.useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const adjustPadding = () => {
      const containerHeight = container.clientHeight;
      if (!containerHeight) return;
      const referenceItem = itemRefs.current.find(Boolean);
      const itemHeight = referenceItem?.offsetHeight ?? 70;
      const padding = Math.max((containerHeight - itemHeight) / 2, 0);
      container.style.paddingTop = `${padding}px`;
      container.style.paddingBottom = `${padding}px`;
    };

    adjustPadding();
    window.addEventListener("resize", adjustPadding);
    return () => window.removeEventListener("resize", adjustPadding);
  }, [rankings.length]);

  const START_INDEX = 1; // zero-based 2nd card

  // Keep the chosen ranking centered after load so we always start at the desired position
  React.useEffect(() => {
    if (!listRef.current) return;
    const container = listRef.current;
    const groupSize = rankings.length || 1;
    const middleGroup = Math.floor(RANKING_REPEAT_GROUPS / 2);
    const indexInGroup = Math.min(START_INDEX, groupSize - 1);
    const maxIndex = Math.max(itemRefs.current.length - 1, 0);
    const desiredIndex = Math.min(
      middleGroup * groupSize + indexInGroup,
      maxIndex
    );

    const alignStart = () => {
      const target = itemRefs.current[desiredIndex];
      if (!target) return;
      const offset =
        target.offsetTop - container.clientHeight / 2 + target.offsetHeight / 2;
      container.scrollTop = Math.max(0, offset);
    };

    let rafId = 0;
    const waitForItem = () => {
      alignStart();
      if (!itemRefs.current[desiredIndex]) {
        rafId = requestAnimationFrame(waitForItem);
      }
    };

    rafId = requestAnimationFrame(waitForItem);
    return () => cancelAnimationFrame(rafId);
  }, [rankings.length]);

  return (
    <div className="bg-black/30 rounded-lg border border-[#808080]/20 px-4 md:px-12 py-6 lg:min-h-[500px] lg:max-h-[500px] overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center justify-center space-x-2 w-full">
          <Image src="/startRanking.png" width={14} height={14} alt="star" />
          <h2 className="text-white text-[1.4rem] font-medium">Hot Pairs</h2>
        </div>
      </div>

      <div
        ref={threeRef}
        className="absolute inset-0 z-0 pt-[-100px] pointer-events-none"
      />
      <div
        ref={listRef}
        className="h-[480px] md:h-[500px] overflow-y-scroll no-scrollbar space-y-5 relative z-10 overscroll-contain"
        style={{
          perspective: "1400px",
          transformStyle: "preserve-3d",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {Array.from({ length: RANKING_REPEAT_GROUPS }).flatMap((_, groupIdx) =>
          rankings.map((item, index) => {
            const keyIndex = groupIdx * rankings.length + index;
            return (
              <div
                key={`${keyIndex}-${item.id}`}
                ref={(el) => {
                  itemRefs.current[keyIndex] = el;
                }}
                className={`relative h-[70px] rounded-3xl overflow-visible ${
                  index === 0 ? "shadow-[0_0_30px_5px_rgba(239,68,68,0.3)]" : ""
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "visible",
                  transformOrigin: "center center",
                }}
              >
                {/* Glass border effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl border border-white/10 z-10 ${
                    index === 0
                      ? "shadow-[0_0_56px_2px_rgba(239,68,68,0.5)]"
                      : ""
                  }`}
                  style={index === 0 ? { transform: "translateZ(0)" } : {}}
                />

                {/* Main gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-2xl`}
                />

                <div className="relative z-20 px-4 py-3 h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3 w-full">
                      <span className="relative">
                        <span
                          className={`text-[8.5rem] font-normal absolute top-[-110px] left-[0px] md:left-[30px] z-20 bg-clip-text text-transparent bg-gradient-to-b ${item.textGradient}`}
                        >
                          {item.rank}
                        </span>
                        <span
                          className={`absolute z-20 bg-clip-text text-transparent bg-gradient-to-b ${
                            item.textGradient
                          } ${
                            item.rank === 1
                              ? "text-[2.2rem] left-[45px] md:left-[70px] top-[-9px]"
                              : item.rank === 2
                              ? "text-[2rem] left-[65px] md:left-[85px] top-[-11px]"
                              : item.rank === 3
                              ? "text-[1.8rem] left-[70px] md:left-[100px] top-[-2px]"
                              : item.rank === 4
                              ? "text-[1.6rem] left-[80px] md:left-[110px] top-[-2px]"
                              : "text-[1.5rem] left-[80px] md:left-[105px] top-[-2px]"
                          }`}
                        >
                          {getRankDisplay(item.rank).suffix}
                        </span>
                      </span>
                      <div className="flex items-center w-full">
                        <div className="flex items-center justify-between ml-28 md:ml-36 w-full">
                          <div className="flex items-center space-x-3">
                            {item.image ? (
                              <Image
                                src={item.image}
                                width={40}
                                height={40}
                                className="rounded-full"
                                alt="Token Image"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-black/50 animate-pulse"></div>
                            )}
                            <div className="text-white text-[1.1rem] flex flex-col justify-start gap-0 font-medium">
                              <span className="flex items-center gap-1">
                                {item.symbol}
                                {/* {isStakedZig(item) && (
                                  <span className="text-[10px] text-[#CECECE]">
                                    (Liquid Staked Token)
                                  </span>
                                )} */}
                              </span>
                              <span className="text-[#CECECE] text-xs font-normal">
                                {" "}
                                / ZIG
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-normal text-white flex flex-col items-end">
                            <div>{item.current_price.toFixed(6)}</div>
                            <div>
                              {item.id?.startsWith("ibc/") ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                <span
                                  className={
                                    item.price_change_percentage_24h >= 0
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }
                                >
                                  {item.price_change_percentage_24h.toFixed(2)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background pattern */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path
                      d="M20,20 L80,20 L80,80 L20,80 Z"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M30,40 L70,40 M30,50 L70,50 M30,60 L70,60"
                      stroke="white"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[150px] z-20 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
    </div>
  );
};

export default RankingComponent;
