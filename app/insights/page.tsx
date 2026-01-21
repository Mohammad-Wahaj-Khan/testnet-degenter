// app/insights/page.tsx
import InsightsContent from "./components/InsightsContent";
import Navbar from "../components/navbar";
import TopMarketToken from "../components/TopMarketToken";

async function getTokenData() {
  const res = await fetch("https://testnet-api.degenter.io/tokens", {
    next: { revalidate: 60 },
  });
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

      if (!hasValidChange(priceChange) && tokenId) {
        try {
          const detailRes = await fetch(
            `https://testnet-api.degenter.io/tokens/${tokenId}`,
            { next: { revalidate: 60 } }
          );
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            priceChange =
              detailJson?.data?.price?.changePct ??
              detailJson?.data?.priceChange ??
              priceChange;
          }
        } catch {
          // Leave fallback as-is when detail fetch fails.
        }
      }

      return {
        symbol,
        name: item.name ?? item?.token?.name,
        imageUri: item.imageUri ?? item?.token?.imageUri,
        mcapUsd: item.mcapUsd,
        priceUsd: item.priceUsd ?? item?.price?.usd,
        volume: item.volume,
        volumeUSD: item.volumeUSD,
        volUsd: item.volUsd,
        priceChange,
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
