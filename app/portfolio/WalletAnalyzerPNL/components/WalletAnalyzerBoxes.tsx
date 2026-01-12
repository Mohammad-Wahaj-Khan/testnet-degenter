"use client";

import React from "react";
import { useChain } from "@cosmos-kit/react";
import { CHAIN_NAME } from "../../../config/chain";

export const analyzerTabs = [
  { id: "trading", label: "Trading PNL" },
  { id: "portfolio", label: "Portfolio" },
  { id: "activities", label: "Activities" },
] as const;

export type AnalyzerTabId = (typeof analyzerTabs)[number]["id"];
export type TradingTimeframe = "24h" | "7d" | "10d" | "1M";

const timeframeOptions: TradingTimeframe[] = ["24h", "7d", "10d", "1M"];
const timeframeToWin: Record<TradingTimeframe, string> = {
  "24h": "24h",
  "7d": "7d",
  "10d": "10d",
  "1M": "30d",
};

type PnlTokenItem = {
  last_active?: string;
  token_balance?: string;
  position_value_usd?: string;
  realized_pnl_usd?: string;
  unrealized_pnl_usd?: string;
  total_pnl_usd?: string;
  bought_usd?: string;
  sold_usd?: string;
  net_usd?: string;
  avg_buy_price_usd?: string;
  avg_sell_price_usd?: string;
  txs_buy?: number;
  txs_sell?: number;
  hold_duration_sec?: number | string;
};

type WalletAnalyzerBoxesProps = {
  activeTab: AnalyzerTabId;
  onTabChange: (tab: AnalyzerTabId) => void;
  addressOverride?: string;
  timeframe: TradingTimeframe;
  onTimeframeChange: (timeframe: TradingTimeframe) => void;
};

export default function WalletAnalyzer({
  activeTab,
  onTabChange,
  addressOverride,
  timeframe,
  onTimeframeChange,
}: WalletAnalyzerBoxesProps) {
  const showTradingDetails = activeTab === "trading";
  const { address: connectedAddress } = useChain(CHAIN_NAME || "zigchain-1");
  const address = addressOverride?.trim() || connectedAddress;
  const apiEndpoints = React.useMemo(
    () => [
      process.env.NEXT_PUBLIC_WALLET_HOLDINGS_API ?? "http://82.208.20.12:8004",
    ],
    []
  );
  const [distribution, setDistribution] = React.useState<
    { label: string; count: number }[]
  >([]);
  const [distributionLoading, setDistributionLoading] = React.useState(false);
  const [distributionError, setDistributionError] = React.useState<string | null>(
    null
  );
  const [pnlTokens, setPnlTokens] = React.useState<PnlTokenItem[]>([]);
  const [pnlLoading, setPnlLoading] = React.useState(false);
  const [pnlError, setPnlError] = React.useState<string | null>(null);

  const safeNumber = (value: unknown): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const buildUrl = (base: string, path: string) => {
    const normalizedBase = base.replace(/\/+$/, "");
    const normalizedPath = path.replace(/^\/+/, "");
    return `${normalizedBase}/${normalizedPath}`;
  };

  const fetchFromEndpoints = async (
    endpoints: string[],
    path: string,
    init: RequestInit = {},
    label: string
  ) => {
    let lastError: string | null = null;
    for (const endpoint of endpoints) {
      try {
        const url = buildUrl(endpoint, path);
        const res = await fetch(url, {
          ...init,
        });
        if (res.ok) {
          return res.json();
        }
        lastError = `HTTP ${res.status} ${res.statusText}`;
      } catch (err) {
        lastError =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "request failed";
      }
    }
    throw new Error(
      lastError
        ? `Unable to load ${label} (${lastError})`
      : `Unable to load ${label}`
  );
  };

  React.useEffect(() => {
    if (!showTradingDetails) return;
    if (!address) {
      setPnlTokens([]);
      setPnlError(null);
      setPnlLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadPnlTokens = async () => {
      setPnlLoading(true);
      setPnlError(null);

      try {
        const win = timeframeToWin[timeframe];
        const payload = await fetchFromEndpoints(
          apiEndpoints,
          `wallets/${encodeURIComponent(
            address
          )}/pnl/tokens?win=${encodeURIComponent(
            win
          )}&sort=total_pnl_desc&limit=100`,
          {
            cache: "no-store",
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
          "pnl tokens"
        );

        const items = Array.isArray(payload?.items) ? payload.items : [];
        if (!active) return;
        setPnlTokens(items);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Failed to load pnl tokens";
        setPnlError(message);
      } finally {
        if (active) {
          setPnlLoading(false);
        }
      }
    };

    loadPnlTokens();

    return () => {
      active = false;
      controller.abort();
    };
  }, [address, apiEndpoints, showTradingDetails, timeframe]);

  React.useEffect(() => {
    if (!showTradingDetails) return;
    if (!address) {
      setDistribution([]);
      setDistributionError(null);
      setDistributionLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadDistribution = async () => {
      setDistributionLoading(true);
      setDistributionError(null);

      try {
        const win = timeframeToWin[timeframe];
        const payload = await fetchFromEndpoints(
          apiEndpoints,
          `wallets/${encodeURIComponent(
            address
          )}/pnl/distribution?win=${encodeURIComponent(win)}`,
          {
            cache: "no-store",
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
          "pnl distribution"
        );

        const buckets = Array.isArray(payload?.buckets) ? payload.buckets : [];
        const prepared = buckets.map((bucket: any) => ({
          label: typeof bucket?.label === "string" ? bucket.label : "N/A",
          count: safeNumber(bucket?.count),
        }));

        if (!active) return;
        setDistribution(prepared);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Failed to load distribution";
        setDistributionError(message);
      } finally {
        if (active) {
          setDistributionLoading(false);
        }
      }
    };

    loadDistribution();

    return () => {
      active = false;
      controller.abort();
    };
  }, [address, apiEndpoints, showTradingDetails, timeframe]);

  const distributionTotal = distribution.reduce(
    (sum, bucket) => sum + bucket.count,
    0
  );

  const formatPercent = (value: number) => {
    if (!Number.isFinite(value) || distributionTotal === 0) return "0%";
    return `${value.toFixed(2)}%`;
  };

  const formatPercentValue = (value: number) => {
    if (!Number.isFinite(value)) return "0%";
    return `${value.toFixed(2)}%`;
  };

  const formatCurrencyCompact = (value: number) => {
    if (!Number.isFinite(value)) return "N/A";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatSignedCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "N/A";
    if (value === 0) return formatCurrencyCompact(value);
    const prefix = value > 0 ? "+" : "-";
    return `${prefix}${formatCurrencyCompact(Math.abs(value))}`;
  };

  const formatCurrencySmart = (value: number) => {
    if (!Number.isFinite(value)) return "N/A";
    if (Math.abs(value) >= 1000) return formatCurrencyCompact(value);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 6,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumberCompact = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatHoldMinutes = (seconds: number, totalCount: number) => {
    if (!Number.isFinite(seconds) || totalCount <= 0) return "0m";
    const minutes = Math.round(seconds / 60 / totalCount);
    return `${minutes}m`;
  };

  const totals = React.useMemo(() => {
    const stats = {
      count: pnlTokens.length,
      bought: 0,
      sold: 0,
      realized: 0,
      unrealized: 0,
      total: 0,
      txsBuy: 0,
      txsSell: 0,
      holdSeconds: 0,
      avgBuySum: 0,
      avgBuyCount: 0,
      avgWinBuySum: 0,
      avgWinBuyCount: 0,
      avgLossBuySum: 0,
      avgLossBuyCount: 0,
      wins: 0,
      soldGreater: 0,
      didntBuy: 0,
      instantSell: 0,
    };

    pnlTokens.forEach((item) => {
      const bought = safeNumber(item.bought_usd);
      const sold = safeNumber(item.sold_usd);
      const realized = safeNumber(item.realized_pnl_usd);
      const unrealized = safeNumber(item.unrealized_pnl_usd);
      const total = safeNumber(item.total_pnl_usd);
      const avgBuy = safeNumber(item.avg_buy_price_usd);
      const holdSeconds = safeNumber(item.hold_duration_sec);
      const txsBuy = safeNumber(item.txs_buy);
      const txsSell = safeNumber(item.txs_sell);

      stats.bought += bought;
      stats.sold += sold;
      stats.realized += realized;
      stats.unrealized += unrealized;
      stats.total += total;
      stats.txsBuy += txsBuy;
      stats.txsSell += txsSell;
      if (Number.isFinite(holdSeconds)) {
        stats.holdSeconds += holdSeconds;
      }
      if (avgBuy > 0) {
        stats.avgBuySum += avgBuy;
        stats.avgBuyCount += 1;
      }
      if (total > 0) {
        stats.wins += 1;
        if (avgBuy > 0) {
          stats.avgWinBuySum += avgBuy;
          stats.avgWinBuyCount += 1;
        }
      } else if (total < 0 && avgBuy > 0) {
        stats.avgLossBuySum += avgBuy;
        stats.avgLossBuyCount += 1;
      }
      if (sold > bought) {
        stats.soldGreater += 1;
      }
      if (bought === 0) {
        stats.didntBuy += 1;
      }
      if (sold > 0 && holdSeconds > 0 && holdSeconds <= 60) {
        stats.instantSell += 1;
      }
    });

    return stats;
  }, [pnlTokens]);

  const winRate = totals.count ? (totals.wins / totals.count) * 100 : 0;
  const realizedPercent = totals.bought
    ? (totals.realized / Math.abs(totals.bought)) * 100
    : 0;
  const avgCost = totals.avgBuyCount
    ? totals.avgBuySum / totals.avgBuyCount
    : 0;
  const avgWinCost = totals.avgWinBuyCount
    ? totals.avgWinBuySum / totals.avgWinBuyCount
    : 0;
  const avgLossCost = totals.avgLossBuyCount
    ? totals.avgLossBuySum / totals.avgLossBuyCount
    : 0;

  const isPnlLoadingEmpty = pnlLoading && !pnlTokens.length;
  const isPnlErrorEmpty = Boolean(pnlError && !pnlTokens.length);
  const winRateDisplay = isPnlLoadingEmpty
    ? "Loading..."
    : isPnlErrorEmpty
    ? "N/A"
    : formatPercentValue(winRate);
  const realizedDisplay = isPnlLoadingEmpty
    ? "Loading..."
    : isPnlErrorEmpty
    ? "N/A"
    : formatSignedCurrency(totals.realized);
  const totalPnlDisplay = isPnlLoadingEmpty
    ? "Loading..."
    : isPnlErrorEmpty
    ? "N/A"
    : formatSignedCurrency(totals.total);
  const unrealizedDisplay = isPnlLoadingEmpty
    ? "Loading..."
    : isPnlErrorEmpty
    ? "N/A"
    : formatSignedCurrency(totals.unrealized);
  const realizedPercentDisplay =
    isPnlLoadingEmpty || isPnlErrorEmpty
      ? ""
      : formatPercentValue(realizedPercent);
  const boughtLabel = formatCurrencyCompact(totals.bought);
  const soldLabel = formatCurrencyCompact(totals.sold);
  const txsBuyLabel = formatNumberCompact(totals.txsBuy);
  const txsSellLabel = formatNumberCompact(totals.txsSell);

  const analyticsRows = [
    {
      label: "Trading Volume",
      value: formatCurrencyCompact(totals.bought + totals.sold),
      color: "text-[#00ff9e]",
    },
    {
      label: "Txs",
      value: `${formatNumberCompact(totals.txsBuy)} / ${formatNumberCompact(
        totals.txsSell
      )}`,
      color: "text-[#22d3ee]",
    },
    {
      label: "Avg Holding Duration",
      value: formatHoldMinutes(totals.holdSeconds, totals.count),
      color: "text-white",
    },
    {
      label: "Bought/Sold",
      value: `${formatCurrencyCompact(totals.bought)} / ${formatCurrencyCompact(
        totals.sold
      )}`,
      color: "text-[#00ff9e]",
    },
    {
      label: "Avg Cost",
      value: formatCurrencySmart(avgCost),
      color: "text-white",
    },
    {
      label: "Avg Win Cost",
      value: formatCurrencySmart(avgWinCost),
      color: "text-white",
    }
  ];

  const suspiciousActions = [
    {
      label: "Sold > Bought",
      value: formatPercentValue(
        totals.count ? (totals.soldGreater / totals.count) * 100 : 0
      ),
      color: "text-white",
    },
    {
      label: "Didn't Buy",
      value: formatPercentValue(
        totals.count ? (totals.didntBuy / totals.count) * 100 : 0
      ),
      color: "text-white",
    },
    {
      label: "Instant Sell",
      value: formatPercentValue(
        totals.count ? (totals.instantSell / totals.count) * 100 : 0
      ),
      color: "text-white",
    },
    {
      label: "Scam/Rug tokens",
      value: "0.00%",
      color: "text-[#ff4d4d]",
    }
  ];

  return (
    <div className="px-4 pt-4 pb-8 font-sans text-white">
      {/* Top Header Navigation */}
      <div className=" flex flex-col gap-4 relative border-b border-white/20 text-gray-400 text-xs uppercase tracking-wider after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-[#FA4E30] after:to-[#39C8A6] after:content-[''] pb-4 md:flex-row md:items-center ">
        <nav className="flex flex-wrap gap-3 text-sm font-medium text-gray-400">
          {analyzerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg transition tracking-wide ${
                activeTab === tab.id
                  ? "bg-black/60 text-white border border-white/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {showTradingDetails && (
          <div className="mt-2 flex w-full flex-wrap justify-between gap-1 bg-black/40 p-1 rounded-lg border border-white/10 md:ml-auto md:mt-0 md:w-auto md:justify-center">
            {timeframeOptions.map((t) => (
              <button
                key={t}
                onClick={() => onTimeframeChange(t)}
                className={`px-3 py-1 text-xs rounded ${
                  t === timeframe
                    ? "bg-[#1a1a1a] text-white border border-[#FFEF3C]"
                    : "text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {showTradingDetails && (
        <div className="grid grid-cols-1 gap-4">
          {/* Right Section: Charts & Analytics */}
          <div className="lg:col-span-9 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:auto-rows-fr mt-6">
              {/* Trading PNL / Win Rate Section */}
              <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden shadow-2xl h-full">
                {/* Header Row */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold tracking-tight text-white">
                      Win Rate
                    </h3>
                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-400">
                      i
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-bold text-white">
                      {winRateDisplay}
                    </span>
                    <svg
                      className={`h-4 w-4 ${
                        isPnlLoadingEmpty || isPnlErrorEmpty
                          ? "text-zinc-500"
                          : totals.total >= 0
                          ? "text-[#4ADE80]"
                          : "text-[#F64F39]"
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        d="M7 17L17 7M17 7H7M17 7V17"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-3 border-y border-white/5 bg-black/20">
                  <div className="p-5 border-r border-white/5">
                    <p className="text-[12px] text-zinc-500 mb-1">Realized</p>
                    <p
                      className={`text-xl font-bold ${
                        isPnlLoadingEmpty || isPnlErrorEmpty
                          ? "text-zinc-500"
                          : totals.realized >= 0
                          ? "text-[#4ADE80]"
                          : "text-[#F64F39]"
                      }`}
                    >
                      {realizedDisplay}
                    </p>
                    {realizedPercentDisplay && (
                      <p
                        className={`text-[11px] font-medium ${
                          totals.realized >= 0
                            ? "text-[#4ADE80]/80"
                            : "text-[#F64F39]/80"
                        }`}
                      >
                        {realizedPercentDisplay}
                      </p>
                    )}
                  </div>
                  <div className="p-5 border-r border-white/5">
                    <p className="text-[12px] text-zinc-500 mb-1">Total PNL</p>
                    <p
                      className={`text-xl font-bold ${
                        isPnlLoadingEmpty || isPnlErrorEmpty
                          ? "text-zinc-500"
                          : totals.total >= 0
                          ? "text-[#4ADE80]"
                          : "text-[#F64F39]"
                      }`}
                    >
                      {totalPnlDisplay}
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-[12px] text-zinc-500 mb-1">Unrealized</p>
                    <p
                      className={`text-xl font-bold ${
                        isPnlLoadingEmpty || isPnlErrorEmpty
                          ? "text-zinc-500"
                          : totals.unrealized >= 0
                          ? "text-[#4ADE80]"
                          : "text-[#F64F39]"
                      }`}
                    >
                      {unrealizedDisplay}
                    </p>
                  </div>
                </div>

                <div className="relative h-32 w-full px-5 pb-4 pt-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4ADE80]/5 via-transparent to-[#F64F39]/5 pointer-events-none" />

                  <div className="flex h-full items-end gap-[3px] relative z-10">
                    {[
                      80, 60, 40, 70, 55, 30, 20, 10, 35, 45, 25, 50, 65, 40,
                      20, 10, 5, 2, 4, 1, 0, 0, 0, 1, 2, 0, 1, 4, 3, 2, 8, 12,
                      15, 40, 25, 30, 55, 45, 60, 50,
                    ].map((height, i) => (
                      <div
                        key={i}
                        className={`chart-bar flex-1 rounded-t-[1px] ${
                          i === 5 || i === 22 || i === 30
                            ? "bg-[#F64F39]"
                            : "bg-[#4ADE80]"
                        }`}
                        style={{
                          height: `${height}%`,
                          opacity: height > 0 ? 0.9 : 0.2,
                          animationDelay: `${i * 40}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* RIGHT COLUMN: PNL Distribution & Actions */}
              <div className="relative overflow-hidden border border-white/10 rounded-2xl h-full">
                <div
                  className="rounded-2xl p-6 overflow-hidden relative shadow-2xl h-full flex flex-col"
                  style={{
                    backgroundImage:
                      "linear-gradient(140deg, #000000 50%, #500a3cff 100%)",
                  }}
                >
                  <h3 className="text-[15px] font-bold text-white mb-8 tracking-tight relative z-10">
                    PNL Distribution ({distributionTotal} Tokens)
                  </h3>

                  <div className="flex items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-4 font-bold text-[13px] text-white">
                      {distributionLoading && !distribution.length && (
                        <div className="text-zinc-400 text-[12px]">
                          Loading distribution...
                        </div>
                      )}
                      {distributionError && !distribution.length && (
                        <div className="text-red-400 text-[12px]">
                          {distributionError}
                        </div>
                      )}
                      {!distributionLoading && !distributionError && !distribution.length && (
                        <div className="text-zinc-400 text-[12px]">
                          No distribution data available.
                        </div>
                      )}
                      {distribution.map((bucket) => {
                        const percent =
                          distributionTotal > 0
                            ? (bucket.count / distributionTotal) * 100
                            : 0;
                        const valueColor =
                          bucket.label.includes("<") ||
                          bucket.label.includes("-")
                            ? "text-[#F64F39]"
                            : "text-[#20D87C]";
                        return (
                          <div key={bucket.label} className="flex gap-6">
                            <span className="text-zinc-500 w-12 font-medium">
                              {bucket.label}
                            </span>
                            <span className={valueColor}>
                              {bucket.count} ({formatPercent(percent)})
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="relative w-56 h-28 self-end overflow-visible">
                      <svg
                        viewBox="0 0 100 50"
                        className="w-full h-full overflow-visible"
                      >
                        <path
                          d="M 10,50 A 40,40 0 0,1 35,12"
                          fill="none"
                          stroke="#F64F39"
                          strokeWidth="14"
                          strokeLinecap="butt"
                          className="pie-path drop-shadow-[0_0_10px_rgba(246,79,57,0.6)]"
                          style={{ animationDelay: "0.05s" }}
                        />
                        <path
                          d="M 35,12 A 40,40 0 0,1 90,50"
                          fill="none"
                          stroke="#20D87C"
                          strokeWidth="14"
                          strokeLinecap="butt"
                          className="pie-path drop-shadow-[0_0_15px_rgba(32,216,124,0.7)]"
                          style={{ animationDelay: "0.25s" }}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:auto-rows-fr">
              <div className="relative overflow-hidden border border-white/10 rounded-2xl h-full">
                <div
                  className="rounded-2xl p-6 overflow-hidden relative shadow-2xl h-full flex flex-col"
                  style={{
                    backgroundImage:
                      "linear-gradient(150deg, #000000 50%, #500a3cff 100%)",
                  }}
                >
                  <h3 className="relative z-10 text-[15px] font-bold text-white mb-6 tracking-tight">
                    Analytics
                  </h3>
                  <div className="relative z-10">
                    {analyticsRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex justify-between items-center text-[13px] pb-2 mb-2"
                      >
                        <span className="text-zinc-500 font-medium">
                          {row.label}
                        </span>
                        {row.label === "Bought/Sold" ? (
                          <div className="font-bold flex gap-1">
                            <span className="text-[#20D87C]">
                              {isPnlLoadingEmpty
                                ? "Loading..."
                                : isPnlErrorEmpty
                                ? "N/A"
                                : boughtLabel}
                            </span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-[#F64F39]">
                              {isPnlLoadingEmpty
                                ? "Loading..."
                                : isPnlErrorEmpty
                                ? "N/A"
                                : soldLabel}
                            </span>
                          </div>
                        ) : row.label === "Txs" ? (
                          <div className="font-bold flex gap-1">
                            <span className="text-[#20D87C]">
                              {isPnlLoadingEmpty
                                ? "Loading..."
                                : isPnlErrorEmpty
                                ? "N/A"
                                : txsBuyLabel}
                            </span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-[#F64F39]">
                              {isPnlLoadingEmpty
                                ? "Loading..."
                                : isPnlErrorEmpty
                                ? "N/A"
                                : txsSellLabel}
                            </span>
                          </div>
                        ) : (
                          <span className={`font-bold ${row.color}`}>
                            {isPnlLoadingEmpty
                              ? "Loading..."
                              : isPnlErrorEmpty
                              ? "N/A"
                              : row.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl border border-white/10 h-full">
                <div
                  className="rounded-2xl p-6 overflow-hidden relative shadow-2xl h-full flex flex-col"
                  style={{
                    backgroundImage:
                      "linear-gradient(145deg, #000000 60%, #1d804eff 100%)",
                  }}
                >
                  <div className="relative z-10 flex justify-between items-center mb-6">
                    <h3 className="text-[15px] text-white tracking-tight">
                      Suspicious Actions
                    </h3>
                  </div>
                  <div className="relative z-10">
                    {suspiciousActions.map((action) => (
                      <div
                        key={action.label}
                        className="flex justify-between items-center text-[13px] pb-2 mb-2"
                      >
                        <span className="text-zinc-500 font-medium">
                          {action.label}
                        </span>
                        <span className={`font-bold ${action.color}`}>
                          {isPnlLoadingEmpty
                            ? "Loading..."
                            : isPnlErrorEmpty
                            ? "N/A"
                            : action.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
