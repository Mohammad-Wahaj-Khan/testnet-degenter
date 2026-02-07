/** @type {import('next').NextConfig} */
const isPwaEnabled = process.env.NEXT_ENABLE_PWA === "true";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isPwaEnabled,
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    webpackBuildWorker: true,
  },
  turbopack: {
    resolveAlias: {
      pino: "pino/browser",
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      pino: "pino/browser",
      ...(isServer ? {} : { "pino-pretty": false }),
    };

    return config;
  },
  images: {
    domains: [
      'raw.githubusercontent.com',
      'memesfun.mypinata.cloud',
      'fonts.googleapis.com',
      'sapphire-tremendous-deer-367.mypinata.cloud',
      'fuchsia-kind-parrotfish-734.mypinata.cloud',
      'beige-recent-snipe-514.mypinata.cloud',
      'oro-images.s3.us-east-1.amazonaws.com',
      'blue-careful-carp-364.mypinata.cloud',
      'image.gatedataimg.com',
      'pbs.twimg.com',
      's2.coinmarketcap.com',
      'encrypted-tbn0.gstatic.com',
      't3.ftcdn.net',
      'testnetmedia.degenter.io',
      "degenter-token-profile.s3.ap-southeast-2.amazonaws.com",
      "gateway.pinata.cloud"
    ],
  },
};

module.exports = withPWA(nextConfig);
