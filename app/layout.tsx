import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import Providers from "./providers/cosmos-provider";
import ImageFallbackHandler from "./components/ImageFallbackHandler";
import LoadingWrapper from "./LoadingWrapper";

// High-fidelity font loading for the "DT" branding
const kanit = localFont({
  src: [
    { path: "../font/Kanit-Thin.ttf", weight: "100", style: "normal" },
    { path: "../font/Kanit-Regular.ttf", weight: "400", style: "normal" },
    { path: "../font/Kanit-Medium.ttf", weight: "500", style: "normal" },
    { path: "../font/Kanit-Bold.ttf", weight: "700", style: "normal" },
    { path: "../font/Kanit-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "Degenter.io | Decentralized Intelligence for the Degens",
  description: "Degenter.io brings you on-chain alpha, memecoin analytics, and community-driven insights — powered by real-time blockchain intelligence.",
  icons: {
    icon: "/degen.svg",
  },
   keywords: [
    "Degenter", "DeFi", "Memecoins", "Crypto Analytics", "On-Chain Data",
    "Trading Tools", "Blockchain Insights", "Web3 Intelligence",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body 
        className={`${kanit.className} bg-black antialiased`} 
        suppressHydrationWarning
      >
        <ImageFallbackHandler />
        <Providers>
          {/* LoadingWrapper now wraps the entire app. 
              It will display the "DT" Pulse animation for 10 seconds 
              before performing a cinematic blur-reveal of the children.
          */}
          <LoadingWrapper>
            {children}
          </LoadingWrapper>
        </Providers>
      </body>
    </html>
  );
}