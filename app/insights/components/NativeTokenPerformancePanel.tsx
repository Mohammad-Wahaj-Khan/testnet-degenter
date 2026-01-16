"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";

type Token = {
  symbol: string;
  name: string;
  imageUri?: string;
  mcapUsd?: number;
  priceChange?: Record<string, number> | number;
  priceUsd?: number;
  volume?: Record<string, number>;
  volumeUSD?: Record<string, number>;
  volUsd?: number;
};

type NativeTokenPerformancePanelProps = {
  data: Token[];
};

const FRAMES = ["30m", "1h", "4h", "24h"] as const;
const FRAME_LABELS = ["30M", "1H", "4H", "24H"] as const;

const normalizeKey = (value: string) => value.trim().toLowerCase();

const getPriceChange = (token: Token, frame: string) => {
  if (typeof token.priceChange === "number") return token.priceChange;
  const key = normalizeKey(frame);
  return token.priceChange?.[key] ?? 0;
};

const getVolumeUsd = (token: Token, frame: string) => {
  const key = normalizeKey(frame);
  return token.volumeUSD?.[key] ?? token.volUsd ?? token.volume?.[key] ?? 0;
};

const PALETTE = [
  "#38bdf8",
  "#f97316",
  "#22c55e",
  "#e11d48",
  "#a855f7",
  "#facc15",
  "#14b8a6",
];

const buildPath = (points: Array<[number, number]>) => {
  return points.reduce((acc, [x, y], index) => {
    return `${acc}${index === 0 ? "M" : "L"}${x},${y}`;
  }, "");
};

const NativeTokenPerformancePanel = ({
  data,
}: NativeTokenPerformancePanelProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedFrame, setSelectedFrame] = useState<(typeof FRAMES)[number]>(
    "24h"
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(() => {
    const top = [...data]
      .map((token) => ({
        token,
        volume: getVolumeUsd(token, "24h"),
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map(({ token }, index) => {
        const points = FRAMES.map((frame) => getPriceChange(token, frame));
        return {
          symbol: token.symbol,
          points,
          color: PALETTE[index % PALETTE.length],
        };
      });

    const allPoints = top.flatMap((item) => item.points);
    const min = Math.min(...allPoints, -1);
    const max = Math.max(...allPoints, 1);
    return { top, min, max };
  }, [data]);

  const chartPadding = { left: 40, right: 120, top: 20, bottom: 30 };
  const chartW = Math.max(dimensions.width - chartPadding.left - chartPadding.right, 0);
  const chartH = Math.max(dimensions.height - chartPadding.top - chartPadding.bottom, 0);

  const xFor = (index: number) =>
    chartPadding.left +
    (chartW / (FRAMES.length - 1 || 1)) * index;
  const yFor = (value: number) => {
    const range = series.max - series.min || 1;
    return (
      chartPadding.top +
      ((series.max - value) / range) * chartH
    );
  };

  const handlePointer = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const step = chartW / (FRAMES.length - 1 || 1);
    const index = Math.round((x - chartPadding.left) / step);
    if (index < 0 || index > FRAMES.length - 1) {
      setHoverIndex(null);
      return;
    }
    setHoverIndex(index);
  };

  return (
    <>
      <header className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-white font-medium uppercase tracking-tighter">
            Native Token Performance
          </h1>
          <Info size={14} className="text-zinc-500 cursor-help" />
        </div>
        <div className="flex bg-zinc-900/80 p-1 rounded text-xs border border-zinc-800">
          {FRAME_LABELS.map((label, index) => {
            const frame = FRAMES[index];
            return (
              <button
                key={label}
                className={`px-3 py-1 rounded ${
                  frame === selectedFrame
                    ? "bg-zinc-800 text-orange-500"
                    : "text-zinc-400"
                }`}
                onClick={() => setSelectedFrame(frame)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <section
        ref={containerRef}
        className="flex-1 p-4 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 to-black"
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full"
          onMouseMove={handlePointer}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = chartPadding.top + chartH * t;
            return (
              <line
                key={t}
                x1={chartPadding.left}
                x2={dimensions.width - chartPadding.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
              />
            );
          })}
          {FRAMES.map((frame, index) => (
            <text
              key={frame}
              x={xFor(index)}
              y={dimensions.height - 8}
              fill="rgba(255,255,255,0.4)"
              fontSize={10}
              textAnchor="middle"
            >
              {FRAME_LABELS[index]}
            </text>
          ))}
          {series.top.map((item) => {
            const points = item.points.map((value, index) => [
              xFor(index),
              yFor(value),
            ]) as Array<[number, number]>;
            return (
              <path
                key={item.symbol}
                d={buildPath(points)}
                stroke={item.color}
                strokeWidth={1.5}
                fill="none"
              />
            );
          })}
          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={chartPadding.top}
              y2={chartPadding.top + chartH}
              stroke="rgba(255,255,255,0.2)"
            />
          )}
        </svg>

        {hoverIndex !== null && (
          <div className="absolute right-40 top-1/2 -translate-y-1/2 bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
            <div className="text-zinc-300 mb-2">
              {FRAME_LABELS[hoverIndex]}
            </div>
            <div className="space-y-1">
              {series.top.map((item) => {
                const value = item.points[hoverIndex];
                return (
                  <div key={item.symbol} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white w-24">{item.symbol}</span>
                    <span
                      className={value >= 0 ? "text-emerald-300" : "text-red-300"}
                    >
                      {value >= 0 ? "+" : ""}
                      {value.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-2">
          {series.top.map((item) => {
            const value = item.points[FRAMES.indexOf(selectedFrame)];
            return (
              <div
                key={item.symbol}
                className="flex items-center justify-between gap-3 text-xs bg-black/60 border border-white/5 rounded px-2 py-1 min-w-[120px]"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-white">{item.symbol}</span>
                </span>
                <span className={value >= 0 ? "text-emerald-300" : "text-red-300"}>
                  {value >= 0 ? "+" : ""}
                  {value.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div> */}
      </section>
    </>
  );
};



export default NativeTokenPerformancePanel;
