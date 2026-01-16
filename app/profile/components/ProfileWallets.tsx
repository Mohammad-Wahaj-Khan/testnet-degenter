import type { ProfileWallet } from "../lib/profile-api";
import { formatDateTime, truncateMiddle } from "../lib/profile-format";

type ProfileWalletsProps = {
  wallets: ProfileWallet[];
  onLinkWallet?: () => void;
};

export default function ProfileWallets({
  wallets,
  onLinkWallet,
}: ProfileWalletsProps) {
  const rows = wallets?.length
    ? wallets
    : [
        {
          address: "3hXNpgKLFQ",
          label: "main",
          network: "Zigchain",
          updated_at: "2026-01-16T15:06:50Z",
        },
      ];

  return (
    <section className="border-b border-neutral-800 pb-6">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500 text-[10px] font-semibold text-emerald-500">
          ok
        </span>
        <div>
          <p className="text-sm font-semibold text-white">WALLETS</p>
          <p className="text-xs text-neutral-500">
            You can sign in with your wallets when connecting them below.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-sm border border-neutral-800">
        <div className="hidden grid-cols-[60px,1fr,160px,200px,40px] gap-4 border-b border-neutral-800 bg-neutral-900/60 px-4 py-2 text-[10px] font-semibold uppercase text-neutral-500 md:grid">
          <span>#</span>
          <span>Address</span>
          <span>Network</span>
          <span>Updated Time</span>
          <span />
        </div>
        <div className="divide-y divide-neutral-800">
          {rows.map((wallet, index) => (
            <div
              key={`${wallet.address}-${index}`}
              className="grid grid-cols-1 gap-2 px-4 py-3 text-sm text-neutral-200 md:grid-cols-[60px,1fr,160px,200px,40px] md:items-center"
            >
              <div className="text-xs text-neutral-500 md:text-sm">
                {index + 1}
              </div>
              <div className="text-blue-400">
                {truncateMiddle(wallet.address, 6, 4)}
              </div>
              <div className="text-neutral-200">{wallet.network ?? "Solana"}</div>
              <div className="text-neutral-200">
                {formatDateTime(wallet.updated_at)}
              </div>
              <button
                type="button"
                className="hidden h-7 w-7 items-center justify-center rounded-full border border-neutral-700 text-xs text-neutral-500 md:flex"
                aria-label="Wallet actions"
              >
                &gt;
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onLinkWallet}
          className="rounded-sm bg-orange-500 px-4 py-2 text-xs font-semibold uppercase text-black transition hover:bg-orange-400"
        >
          Link Wallet
        </button>
      </div>
    </section>
  );
}
