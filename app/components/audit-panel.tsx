"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTokenSummary } from "@/app/hooks/useTokenSummary";
import { tokenAPI, type TokenDetailResponse } from "@/lib/api";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

interface SecurityResponse {
  success: boolean;
  data: {
    score: number;
    penalties?: { k: string; pts: number }[];
    bonuses?: { k: string; pts: number }[];
    categories?: {
      supply?: Record<string, any>;
      distribution?: Record<string, any>;
      adoption?: Record<string, any>;
    };
    checks?: {
      isMintable?: boolean;
      canChangeMintingCap?: boolean;
      maxSupply?: number;
      totalSupply?: number;
      top10PctOfMax?: number;
      creatorPctOfMax?: number;
      holdersCount?: number;
    };
    lastUpdated?: string;
    source?: string;
  };
}

export default function AuditPanel({ tokenId }: { tokenId?: string }) {
  const [securityData, setSecurityData] = useState<
    SecurityResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [summaryFallback, setSummaryFallback] =
    useState<TokenDetailResponse["data"] | null>(null);
  const { data: summaryData } = useTokenSummary({
    tokenKey: tokenId ?? null,
  });
  const summary = summaryData ?? summaryFallback;

  useEffect(() => {
    const fetchSecurityData = async () => {
      if (!tokenId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE}/tokens/${encodeURIComponent(tokenId)}/security`
        );
        const data: SecurityResponse = await response.json();
        if (data?.success) setSecurityData(data.data);
      } catch (error) {
        // console.error("Error fetching security data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, [tokenId]);

  useEffect(() => {
    if (!tokenId || summaryData) return;
    setSummaryFallback(null);
    let active = true;
    tokenAPI
      .getTokenDetailsBySymbol(tokenId, "best", true)
      .then((res) => {
        if (!active) return;
        if (res?.data) setSummaryFallback(res.data);
      })
      .catch((error) => {
        console.error("Failed to load audit summary fallback:", error);
      });
    return () => {
      active = false;
    };
  }, [tokenId, summaryData]);

  const getStatusColor = (condition: boolean) =>
    condition ? "bg-red-400" : "bg-emerald-400";

  if (loading) {
    return (
      <div className="w-full mx-auto">
        <div
          className="rounded-lg bg-cover bg-center bg-no-repeat h-36 w-full overflow-hidden"
          style={{ backgroundImage: "url('/degenter.png')" }}
        ></div>
        <div className="bg-[#050505] rounded-2xl p-6 shadow-lg border border-[#808080]/20 text-white text-sm flex flex-col items-center">
          Loading security data...
        </div>
      </div>
    );
  }

  if (!securityData) {
    return (
      <div className="w-full mx-auto">
        <div
          className="rounded-lg bg-cover bg-center bg-no-repeat h-36 w-full overflow-hidden"
          style={{ backgroundImage: "url('/degenter.png')" }}
        ></div>
        <div className="bg-[#050505] rounded-2xl p-6 shadow-lg border border-[#808080]/20 text-white text-sm flex flex-col items-center">
          Failed to load security data
        </div>
      </div>
    );
  }

  if (
    tokenId?.toLowerCase() === "stzig" ||
    tokenId ===
      "coin.zig109f7g2rzl2aqee7z6gffn8kfe9cpqx0mjkk7ethmx8m2hq4xpe9snmaam2.stzig"
  ) {
    return (
      <div className="w-full mx-auto">
        <Link href={`https://x.com/DegenTer_Bot`} target="_blank">
          <div
            className="rounded-lg bg-cover bg-no-repeat h-48 w-full border border-[#808080]/20"
            style={{
              backgroundImage: "url('/degenter.png')",
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          ></div>
        </Link>

        <div className="bg-[#050505] rounded-lg p-6 shadow-lg border border-[#808080]/20 text-white text-sm flex flex-col mt-2 items-center">
          <div className="relative flex justify-center items-center mb-3">
            <svg
              className="w-28 h-28 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#1E1E1E"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#1E1E1E"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="0 283"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex items-baseline justify-center">
              <span className="text-3xl font-medium text-white">--</span>
              <span className="text-gray-400 text-xs -mb-1">/100</span>
            </div>
          </div>
          <h2 className="text-lg mb-4 text-center">DegenScore</h2>

          <div className="w-full space-y-3">
            {[
              // "Mintable",
              "Can Change Mint Cap",
              "Total Supply",
              "Max Supply",
              "Top 10 Holders %",
              "Holders",
            ].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gray-300">{label}</span>
                <span className="text-white/80 text-xs">--</span>
              </div>
            ))}
          </div>

          <button
            disabled
            className="w-full mt-6 py-2.5 bg-gray-600 rounded-lg text-gray-400 font-medium cursor-not-allowed"
          >
            Check Audits
          </button>
        </div>
      </div>
    );
  }

  const checks = securityData.checks || {};

  const toNumber = (value?: number | string | null) => {
    if (value == null) return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const coalescePositive = (
    ...values: Array<number | string | null | undefined>
  ) => {
    for (const value of values) {
      const n = toNumber(value);
      if (n != null && n > 0) return n;
    }
    return null;
  };

  const formatNumber = (value?: number | null, fallback = "—") =>
    value == null ? fallback : value.toLocaleString();

  const totalSupplyValue = coalescePositive(
    checks.totalSupply,
    summary?.supply?.max,
    summary?.supply?.circulating,
    summary?.circulatingSupply
  );
  const maxSupplyValue = coalescePositive(
    checks.maxSupply,
    summary?.supply?.max,
    summary?.circulatingSupply
  );
  const holdersValue = coalescePositive(
    checks.holdersCount,
    summary?.holder,
    (summary as { holders?: number | string } | null)?.holders
  );
  const hasTotalSupply = "totalSupply" in checks || totalSupplyValue != null;
  const hasMaxSupply = "maxSupply" in checks || maxSupplyValue != null;
  const hasHolders = "holdersCount" in checks || holdersValue != null;

  return (
    <div className="w-full mx-auto">
      <Link href={`https://x.com/DegenTer_Bot`} target="_blank">
        <div
          className="rounded-lg bg-cover bg-no-repeat h-48 w-full border border-[#808080]/20"
          style={{
            backgroundImage: "url('/degenter.png')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        ></div>
      </Link>

      <div className="bg-[#050505] rounded-lg p-6 shadow-lg border border-[#808080]/20 text-white text-sm flex flex-col mt-2 items-center">
        {/* Circular Score Indicator */}
        {/* <div className="relative flex justify-center items-center mb-3">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#1E1E1E" strokeWidth="6" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={`${(securityData.score / 100) * 283} ${(1 - securityData.score / 100) * 283}`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="100%" stopColor="#00FFA3" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex items-baseline justify-center">
            <span className="text-3xl font-medium">{securityData.score}</span>
            <span className="text-gray-400 text-xs -mb-1">/100</span>
          </div>
        </div> */}
        <div className="relative flex justify-center items-center mb-3 drop-shadow-[0_0_1px_rgba(0,255,163,0.1)]">
          <svg
            className="w-28 h-28 transform -rotate-90"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible" }} // ✅ allow glow to bleed outside
          >
            {/* Background circle with subtle glow */}
            <defs>
              {/* Track glow */}
              <filter
                id="trackGlow"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
                filterUnits="objectBoundingBox"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter
                id="progressGlow"
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
                filterUnits="objectBoundingBox"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Progress glow */}
              <filter
                id="progressGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6B00" />
                <stop offset="100%" stopColor="#00FFA3" />
              </linearGradient>
            </defs>

            {/* Track with subtle glow */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#1E1E1E"
              strokeWidth="6"
              fill="transparent"
              filter="url(#trackGlow)"
            />

            {/* Progress with sharp glow */}
            <g filter="url(#progressGlow)">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${(securityData.score / 100) * 283} ${
                  (1 - securityData.score / 100) * 283
                }`}
                strokeLinecap="round"
              />
            </g>
          </svg>

          <div className="absolute flex items-baseline justify-center">
            {/* <span className="text-3xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#00FFA3]"> */}
            <span className="text-3xl font-medium text-white">
              {securityData.score}
            </span>
            <span className="text-gray-400 text-xs -mb-1">/100</span>
          </div>
        </div>
        <h2 className="text-lg mb-4 text-center">DegenScore</h2>

        {/* Security Fields */}
        <div className="w-full space-y-3">
          {/* Mintable */}
          {/* {"isMintable" in checks && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Mintable</span>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-xs">Yes</span>
                <div className={`w-3 h-3 rounded-sm ${getStatusColor(true)}`} />
              </div>
            </div>
          )} */}

          {/* Can Change Mint Cap */}
          {"canChangeMintingCap" in checks && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Can Change Mint Cap</span>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-xs">
                  {checks.canChangeMintingCap ? "Yes" : "No"}
                </span>
                <div
                  className={`w-3 h-3 rounded-sm ${getStatusColor(
                    !checks.canChangeMintingCap ? false : true
                  )}`}
                />
              </div>
            </div>
          )}

          {/* Supply Info */}
          {hasTotalSupply && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Total Supply</span>
              <span className="text-white/80 text-xs">
                {formatNumber(totalSupplyValue)}
              </span>
            </div>
          )}

          {hasMaxSupply && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Max Supply</span>
              <span className="text-white/80 text-xs">
                {formatNumber(maxSupplyValue)}
              </span>
            </div>
          )}

          {/* Distribution */}
          {"top10PctOfMax" in checks && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Top 10 Holders %</span>
              <span className="text-white/80 text-xs">
                {checks.top10PctOfMax?.toFixed(2)}%
              </span>
            </div>
          )}

          {/* {"creatorPctOfMax" in checks && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Creator % of Max</span>
              <span className="text-white/80 text-xs">
                {checks.creatorPctOfMax?.toFixed(2)}%
              </span>
            </div>
          )} */}

          {hasHolders && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Holders</span>
              <span className="text-white/80 text-xs">
                {formatNumber(holdersValue)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            // First, find and click the security tab to activate it
            const securityTabButton = document.querySelector(
              '[data-tab="security"]'
            ) as HTMLElement;
            if (securityTabButton) {
              securityTabButton.click();

              // Then scroll to the security section
              setTimeout(() => {
                const securitySection = document.getElementById("security-tab");
                if (securitySection) {
                  securitySection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }, 100); // Small delay to ensure the tab is activated
            }
          }}
          className="w-full mt-6 py-2.5 bg-emerald-400 hover:bg-emerald-500 transition-colors rounded-lg text-black font-medium"
        >
          Check Audits
        </button>
      </div>
    </div>
  );
}
