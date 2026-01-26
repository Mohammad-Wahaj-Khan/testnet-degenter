import { NextResponse } from 'next/server';

type Token = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  image?: string;
};

export async function GET() {
  try {
    // In a real app, you would fetch this data from your database or an external API
    const mockTokens: Token[] = [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        price: 50000,
        priceChange24h: 2.5,
        marketCap: 950000000000,
        volume24h: 25000000000,
        image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        price: 3000,
        priceChange24h: 1.8,
        marketCap: 360000000000,
        volume24h: 15000000000,
        image: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      },
      // Add more tokens as needed
    ];

    return NextResponse.json(mockTokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return new NextResponse('Failed to fetch tokens', { status: 500 });
  }
}
