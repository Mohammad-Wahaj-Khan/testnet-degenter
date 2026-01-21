import { useState, useEffect, useRef } from "react";
import type { ProfileWallet } from "../lib/profile-api";
import { formatDateTime, truncateMiddle } from "../lib/profile-format";

const API_KEY = "file"; // Using 'file' as the API key
const getAvatarUploadUrl = (userId: number | string | null) => {
  if (userId === null || userId === "") {
    throw new Error("User ID is required for avatar upload");
  }
  return `https://testnet-api.degenter.io/profiles/${userId}/avatar`;
};

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

type ProfileWalletsProps = {
  wallets: ProfileWallet[];
  onLinkWallet?: () => void;
  userId?: number | string | null;
  onImageUploadSuccess?: (imageUrl: string) => void;
};

export default function ProfileWallets({
  wallets = [],
  onLinkWallet,
  userId,
  onImageUploadSuccess,
}: ProfileWalletsProps) {
  const [localWallets, setLocalWallets] = useState<ProfileWallet[]>(wallets);
  const prevWalletsRef = useRef<ProfileWallet[]>(wallets);
  const prevUserIdRef = useRef<number | string | null | undefined>(userId);
  // Update local state when props change
  useEffect(() => {
    // Only update if wallets prop actually changed
    const walletsChanged = JSON.stringify(wallets) !== JSON.stringify(prevWalletsRef.current);
    const userIdChanged = userId !== prevUserIdRef.current;

    if (walletsChanged || userIdChanged) {
      setLocalWallets(wallets);
      prevWalletsRef.current = wallets;
      prevUserIdRef.current = userId;
      
      // Reset upload state when user changes
      if (userIdChanged) {
        setIsUploading(false);
        setUploadError(null);
      }
    }
  }, [wallets, userId]);

  const rows = localWallets?.length
    ? localWallets
    : [
        {
          address: "No wallets connected",
          label: "",
          network: "",
          updated_at: new Date().toISOString(),
        },
      ];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    if (!userId) {
      setUploadError("Please connect your wallet first");
      return null;
    }
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadUrl = getAvatarUploadUrl(userId);
      // console.log("Uploading to:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          // Don't set Content-Type header, let the browser set it with the correct boundary
        },
        body: formData,
      });

      const result = await response.json();
      // console.log("Upload response:", result);

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            `Failed to upload image: ${response.status} ${response.statusText}`
        );
      }

      // Handle different response formats
      const imageUrl =
        result.url ||
        result.image_url ||
        (result.data && (result.data.url || result.data.image_url));

      if (!imageUrl) {
        throw new Error("No image URL in response");
      }

      // console.log("Image uploaded successfully:", imageUrl);

      // Update the parent component with the new image URL
      if (onImageUploadSuccess) {
        onImageUploadSuccess(imageUrl);
      }

      return imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload image"
      );
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value to allow re-uploading the same file
    event.target.value = '';
    
    try {
      const imageUrl = await handleImageUpload(file);
      if (imageUrl && onImageUploadSuccess) {
        onImageUploadSuccess(imageUrl);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      setUploadError('Failed to process image upload');
    }
  };

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
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={`https://avatar.vercel.sh/${wallet.address}.svg`}
                    alt=""
                    className="h-8 w-8 rounded-full border border-neutral-700"
                  />
                  <label className="absolute -bottom-1 -right-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-neutral-800 p-1 hover:bg-neutral-700">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </label>
                </div>
                <span className="text-blue-400">
                  {truncateMiddle(wallet.address, 6, 4)}
                </span>
              </div>
              <div className="text-neutral-200">
                {wallet.network ?? "Solana"}
              </div>
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
          className="rounded-sm bg-green-500 px-4 py-2 text-xs font-semibold uppercase text-black transition hover:bg-green-400"
        >
          Link Wallet
        </button>
      </div>
      {uploadError && (
        <div className="mt-2 text-sm text-red-500">{uploadError}</div>
      )}
      {isUploading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-500 border-t-orange-500"></div>
          Uploading image...
        </div>
      )}
    </section>
  );
}
