"use client";

import React from "react";
import { ClipboardCopy, Pencil, Star } from "lucide-react";
import { useChain } from "@cosmos-kit/react";
import { CHAIN_NAME } from "../../../config/chain";
import Profile from "@/public/profileimg.svg";
import Whale from "@/public/whale.svg";
import Airdrop from "@/public/airdrop.svg";
import Hacker from "@/public/hacker.svg";
import Stars from "@/public/star.svg";
import Image, { type StaticImageData } from "next/image";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { API_BASE_URL } from "@/lib/api";

const chartData = [
  { time: "Mon", close: 19600 },
  { time: "Tue", close: 18800 },
  { time: "Wed", close: 19150 },
  { time: "Thu", close: 18700 },
  { time: "Fri", close: 18275 },
  { time: "Sat", close: 18450 },
  { time: "Sun", close: 19120 },
  { time: "Mon", close: 19400 },
  { time: "Tue", close: 18930 },
  { time: "Wed", close: 19210 },
  { time: "Thu", close: 19480 },
  { time: "Fri", close: 19310 },
  { time: "Sat", close: 19520 },
  { time: "Sun", close: 19690 },
];

const socialTags: { label: string; image: StaticImageData }[] = [
  { label: "Airdrop Farmer", image: Airdrop },
  { label: "Whale", image: Whale },
  { label: "Smart Trader", image: Stars },
  { label: "Hacker", image: Hacker },
];

const normalizeWalletApiBase = (value?: string) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed || /undefined|null/i.test(trimmed)) return API_BASE_URL;
  return trimmed;
};

const HOLDINGS_API_ENDPOINTS = Array.from(
  new Set([normalizeWalletApiBase(process.env.NEXT_PUBLIC_WALLET_HOLDINGS_API)])
);

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

const formatCurrencyCompact = (value: number) => {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatWalletAddress = (value?: string) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "No wallet selected";
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
};

type WalletAnalyzerSidebarProps = {
  addressOverride?: string;
};

export default function WalletAnalyzerSidebar({
  addressOverride,
}: WalletAnalyzerSidebarProps) {
  const { address: connectedAddress } = useChain(CHAIN_NAME || "zigchain-1");
  const address = addressOverride?.trim() || connectedAddress;
  const [walletValue, setWalletValue] = React.useState(0);
  const [loadingValue, setLoadingValue] = React.useState(false);
  const [valueError, setValueError] = React.useState<string | null>(null);
  const [classCounts, setClassCounts] = React.useState<Record<string, number>>(
    {}
  );
  const [loadingWhaleCount, setLoadingWhaleCount] = React.useState(false);

  React.useEffect(() => {
    if (!address) {
      setWalletValue(0);
      setValueError(null);
      setLoadingValue(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadWalletValue = async () => {
      setLoadingValue(true);
      setValueError(null);
      try {
        const payload = await fetchFromEndpoints(
          HOLDINGS_API_ENDPOINTS,
          `wallets/${encodeURIComponent(address)}/portfolio/holdings`,
          {
            cache: "no-store",
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
          "wallet holdings"
        );
        const items = Array.isArray(payload?.items) ? payload.items : [];
        const total = items.reduce((sum: number, item: any) => {
          const valueUsd = safeNumber(item?.value_usd ?? item?.valueUsd);
          return sum + valueUsd;
        }, 0);
        if (!active) return;
        setWalletValue(total);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Failed to load wallet value";
        setValueError(message);
      } finally {
        if (active) {
          setLoadingValue(false);
        }
      }
    };

    loadWalletValue();

    return () => {
      active = false;
      controller.abort();
    };
  }, [address]);

  React.useEffect(() => {
    if (!address) {
      setClassCounts({});
      setLoadingWhaleCount(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const loadWhaleCount = async () => {
      setLoadingWhaleCount(true);
      try {
        const payload = await fetchFromEndpoints(
          HOLDINGS_API_ENDPOINTS,
          `trades/wallet/${encodeURIComponent(address)}`,
          {
            cache: "no-store",
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
          "wallet trades"
        );
        const trades = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        const counts = trades.reduce(
          (acc: Record<string, number>, trade: any) => {
            const rawClass =
              trade?.class ??
              trade?.Class ??
              trade?.category ??
              trade?.tag ??
              "";
            const key =
              typeof rawClass === "string" ? rawClass.toLowerCase().trim() : "";
            if (!key) return acc;
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          },
          {}
        );
        if (!active) return;
        setClassCounts(counts);
      } catch {
        if (!active) return;
        setClassCounts({});
      } finally {
        if (active) {
          setLoadingWhaleCount(false);
        }
      }
    };

    loadWhaleCount();

    return () => {
      active = false;
      controller.abort();
    };
  }, [address]);

  const walletValueDisplay = loadingValue
    ? "Loading..."
    : valueError
    ? "N/A"
    : formatCurrencyCompact(walletValue);
  const displayAddress = address?.trim() || "No wallet selected";

  return (
    <div className="w-full space-y-4">
      <h1 className=" text-3xl tracking-tight mb-10 mt-4">Wallet Analyzer</h1>
      <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 pointer-events-none">
                
                <div className="absolute inset-0 bg-gradient-to-b from-[#05010c]/90 via-[#030106]/80 to-[#010103]/95" />
                <div
                className="absolute -left-8 -top-12 h-28 w-52 rounded-full opacity-30 blur-[20px]"
                style={{ backgroundColor: "#4ADE80" }}
                />
                <div
                className="absolute -right-4 -top-12 h-28 w-52 rounded-full opacity-30 blur-[20px]"
                style={{ backgroundColor: "#662D91" }}
                />
                <div
                className="absolute -right-12 -bottom-12 h-32 w-48 rounded-full opacity-25 blur-[40px]"
                style={{ backgroundColor: "#F64F39" }}
                />
               <div
                className="absolute -left-12 -bottom-12 h-32 w-48 rounded-full opacity-25 blur-[40px]"
                style={{ backgroundColor: "#662D91" }}
                />
            </div>
            <div className="relative  z-10 px-6 py-6 text-white">

                <div className="relative mb-8 overflow-hidden  ">
                <div className="relative z-10 flex items-start gap-4 rounded-2xl pb-4 border-b border-white/10">
                    <Image
                        src={Profile}
                        alt="Profile icon"
                        width={18}
                        height={18}
                        className="h-16 w-16 " 
                        unoptimized
                    />
                    <div className="flex-1">
                    <p className="text-sm font-semibold text-white tracking-tight">
                      {/* {formatWalletAddress(displayAddress)} */}
                      wahaj
                    </p>
                    <p className="text-[11px] text-gray-300">
                      {formatWalletAddress(displayAddress)}

                      {/* {displayAddress} */}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        4M
                        </span>
                        <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        <Star className="h-3.5 w-3.5 text-white" />
                        </span>
                    </div>
                    </div>
                    <div className="flex flex-col gap-2">
                    <button className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#00ff9e]">
                        <Pencil className="h-3 w-3" />
                    </button>
                    <button className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#00ff9e]">
                        <ClipboardCopy className="h-3 w-3" />
                    </button>
                    </div>
                </div>

                
                {/* Wallet Value Section - Replica of Layout in image */}
                <div>
                    <div className="flex mt-4 items-baseline justify-between">
                    <span className="text-lg text-zinc-200">Wallet Value</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">
                          {walletValueDisplay}
                        </span>
                        <span className="text-[11px] font-semibold text-[#ff4d4d]">N/A</span>
                    </div>
                    </div>

                    {/* Red sparkline replaced with Recharts line */}
                    <div className="w-full h-24 mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                        >
                          <XAxis dataKey="time" hide />
                          <YAxis domain={["dataMin", "dataMax"]} hide />
                          <Line
                            type="monotone"
                            dataKey="close"
                            stroke="#F64F39"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                </div>
                </div>
                {/* <div>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-300">
                    <span>Social Tag</span>
                    <span>insights</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    {socialTags.map(({ accent, icon: Icon, label }) => (
                    <div
                        key={label}
                        className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-[#080b0f] to-[#040407] px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                    >
                        <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">score</span>
                        <Icon className={`h-4 w-4 ${accent}`} />
                        </div>
                        <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400">{label}</p>
                        <p className="text-2xl font-semibold text-white">0</p>
                        </div>
                    </div>
                    ))}
                </div>
                </div> */}
                <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white mb-4">
                        <span className="tracking-tight">Social Tag</span>
                        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-700 text-[10px] text-zinc-300">
                        i
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        {socialTags.map(({ label, image }) => {
                          const labelKey = label.toLowerCase().trim();
                          const classKey =
                            labelKey === "whale" ? "shrimp" : labelKey;
                          const tagValue =
                            classKey in classCounts
                              ? loadingWhaleCount
                                ? "..."
                                : String(classCounts[classKey] ?? 0)
                              : "0";
                          return (
                        <div
                            key={label}
                            className="flex flex-col justify-between rounded-xl bg-[#111111] p-4 min-h-[110px] border border-transparent hover:border-white/5 transition-colors"
                        >
                            {/* Top: Label and Icon side-by-side */}
                            <div className="flex items-start justify-between gap-2">
                            <p className="text-[12px] leading-tight text-zinc-500 ">
                                {label}
                            </p>
                            <div className="flex-shrink-0">
                                <Image
                                    src={image}
                                    alt={`${label} icon`}
                                    width={24}
                                    height={24}
                                    className="h-10 w-10"
                                />
                            </div>
                            </div>
                            
                            {/* Bottom: Large Count */}
                            <div className="mt-auto">
                            <p className="text-3xl font-bold text-white">
                              {tagValue}
                            </p>
                            </div>
                        </div>
                          );
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
