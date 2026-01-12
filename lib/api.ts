// app/lib/api.ts
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://82.208.20.12:8004";
const API_KEY =
  process.env.NEXT_PUBLIC_X_API_KEY || process.env.NEXT_PUBLIC_API_KEY;

/* ===== Types ===== */
export type Bucket = "30m" | "1h" | "4h" | "24h";
export type PriceSource = "best" | "first" | "all";
export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export type Unit = "native" | "usd";

export interface TokenSummary {
  [x: string]: any;
  tokenId: string;
  denom?: string;
  symbol?: string;
  name?: string;
  imageUri?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  priceInNative?: number;
  priceInUsd?: number;
  priceSource?: string;
  priceChange?: Record<string, number>;
  volume?: Record<string, number>;
  liquidity?: number;
  fdv?: number;
  mc?: number;
  circulatingSupply?: number;
  supply?: number;
  holder?: number | string;
  tradeCount?: { buy: number; sell: number; total: number };
  txBuckets?: Record<string, number>;
  creationTime?: string;
  socials?: any;
}

export interface TokenDetailResponse {
  success: boolean;
  data: {
    token?: {
      tokenId?: string;
      denom?: string;
      symbol?: string;
      name?: string;
      imageUri?: string;
      createdAt?: string;
      description?: string | null;
    };
    price?: {
      source?: string;
      poolId?: string;
      native?: number;
      usd?: number;
      changePct?: Record<string, number>;
    };
    mcapDetail?: { native?: number; usd?: number };
    fdvDetail?: { native?: number; usd?: number };
    supply?: { circulating?: number; max?: number };
    priceInNative?: number;
    priceInUsd?: number;
    priceSource?: string;
    poolId?: string;
    pools?: number;
    holder?: number | string;
    creationTime?: string;
    circulatingSupply?: number;
    fdvNative?: number;
    fdv?: number;
    mcNative?: number;
    mc?: number;
    priceChange?: Record<string, number>;
    volume?: Record<string, number>;
    volumeUSD?: Record<string, number>;
    txBuckets?: Record<string, number>;
    uniqueTraders?: number;
    trade?: number;
    sell?: number;
    buy?: number;
    v?: number;
    vBuy?: number;
    vSell?: number;
    vUSD?: number;
    vBuyUSD?: number;
    vSellUSD?: number;
    liquidity?: number;
    liquidityNative?: number;
  };
  twitter?: string | null;
}

// TypeScript Interfaces
export interface Token {
  tokenId: string;
  denom: string;
  symbol: string;
  name: string;
  imageUri: string;
  createdAt: string;
  priceNative: number;
  priceUsd: number;
  mcapNative: number;
  mcapUsd: number;
  fdvNative: number;
  fdvUsd: number;
  holders: number;
  volNative: number;
  volUsd: number;
  tx: number;
  change24hPct: number;
}

export interface OHLCVData {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
}

export interface Trade {
  time: string;
  txHash: string;
  pairContract: string;
  signer: string;
  direction: "buy" | "sell";
  offerDenom: string;
  offerAmountBase: string;
  offerAmount: number;
  askDenom: string;
  askAmountBase: string;
  askAmount: number;
  returnAmountBase: string;
  returnAmount: number;
  priceNative: number;
  priceUsd: number;
  valueNative: number;
  valueUsd: number;
  class: string;
}

export class TokenAPI {
  get(arg0: string) {
    throw new Error("Method not implemented.");
  }
  constructor(private baseUrl: string = BASE_URL) {}

  private async fetchData<T>(endpoint: string): Promise<T> {
    const headers: HeadersInit = API_KEY ? { "x-api-key": API_KEY } : {};
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json() as Promise<T>;
  }

  /* ---------------- Token Summary ---------------- */
  async getTokenSummaryBySymbol(
    symbol: string,
    priceSource: PriceSource = "best",
    includePools = true
  ) {
    const safeSymbol = encodeURIComponent(symbol);
    const include = includePools ? "&includePools=1" : "";
    return this.fetchData<{ success: boolean; data: TokenSummary }>(
      `/tokens/${safeSymbol}?priceSource=${priceSource}${include}`
    );
  }

  async getTokenDetailsBySymbol(
    symbol: string,
    priceSource: PriceSource = "best",
    includePools = true
  ) {
    const safeSymbol = encodeURIComponent(symbol);
    const include = includePools ? "&includePools=1" : "";
    return this.fetchData<TokenDetailResponse>(
      `/tokens/${safeSymbol}?priceSource=${priceSource}${include}`
    );
  }

  /* ---------------- Token OHLCV ---------------- */
  async getTokenOHLCV(
    symbol: string,
    tf: Timeframe = "1h",
    priceSource: PriceSource = "best",
    unit: Unit = "native"
  ) {
    const safeSymbol = encodeURIComponent(symbol);
    return this.fetchData<OHLCVData[]>(
      `/tokens/${safeSymbol}/ohlcv?tf=${tf}&priceSource=${priceSource}&unit=${unit}`
    );
  }

  async getLargeTrades(
    p0: string,
    p1: string,
    p2: { signal: AbortSignal },
    bucket: Bucket = "24h",
    uint: Unit = "usd"
  ): Promise<Trade[]> {
    return this.fetchData<Trade[]>(
      `/trades/?tf=${bucket}&unit=${uint}&limit=5000`
    );
  }

  async getTopTokensForDashboard(
    p0: string,
    p1: string,
    p2: string,
    itemsPerPage: number,
    p3: number,
    p4: { signal: AbortSignal },
    bucket: Bucket = "24h",
    priceSource: PriceSource = "best",
    sort: string = "volume",
    limit: number = 100,
    offset: number = 0
  ): Promise<Token[]> {
    return this.fetchData<Token[]>(
      `/tokens?bucket=${bucket}&priceSource=${priceSource}&dir=desc&includeChange=1&limit=${limit}&offset=${offset}&sort=${sort}`
    );
  }
  async getTopMarketTokens(
    bucket: Bucket = "30m",
    priceSource: PriceSource = "best",
    sort: string = "volume",
    limit: number = 100,
    offset: number = 0
  ): Promise<Token[]> {
    return this.fetchData<Token[]>(
      `/tokens?bucket=${bucket}&priceSource=${priceSource}&dir=desc&includeChange=1&limit=${limit}&offset=${offset}&sort=${sort}`
    );
  }
  /* ---------------- Other Endpoints ---------------- */
  async getTokenPools(symbol: string, bucket: Bucket = "24h") {
    const safeSymbol = encodeURIComponent(symbol);
    return this.fetchData<any>(`/tokens/${safeSymbol}/pools?bucket=${bucket}`);
  }

  async getTokenSecurity(symbol: string) {
    const safeSymbol = encodeURIComponent(symbol);
    return this.fetchData<any>(`/tokens/${safeSymbol}/security`);
  }

  async getTokenHolders(symbol: string, limit = 100, offset = 0) {
    const safeSymbol = encodeURIComponent(symbol);
    return this.fetchData<any>(
      `/tokens/${safeSymbol}/holders?limit=${limit}&offset=${offset}`
    );
  }

  async getTokenTrades(
    symbol: string,
    tf: Bucket = "24h",
    limit = 200,
    unit: Unit = "usd"
  ) {
    const safeSymbol = encodeURIComponent(symbol);
    return this.fetchData<any>(
      `/trades/token/${safeSymbol}?tf=${tf}&limit=${limit}&unit=${unit}`
    );
  }

  async healthCheck() {
    return this.fetchData<{ ok: boolean }>("/health");
  }
}

export const tokenAPI = new TokenAPI();
