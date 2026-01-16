"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProfileSidebar from "./components/ProfileSidebar";
import ProfileHeader from "./components/ProfileHeader";
import ProfileWallets from "./components/ProfileWallets";
import ProfileEmail from "./components/ProfileEmail";
import CreateProfileModal from "./components/CreateProfileModal";
import {
  createProfile,
  getProfile,
  getProfileById,
  updateProfile,
  type Profile,
} from "./lib/profile-api";
import Navbar from "../components/navbar";
import TopMarketToken from "../components/TopMarketToken";
import { useChain } from "@cosmos-kit/react";
import { CHAIN_NAME } from "../config/chain";

const GUEST_WALLET_KEY = "degenterGuestWalletId";
const GUEST_HANDLE_KEY = "degenterGuestProfileHandle";

const defaultProfile: Profile = {
  handle: "",
  display_name: "",
  bio: "On-chain trader",
  image_url: "",
  website: "https://example.com",
  twitter: "@myhandle",
  telegram: "https://t.me/myhandle",
  tags: ["defi", "memes"],
  wallets: [
    {
      address: "3hXNpgKLFQ",
      label: "main",
      is_primary: true,
      network: "Solana",
      updated_at: "2026-01-16T15:06:50Z",
    },
  ],
};

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const userId = useMemo(
    () => searchParams.get("userId")?.trim() || "",
    [searchParams]
  );
  const handle = useMemo(
    () => searchParams.get("handle")?.trim() || "",
    [searchParams]
  );
  const apiKey = process.env.NEXT_PUBLIC_DEGENTER_API_KEY;
  const { address, openView } = useChain((CHAIN_NAME as string) || "zigchain-1");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [guestWalletId, setGuestWalletId] = useState("");
  const [guestHandle, setGuestHandle] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedWallet = localStorage.getItem(GUEST_WALLET_KEY);
    const storedHandle = localStorage.getItem(GUEST_HANDLE_KEY);
    if (storedWallet) {
      setGuestWalletId(storedWallet);
    } else {
      const generated =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `guest-${crypto.randomUUID()}`
          : `guest-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_WALLET_KEY, generated);
      setGuestWalletId(generated);
    }
    if (storedHandle) {
      setGuestHandle(storedHandle);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        if (!userId && !handle && !address && !guestHandle && !guestWalletId) {
          setIsLoading(false);
          return;
        }
        const effectiveHandle =
          handle || address || guestHandle || guestWalletId;
        const data = userId
          ? await getProfileById(userId, apiKey)
          : await getProfile(effectiveHandle, apiKey);
        if (isActive) {
          setProfile(data);
          setHasProfile(true);
        }
      } catch {
        if (isActive) {
          setError("Unable to load profile from the API.");
          setHasProfile(false);
          setIsModalOpen(true);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [handle, userId, address, apiKey, guestHandle, guestWalletId]);

  const handleUpgrade = () => {
    setIsModalOpen(true);
  };

  const handleCreateProfile = async (payload: Profile) => {
    const saved = hasProfile
      ? await updateProfile({ ...payload, user_id: profile.user_id }, apiKey)
      : await createProfile(payload, apiKey);
    setProfile(saved);
    setHasProfile(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_HANDLE_KEY, saved.handle);
    }
    setGuestHandle(saved.handle);
  };

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
      <div className="grid min-h-screen grid-cols-1 pt-20 px-6 md:grid-cols-[260px,1fr]">
        <ProfileSidebar />
        <section className="px-6 py-6 md:px-10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-400">Overview</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-sm border border-orange-500 px-4 py-2 text-xs font-semibold uppercase text-orange-500 transition hover:bg-orange-500 hover:text-black"
            >
              {hasProfile ? "Edit Profile" : "Create Profile"}
            </button>
          </div>
          <ProfileHeader
            profile={profile}
            onUpgrade={handleUpgrade}
            isSaving={isSaving}
          />
          {isLoading && (
            <p className="mt-4 text-xs text-neutral-500">Loading profile...</p>
          )}
          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
          <div className="mt-6 space-y-6">
            <ProfileWallets
              wallets={profile.wallets ?? []}
              onLinkWallet={() => openView?.()}
            />
            <ProfileEmail />
          </div>
        </section>
      </div>
      <CreateProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProfile}
        walletAddress={address ?? guestHandle ?? guestWalletId ?? undefined}
        initialProfile={profile}
      />
    </main>
  );
}
