import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// import { WalletProvider } from "./providers/walletconnect-provider";
import CosmosProvider from "./providers/cosmos-provider";
import Providers from "./providers/cosmos-provider";
import ImageFallbackHandler from "./components/ImageFallbackHandler";
const kanit = localFont({
  src: [
    {
      path: "../font/Kanit-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../font/Kanit-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../font/Kanit-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../font/Kanit-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../font/Kanit-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../font/Kanit-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../font/Kanit-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../font/Kanit-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../font/Kanit-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../font/Kanit-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../font/Kanit-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../font/Kanit-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../font/Kanit-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../font/Kanit-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../font/Kanit-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../font/Kanit-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../font/Kanit-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../font/Kanit-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Degenter.io | Decentralized Intelligence for the Degens",
  description: "Degenter.io brings you on-chain alpha, memecoin analytics, and community-driven insights — powered by real-time blockchain intelligence.",
  icons: {
    icon: "/degen.svg", // or "/path/to/custom-icon.png"
  },
   keywords: [
    "Degenter",
    "DeFi",
    "Memecoins",
    "Crypto Analytics",
    "On-Chain Data",
    "Trading Tools",
    "Blockchain Insights",
    "Web3 Intelligence",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="manifest" href="/manifest.json" />
      <body className={`${kanit.className}`}>
        <ImageFallbackHandler />
        <Providers>{children}
          {/* <WalletProvider>{children}</WalletProvider> */}
        </Providers>
      </body>
    </html>
  );
}
