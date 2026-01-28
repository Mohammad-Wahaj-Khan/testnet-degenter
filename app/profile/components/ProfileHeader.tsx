"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  BadgeCheck,
  Sparkles,
  Zap,
  TrendingUp,
  Calendar,
  Plus,
} from "lucide-react";
import { truncateMiddle } from "../lib/profile-format";
import type { Profile } from "../lib/profile-api";
import { uploadProfileImage } from "../lib/profile-api";
import dynamic from "next/dynamic";
import { UltimateButton } from "./ProfileWallets";

const WalletValueChart = dynamic(() => import("./WalletValueChart"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-white/5 rounded-xl animate-pulse" />
  ),
});

type ProfileHeaderProps = {
  profile: Profile;
  onUpgrade: () => void;
  isSaving: boolean;
  onImageUpdate: (imageUrl: string) => void;
  apiKey: string;
};

export default function ProfileHeader({
  profile,
  onUpgrade,
  isSaving,
  onImageUpdate,
  apiKey,
}: ProfileHeaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [profile.image_url]);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile.user_id) return;
    try {
      setIsUploading(true);
      const result = await uploadProfileImage(profile.user_id, file, apiKey);
      onImageUpdate(result.image_url);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const walletAddress = profile.wallets?.[0]?.address || "";
  const displayName = profile.display_name || profile.handle || "Degen User";
  const creationDate = new Date(profile?.created_at).toLocaleDateString(
    "en-US",
    { month: "short", year: "numeric" }
  );

  return (
    <section className="relative group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-1 shadow-2xl">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="relative rounded-[22px] bg-gradient-to-b from-white/[0.03] to-transparent p-6 md:p-8">
        {/* TOP ROW: Avatar + Chart + Value */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 1. Avatar (3 cols) */}
          <div className="lg:col-span-2 flex justify-center lg:justify-start">
            <div className="relative group/avatar">
              <div
                className={`relative h-32 w-32 overflow-hidden rounded-[2.5rem] p-[2px] bg-gradient-to-tr from-emerald-500/40 via-white/10 to-blue-500/40 transition-all cursor-pointer ${
                  isUploading ? "animate-pulse" : "hover:scale-105"
                }`}
                onClick={handleImageClick}
              >
                <div className="h-full w-full rounded-[2.4rem] overflow-hidden bg-[#0D0D0D]">
                  {profile.image_url && !imageError ? (
                    <img
                      src={profile.image_url}
                      alt={displayName}
                      className={`h-full w-full object-cover transition-opacity duration-500 ${
                        imageLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#111]">
                      <Camera className="text-white/20" size={32} />
                    </div>
                  )}
                </div>
                {/* Upload Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-[2.4rem]">
                  <Zap className="text-emerald-400" size={24} />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-emerald-500 text-black shadow-lg">
                <BadgeCheck size={16} strokeWidth={3} />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* 2. Chart (6 cols) */}
          <div className="lg:col-span-7 w-full h-[140px] bg-white/[0.02] rounded-2xl border border-white/5 p-2 overflow-hidden relative">
            <div className="absolute top-2 left-4 z-10">
              {/* <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Performance
                </span> */}
            </div>
            {walletAddress ? (
              <WalletValueChart walletAddress={walletAddress} />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                Analytics Unavailable
              </div>
            )}
          </div>

          {/* 3. High Level Stats - Locked (3 cols) */}
          <div className="lg:col-span-3 flex items-center justify-center border-l border-white/5 lg:pl-8">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-400"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
              </div>
              <p className="text-sm font-medium text-white/90">
                Upgrade to PRO
              </p>
              <p className="text-xs text-white/60 mt-1">
                Unlock portfolio analytics
              </p>
              <button
                // onClick={onUpgrade}
                className="mt-3 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg transition-colors hover:bg-emerald-500/30"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Profile Details */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4 max-w-2xl">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
                  {displayName}
                </h1>
                {isSaving && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase">
                      Syncing
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-400/10">
                  @{profile.handle || truncateMiddle(walletAddress, 6, 4)}
                </span>
                {/* <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium">
                  <Calendar size={12} />
                  Joined {creationDate}
                </div> */}
              </div>
            </div>

            {profile.bio && (
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-medium italic">
                "{profile.bio}"
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {profile.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-tighter text-zinc-300 hover:bg-white/10 transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex shrink-0">
            {/* <button
                type="button"
                onClick={onUpgrade}
                className="group relative flex items-center gap-2 rounded-2xl bg-white text-black px-6 py-3 text-sm font-black hover:bg-emerald-400 transition-all active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <Sparkles size={16} />
                UPGRADE PRO
              </button> */}
            <UltimateButton onClick={onUpgrade} disabled={isSaving}>
              <Plus
                size={18}
                className="transition-transform group-hover:rotate-90"
              />
              Update Profile
            </UltimateButton>
          </div>
        </div>
      </div>
    </section>
  );
}
