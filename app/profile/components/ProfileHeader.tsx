import { useState, useRef } from "react";
import {
  Camera,
  Loader2,
  BadgeCheck,
  Sparkles,
  ChevronRight,
} from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleValue =
    profile.handle || profile.wallets?.[0]?.address || "3hXNpgKLFqCXB79h";
  const displayHandle = truncateMiddle(handleValue, 6, 6);
  const displayName =
    profile.display_name || profile.handle || displayHandle || "Profile";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/20 p-6 md:p-8">
      {/* Decorative Background Glow */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
        {/* Avatar Section */}
        <div className="relative self-center md:self-start">
          <div
            className={`group relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-neutral-800 bg-neutral-900 transition-all hover:border-emerald-500/50 ${
              isUploading ? "animate-pulse" : ""
            }`}
            onClick={handleImageClick}
          >
            {profile.image_url ? (
              <img
                src={profile.image_url}
                alt={displayName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
                <Camera className="text-neutral-700" size={32} />
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              {isUploading ? (
                <Loader2 className="animate-spin text-emerald-500" size={24} />
              ) : (
                <>
                  <Camera className="mb-1 text-white" size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                    Update
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Badge */}
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-emerald-500 shadow-xl">
            <BadgeCheck size={18} />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {displayName}
              </h1>
              {isSaving && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                  Saving...
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-neutral-500">
              {displayHandle}
            </p>
            {profile.bio && (
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-neutral-400 md:mx-0">
                {profile.bio}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-neutral-800/50 pt-6 md:justify-start md:gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Account Tier
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                REGULAR
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onUpgrade}
                className="group flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-xs font-bold uppercase text-neutral-500 transition-all hover:bg-neutral-800"
                disabled
              >
                <Sparkles size={14} />
                Upgrade to Pro
                <span className="rounded bg-neutral-700 px-1 py-0.5 text-[8px]">
                  LOCKED
                </span>
              </button>

              <button
                type="button"
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tighter text-neutral-600 transition-colors hover:text-neutral-400"
              >
                Benefits
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
