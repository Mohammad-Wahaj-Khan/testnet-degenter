// app/insights/page.tsx
import InsightsContent from "./components/InsightsContent";
import Navbar from "../components/navbar";
import TopMarketToken from "../components/TopMarketToken";

async function getTokenData() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/tokens`,
    {
      next: { revalidate: 60 },
    }
  );
  const json = await res.json();

  const items = Array.isArray(json?.data) ? json.data : [];
  const hasValidChange = (change: any) => {
    if (typeof change === "number") return true;
    if (!change || typeof change !== "object") return false;
    return Object.values(change).some(
      (value) => typeof value === "number" && value !== 0
    );
  };

  const normalized = await Promise.all(
    items.map(async (item: any) => {
      const symbol = item.symbol ?? item?.token?.symbol;
      const tokenId = item.tokenId ?? item?.token?.tokenId;
      let priceChange =
        item?.price?.changePct ?? item?.priceChange ?? item?.price?.change;

      // Ensure priceChange is an object with timeframes
      if (typeof priceChange === "number") {
        priceChange = { "24h": priceChange };
      } else if (!priceChange || typeof priceChange !== "object") {
        priceChange = { "24h": 0 };
      }

      // Ensure volume data is properly structured
      let volumeUSD = item.volumeUSD || {};
      if (typeof item.volUsd === "number") {
        volumeUSD = { "24h": item.volUsd };
      }

      if ((!hasValidChange(priceChange) || !volumeUSD["24h"]) && tokenId) {
        try {
          const detailRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/tokens/${tokenId}`,
            { next: { revalidate: 60 } }
          );
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            const detailData = detailJson?.data;

            // Update priceChange with detailed data if available
            const detailedPriceChange =
              detailData?.price?.changePct ?? detailData?.priceChange;
            if (detailedPriceChange) {
              priceChange =
                typeof detailedPriceChange === "number"
                  ? { "24h": detailedPriceChange }
                  : detailedPriceChange;
            }

            // Update volume data if available
            if (detailData?.volumeUSD) {
              volumeUSD = detailData.volumeUSD;
            } else if (detailData?.volUsd) {
              volumeUSD = { "24h": detailData.volUsd };
            }
          }
        } catch {
          // Fallback to existing data if detail fetch fails
        }
      }

      return {
        id: tokenId || symbol.toLowerCase(),
        symbol,
        name: item.name ?? item?.token?.name,
        imageUri: item.imageUri ?? item?.token?.imageUri,
        mcapUsd: item.mcapUsd || 0,
        priceUsd: item.priceUsd ?? item?.price?.usd ?? 0,
        volume: item.volume || {},
        volumeUSD: volumeUSD,
        volUsd: volumeUSD["24h"] || 0,
        priceChange,
        // Add default values for required fields
        change: priceChange["24h"] || 0,
        volume24h: volumeUSD["24h"] || 0,
      };
    })
  );

  return normalized
    .sort(
      (a: { volUsd: any }, b: { volUsd: any }) =>
        (b.volUsd ?? 0) - (a.volUsd ?? 0)
    )
    .slice(0, 200);
}

export default async function InsightsPage() {
  const tokens = await getTokenData();

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
      </div>
      <InsightsContent tokens={tokens} />
    </main>
  );
}
