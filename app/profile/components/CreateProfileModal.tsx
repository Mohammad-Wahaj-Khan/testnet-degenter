import { useEffect, useMemo, useRef, useState } from "react";
import type { Profile } from "../lib/profile-api";
import { uploadProfileImage } from "../lib/profile-api";

const DEFAULT_IMAGE_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuqOuCqB99JERXN81cgLxhxO7-ktwDjh5SAA&s";

type CreateProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Profile) => Promise<void>;
  walletAddress?: string;
  initialProfile?: Partial<Profile>;
  apiKey?: string;
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
  apiKey,
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent wallet addresses as handles
  useEffect(() => {
    const trimmedHandle = handle.trim();
    if (/^0x[a-fA-F0-9]{40}$/i.test(trimmedHandle)) {
      setError("Wallet addresses cannot be used as handles");
    } else if (error === "Wallet addresses cannot be used as handles") {
      setError("");
    }
  }, [handle, error]);

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

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return;

    // Check if file is SVG
    if (file.type === "image/svg+xml") {
      alert(
        "SVG files are not supported. Please upload an image in a different format."
      );
      return;
    }

    // Create a preview of the image
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // If we have a user ID (editing existing profile), upload to server
    if (initialProfile?.user_id) {
      try {
        setIsUploading(true);
        const result = await uploadProfileImage(
          initialProfile.user_id,
          file,
          process.env.NEXT_PUBLIC_X_API_KEY || ""
        );
        setImageUrl(result.image_url);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedHandle = handle.trim();
    if (!trimmedHandle) {
      setError("Handle is required");
      return;
    }

    // Add any additional handle validation here if needed
    if (trimmedHandle.length < 3) {
      setError("Handle must be at least 3 characters long");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      // Create the profile data
      const profileData = {
        handle: handle.trim(),
        display_name: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        image_url: imageUrl || undefined,
        website: website.trim() || undefined,
        twitter: twitter.trim() || undefined,
        telegram: telegram.trim() || undefined,
        tags: parseTags(tagsInput),
        wallets: initialProfile?.wallets || [],
      };

      // console.log("Submitting profile data:", profileData);

      // Call the save function from props
      await onSave(profileData);

      // Close the modal on success
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save profile";
      setError(`Error: ${errorMessage}`);
      // Re-throw the error so the parent component can handle it if needed
      throw error;
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
            <div
              className="relative h-28 w-28 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload a new profile picture"
            >
              <img
                src={imageUrl || DEFAULT_IMAGE_URL}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs text-center p-2">
                  {isUploading ? "Uploading..." : "Change Photo"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Profile Image</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
                className="hidden"
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-left text-sm text-neutral-200 disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Choose an image"}
              </button>
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
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="Unique Name (e.g., john_doe)"
                className="w-full rounded border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-neutral-400">Display Name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your Display name"
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
              className="rounded-sm bg-green-500 px-5 py-2 text-xs font-semibold uppercase text-black transition hover:bg-green-400 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
