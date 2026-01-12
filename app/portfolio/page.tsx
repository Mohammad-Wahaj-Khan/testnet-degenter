"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/navbar";
import TopMarketToken from "../components/TopMarketToken";
import WalletAnalyzerBoxes, {
  analyzerTabs,
  type AnalyzerTabId,
  type TradingTimeframe,
} from "./WalletAnalyzerPNL/components/WalletAnalyzerBoxes";
import WalletAnalyzerTable from "./WalletAnalyzerPNL/components/WalletAnalyzerTable";
import WalletAnalyzerSidebar from "./WalletAnalyzerPNL/components/WalletAnalyzesSideBar";
import WalletAnalyzerPortfolio from "./WalletAnalyzerPortfolio/components/WalletAnalyzerPortfolio";
import WalletAnalyzerActivities from "./WalletAnalyzerActivities/components/WalletAnalyzerActivities";

export default function Home() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AnalyzerTabId>(analyzerTabs[0].id);
  const [tradingTimeframe, setTradingTimeframe] =
    useState<TradingTimeframe>("24h");
  const showTradingContent = activeTab === "trading";
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const addressOverride = searchParams.get("address")?.trim() || "";
  const tabOverride = searchParams.get("tab") as AnalyzerTabId | null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsAnimationReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (
      tabOverride &&
      (tabOverride === "trading" ||
        tabOverride === "portfolio" ||
        tabOverride === "activities")
    ) {
      setActiveTab(tabOverride);
    }
  }, [tabOverride]);

  return (
    <>
      <main className="flex min-h-screen flex-col bg-black relative overflow-hidden">
        <div
          className="absolute inset-0 z-1 h-60"
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

        <div className="z-10">
          <div
            className={`drop-from-top ${isAnimationReady ? "drop-from-top-active" : ""}`}
            style={{ animationDelay: "0s" }}
          >
            <Navbar />
          </div>
          <div
            className={`drop-from-top ${isAnimationReady ? "drop-from-top-active" : ""}`}
            style={{ animationDelay: "0.07s" }}
          >
            <TopMarketToken />
          </div>
          <section
            className={`mx-auto w-full px-8 pt-10 drop-from-top ${
              isAnimationReady ? "drop-from-top-active" : ""
            }`}
            style={{ animationDelay: "0.14s" }}
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,380px),1fr]">
              <div
                className={`drop-from-top ${isAnimationReady ? "drop-from-top-active" : ""}`}
                style={{ animationDelay: "0.18s" }}
              >
                <WalletAnalyzerSidebar
                  addressOverride={addressOverride || undefined}
                />
              </div>
              <div
                className={`drop-from-top ${isAnimationReady ? "drop-from-top-active" : ""}`}
                style={{ animationDelay: "0.22s" }}
              >
                <WalletAnalyzerBoxes
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  addressOverride={addressOverride || undefined}
                  timeframe={tradingTimeframe}
                  onTimeframeChange={setTradingTimeframe}
                />
                {!showTradingContent && activeTab === "portfolio" && (
                  <WalletAnalyzerPortfolio
                    addressOverride={addressOverride || undefined}
                  />
                )}
                {!showTradingContent && activeTab === "activities" && (
                  <WalletAnalyzerActivities
                    addressOverride={addressOverride || undefined}
                  />
                )}
              </div>
            </div>
            {showTradingContent && (
              <div
                className={`mt-4 space-y-8 drop-from-top ${
                  isAnimationReady ? "drop-from-top-active" : ""
                }`}
                style={{ animationDelay: "0.26s" }}
              >
                <WalletAnalyzerTable
                  addressOverride={addressOverride || undefined}
                  timeframe={tradingTimeframe}
                />
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
