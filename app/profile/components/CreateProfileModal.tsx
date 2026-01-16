import { useEffect, useMemo, useState } from "react";
import type { Profile } from "../lib/profile-api";

const DEFAULT_IMAGE_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuqOuCqB99JERXN81cgLxhxO7-ktwDjh5SAA&s";

type CreateProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Profile) => Promise<void>;
  walletAddress?: string;
  initialProfile?: Partial<Profile>;
};

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export default function CreateProfileModal({
  isOpen,
  onClose,
  onSave,
  walletAddress,
  initialProfile,
}: CreateProfileModalProps) {
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE_URL);
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resolvedHandle = useMemo(() => {
    if (handle.trim()) return handle.trim();
    return walletAddress?.trim() ?? "";
  }, [handle, walletAddress]);

  useEffect(() => {
    if (!isOpen) return;
    setHandle(initialProfile?.handle ?? "");
    setDisplayName(initialProfile?.display_name ?? "");
    setBio(initialProfile?.bio ?? "");
    setImageUrl(initialProfile?.image_url ?? DEFAULT_IMAGE_URL);
    setWebsite(initialProfile?.website ?? "");
    setTwitter(initialProfile?.twitter ?? "");
    setTelegram(initialProfile?.telegram ?? "");
    setTagsInput((initialProfile?.tags ?? []).join(", "));
    setError("");
  }, [initialProfile, isOpen]);

  const handleImageUpload = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const tags = parseTags(tagsInput);
    if (!resolvedHandle) {
      setError("Handle is required.");
      return;
    }
    if (tags.length < 1 || tags.length > 4) {
      setError("Tags must be between 1 and 4.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        handle: resolvedHandle,
        display_name: displayName || resolvedHandle,
        bio,
        image_url: imageUrl || DEFAULT_IMAGE_URL,
        website: website || "none",
        twitter: twitter || "none",
        telegram: telegram || "none",
        tags,
        wallets: walletAddress
          ? [
              {
                address: walletAddress,
                label: "main",
                is_primary: true,
              },
            ]
          : [],
      });
      onClose();
    } catch {
      setError("Unable to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
      <div className="w-full max-w-2xl rounded-lg border border-neutral-800 bg-[#0b0b0b] p-6 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <p className="text-lg font-semibold">Create Profile</p>
            <p className="text-xs text-neutral-500">
              Complete your profile details and link your wallet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-[160px,1fr] md:items-center">
            <div className="h-28 w-28 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900">
              <img
                src={imageUrl || DEFAULT_IMAGE_URL}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200 file:mr-3 file:rounded file:border-0 file:bg-neutral-800 file:px-3 file:py-1 file:text-xs file:text-neutral-200"
              />
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => {
                  setImageUrl(event.target.value);
                }}
                placeholder="Paste image URL"
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Handle</label>
              <input
                value={resolvedHandle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="for get api"
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Display Name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your display name"
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Your bio"
              rows={3}
              className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Website</label>
              <input
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="none"
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Twitter</label>
              <input
                value={twitter}
                onChange={(event) => setTwitter(event.target.value)}
                placeholder="none"
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Telegram</label>
              <input
                value={telegram}
                onChange={(event) => setTelegram(event.target.value)}
                placeholder="none"
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400">
              Tags (1-4, separated by commas)
            </label>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="your tags which shows on search portfolio, whale"
              className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400">Linked Wallet</label>
            <input
              value={walletAddress || "Generated wallet id"}
              disabled
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-500"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
            <p className="text-xs text-neutral-500">
              Email verification is locked for now.
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-sm bg-orange-500 px-5 py-2 text-xs font-semibold uppercase text-black transition hover:bg-orange-400 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
