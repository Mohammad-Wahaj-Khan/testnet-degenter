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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'memesfun.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fonts.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sapphire-tremendous-deer-367.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fuchsia-kind-parrotfish-734.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'beige-recent-snipe-514.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'oro-images.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blue-careful-carp-364.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.gatedataimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's2.coinmarketcap.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 't3.ftcdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
