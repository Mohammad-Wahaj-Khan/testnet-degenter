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
import dynamic from "next/dynamic";

const WordCloudPanel = dynamic(() => import("./WordCloudPanel"), {
  ssr: false,
});

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
    "bubble" | "coin360" | "native-performance" | "wordcloud"
  >("wordcloud");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMarketTrendsOpen, setIsMarketTrendsOpen] = useState(true);
  const insightName =
    activeView === "bubble"
      ? "Bubble Map"
      : activeView === "coin360"
      ? "Coin 360"
      : activeView === "native-performance"
      ? "Token Performance"
      : "Market Trends";

  return (
    <div className="flex flex-1 min-h-0 flex-col px-6">
      <header className="flex items-center gap-3 px-4 py-3  relative z-20">
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
                {isMarketTrendsOpen && (
                  <ul id="market-trends-list" className="space-y-1 pl-4">
                    <li>
                      <button
                        className={`w-full text-left px-3 py-1.5 rounded ${
                          activeView === "wordcloud"
                            ? "bg-zinc-800 text-orange-400"
                            : "text-zinc-400 hover:bg-zinc-800"
                        }`}
                        onClick={() => setActiveView("wordcloud")}
                      >
                        Market Trends
                      </button>
                    </li>
                    <li>
                      <button
                        className={`w-full text-left px-3 py-1.5 rounded ${
                          activeView === "bubble"
                            ? "bg-zinc-800 text-orange-400"
                            : "text-zinc-400 hover:bg-zinc-800"
                        }`}
                        onClick={() => setActiveView("bubble")}
                      >
                        Bubble Map
                      </button>
                    </li>
                    <li>
                      <div className="relative">
                        <button
                          className={`w-full text-left px-3 py-1.5 rounded ${
                            activeView === "coin360"
                              ? "bg-zinc-800 text-orange-400/50"
                              : "text-zinc-400/50 hover:bg-zinc-800/50"
                          } opacity-50 cursor-not-allowed`}
                          disabled
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          Coin 360
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-700/80 text-zinc-400 px-2 py-0.5 rounded">
                            Coming Soon
                          </span>
                        </button>
                      </div>
                    </li>
                    <li>
                      <div className="relative">
                        <button
                          className={`w-full text-left px-3 py-1.5 rounded ${
                            activeView === "native-performance"
                              ? "bg-zinc-800 text-orange-400/50"
                              : "text-zinc-400/50 hover:bg-zinc-800/50"
                          } opacity-50 cursor-not-allowed`}
                          disabled
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          Token Performance
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-700/80 text-zinc-400 px-2 py-0.5 rounded">
                            Coming Soon
                          </span>
                        </button>
                      </div>
                    </li>
                  </ul>
                )}
              </div>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          {activeView === "wordcloud" && <WordCloudPanel />}
          {activeView === "bubble" && <BubbleMapPanel data={tokens} />}
          {activeView === "coin360" && <Coin360Panel data={tokens} />}
          {activeView === "native-performance" && (
            <NativeTokenPerformancePanel data={tokens} />
          )}
        </main>
      </div>
    </div>
  );
};

export default InsightsContent;
