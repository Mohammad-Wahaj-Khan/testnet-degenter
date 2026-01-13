"use client";

import { useEffect, useRef, useState } from "react";
import { tokenAPI, type TokenDetailResponse } from "@/lib/api";

type TokenSummaryData = TokenDetailResponse["data"] & {
  token?: TokenDetailResponse["data"]["token"];
};

type TokenSummaryMessage = {
  type?: string;
  ts?: string;
  token_id?: string | number;
  data?: TokenSummaryData;
};

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_TRADES_WS_URL || "";

const toNumber = (value?: string | number | null) => {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

export function useTokenSummary({
  tokenId,
  tokenKey,
}: {
  tokenId?: number | string | null;
  tokenKey?: string | null;
}) {
  const [data, setData] = useState<TokenSummaryData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [resolvedTokenId, setResolvedTokenId] = useState<number | null>(
    toNumber(tokenId)
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);

  useEffect(() => {
    const nextId = toNumber(tokenId);
    if (nextId) {
      setResolvedTokenId(nextId);
      return;
    }

    if (!tokenKey) {
      setResolvedTokenId(null);
      return;
    }

    let active = true;
    tokenAPI
      .getTokenDetailsBySymbol(tokenKey, "best", true)
      .then((res) => {
        const resolved = toNumber(res?.data?.token?.tokenId);
        if (active && resolved) setResolvedTokenId(resolved);
      })
      .catch(() => {
        if (active) setResolvedTokenId(null);
      });

    return () => {
      active = false;
    };
  }, [tokenId, tokenKey]);

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_TOKEN_SUMMARY_WS_URL ||
      process.env.NEXT_PUBLIC_WS_URL ||
      DEFAULT_WS_URL;

    if (!resolvedTokenId || !wsUrl) return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        ws.send(
          JSON.stringify({
            type: "sub",
            stream: "token_summary",
            tokenId: resolvedTokenId,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg: TokenSummaryMessage = JSON.parse(event.data);
          if (msg.type !== "token_summary" || !msg.data) return;
          setData(msg.data);
          setLastUpdated(new Date());
        } catch (err) {
          console.error("Token summary parse error:", err);
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        reconnectRef.current = window.setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      setConnected(false);
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [resolvedTokenId]);

  return { data, lastUpdated, connected, tokenId: resolvedTokenId };
}
