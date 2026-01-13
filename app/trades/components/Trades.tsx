/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import Image from "next/image";
import { Copy, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
const ZIGCHAIN_ICON = "/zigicon.png";
const Degenter_ICON = "/degen.png";
const ZIGCHAIN_LABEL = "Oroswap";
const Degenter_Label = "Degenter";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://testnet-api.degenter.io";
const API_KEY =
  process.env.NEXT_PUBLIC_X_API_KEY || process.env.NEXT_PUBLIC_API_KEY;
const API_HEADERS: HeadersInit = API_KEY ? { "x-api-key": API_KEY } : {};
const TRADES_WS_URL = process.env.NEXT_PUBLIC_TRADES_WS_URL || "";
const MAX_TRADES = 500;
const TOKEN_OPTIONS_CACHE: { loaded: boolean; options: TokenOption[] } = {
  loaded: false,
  options: [],
};
type TradesWsListener = (event: MessageEvent) => void;
const tradesWsHub = {
  ws: null as WebSocket | null,
  reconnectTimeout: null as NodeJS.Timeout | null,
  reconnectAttempts: 0,
  connecting: false,
  allowReconnect: true,
  listeners: new Set<TradesWsListener>(),
};

const notifyTradesWsListeners = (event: MessageEvent) => {
  tradesWsHub.listeners.forEach((listener) => listener(event));
};

const ensureTradesWs = () => {
  if (!TRADES_WS_URL) return;
  if (
    tradesWsHub.ws &&
    (tradesWsHub.ws.readyState === WebSocket.OPEN ||
      tradesWsHub.ws.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  if (tradesWsHub.connecting) return;

  tradesWsHub.connecting = true;

  try {
    const ws = new WebSocket(TRADES_WS_URL);
    tradesWsHub.ws = ws;

    ws.onopen = () => {
      tradesWsHub.connecting = false;
      tradesWsHub.reconnectAttempts = 0;
      ws.send(JSON.stringify({ type: "sub", stream: "trades" }));
    };

    ws.onmessage = notifyTradesWsListeners;

    ws.onerror = () => {
      tradesWsHub.connecting = false;
    };

    ws.onclose = () => {
      tradesWsHub.ws = null;
      tradesWsHub.connecting = false;
      if (!tradesWsHub.allowReconnect || tradesWsHub.listeners.size === 0) return;
      if (tradesWsHub.reconnectAttempts < 5) {
        const delay = Math.min(
          1000 * Math.pow(2, tradesWsHub.reconnectAttempts),
          30000
        );
        tradesWsHub.reconnectAttempts += 1;
        tradesWsHub.reconnectTimeout = setTimeout(() => {
          ensureTradesWs();
        }, delay);
      }
    };
  } catch {
    tradesWsHub.connecting = false;
  }
};

const addTradesWsListener = (listener: TradesWsListener) => {
  tradesWsHub.listeners.add(listener);
  tradesWsHub.allowReconnect = true;
  ensureTradesWs();

  return () => {
    tradesWsHub.listeners.delete(listener);
    if (tradesWsHub.listeners.size > 0) return;
    tradesWsHub.allowReconnect = false;
    if (tradesWsHub.reconnectTimeout) {
      clearTimeout(tradesWsHub.reconnectTimeout);
      tradesWsHub.reconnectTimeout = null;
    }
    if (tradesWsHub.ws) {
      try {
        tradesWsHub.ws.close();
      } catch {}
      tradesWsHub.ws = null;
    }
  };
};

export interface Trade {
  time: string;
  txHash: string;
  direction: "buy" | "sell" | "provide" | "withdraw";
  offerDenom: string;
  offerAmount: number;
  askDenom: string;
  returnAmount: number;
  valueNative?: number;
  valueUsd: number;
  priceUsd: number;
  signer: string;
  class: "whale" | "shark" | "shrimp";
}

export type ValueRangeLabel =
  | "< 1K ZIG"
  | "1K - 10K ZIG"
  | "> 10K ZIG";

export interface TradesFilter {
  assetMode: "all" | "token";
  timeRange: "24H" | "7D" | "30D";
  valueRange: ValueRangeLabel | "";
  tokenDenom: string;
  wallet: string;
}

export interface TokenOption {
  denom: string;
  label: string;
}

const TIME_RANGE_MS: Record<TradesFilter["timeRange"], number> = {
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
};
const TIME_RANGE_API: Record<TradesFilter["timeRange"], string> = {
  "24H": "24h",
  "7D": "7d",
  "30D": "30d",
};

interface TradesProps {
  filters: TradesFilter;
  onAvailableTokens?: (options: TokenOption[]) => void;
  onFilteredTradesChange?: (trades: Trade[]) => void;
}

const Trades = ({ filters, onAvailableTokens, onFilteredTradesChange }: TradesProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;
  const [symbolMap, setSymbolMap] = useState<Record<string, string>>({});
  const [tokenImageMap, setTokenImageMap] = useState<Record<string, string>>({});
  const [allTokenOptions, setAllTokenOptions] = useState<TokenOption[]>([]);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const hasWsTradesRef = useRef(false);
  const tradesRef = useRef<Trade[]>([]);
  const wsMessageHandlerRef = useRef<(event: MessageEvent) => void>(() => {});

  // Colors from image_cc0611.png (Figma)
  const COLORS = {
    green: "#4ADE80",
    purple: "#662D91",
    darkBg: "#050505",
    rowHover: "rgba(255, 255, 255, 0.03)",
  };

  const fetchApi = useCallback(
    (url: string, init: RequestInit = {}) =>
      fetch(url, {
        ...init,
        headers: { ...API_HEADERS, ...(init.headers || {}) },
      }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/tokens/swap-list?q=zig&unit=usd`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items: Array<{
          denom: string;
          symbol: string;
          imageUri?: string;
        }> = json?.data ?? [];
        const map: Record<string, string> = {};
        const imageMap: Record<string, string> = {};

        map["uzig"] = "ZIG";
        imageMap["uzig"] = "/zigicon.png";

        for (const it of items) {
          if (it?.denom && it?.symbol) {
            map[it.denom] = it.symbol;
            if (it.imageUri) {
              imageMap[it.denom] = it.imageUri;
            }
          }
        }

        if (!cancelled) {
          setSymbolMap(map);
          setTokenImageMap(imageMap);
        }
      } catch {
        if (!cancelled) {
          setSymbolMap({ uzig: "ZIG" });
          setTokenImageMap({ uzig: "/zigicon.png" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (TOKEN_OPTIONS_CACHE.loaded) {
      setAllTokenOptions(TOKEN_OPTIONS_CACHE.options);
      return;
    }

    (async () => {
      try {
        const res = await fetchApi(
          `${API_BASE}/tokens?bucket=24h&priceSource=best&sort=volume&dir=desc&includeChange=1&limit=200&offset=0`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items: Array<{ denom?: string; tokenId?: string; symbol?: string }> =
          json?.data ?? [];
        const options = items
          .map((token) => {
            const denom = token.denom || token.tokenId || "";
            return {
              denom,
              label: token.symbol || denom,
            };
          })
          .filter((option) => option.denom && !isZigDenom(option.denom));

        if (!cancelled) {
          TOKEN_OPTIONS_CACHE.options = options;
          TOKEN_OPTIONS_CACHE.loaded = true;
          setAllTokenOptions(options);
        }
      } catch (error) {
        console.error("Failed to load token options", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchApi]);

  const formatTime = (timeStr: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(timeStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}hr ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getEntityIcon = (tradeClass: Trade["class"]) => {
    switch (tradeClass) {
      case "whale": return <span className="text-blue-400">🐋</span>;
      case "shark": return <span className="text-cyan-300">🦈</span>;
      default: return <span className="text-orange-400">🦐</span>;
    }
  };

  const getEntityLabel = (tradeClass: Trade["class"]) => {
    switch (tradeClass) {
      case "shark":
        return "Shark";
      case "shrimp":
        return "Shrimp";
      default:
        return "Whale";
    }
  };

  const determineEntityClass = (trade: Trade): Trade["class"] => {
    const value = trade.valueNative ?? trade.valueUsd ?? 0;
    if (value >= 10000) return "whale";
    if (value >= 1000) return "shark";
    return "shrimp";
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const formatAmount = (value?: number) =>
    value != null
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  const symbolFor = (denom?: string) => {
    if (!denom) return "";
    if (denom.toLowerCase().includes("uzig")) return "ZIG";
    const found = symbolMap[denom];
    if (found) return found;
    const cleaned = denom.replace(/ibc\/\w+\//i, "");
    const parts = cleaned.split(/[./]/);
    const last = parts[parts.length - 1] || denom;
    return last.toUpperCase();
  };

  const getTokenIcon = (denom?: string): string => {
    if (!denom) return "/zigicon.png";
    return tokenImageMap[denom] ?? "/zigicon.png";
  };

  const isZigDenom = (denom?: string) => denom?.toLowerCase().includes("uzig");

  const tradeKey = (trade: Trade) =>
    trade.txHash || `${trade.signer}:${trade.time}:${trade.offerDenom}:${trade.askDenom}`;

  const getZigSideAmount = (
    offerDenom: string,
    askDenom: string,
    direction: Trade["direction"],
    offerAmount: number,
    returnAmount: number
  ) => {
    const offeringZig = isZigDenom(offerDenom);
    const askingZig = isZigDenom(askDenom);

    if (direction === "buy" && offeringZig) return offerAmount;
    if (direction === "sell" && askingZig) return returnAmount;
    if (offeringZig) return offerAmount;
    if (askingZig) return returnAmount;
    return 0;
  };

  const getTradeClass = (zigAmount: number = 0): Trade["class"] => {
    if (zigAmount >= 10000) return "whale";
    if (zigAmount >= 1000) return "shark";
    return "shrimp";
  };

  const normalizeWsAmount = (raw: number, denom: string) => {
    if (!Number.isFinite(raw)) return 0;
    if (isZigDenom(denom)) return raw / 1_000_000;
    return raw / 1_000_000;
  };

  const unwrapTradePayload = (payload: any): any => {
    if (!payload || typeof payload !== "object") return payload;
    if (
      payload.direction ||
      payload.offer_amount_base ||
      payload.offerAmount ||
      payload.offer_amount ||
      payload.return_amount_base ||
      payload.returnAmount ||
      payload.return_amount ||
      payload.action ||
      payload.trade_id ||
      payload.tradeId
    ) {
      return payload;
    }
    if (payload.data) return unwrapTradePayload(payload.data);
    return payload;
  };

  const mapStreamTradeToLocal = (item: any): Trade | null => {
    try {
      const tradeData = unwrapTradePayload(item);
      if (!tradeData) return null;

      const direction = (tradeData.direction as Trade["direction"]) || "buy";
      const offerDenom = tradeData.offer_asset_denom ?? tradeData.offerDenom ?? "";
      const askDenom = tradeData.ask_asset_denom ?? tradeData.askDenom ?? "";
      const offerAmountRaw = Number(
        tradeData.offer_amount_base ??
          tradeData.offerAmountBase ??
          tradeData.offer_amount ??
          tradeData.offerAmount ??
          0
      );
      const returnAmountRaw = Number(
        tradeData.return_amount_base ??
          tradeData.returnAmountBase ??
          tradeData.return_amount ??
          tradeData.returnAmount ??
          0
      );

      const offerAmount = tradeData.offerAmount
        ? Number(tradeData.offerAmount)
        : normalizeWsAmount(offerAmountRaw, offerDenom);
      const returnAmount = tradeData.returnAmount
        ? Number(tradeData.returnAmount)
        : normalizeWsAmount(returnAmountRaw, askDenom);

      const zigAmount = getZigSideAmount(
        offerDenom,
        askDenom,
        direction,
        offerAmount,
        returnAmount
      );

      const priceUsd = Number(
        tradeData.price_in_usd ??
          tradeData.priceInUsd ??
          tradeData.price_usd ??
          0
      );
      const valueUsd = Number(
        tradeData.value_in_usd ??
          tradeData.valueUsd ??
          tradeData.value_usd ??
          (priceUsd ? priceUsd * (direction === "sell" ? offerAmount : returnAmount) : 0)
      );

      return {
        time: tradeData.created_at ?? item?.ts ?? new Date().toISOString(),
        txHash: tradeData.tx_hash ?? tradeData.txHash ?? item?.tx_hash ?? "",
        direction,
        offerDenom,
        offerAmount,
        askDenom,
        returnAmount,
        valueNative: zigAmount || undefined,
        valueUsd,
        priceUsd,
        signer: tradeData.signer ?? "",
        class: getTradeClass(zigAmount),
      };
    } catch (error) {
      console.error("Error parsing trade from stream:", error);
      return null;
    }
  };

  const parseTradesFromStreamMessage = (
    msg: any
  ): { trades: Trade[]; isSnapshot: boolean } => {
    if (!msg) return { trades: [], isSnapshot: false };
    const isSnapshot = msg.type === "snapshot";
    let items: any[] = [];

    if (msg.type === "trade") {
      items = [msg.data ?? msg];
    } else if (isSnapshot && Array.isArray(msg.data)) {
      items = msg.data;
    } else if (Array.isArray(msg.data)) {
      items = msg.data;
    }

    if (!items.length) return { trades: [], isSnapshot };

    const mapped = items
      .map(mapStreamTradeToLocal)
      .filter(Boolean) as Trade[];

    return { trades: mapped, isSnapshot };
  };

  const mapApiTradeToLocal = (trade: any): Trade => {
    const direction = (trade.direction as Trade["direction"]) || "buy";
    const offerDenom = trade.offerDenom ?? trade.offer_denom ?? "";
    const askDenom = trade.askDenom ?? trade.ask_denom ?? "";
    const offerAmount = Number(trade.offerAmount ?? trade.offer_amount ?? 0);
    const returnAmount = Number(trade.returnAmount ?? trade.return_amount ?? 0);
    const zigAmount = getZigSideAmount(
      offerDenom,
      askDenom,
      direction,
      offerAmount,
      returnAmount
    );

    return {
      time: trade.time ?? trade.created_at ?? "",
      txHash: trade.txHash ?? trade.tx_hash ?? "",
      direction,
      offerDenom,
      offerAmount,
      askDenom,
      returnAmount,
      valueNative: Number(trade.valueNative ?? zigAmount ?? 0) || undefined,
      valueUsd: Number(trade.valueUsd ?? trade.value_usd ?? 0),
      priceUsd: Number(trade.priceUsd ?? trade.price_usd ?? 0),
      signer: trade.signer ?? "",
      class: getTradeClass(zigAmount),
    };
  };

  const fetchTradesFromApi = useCallback(async () => {
    const timeframe = TIME_RANGE_API[filters.timeRange] ?? "24h";
    const tokenDenom = filters.tokenDenom.trim();
    const endpoint = tokenDenom
      ? `${API_BASE}/trades/token/${encodeURIComponent(
          tokenDenom
        )}?tf=${timeframe}&unit=usd&limit=5000`
      : `${API_BASE}/trades?tf=${timeframe}&unit=usd&limit=5000`;
    try {
      if (!tradesRef.current.length) {
        setLoading(true);
      }
      const res = await fetchApi(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        const mapped = json.data.map(mapApiTradeToLocal);
        setTrades(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch trades", err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, filters.timeRange, filters.tokenDenom]);

  useEffect(() => {
    wsMessageHandlerRef.current = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { trades: tradesFromMessage, isSnapshot } =
          parseTradesFromStreamMessage(msg);
        if (!tradesFromMessage.length) return;

        hasWsTradesRef.current = true;
        setTrades((prev) => {
          if (isSnapshot) {
            if (!prev.length) return tradesFromMessage.slice(0, MAX_TRADES);
            const seen = new Set(prev.map(tradeKey));
            const incoming = tradesFromMessage.filter(
              (trade) => !seen.has(tradeKey(trade))
            );
            if (!incoming.length) return prev;
            return [...incoming, ...prev].slice(0, MAX_TRADES);
          }

          const seen = new Set(prev.map(tradeKey));
          const incoming = tradesFromMessage.filter(
            (trade) => !seen.has(tradeKey(trade))
          );
          if (!incoming.length) return prev;
          return [...incoming, ...prev].slice(0, MAX_TRADES);
        });
        setLoading(false);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
  }, [parseTradesFromStreamMessage, tradeKey]);

  useEffect(() => {
    if (!TRADES_WS_URL) return;
    const listener = (event: MessageEvent) => {
      wsMessageHandlerRef.current(event);
    };
    const unsubscribe = addTradesWsListener(listener);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!filters.tokenDenom) {
      if (!TRADES_WS_URL) {
        fetchTradesFromApi();
      }
      return;
    }
    fetchTradesFromApi();
  }, [fetchTradesFromApi, filters.tokenDenom]);

  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);

  useEffect(() => {
    if (!TRADES_WS_URL) return;
    let cancelled = false;
    const fallbackTimeout = setTimeout(() => {
      if (!hasWsTradesRef.current && !cancelled) {
        fetchTradesFromApi();
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimeout);
    };
  }, [fetchTradesFromApi, filters.timeRange]);

  const parseTradeTimestamp = (time?: string) => {
    if (!time) return NaN;
    const numeric = Number(time);
    if (!Number.isNaN(numeric)) {
      return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    }
    const parsed = Date.parse(time);
    return Number.isNaN(parsed) ? NaN : parsed;
  };

  const copyAddress = async (address: string) => {
    if (!address || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  const tokenOptionsFromTrades = useMemo(() => {
    const uniqueTokens = new Map<string, string>();
    trades.forEach((trade) => {
      [trade.askDenom, trade.offerDenom].forEach((denom) => {
        if (!denom) return;
        if (!uniqueTokens.has(denom)) {
          uniqueTokens.set(denom, symbolFor(denom));
        }
      });
    });
    return Array.from(uniqueTokens.entries())
      .map(([denom, label]) => ({
        denom,
        label,
      }))
      .filter(({ denom }) => !isZigDenom(denom));
  }, [trades, symbolMap]);

  useEffect(() => {
    if (!onAvailableTokens) return;
    const options = allTokenOptions.length
      ? allTokenOptions
      : tokenOptionsFromTrades;
    onAvailableTokens(options);
  }, [onAvailableTokens, tokenOptionsFromTrades, allTokenOptions]);



  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const walletFilter = filters.wallet.trim().toLowerCase();

    return trades.filter((trade) => {
      if (filters.assetMode === "token") {
        if (isZigDenom(trade.askDenom) && isZigDenom(trade.offerDenom)) {
          return false;
        }
      }

      const tradeTimestamp = parseTradeTimestamp(trade.time);
      const timeLimit = TIME_RANGE_MS[filters.timeRange] ?? Number.POSITIVE_INFINITY;
      if (
        !Number.isNaN(tradeTimestamp) &&
        now - tradeTimestamp > timeLimit
      ) {
        return false;
      }

      const value = trade.valueNative ?? trade.valueUsd ?? 0;
      if (filters.valueRange === "< 1K ZIG" && value >= 1000) return false;
      if (
        filters.valueRange === "1K - 10K ZIG" &&
        (value < 1000 || value >= 10000)
      )
        return false;
      if (filters.valueRange === "> 10K ZIG" && value < 10000) return false;

      if (filters.tokenDenom) {
        const tokenLower = filters.tokenDenom.toLowerCase();
        const matchesToken =
          trade.askDenom.toLowerCase() === tokenLower ||
          trade.offerDenom.toLowerCase() === tokenLower;
        if (!matchesToken) return false;
      }

      if (walletFilter && !trade.signer.toLowerCase().includes(walletFilter)) {
        return false;
      }

      return true;
    });
  }, [trades, filters]);
  useEffect(() => {
    onFilteredTradesChange?.(filteredTrades);
  }, [filteredTrades, onFilteredTradesChange]);
  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(filteredTrades.length / tradesPerPage)
    );
    setCurrentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [filteredTrades.length, tradesPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrades.length / tradesPerPage)
  );
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * tradesPerPage,
    currentPage * tradesPerPage
  );

  useLayoutEffect(() => {
    if (!tableBodyRef.current) return;
    const rows = Array.from(tableBodyRef.current.querySelectorAll<HTMLTableRowElement>("tr"));
    if (!rows.length) return;

    gsap.fromTo(
      rows,
      {
        opacity: 0,
        y: 16,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.05,
        overwrite: "auto",
      }
    );
  }, [paginatedTrades]);

  return (
    // <div className="relative w-full min-h-screen p-4 font-sans selection:bg-purple-500/30" 
    //      style={{ backgroundColor: COLORS.darkBg, color: 'white' }}
    //      >
      
    //   {/* Background Gradient Glow - Exact Replica of image_cc8971.jpg */}
    //   {/* <div className="fixed inset-0 pointer-events-none overflow-hidden">
    //     <div 
    //       className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] blur-[120px] opacity-20 rounded-full"
    //       style={{ background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.purple})` }}
    //     />
    //   </div> */}

      <div
        className="relative z-10 mx-auto w-full rounded-2xl overflow-hidden border border-white/20"
        style={{
          backgroundImage: `radial-gradient(circle at 80% 80%, rgba(35, 153, 125, 0.45), rgba(0,0,0,0) 55%), linear-gradient(140deg, #050505 35%, #050505 70%, #020a0b 100%)`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="overflow-x-auto ">
          <table className="w-full text-left border-collapse">
            <thead>
                
              <tr className="relative border-b border-white/20 bg-[#000000]/50 text-gray-400 text-xs uppercase tracking-wider after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-[#FA4E30] after:to-[#39C8A6] after:content-['']">
              
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Value</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Trader</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Platform</th>
              </tr>
            </thead>
            <tbody ref={tableBodyRef} className="divide-y divide-white/[0.03]">
              {!paginatedTrades.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-white/60"
                  >
                    No trades found
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade, idx) => {
                const entityClass = determineEntityClass(trade);
                return (
                  <tr key={trade.txHash + idx} className="group transition-colors hover:bg-white/[0.02] border-b border-white/15">
                  <td className="px-6 py-4 text-sm text-gray-300  border-b border-white/15">
                    {formatTime(trade.time)}
                  </td>
                  <td className="px-6 py-4 border-b border-white/15">
                    <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${
                      trade.direction === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {trade.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium border-b border-white/15">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {getEntityIcon(entityClass)}
                        {/* <span className="text-xs uppercase tracking-wide text-gray-400/80 font-semibold">
                          {getEntityLabel(entityClass)}
                        </span> */}
                      </div>
                      <span>
                        ${trade.valueUsd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm border-b border-white/15">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[#20D87C]">
                        <Image
                          src={getTokenIcon(trade.askDenom)}
                          alt={`${symbolFor(trade.askDenom)} icon`}
                          width={18}
                          height={18}
                          className="w-4 h-4 rounded-full object-cover"
                          unoptimized
                        />
                        <span className="text-sm font-semibold">
                          +{formatAmount(trade.returnAmount)} {symbolFor(trade.askDenom)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#F64F39]">
                        <Image
                          src={getTokenIcon(trade.offerDenom)}
                          alt={`${symbolFor(trade.offerDenom)} icon`}
                          width={18}
                          height={18}
                          className="w-4 h-4 rounded-full object-cover"
                          unoptimized
                        />
                        <span className="text-sm font-semibold">
                          -{formatAmount(trade.offerAmount)} {symbolFor(trade.offerDenom)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm border-b border-white/15">
                    <div className="flex items-center gap-2 text-blue-400 group">
                      <span className="cursor-pointer hover:text-blue-300">
                        {truncateAddress(trade.signer)}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyAddress(trade.signer)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Copy trader address"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-white/15">
                      <div className="flex items-center gap-2">
                        <Image
                          src={ZIGCHAIN_ICON}
                          alt="Zigchain"
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                        <span className="text-sm">{ZIGCHAIN_LABEL}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 border-b border-white/15">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Image
                          src={Degenter_ICON}
                          alt="Degenter"
                          width={24}
                          height={24}
                          className="h-6 w-7  object-cover"
                        />
                        <span className="text-sm">{Degenter_Label}</span>
                      </div>
                      <a href={`https://testnet.zigscan.org/tx/${trade.txHash}`} target="_blank" className="p-1.5 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                        <ExternalLink size={14} className="text-green-400" />
                      </a>
                    </div>
                  </td>
                </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination as seen in UI footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-white/5 bg-black/20">
          <span className="text-xs text-gray-500">
            Showing {(currentPage - 1) * tradesPerPage + 1}-{Math.min(currentPage * tradesPerPage, filteredTrades.length)} of {filteredTrades.length}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium px-3 py-1 bg-white/10 rounded-md">
               {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    // </div>
  );
};

export default Trades;
