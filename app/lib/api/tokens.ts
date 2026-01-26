export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  image?: string;
  holders?: number;
  txCount?: number;
}

export const fetchMarketTrends = async (): Promise<TokenData[]> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/tokens`
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch market trends");
    }

    return data.data.map((token: any) => ({
      id: token.tokenId,
      symbol: token.symbol,
      name: token.name,
      price: token.priceUsd,
      priceChange24h: 0, // Not provided in the API
      marketCap: token.mcapUsd,
      volume24h: token.volUsd,
      image: token.imageUri || undefined,
      holders: token.holders,
      txCount: token.tx,
    }));
  } catch (error) {
    console.error("Error fetching market trends:", error);
    throw error;
  }
};

export const fetchTokenDetails = async (
  tokenId: string
): Promise<TokenData> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/tokens/${tokenId}`
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch token details");
    }

    const token = data.data;
    return {
      id: token.tokenId,
      symbol: token.symbol,
      name: token.name,
      price: token.priceUsd,
      priceChange24h: 0, // Not provided in the API
      marketCap: token.mcapUsd,
      volume24h: token.volUsd,
      image: token.imageUri || undefined,
      holders: token.holders,
      txCount: token.tx,
    };
  } catch (error) {
    console.error("Error fetching token details:", error);
    throw error;
  }
};
