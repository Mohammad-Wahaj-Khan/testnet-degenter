"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// --- Design Constants ---
const COLORS = [
  "#FF4D4D", // Red
  "#4ADE80", // Green
  "#38BDF8", // Blue
  "#FBBF24", // Yellow
  "#A78BFA", // Purple
  "#F472B6", // Pink
  "#94A3B8", // Gray
  "#FB923C", // Orange
  "#22D3EE", // Cyan
  "#E879F9", // Magenta
];

const ROTATIONS = [0, 90, -45, 45, 0, 0, -90, 30, -30];

type TokenPosition = {
  left: number;
  top: number;
  rotation: number;
  color: string;
  fontSize: number;
  width: number;
  height: number;
};

type PricePoint = {
  time: string;
  price: number;
};

type TokenWithPosition = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  occurrences: number;
  priceHistory: PricePoint[];
  position: TokenPosition;
};

// Mock price history data generator
const generatePriceHistory = (basePrice: number): PricePoint[] => {
  const data: PricePoint[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const randomChange = (Math.random() - 0.5) * 0.1;
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      price: basePrice * (1 + randomChange * (24 - i) / 24),
    });
  }
  return data;
};

const WordCloudPanel = () => {
  const [tokens, setTokens] = useState<TokenWithPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredToken, setHoveredToken] = useState<TokenWithPosition | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenWithPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sortedTokens = useMemo(
    () => [...tokens].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)),
    [tokens]
  );

  // Robust Overlap Detection (AABB)
  const isOverlapping = (rect1: any, existingRects: any[]) => {
    const padding = 4;
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
    const occurrences = data.map((t) => t.occurrences || t.mcapUsd || 100);
    const minOcc = Math.min(...occurrences);
    const maxOcc = Math.max(...occurrences);

    const placedRects: any[] = [];
    const result: TokenWithPosition[] = [];

    // Place largest tokens first (center-outwards)
    const sortedData = [...data].sort((a, b) => 
      (b.occurrences || b.mcapUsd || 0) - (a.occurrences || a.mcapUsd || 0)
    );

    sortedData.forEach((token, index) => {
      const occValue = token.occurrences || token.mcapUsd || 100;
      const sizeWeight =
        (Math.log10(Math.max(occValue, 10)) - Math.log10(Math.max(minOcc, 10))) /
        (Math.log10(Math.max(maxOcc, 10)) - Math.log10(Math.max(minOcc, 10)) + 0.1);

      const fontSize = 11 + sizeWeight * 38;
      const rotation = ROTATIONS[index % ROTATIONS.length];

      // Calculate bounding box based on rotation
      const textWidth = token.symbol.length * fontSize * 0.6;
      const textHeight = fontSize * 1.2;
      const rad = (Math.abs(rotation) * Math.PI) / 180;
      const w = Math.abs(textWidth * Math.cos(rad)) + Math.abs(textHeight * Math.sin(rad));
      const h = Math.abs(textWidth * Math.sin(rad)) + Math.abs(textHeight * Math.cos(rad));

      let angle = 0;
      let radius = 0;
      let placed = false;

      // Spiral outwards to find the first available gap
      while (!placed && radius < 500) {
        // Horizontal Ellipse multipliers (match image aspect ratio ~3:1)
        const x = 50 + radius * 0.18 * Math.cos(angle);
        const y = 50 + radius * 0.1 * Math.sin(angle);

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
            id: token.tokenId || token.id || `token-${index}`,
            symbol: token.symbol,
            name: token.name || token.symbol,
            price: token.priceUsd || token.price || 0,
            priceChange24h:
              token.priceChange24h !== undefined && token.priceChange24h !== null
                ? token.priceChange24h
                : 0,
            marketCap: token.mcapUsd || token.marketCap || 0,
            volume24h: token.volUsd || token.volume24h || 0,
            occurrences: token.occurrences || Math.floor(Math.random() * 100) + 10,
            priceHistory: generatePriceHistory(token.priceUsd || token.price || 1),
            position: {
              left: x,
              top: y,
              rotation,
              fontSize,
              color: COLORS[index % COLORS.length],
              width: w,
              height: h,
            },
          });
          placed = true;
        }
        angle += 0.25;
        radius += 0.35;
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
          // Filter tokens with positive market cap or occurrences
          const filteredTokens = data.data.filter((t: any) => 
            (t.mcapUsd > 0) || (t.occurrences > 0)
          );

          // Fetch detailed data for each token to get 24h change
          const tokensWithDetails = await Promise.all(
            filteredTokens.map(async (token: any) => {
              const details = await fetchTokenData(token.symbol);
              return {
                ...token,
                occurrences: token.occurrences || Math.floor(Math.random() * 200) + 20,
                priceChange24h: details?.priceChange?.["24h"] || 
                  details?.priceChange24h || 
                  (Math.random() - 0.5) * 20,
                price: details?.priceInUsd || details?.priceUsd || token.priceUsd || 0,
                volume24h: details?.volumeUSD?.["24h"] || details?.volume24h || 0,
              };
            })
          );

          setTokens(generateLayout(tokensWithDetails));
        } else {
          // Fallback mock data if API fails
          const mockData = [
            { symbol: "Pump.fun", name: "Pump.fun", mcapUsd: 1000000, occurrences: 500 },
            { symbol: "Raydium", name: "Raydium", mcapUsd: 800000, occurrences: 420 },
            { symbol: "Jupiter", name: "Jupiter", mcapUsd: 600000, occurrences: 380 },
            { symbol: "Meteora", name: "Meteora", mcapUsd: 450000, occurrences: 320 },
            { symbol: "Goosefx.io", name: "GooseFX", mcapUsd: 300000, occurrences: 48 },
            { symbol: "Jito", name: "Jito", mcapUsd: 280000, occurrences: 150 },
            { symbol: "Marinade", name: "Marinade", mcapUsd: 250000, occurrences: 140 },
            { symbol: "Solend", name: "Solend", mcapUsd: 220000, occurrences: 130 },
            { symbol: "Drift", name: "Drift", mcapUsd: 200000, occurrences: 120 },
            { symbol: "Zeta", name: "Zeta", mcapUsd: 180000, occurrences: 110 },
            { symbol: "Bonk", name: "Bonk", mcapUsd: 160000, occurrences: 100 },
            { symbol: "WIF", name: "Dogwifhat", mcapUsd: 150000, occurrences: 95 },
            { symbol: "BOME", name: "Book of Meme", mcapUsd: 140000, occurrences: 90 },
            { symbol: "POPCAT", name: "Popcat", mcapUsd: 130000, occurrences: 85 },
            { symbol: "W", name: "Wormhole", mcapUsd: 120000, occurrences: 80 },
            { symbol: "TNSR", name: "Tensor", mcapUsd: 110000, occurrences: 75 },
            { symbol: "KMNO", name: "Kamino", mcapUsd: 100000, occurrences: 70 },
            { symbol: "CLOUD", name: "Cloud", mcapUsd: 95000, occurrences: 65 },
            { symbol: "USDC", name: "USD Coin", mcapUsd: 90000, occurrences: 60 },
            { symbol: "SOL", name: "Solana", mcapUsd: 85000, occurrences: 55 },
          ];
          setTokens(generateLayout(mockData));
        }
      } catch (err) {
        console.error(err);
        // Fallback mock data
        const mockData = [
          { symbol: "Pump.fun", name: "Pump.fun", mcapUsd: 1000000, occurrences: 500 },
          { symbol: "Raydium", name: "Raydium", mcapUsd: 800000, occurrences: 420 },
          { symbol: "Jupiter", name: "Jupiter", mcapUsd: 600000, occurrences: 380 },
          { symbol: "Meteora", name: "Meteora", mcapUsd: 450000, occurrences: 320 },
          { symbol: "Goosefx.io", name: "GooseFX", mcapUsd: 300000, occurrences: 48 },
        ];
        setTokens(generateLayout(mockData));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [generateLayout]);

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
  };
  const activeToken = selectedToken ?? hoveredToken;

  return (
    <div className="w-full font-sans select-none">
      <div className="relative w-full h-[600px] bg-[#1a1a1a] flex items-center justify-center overflow-hidden rounded-xl">
      {/* Background Dimming layer */}
      <div
        className={`absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-none ${
          hoveredToken ? "opacity-100" : "opacity-0"
        }`}
      />

      <div ref={containerRef} className="relative w-full h-full pr-[330px]">
        {!loading &&
          tokens.map((token) => {
            const isHovered = hoveredToken?.id === token.id;
            return (
              <div
                key={token.id}
                onMouseEnter={() => setHoveredToken(token)}
                onMouseLeave={() => {
                  if (!selectedToken) setHoveredToken(null);
                }}
                onClick={() => setSelectedToken(token)}
                className="absolute cursor-pointer transition-all duration-300 whitespace-nowrap"
                style={{
                  left: `${token.position.left}%`,
                  top: `${token.position.top}%`,
                  transform: `translate(-50%, -50%) rotate(${
                    token.position.rotation
                  }deg) scale(${isHovered ? 1.15 : 1})`,
                  fontSize: `${token.position.fontSize}px`,
                  color: token.position.color,
                  fontWeight: token.position.fontSize > 28 ? "800" : "600",
                  zIndex: isHovered ? 50 : 5,
                  opacity: activeToken && activeToken.id !== token.id ? 0.2 : 1,
                  filter: activeToken && activeToken.id !== token.id ? "blur(2px)" : "none",
                  textShadow: isHovered
                    ? `0 0 15px ${token.position.color}80, 0 0 30px ${token.position.color}40`
                    : "0 2px 4px rgba(0,0,0,0.5)",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {token.symbol}
              </div>
            );
          })}
      </div>

      {/* All tokens details with mini charts */}
      {!loading && (
        <div className="absolute right-0 top-0 z-[55] h-full w-[330px] border-l border-zinc-800 bg-[#151515]/95 backdrop-blur-sm">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-100">All Tokens</h3>
            <p className="text-xs text-zinc-400">{sortedTokens.length} tokens</p>
          </div>
          <div className="h-[calc(100%-58px)] overflow-y-auto p-3 space-y-2">
            {sortedTokens.map((token) => (
              <div
                key={`detail-${token.id}`}
                onMouseEnter={() => setHoveredToken(token)}
                onMouseLeave={() => {
                  if (!selectedToken) setHoveredToken(null);
                }}
                onClick={() => setSelectedToken(token)}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{token.symbol}</p>
                    <p className="text-[11px] text-zinc-400">{token.name}</p>
                  </div>
                  <span className={`text-xs font-semibold ${token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <p className="text-zinc-400">Price: <span className="text-zinc-200">${token.price.toFixed(6)}</span></p>
                  <p className="text-zinc-400">Vol: <span className="text-zinc-200">${formatNumber(token.volume24h)}</span></p>
                  <p className="text-zinc-400">MCap: <span className="text-zinc-200">${formatNumber(token.marketCap)}</span></p>
                  <p className="text-zinc-400">Occ: <span className="text-zinc-200">{token.occurrences}</span></p>
                </div>
                <div className="mt-2 h-[46px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={token.priceHistory}>
                      <Line type="monotone" dataKey="price" stroke={token.position.color} strokeWidth={1.8} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
            <span className="text-zinc-400 text-sm">Loading tokens...</span>
          </div>
        </div>
      )}
      </div>

      {/* {activeToken && (
        <div className="mt-3 w-full rounded-xl border border-zinc-700 bg-[#1e1e1e] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-4 border-b border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{activeToken.symbol}</h3>
                <p className="text-zinc-400 text-xs">{activeToken.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedToken && (
                  <button
                    onClick={() => {
                      setSelectedToken(null);
                      setHoveredToken(null);
                    }}
                    className="rounded-md border border-zinc-600 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                  >
                    Clear pin
                  </button>
                )}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: activeToken.position.color }}
                >
                  {activeToken.symbol.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Price</span>
              <div className="text-right">
                <span className="text-white font-bold text-xl">
                  ${activeToken.price < 0.01 
                    ? activeToken.price.toExponential(4) 
                    : activeToken.price.toFixed(6)}
                </span>
                <span 
                  className={`ml-2 text-sm font-medium ${
                    activeToken.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {activeToken.priceChange24h >= 0 ? "↑" : "↓"} 
                  {Math.abs(activeToken.priceChange24h).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Market Cap</p>
                <p className="text-zinc-200 font-semibold text-sm">${formatNumber(activeToken.marketCap)}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">24h Volume</p>
                <p className="text-zinc-200 font-semibold text-sm">${formatNumber(activeToken.volume24h)}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Occurrences</p>
                <p className="text-zinc-200 font-semibold text-sm">{activeToken.occurrences}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Rank</p>
                <p className="text-zinc-200 font-semibold text-sm">#{Math.floor(Math.random() * 500) + 1}</p>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">24h Price Trend</p>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeToken.priceHistory}>
                    <defs>
                      <linearGradient id={`gradient-${activeToken.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeToken.position.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={activeToken.position.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        fontSize: "11px",
                      }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#888" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={activeToken.position.color}
                      strokeWidth={2}
                      fill={`url(#gradient-${activeToken.id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Volume Distribution</p>
              <div className="h-[60px] flex items-end justify-between gap-1">
                {Array.from({ length: 12 }).map((_, i) => {
                  const height = Math.random() * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        backgroundColor: activeToken.position.color,
                        opacity: 0.6 + (height / 200),
                      }}
                    />
                  );
                })}
              </div>
            </div>

          </div>
          </div>
      )} */}
    </div>
  );
};

export default WordCloudPanel;
