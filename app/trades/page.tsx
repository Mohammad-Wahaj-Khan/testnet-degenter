// app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { tokenAPI } from "@/lib/api";
import Navbar from "@/app/components/navbar";
import TopMarketToken from "@/app/components/TopMarketToken";
import NotFoundPage from "@/app/not-found";
import AssetsFilter from "./components/AssetsFilter";
import TradesComponent from "./components/Trades";
import type { TokenOption, TradesFilter, Trade } from "./components/Trades";
import FilterTradesTop from "./components/FindTradesTop";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

/* ---------------- Types ---------------- */
interface Token {
  id: number;
  name: string;
  symbol: string;
  pair_contract: string;
  price: number;
  priceUsd: number;
  change24h: number;
  icon: string | null;
  liquidity: number;
  marketCap: number;
  fdv: number;
  volume: {
    "30m": number;
    "1h": number;
    "4h": number;
    "24h": number;
  };
  txCount: {
    "30m": number;
    "1h": number;
    "4h": number;
    "24h": number;
    "30d": number;
  };
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  holders: number;
  txBuy: number;
  txSell: number;
}

/* ---------------- Fetch Token ---------------- */
async function fetchTokenBySymbol(symbol: string): Promise<Token | null> {
  try {
    const res = await tokenAPI.getTokenSummaryBySymbol(symbol, "best", true);
    const token = res?.data;
    if (!token) return null;

    return {
      id: Number(token.tokenId || 0),
      pair_contract: token.denom
        ? token.denom.startsWith("ibc/")
          ? token.symbol || token.name || token.tokenId || ""
          : token.denom
        : token.symbol || token.name || token.tokenId || "",
      name: token.name || "Unknown Token",
      symbol: token.symbol || "",
      price: token.priceInNative || 0,
      priceUsd: token.priceInUsd || 0,
      change24h: token.priceChange?.["24h"] || 0,
      icon: token.imageUri || null,
      liquidity: token.liquidity || 0,
      marketCap: token.mc || 0,
      fdv: token.fdv || 0,
      maxSupply: token.maxSupply || 0,
      volume: {
        "30m": token.volume?.["30m"] || 0,
        "1h": token.volume?.["1h"] || 0,
        "4h": token.volume?.["4h"] || 0,
        "24h": token.volume?.["24h"] || 0,
      },
      txCount: {
        "30m": token.txBuckets?.["30m"] || 0,
        "1h": token.txBuckets?.["1h"] || 0,
        "4h": token.txBuckets?.["4h"] || 0,
        "24h": token.txBuckets?.["24h"] || 0,
        "30d": 0,
      },
      circulatingSupply: token.circulatingSupply || 0,
      totalSupply: token.supply || 0,
      holders: Number(token.holder || 0),
      txBuy: token.tradeCount?.buy || 0,
      txSell: token.tradeCount?.sell || 0,
    };
  } catch (error) {
    console.error("Error fetching token by symbol:", error);
    return null;
  }
}

const getDefaultFilters = (): TradesFilter => ({
  assetMode: "all",
  timeRange: "24H",
  valueRange: "",
  tokenDenom: "",
  wallet: "",
});

/* ---------------- Main Page ---------------- */
export default function FindTrades() {
  const { tokenDetails } = useParams();
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuditPanelVisible, setIsAuditPanelVisible] = useState(true);
  const [availableTokens, setAvailableTokens] = useState<TokenOption[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<
    "trades" | "holders" | "security" | "mySwaps" | "topTrades"
  >("trades");
  const [filters, setFilters] = useState<TradesFilter>(getDefaultFilters());
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const updateFilters = useCallback((updates: Partial<TradesFilter>) => {
    setFilters((prev) => {
      const newFilters = { ...prev, ...updates };
      // Save to localStorage when filters change
      if (typeof window !== "undefined") {
        localStorage.setItem("tradesFilters", JSON.stringify(newFilters));
      }
      return newFilters;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(getDefaultFilters());
  }, []);

  const handleTokenSearch = useCallback(
    (query: string) => {
      // 1. If query is empty, treat it as a reset for the token filter
      const trimmedQuery = query.trim();

      setIsSearching(true);

      // 2. Update the filters - This will trigger the useEffect inside <TradesComponent />
      // which should be calling your /trades or /tokens endpoint
      updateFilters({ tokenDenom: trimmedQuery });

      // Simulate a small delay for UI feedback
      setTimeout(() => {
        setIsSearching(false);
      }, 500);
    },
    [updateFilters]
  );

  // Add a specific function to clear just the token search
  const handleClearSearch = useCallback(() => {
    updateFilters({ tokenDenom: "" });
  }, [updateFilters]);
  const handleAvailableTokens = useCallback((tokens: TokenOption[]) => {
    setAvailableTokens(tokens);
  }, []);

  const toggleFiltersOpen = useCallback(() => {
    setFiltersVisible((prev) => !prev);
  }, []);

  const handleFilteredTradesUpdate = useCallback((trades: Trade[]) => {
    setFilteredTrades(trades);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // If no filtered trades, show a message
    if (!filteredTrades.length) {
      alert("No trades to export. Please adjust your filters and try again.");
      return;
    }

    const headers = [
      "Time",
      "Direction",
      "ValueUSD",
      "ReturnAmount",
      "ReturnDenom",
      "OfferAmount",
      "OfferDenom",
      "Trader",
      "TxHash",
    ];

    const escapeCell = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const rows = filteredTrades.map((trade) => [
      new Date(trade.time).toISOString(),
      trade.direction,
      trade.valueUsd.toFixed(2),
      trade.returnAmount.toFixed(4),
      trade.askDenom,
      trade.offerAmount.toFixed(4),
      trade.offerDenom,
      trade.signer,
      trade.txHash,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `degenter-trades-${new Date().toISOString()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [filteredTrades]);
  // Add this to a page component
  // useEffect(() => {
  //   console.log('API_BASE:', process.env.NEXT_PUBLIC_API_BASE_URL);
  // }, []);
  /* -------- Fetch token by route param -------- */
  useEffect(() => {
    if (!tokenDetails) return;

    const tokenSymbol = Array.isArray(tokenDetails)
      ? tokenDetails[0]
      : tokenDetails;
    if (!tokenSymbol || tokenSymbol === "undefined" || tokenSymbol === "null")
      return;

    const loadToken = async () => {
      setLoading(true);
      try {
        const tokenData = await fetchTokenBySymbol(tokenSymbol);
        if (tokenData) {
          setToken({
            ...tokenData,
            icon:
              tokenData.icon ||
              "https://pbs.twimg.com/profile_images/1929879248212275200/Yzkbsu74_400x400.png",
          });
        } else {
          setError("Token not found");
        }
      } catch (err) {
        setError("Failed to load token");
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, [tokenDetails]);

  const toggleAuditPanel = () => {
    setIsAuditPanelVisible((v) => !v);
  };

  useEffect(() => {
    if (!token) return;

    const priceToUse = token.priceUsd || token.price || 0;
    const priceLabel =
      priceToUse >= 1
        ? priceToUse.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : priceToUse > 0
        ? priceToUse.toPrecision(4)
        : "0.00";

    const title = `${token.symbol} - $${priceLabel} | Degenter`;
    const description = `Live ${token.symbol} stats — currently $${priceLabel}. Track trades, holders, security, and swaps on Degenter.`;

    document.title = title;

    const ensureMeta = (
      key: string,
      attr: "name" | "property",
      content: string
    ) => {
      let tag = document.querySelector<HTMLMetaElement>(
        `meta[${attr}="${key}"]`
      );
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    ensureMeta("description", "name", description);
    ensureMeta("og:title", "property", title);
    ensureMeta("og:description", "property", description);
    ensureMeta("twitter:title", "name", title);
    ensureMeta("twitter:description", "name", description);
  }, [token]);

  /* -------- UI -------- */
  if (!loading && (!token || error)) {
    return <NotFoundPage />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-black relative overflow-hidden p-0 md:px-4">
      <div
        className="absolute inset-0 z-0 h-56"
        style={{
          backgroundImage: `
            linear-gradient(
              120deg,
              #14624F 0%,
              #39C8A6 36.7%,
              #FA4E30 66.8%,
              #2D1B45 100%
            )
          `,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-black" />
      </div>
      <div className="animate-header relative z-20">
        <Navbar />
        <TopMarketToken />
        <FilterTradesTop
          filters={filters}
          filtersOpen={filtersVisible}
          onToggleFilters={toggleFiltersOpen}
          onExport={handleExportCsv}
          hasFilteredTrades={true} // Always enable the export button
        />
      </div>

      <div className="relative z-10 w-full px-8 pb-8">
        <div className="mx-auto w-full ">
          <section className="flex w-full flex-col gap-6 md:flex-row">
            <div
              className={`${filtersVisible ? "block" : "hidden"} ${
                filtersVisible ? "md:block" : "md:hidden"
              } md:w-[340px] animate-sidebar`}
            >
              <AssetsFilter
                selectedAssetMode={filters.assetMode}
                onAssetModeChange={(value) =>
                  updateFilters({ assetMode: value })
                }
                selectedTime={filters.timeRange}
                onTimeChange={(value) => updateFilters({ timeRange: value })}
                selectedValue={filters.valueRange}
                onValueChange={(value) => updateFilters({ valueRange: value })}
                selectedToken={filters.tokenDenom}
                onTokenSearch={handleTokenSearch}
                tokenOptions={availableTokens}
                walletAddress={filters.wallet}
                onWalletAddressChange={(value) =>
                  updateFilters({ wallet: value })
                }
                onClearSearch={handleClearSearch}
                onReset={handleResetFilters}
                isSearching={isSearching}
              />
            </div>
            <div className="flex-1 animate-table">
              <TradesComponent
                filters={filters}
                onAvailableTokens={handleAvailableTokens}
                onFilteredTradesChange={setFilteredTrades}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
