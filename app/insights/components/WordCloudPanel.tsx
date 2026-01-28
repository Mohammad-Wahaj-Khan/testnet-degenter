"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// --- Design Constants ---
const COLORS = [
  "#FF4D4D",
  "#4ADE80",
  "#38BDF8",
  "#FBBF24",
  "#A78BFA",
  "#F472B6",
  "#94A3B8",
];
const ROTATIONS = [0, 90, -45, 45, 0, 0];

type TokenPosition = {
  left: number;
  top: number;
  rotation: number;
  color: string;
  fontSize: number;
  width: number;
  height: number;
};

type TokenWithPosition = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  position: TokenPosition;
};

const WordCloudPanel = () => {
  const [tokens, setTokens] = useState<TokenWithPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredToken, setHoveredToken] = useState<TokenWithPosition | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Robust Overlap Detection (AABB)
  const isOverlapping = (rect1: any, existingRects: any[]) => {
    const padding = 2; // Extra gap between tokens
    return existingRects.some((rect2) => {
      return !(
        rect1.x + rect1.w + padding < rect2.x ||
        rect1.x > rect2.x + rect2.w + padding ||
        rect1.y + rect1.h + padding < rect2.y ||
        rect1.y > rect2.y + rect2.h + padding
      );
    });
  };

  const generateLayout = useCallback((data: any[]) => {
    const marketCaps = data.map((t) => t.mcapUsd);
    const minMcap = Math.min(...marketCaps);
    const maxMcap = Math.max(...marketCaps);

    const placedRects: any[] = [];
    const result: TokenWithPosition[] = [];

    // Place largest tokens first (center-outwards)
    const sortedData = [...data].sort((a, b) => b.mcapUsd - a.mcapUsd);

    sortedData.forEach((token) => {
      const sizeWeight =
        (Math.log10(token.mcapUsd) - Math.log10(minMcap)) /
        (Math.log10(maxMcap) - Math.log10(minMcap));

      const fontSize = 12 + sizeWeight * 42;
      const rotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];

      // Calculate bounding box based on rotation
      const textWidth = token.symbol.length * fontSize * 0.65;
      const textHeight = fontSize * 1.1;
      const w = Math.abs(rotation) === 90 ? textHeight : textWidth;
      const h = Math.abs(rotation) === 90 ? textWidth : textHeight;

      let angle = 0;
      let radius = 0;
      let placed = false;

      // Spiral outwards to find the first available gap
      while (!placed && radius < 600) {
        // Horizontal Ellipse multipliers (match image aspect ratio)
        const x = 50 + radius * 0.16 * Math.cos(angle);
        const y = 50 + radius * 0.08 * Math.sin(angle);

        // Grid-based bounding box for collision check
        const currentRect = {
          x: x - w / 20,
          y: y - h / 20,
          w: w / 10,
          h: h / 10,
        };

        if (!isOverlapping(currentRect, placedRects)) {
          placedRects.push(currentRect);
          result.push({
            id: token.tokenId,
            symbol: token.symbol,
            name: token.name,
            price: token.priceUsd,
            priceChange24h:
              token.priceChange24h !== undefined &&
              token.priceChange24h !== null
                ? token.priceChange24h
                : 0,
            marketCap: token.mcapUsd,
            volume24h: token.volUsd,
            position: {
              left: x,
              top: y,
              rotation,
              fontSize,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              width: w,
              height: h,
            },
          });
          placed = true;
        }
        angle += 0.3; // Incremental search
        radius += 0.4;
      }
    });
    return result;
  }, []);

  const fetchTokenData = async (symbol: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/tokens/${symbol.toLowerCase()}`
      );
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First, fetch the list of tokens
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/tokens`
        );
        const data = await response.json();

        if (data.success) {
          // Filter tokens with positive market cap
          const filteredTokens = data.data.filter((t: any) => t.mcapUsd > 0);

          // Fetch detailed data for each token to get 24h change
          const tokensWithDetails = await Promise.all(
            filteredTokens.map(async (token: any) => {
              const details = await fetchTokenData(token.symbol);
              return {
                ...token,
                priceChange24h: details?.priceChange?.["24h"] || 0,
                price: details?.priceInUsd || token.priceUsd || 0,
                volume24h: details?.volumeUSD?.["24h"] || 0,
              };
            })
          );

          setTokens(generateLayout(tokensWithDetails));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [generateLayout]);

  return (
    <div className="relative w-full h-[600px] bg-[#141414] flex items-center justify-center overflow-hidden font-sans select-none border border-zinc-800 rounded-xl">
      {/* Background Dimming layer */}
      <div
        className={`absolute inset-0 z-10 bg-black/50 backdrop-blur-[3px] transition-opacity duration-500 pointer-events-none ${
          hoveredToken ? "opacity-100" : "opacity-0"
        }`}
      />

      <div ref={containerRef} className="relative w-full h-full">
        {!loading &&
          tokens.map((token) => {
            const isHovered = hoveredToken?.id === token.id;
            return (
              <div
                key={token.id}
                onMouseEnter={() => setHoveredToken(token)}
                onMouseLeave={() => setHoveredToken(null)}
                className="absolute cursor-pointer transition-all duration-300 whitespace-nowrap"
                style={{
                  left: `${token.position.left}%`,
                  top: `${token.position.top}%`,
                  transform: `translate(-50%, -50%) rotate(${
                    token.position.rotation
                  }deg) scale(${isHovered ? 1.15 : 1})`,
                  fontSize: `${token.position.fontSize}px`,
                  color: token.position.color,
                  fontWeight: token.position.fontSize > 30 ? "900" : "600",
                  zIndex: isHovered ? 50 : 5,
                  opacity: hoveredToken && !isHovered ? 0.2 : 1,
                  filter: hoveredToken && !isHovered ? "blur(4px)" : "none",
                  textShadow: isHovered
                    ? `0 0 20px ${token.position.color}aa`
                    : "none",
                }}
              >
                {token.symbol}
              </div>
            );
          })}
      </div>

      {/* Dynamic Side-Positioned Detail Card */}
      {hoveredToken && (
        <div
          className="absolute z-[60] w-[260px] bg-[#1e1e1e] border border-zinc-700 p-4 rounded shadow-2xl animate-in fade-in duration-200"
          style={{
            // Logic: Place card to the right if token is on the left half, else left.
            left:
              hoveredToken.position.left > 70
                ? "auto"
                : `${hoveredToken.position.left + 5}%`,
            right:
              hoveredToken.position.left > 70
                ? `${100 - hoveredToken.position.left + 5}%`
                : "auto",
            top: `${Math.min(Math.max(hoveredToken.position.top, 20), 80)}%`, // Keep card in bounds
            transform: "translateY(-50%)",
          }}
        >
          <div className="text-white font-bold border-b border-zinc-800 pb-2 mb-2 flex justify-between">
            <span>{hoveredToken.symbol}</span>
            <span className="text-green-400 text-xs font-mono">
              ${hoveredToken.price.toFixed(5)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] text-zinc-500 uppercase">
                24h Change
              </span>
              <span
                className={`text-xs font-medium ${
                  hoveredToken.priceChange24h >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {hoveredToken.priceChange24h >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(hoveredToken.priceChange24h).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-zinc-500 uppercase">
                24h Vol
              </span>
              <span className="text-zinc-200 text-xs">
                ${(hoveredToken.volume24h / 1000).toFixed(1)}K
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordCloudPanel;
