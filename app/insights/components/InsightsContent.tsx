"use client";

import { useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import BubbleMapPanel from "./BubbleMapPanel";
import Coin360Panel from "./Coin360Panel";
import NativeTokenPerformancePanel from "./NativeTokenPerformancePanel";

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

type InsightsContentProps = {
  tokens: Token[];
};

const InsightsContent: React.FC<InsightsContentProps> = ({ tokens }) => {
  const [activeView, setActiveView] = useState<
    "bubble" | "coin360" | "native-performance"
  >("bubble");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMarketTrendsOpen, setIsMarketTrendsOpen] = useState(true);
  const insightName =
    activeView === "bubble"
      ? "Bubble Map"
      : activeView === "coin360"
      ? "Coin 360"
      : "Token Performance";

  return (
    <div className="flex flex-1 min-h-0 flex-col px-6">
      <header className="flex items-center gap-3 px-4 py-3  relative z-20  py-8">
        <button
          className="text-zinc-400 hover:text-white"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose size={18} />
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>
        <h2 className="text-white font-semibold uppercase text-sm">Insights</h2>
        <span className="text-zinc-400 text-sm">/ {insightName}</span>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          className={`hidden md:flex flex-col transition-[width] duration-200 ${
            isSidebarOpen ? "w-64 border-r border-zinc-800" : "w-0"
          }`}
        >
          <div
            className={`flex-1 p-4 transition-opacity duration-200 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <h2 className="text-white font-bold mb-6 flex items-center gap-2">
              <LayoutGrid size={20} /> INSIGHTS
            </h2>

            {/* <div className="relative mb-6">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
              <input
                placeholder="Search insight"
                className="w-full bg-zinc-900 border-none rounded py-2 pl-10 text-sm focus:ring-1 ring-orange-500"
              />
            </div> */}

            <nav className="space-y-4 text-sm">
              <div>
                <button
                  className="w-full flex items-center justify-between text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 hover:text-zinc-400"
                  onClick={() => setIsMarketTrendsOpen((prev) => !prev)}
                  aria-expanded={isMarketTrendsOpen}
                  aria-controls="market-trends-list"
                >
                  <span>Market Trends</span>
                  {isMarketTrendsOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
                {isMarketTrendsOpen ? (
                  <div id="market-trends-list" className="space-y-1">
                    <button
                      className={`w-full flex items-center gap-3 p-2 rounded text-left ${
                        activeView === "bubble"
                          ? "bg-zinc-900 text-[#39C8A6]"
                          : "hover:bg-zinc-900 text-zinc-400"
                      }`}
                      onClick={() => setActiveView("bubble")}
                    >
                      <div
                        className={`w-1 h-4 rounded-full ${
                          activeView === "bubble"
                            ? "bg-[#39C8A6]"
                            : "bg-zinc-700"
                        }`}
                      />
                      Bubble map
                    </button>
                    <button
                      className={`w-full flex items-center gap-3 p-2 rounded text-left ${
                        activeView === "coin360"
                          ? "bg-zinc-900 text-[#FA4E30]"
                          : "hover:bg-zinc-900 text-zinc-400"
                      }`}
                      onClick={() => setActiveView("coin360")}
                    >
                      <div
                        className={`w-1 h-4 rounded-full ${
                          activeView === "coin360"
                            ? "bg-[#FA4E30]"
                            : "bg-zinc-700"
                        }`}
                      />
                      Coin 360
                    </button>
                    <button
                      className={`w-full flex items-center gap-3 p-2 rounded text-left ${
                        activeView === "native-performance"
                          ? "bg-zinc-900 text-[#51179cff]"
                          : "hover:bg-zinc-900 text-zinc-400"
                      }`}
                      onClick={() => setActiveView("native-performance")}
                    >
                      <div
                        className={`w-1 h-4 rounded-full ${
                          activeView === "native-performance"
                            ? "bg-[#51179cff]"
                            : "bg-zinc-700"
                        }`}
                      />
                      Token performances
                    </button>
                  </div>
                ) : null}
              </div>
            </nav>
        </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {activeView === "bubble" ? (
            <BubbleMapPanel data={tokens} />
          ) : activeView === "coin360" ? (
            <Coin360Panel data={tokens} />
          ) : (
            <NativeTokenPerformancePanel data={tokens} />
          )}
        </main>
      </div>
    </div>
  );
};

export default InsightsContent;
