// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tokenAPI } from "@/lib/api";
import Navbar from "@/app/components/navbar";
import SwapPanel from "@/app/components/swap-panel";
import TopMarketToken from "@/app/components/TopMarketToken";
import TradingChart from "@/app/components/tradingchart";
import AuditPanel from "@/app/components/audit-panel";
import Footer from "@/app/components/footer";
import RecentTrades, {
  type SignerFilterSummary,
} from "@/app/components/RecentTrades";
import TopHolders from "@/app/components/TopHolders";
import Security from "@/app/components/Security";
import TopTrades from "@/app/components/TopTrades";
import AddLeft from "@/app/components/add-left";
import MySwaps from "@/app/components/MySwaps";
import NotFoundPage from "@/app/not-found";

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
    const res = await tokenAPI.getTokenDetailsBySymbol(symbol, "best", true);
    const detail = res?.data;
    if (!detail) return null;

    const token = detail.token || {};
    const denom = token.denom;
    const fallbackKey = token.symbol || token.name || token.tokenId || "";
    const priceChange = detail.price?.changePct || detail.priceChange;

    return {
      id: Number(token.tokenId || 0),
      pair_contract: denom
        ? denom.startsWith("ibc/")
          ? fallbackKey
          : denom
        : fallbackKey,
      name: token.name || "Unknown Token",
      symbol: token.symbol || "",
      price: detail.price?.native || detail.priceInNative || 0,
      priceUsd: detail.price?.usd || detail.priceInUsd || 0,
      change24h: priceChange?.["24h"] || 0,
      icon: token.imageUri || null,
      liquidity: detail.liquidity || 0,
      marketCap: detail.mcapDetail?.usd || detail.mc || 0,
      fdv: detail.fdvDetail?.usd || detail.fdv || 0,
      maxSupply: detail.supply?.max || detail.circulatingSupply || 0,
      volume: {
        "30m": detail.volume?.["30m"] || 0,
        "1h": detail.volume?.["1h"] || 0,
        "4h": detail.volume?.["4h"] || 0,
        "24h": detail.volume?.["24h"] || 0,
      },
      txCount: {
        "30m": detail.txBuckets?.["30m"] || 0,
        "1h": detail.txBuckets?.["1h"] || 0,
        "4h": detail.txBuckets?.["4h"] || 0,
        "24h": detail.txBuckets?.["24h"] || 0,
        "30d": 0,
      },
      circulatingSupply:
        detail.supply?.circulating || detail.circulatingSupply || 0,
      totalSupply: detail.supply?.max || detail.circulatingSupply || 0,
      holders: Number(detail.holder || 0),
      txBuy: detail.buy || 0,
      txSell: detail.sell || 0,
    };
  } catch (error) {
    console.error("Error fetching token by symbol:", error);
    return null;
  }
}

/* ---------------- Main Page ---------------- */
export default function PairDetails() {
  const { tokenDetails } = useParams();
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuditPanelVisible, setIsAuditPanelVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "trades" | "holders" | "security" | "mySwaps" | "topTrades"
  >("trades");
  const [signerSummary, setSignerSummary] =
    useState<SignerFilterSummary | null>(null);
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

    const ensureMeta = (key: string, attr: "name" | "property", content: string) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
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
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-1 h-60"
        style={{
          backgroundImage: `linear-gradient(120deg,#14624F 0%,#39C8A6 36.7%,#FA4E30 66.8%,#2D1B45 100%)`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-black" />
      </div>

      <Navbar />
      <TopMarketToken />

      {/* ====================== Main Responsive Section ====================== */}
      <div className="flex flex-col max-w-8xl mx-auto w-full px-4 md:px-6 lg:px-8 py-4 space-y-4">
        {/* Wrapper: On large screens → row layout, on mobile → stacked */}
        <div
          className={`flex flex-col lg:flex-row gap-4 w-full ${isAuditPanelVisible}`}
        >
          {/* Left / Sidebar: Swap Panel */}
          <div className="hidden lg:block lg:order-1 w-full lg:w-80 flex-shrink-0">
            {token ? (
              <SwapPanel params={{ token: token.pair_contract }} />
            ) : (
              <AddLeft />
            )}
          </div>

          {/* Main Content */}
          <div className="order-1 lg:order-2 flex-1 flex flex-col">
            {/* Chart + Audit */}
            <div
              className={`flex flex-col lg:flex-row  w-full px-2 md:p-0 ${
                isAuditPanelVisible ? "lg:gap-4" : ""
              }`}
            >
              {/* Trading Chart */}
              <div className="flex-1 ">
                {token ? (
                  <TradingChart
                    token={token.pair_contract}
                    onToggleAuditPanel={toggleAuditPanel}
                    isAuditPanelVisible={isAuditPanelVisible}
                    signerSummary={signerSummary}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-400">
                    Loading chart...
                  </div>
                )}
              </div>

              <div className="flex-1 lg:hidden ">
                {token ? (
                  <SwapPanel params={{ token: token.pair_contract }} />
                ) : (
                  <AddLeft />
                )}
              </div>

              {/* Audit Panel */}
              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden flex-shrink-0 block 
                ${
                  isAuditPanelVisible
                    ? "w-full lg:w-80 opacity-100 ml-0"
                    : "w-0 lg:w-0 opacity-0 "
                }`}
                style={{
                  transitionProperty: "width, opacity, margin-left",
                  willChange: "width, opacity, margin-left",
                }}
              >
                <div className="w-full lg:w-80">
                  <AuditPanel tokenId={token?.pair_contract} />
                </div>
              </div>
            </div>

            {/* Tabs + Tables */}
            <div className="mt-4 w-full p-2 md:p-0">
              <div className="relative mb-1 border-t border-x border-[#808080]/20 rounded-t-md py-2 px-4 overflow-x-auto">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#FA4E30] to-[#39C8A6]" />
                <div className="flex space-x-4 min-w-max">
                  {[
                    { key: "trades", label: "Recent Trades" },
                    { key: "holders", label: "Top Holders" },
                    { key: "topTrades", label: "Top Trades" },
                    { key: "security", label: "Security" },
                    { key: "mySwaps", label: "My Swaps" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      data-tab={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 font-medium whitespace-nowrap ${
                        activeTab === tab.key
                          ? "text-white bg-[#1C1C1C] p-2 rounded my-2"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[400px]">
                {activeTab === "trades" ? (
                  <RecentTrades
                    tokenId={token?.pair_contract}
                    onSignerFilterChange={setSignerSummary}
                  />
                ) : activeTab === "holders" ? (
                  <TopHolders tokenId={token?.pair_contract} />
                ) : activeTab === "security" ? (
                  <Security
                    tokenId={token?.id}
                    tokenKey={token?.pair_contract}
                  />
                ) : activeTab === "topTrades" ? (
                  <TopTrades tokenId={token?.pair_contract} />
                ) : activeTab === "mySwaps" ? (
                  <MySwaps tokenId={token?.pair_contract} />
                ) : (
                  <AuditPanel tokenId={token?.pair_contract} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
