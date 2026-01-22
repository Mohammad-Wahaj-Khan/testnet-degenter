"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Wallet,
  Globe,
  Zap,
  TrendingUp,
  Flame,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Star,
  ExternalLink,
  Loader2,
  Filter,
  X,
  Check,
} from "lucide-react";

interface Token {
  rank: number;
  symbol: string;
  name: string;
  priceNative: number;
  priceUsd: number;
  holders: number;
  mcapNative: number | null;
  mcapUsd: number | null;
  volNative: number;
  volUsd: number;
  imageUri: string | null;
  priceChange?: {
    "30m": number;
    "1h": number;
    "4h": number;
    "24h": number;
  };
  h1?: string;
  h4?: string;
  h24?: string;
  liq?: string;
  ticker?: string;
  mc?: string;
  tokenId?: string;
  change24hPct?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(decimals)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(decimals)}K`;
  }
  return `$${num.toFixed(decimals)}`;
};

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  align?: "left" | "right";
  locked?: boolean;
}

const FindGemsMain = () => {
  type TabType = 'trending' | 'gainers' | 'losers';
  
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [timeframe, setTimeframe] = useState<string>("24h");

  // Define available timeframes for each tab
  const tabTimeframes = {
    trending: ["1H", "4H", "24H"],
    gainers: ["1H", "4H", "24H"],
    losers: ["1H", "4H", "24H"],
  } as const;
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "rank", label: "#", visible: true, align: "left" },
    { id: "token", label: "Token", visible: true, align: "left", locked: true },
    { id: "price", label: "Price", visible: true, align: "left", locked: true },
    { id: "h1", label: "1H %", visible: false, align: "left" },
    { id: "h4", label: "4H %", visible: false, align: "left" },
    { id: "h24", label: "24H %", visible: true, align: "left" },
    { id: "mc", label: "MC", visible: false, align: "right" },
    {
      id: "volume",
      label: "Volume (24h)",
      visible: true,
      align: "right",
      locked: true,
    },
    { id: "holders", label: "Holders", visible: true, align: "right" },
    { id: "actions", label: "", visible: true, align: "right" },
  ]);

  const toggleColumn = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (column?.locked) return; // Don't toggle if column is locked

    setColumns(
      columns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const resetFilters = () => {
    setColumns(
      columns.map((col) => ({
        ...col,
        visible: true,
      }))
    );
  };

  const fetchTokenDetails = async (tokenId: string) => {
    try {
      const response = await fetch(`${API_URL}/tokens/${tokenId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error("Error fetching token details:", error);
      return null;
    }
  };

  const fetchGainersLosers = async (
    type: "gainers" | "losers",
    timeframe: string
  ) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/tokens/${type}?timeframe=${timeframe}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const formattedTokens = data.data.map((token: any, index: number) => ({
          rank: index + 1,
          symbol: token.symbol,
          name: token.name || token.symbol,
          priceNative: token.priceNative,
          priceUsd: token.priceUsd,
          holders: token.holders,
          mcapNative: token.mcapNative,
          mcapUsd: token.mcapUsd,
          volNative: token.volNative,
          volUsd: token.volUsd || 0,
          imageUri: token.imageUri,
          priceChange: {
            "30m": 0,
            "1h": 0,
            "4h": 0,
            "24h": token.change24hPct || 0,
          },
          h1: formatPriceChange(0),
          h4: formatPriceChange(0),
          h24: formatPriceChange(token.change24hPct || 0),
          liq: formatNumber(token.volUsd || 0),
          mc: token.mcapUsd ? formatNumber(token.mcapUsd) : "N/A",
          ticker: token.symbol,
          tokenId: token.tokenId,
          change24hPct: token.change24hPct || 0,
        }));

        setTokens(formattedTokens);
      } else {
        setError("Invalid data format from API");
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(`Failed to fetch ${type}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const formatPriceChange = (change: number | undefined): string => {
    if (change === undefined) return "0.00%";
    return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
  };

  const renderPriceChange = (timeKey: "1h" | "4h" | "24h", token: Token) => {
    let change = 0;

    // If we have direct change24hPct (from gainers/losers API), use that for 24h
    if (timeKey === "24h" && token.change24hPct !== undefined) {
      change = token.change24hPct;
    } else {
      // Fall back to priceChange object for other timeframes
      change = token.priceChange?.[timeKey] ?? 0;
    }

    const displayValue = formatPriceChange(change);

    return (
      <span
        className={
          change > 0
            ? "text-green-500"
            : change < 0
            ? "text-red-500"
            : "text-gray-400"
        }
      >
        {displayValue}
      </span>
    );
  };

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);

        if (activeTab === "gainers" || activeTab === "losers") {
          // Use the new API endpoint for gainers and losers
          await fetchGainersLosers(activeTab, timeframe);
          return;
        }

        // Original trending tokens fetch
        const response = await fetch(`${API_URL}/tokens`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // First, get basic token data
          const tokensWithBasicData = data.data
            .filter((token: any) => token.symbol && token.priceUsd > 0)
            .slice(0, 50); // Limit to top 50 tokens for performance

          // Then fetch detailed price change data for each token
          const tokensWithDetails = await Promise.all(
            tokensWithBasicData.map(async (token: any) => {
              const details = await fetchTokenDetails(
                token.tokenId || token.symbol
              );
              return {
                rank: 0, // Will be set after sorting
                symbol: token.symbol,
                name: token.name || token.symbol,
                priceNative: token.priceNative,
                priceUsd: token.priceUsd,
                holders: token.holders,
                mcapNative: token.mcapNative,
                mcapUsd: token.mcapUsd,
                volNative: token.volNative,
                volUsd: token.volUsd || 0,
                imageUri: token.imageUri,
                priceChange: details?.price?.changePct || {
                  "30m": 0,
                  "1h": 0,
                  "4h": 0,
                  "24h": 0,
                },
                h1: formatPriceChange(details?.price?.changePct?.["1h"]),
                h4: formatPriceChange(details?.price?.changePct?.["4h"]),
                h24: formatPriceChange(details?.price?.changePct?.["24h"]),
                liq: formatNumber(token.volUsd || 0),
                mc: token.mcapUsd ? formatNumber(token.mcapUsd) : "N/A",
                ticker: token.symbol,
                tokenId: token.tokenId,
                change24hPct: details?.price?.changePct?.["24h"] || 0,
              };
            })
          );

          // Sort based on active tab and timeframe
          const sortedTokens = [...tokensWithDetails].sort(
            (a: Token, b: Token) => {
              if ((activeTab as TabType) === 'gainers') {
                return (b.change24hPct || 0) - (a.change24hPct || 0);
              } else if ((activeTab as TabType) === 'losers') {
                return (a.change24hPct || 0) - (b.change24hPct || 0);
              } else {
                // Default: sort by volume for trending
                return (b.volUsd || 0) - (a.volUsd || 0);
              }
            }
          );

          // Update ranks after sorting
          const rankedTokens = sortedTokens.map((token, index) => ({
            ...token,
            rank: index + 1,
          }));

          setTokens(rankedTokens);
        } else {
          setError("Invalid data format from API");
        }
      } catch (err) {
        console.error("Error fetching tokens:", err);
        setError("Failed to fetch tokens. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [activeTab, timeframe]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#E5E7EB] font-sans selection:bg-yellow-500/30">
      {/* Sub Header / Filters */}
      <div className="px-8 py-4">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#1a1a1a] rounded-lg border border-white/5 mb-4 w-fit">
          {tabTimeframes[activeTab]?.map((period) => {
            const periodLower = period.toLowerCase();
            return (
              <button
                key={period}
                onClick={() => setTimeframe(periodLower)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  timeframe === periodLower
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {period}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 my-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-4">
              {/* Trending Section */}
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">TRENDING</div>
                <div className="flex bg-[#1a1a1a] p-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  {tabTimeframes.trending.map((period) => (
                    <button
                      key={`trending-${period}`}
                      onClick={() => {
                        setActiveTab("trending");
                        setTimeframe(period.toLowerCase());
                      }}
                      className={`px-3 py-1.5 rounded transition-colors ${
                        activeTab === "trending" &&
                        timeframe === period.toLowerCase()
                          ? "bg-[#2a2a2a] text-yellow-500"
                          : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Gainers Section */}
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">TOP GAINERS</div>
                <div className="flex bg-[#1a1a1a] p-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  {tabTimeframes.gainers.map((period) => (
                    <button
                      key={`gainers-${period}`}
                      onClick={() => {
                        setActiveTab("gainers");
                        setTimeframe(period.toLowerCase());
                      }}
                      className={`px-3 py-1.5 rounded transition-colors ${
                        activeTab === "gainers" &&
                        timeframe === period.toLowerCase()
                          ? "bg-[#2a2a1a] text-green-500"
                          : "text-gray-500 hover:text-green-400 hover:bg-white/5"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Losers Section */}
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">TOP LOSERS</div>
                <div className="flex bg-[#1a1a1a] p-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  {tabTimeframes.losers.map((period) => (
                    <button
                      key={`losers-${period}`}
                      onClick={() => {
                        setActiveTab("losers");
                        setTimeframe(period.toLowerCase());
                      }}
                      className={`px-3 py-1.5 rounded transition-colors ${
                        activeTab === "losers" &&
                        timeframe === period.toLowerCase()
                          ? "bg-[#2a1a1a] text-red-500"
                          : "text-gray-500 hover:text-red-400 hover:bg-white/5"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2 rounded-md text-sm hover:bg-[#2a2a2a] transition-colors"
            >
              <Filter size={16} className="text-yellow-500" />
              <span>Columns</span>
              {showColumnSelector ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-md shadow-lg z-10">
                <div className="p-2 border-b border-white/10 flex justify-between items-center">
                  <span className="text-sm font-medium">Customize Columns</span>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-yellow-500 hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {columns.map((column) => (
                    <label
                      key={column.id}
                      className={`flex items-center px-4 py-2 ${
                        column.locked
                          ? "opacity-50"
                          : "hover:bg-white/5 cursor-pointer"
                      }`}
                      onClick={(e) => {
                        if (!column.locked) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={() => toggleColumn(column.id)}
                          disabled={column.locked}
                          className={`h-4 w-4 rounded border-gray-600 focus:ring-yellow-500 bg-transparent ${
                            column.locked
                              ? "text-gray-500"
                              : "text-yellow-500 cursor-pointer"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <span
                        className={`ml-3 text-sm ${
                          column.locked ? "text-gray-500" : "text-gray-300"
                        }`}
                      >
                        {column.label}
                        {column.locked && (
                          <span className="ml-2 text-xs text-gray-500">
                            (Locked)
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-white/5 rounded-lg bg-black/20">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2
                className="animate-spin text-yellow-500 mr-2"
                size={24}
              />
              <span>Loading tokens...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="ml-2 text-yellow-500 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-gray-500 border-b border-white/5 uppercase text-[11px] font-bold">
                  {columns.find((c) => c.id === "rank")?.visible && (
                    <th className="py-4 px-4 w-10 text-left">#</th>
                  )}
                  {columns.find((c) => c.id === "token")?.visible && (
                    <th className="py-4 px-4 text-left">Token</th>
                  )}
                  {columns.find((c) => c.id === "price")?.visible && (
                    <th className="py-4 px-4 text-left">Price</th>
                  )}
                  {columns.find((c) => c.id === "h1")?.visible && (
                    <th
                      className="py-4 px-4 text-gray-500 cursor-pointer hover:text-white"
                      onClick={() => setTimeframe("1h")}
                    >
                      <div className="flex items-center">
                        1H %
                        {timeframe === "1h" && (
                          <ChevronUp size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                  )}
                  {columns.find((c) => c.id === "h4")?.visible && (
                    <th
                      className="py-4 px-4 text-gray-500 cursor-pointer hover:text-white"
                      onClick={() => setTimeframe("4h")}
                    >
                      <div className="flex items-center">
                        4H %
                        {timeframe === "4h" && (
                          <ChevronUp size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                  )}
                  {columns.find((c) => c.id === "h24")?.visible && (
                    <th
                      className="py-4 px-4 text-gray-500 cursor-pointer hover:text-white"
                      onClick={() => setTimeframe("24h")}
                    >
                      <div className="flex items-center">
                        24H %
                        {timeframe === "24h" && (
                          <ChevronUp size={14} className="ml-1" />
                        )}
                      </div>
                    </th>
                  )}
                  {columns.find((c) => c.id === "mc")?.visible && (
                    <th className="py-4 px-4 text-right">MC</th>
                  )}
                  {columns.find((c) => c.id === "volume")?.visible && (
                    <th className="py-4 px-4 text-right">Volume (24h)</th>
                  )}
                  {columns.find((c) => c.id === "holders")?.visible && (
                    <th className="py-4 px-4 text-right">Holders</th>
                  )}
                  {columns.find((c) => c.id === "actions")?.visible && (
                    <th className="py-4 px-4 w-10"></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tokens.map((token) => (
                  <tr
                    key={token.rank}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => router.push(`/token/${token.symbol}`)}
                  >
                    {columns.find((c) => c.id === "rank")?.visible && (
                      <td className="py-4 px-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Star
                            size={14}
                            className="group-hover:text-yellow-500"
                          />
                          {token.rank}
                        </div>
                      </td>
                    )}

                    {columns.find((c) => c.id === "token")?.visible && (
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {token.imageUri ? (
                            <img
                              src={token.imageUri}
                              alt={token.name}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://via.placeholder.com/32";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                          )}
                          <div>
                            <div className="font-bold flex items-center gap-1">
                              {token.name}{" "}
                              <span className="text-[10px] text-gray-500 font-normal">
                                {token.symbol}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500">
                              ZIG Chain
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {columns.find((c) => c.id === "price")?.visible && (
                      <td className="py-4 px-4 font-medium">
                        ${token.priceUsd.toFixed(6)}
                      </td>
                    )}

                    {columns.find((c) => c.id === "h1")?.visible && (
                      <td
                        className={`py-4 px-4 font-medium ${
                          token.h1?.startsWith("-")
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {token.h1 || "0.00%"}
                      </td>
                    )}

                    {columns.find((c) => c.id === "h4")?.visible && (
                      <td
                        className={`py-4 px-4 font-medium ${
                          token.h4?.startsWith("-")
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {token.h4 || "0.00%"}
                      </td>
                    )}

                    {columns.find((c) => c.id === "h24")?.visible && (
                      <td
                        className={`py-4 px-4 font-medium ${
                          token.h24?.startsWith("-")
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {token.h24 || "0.00%"}
                      </td>
                    )}

                    {columns.find((c) => c.id === "mc")?.visible && (
                      <td className="py-4 px-4 text-right font-medium">
                        {token.mcapUsd ? formatNumber(token.mcapUsd) : "N/A"}
                      </td>
                    )}

                    {columns.find((c) => c.id === "volume")?.visible && (
                      <td className="py-4 px-4 text-right font-medium text-gray-300">
                        {formatNumber(token.volUsd)}
                      </td>
                    )}

                    {columns.find((c) => c.id === "holders")?.visible && (
                      <td className="py-4 px-4 text-right font-medium text-gray-300">
                        {token.holders.toLocaleString()}
                      </td>
                    )}

                    {columns.find((c) => c.id === "actions")?.visible && (
                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/token/${token.symbol}`);
                          }}
                          className="text-gray-600 hover:text-white transition-colors"
                          title="View token performance"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindGemsMain;
