"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Loader2,
  BadgeCheck,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock as FiLock,
  User,
} from "lucide-react";
import Image from "next/image";
import { truncateMiddle } from "../lib/profile-format";
import type { Profile } from "../lib/profile-api";
import { uploadProfileImage } from "../lib/profile-api";

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
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset image state when profile changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [profile.image_url]);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile.user_id) return;

    if (file.type === "image/svg+xml") {
      alert("SVG files are not supported.");
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadProfileImage(profile.user_id, file, apiKey);
      onImageUpdate(result.image_url);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleValue = profile.handle || profile.wallets?.[0]?.address || "3hXNpgKLFqCXB79h";
  const displayHandle = truncateMiddle(handleValue, 6, 6);
  const displayName = profile.display_name || profile.handle || displayHandle || "Degen User";

  return (
    <section className="relative group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0A0A0A] p-1 shadow-2xl">
      {/* High-Level Ambient Glows */}
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Glass Inner Container */}
      <div className="relative rounded-[22px] bg-gradient-to-b from-white/[0.03] to-transparent p-6 md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          
          {/* Avatar Section: Custom Hex/Octagon Style Border */}
          <div className="relative group/avatar self-center md:self-start">
            <div
              className={`relative h-40 w-40 overflow-hidden rounded-[2.5rem] p-[2px] bg-gradient-to-tr from-emerald-500/40 via-white/10 to-blue-500/40 transition-all duration-500 group-hover/avatar:rounded-3xl cursor-pointer ${
                isUploading ? "animate-pulse" : ""
              }`}
              onClick={handleImageClick}
            >
              <div className="h-full w-full rounded-[2.4rem] overflow-hidden bg-[#0D0D0D] transition-all group-hover/avatar:rounded-[1.4rem]">
                {profile.image_url && !imageError ? (
                  <>
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                      </div>
                    )}
                    <img
                      ref={imageRef}
                      src={profile.image_url}
                      alt={displayName}
                      className={`h-full w-full object-cover transition-transform duration-700 group-hover/avatar:scale-110 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      loading="lazy"
                      decoding="async"
                    />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#111]">
                    {imageError ? (
                      <User className="h-16 w-16 text-white/30" />
                    ) : (
                      <Camera className="text-white/20" size={40} />
                    )}
                  </div>
                )}
              </div>

              {/* Advanced UI Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/80 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover/avatar:opacity-100">
                {isUploading ? (
                  <Loader2 className="animate-spin text-black" size={32} />
                ) : (
                  <>
                    <Zap className="mb-2 text-black fill-black" size={24} />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-black">Update</span>
                  </>
                )}
              </div>
            </div>

            {/* Verified Badge with Pulse */}
            <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-[#0A0A0A] bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <BadgeCheck size={22} strokeWidth={2.5} />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" disabled={isUploading} />
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60">
                  {displayName}
                </h1>
                {isSaving && (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
                    <div className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Syncing</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-emerald-400">
                   {displayHandle}
                 </span>
              </div>

              {profile.bio && (
                <p className="mx-auto max-w-lg text-base leading-relaxed text-zinc-400 md:mx-0 font-medium">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Stats / Actions Bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-8 md:justify-start">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Identity Tier</span>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 px-2 items-center gap-1.5 rounded bg-emerald-500 text-black text-[11px] font-black">
                    <ShieldCheck size={14} />
                    ELITE AGENT
                  </div>
                </div>
              </div>

              <div className="h-10 w-[1px] bg-white/5 hidden md:block" />

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="group flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs font-bold text-white/40 transition-all opacity-50 cursor-not-allowed"
                  >
                    <Sparkles size={14} className="opacity-50" />
                    Upgrade to Pro
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
                      <FiLock size={10} className="text-black" />
                    </span>
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="group flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs font-bold text-white/40 transition-all opacity-50 cursor-not-allowed"
                  >
                    View Perks
                    <ChevronRight size={14} className="opacity-50" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
                      <FiLock size={10} className="text-black" />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}