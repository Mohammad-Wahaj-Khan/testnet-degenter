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
  getProfileByWallet,
  updateProfile,
  uploadProfileImage,
  type Profile,
} from "./lib/profile-api";
import Navbar from "../components/navbar";
import TopMarketToken from "../components/TopMarketToken";
import { useChain } from "@cosmos-kit/react";
import { CHAIN_NAME } from "../config/chain";

const GUEST_WALLET_KEY = "degenterGuestWalletId";
const USER_ID_KEY = "degenterUserId";

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
  const apiKey = process.env.NEXT_PUBLIC_X_API_KEY;
  const { address, openView, isWalletConnected } = useChain(
    (CHAIN_NAME as string) || "zigchain-1"
  );
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(true);
  const [guestWalletId, setGuestWalletId] = useState("");
  const [savedUserId, setSavedUserId] = useState("");
  const [lastWalletAddress, setLastWalletAddress] = useState(address);

  const handleImageUpdate = async (imageUrl: string) => {
    if (!profile) return;

    // Create a new object with the updated image URL and a timestamp
    const newImageUrl = `${imageUrl}`;
    const updatedProfile = {
      ...profile,
      image_url: newImageUrl,
    };

    // Update the UI immediately
    setProfile(updatedProfile);

    // If we have a user_id and API key, update the server
    if (profile.user_id && apiKey) {
      try {
        setIsSaving(true);
        // Update the server with the clean URL (no timestamp)
        await updateProfile({ ...updatedProfile, image_url: imageUrl }, apiKey);
      } catch (error) {
        console.error("Failed to update profile with new image:", error);
        // Revert the local state if the server update fails
        setProfile((prev) => ({ ...prev, image_url: profile.image_url }));
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Handle wallet connection and profile check
  useEffect(() => {
    const checkWalletProfile = async () => {
      if (!address || !apiKey) return;

      try {
        // console.log("Checking profile for wallet:", address);
        setIsLoading(true);

        try {
          // First try to get the profile by wallet
          const walletProfile = await getProfileByWallet(address, apiKey);
          // console.log("Found existing profile:", walletProfile);

          // Check if this is a valid profile (has a handle and user_id)
          if (walletProfile?.handle && walletProfile?.user_id) {
            setProfile(walletProfile);
            setHasProfile(true);
            setIsModalOpen(false);
          } else {
            // If we get a profile but it's not valid, treat as no profile
            throw new Error("No valid profile found");
          }
        } catch (error) {
          // If we get a 404 or any other error, treat as no profile
          // console.log(
          //   "No profile found for wallet, showing create profile modal"
          // );
          setHasProfile(false);
          setProfile({
            ...defaultProfile,
            wallets: [
              {
                address,
                label: "Main Wallet",
                is_primary: true,
                network: "Zigchain",
              },
            ],
          });
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error("Error in wallet profile check:", error);
        setError("Failed to check wallet profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (isWalletConnected && address) {
      // console.log("Wallet connected, checking profile...");
      checkWalletProfile();
    } else {
      // console.log("Wallet not connected or no address");
    }
  }, [address, isWalletConnected, apiKey]);

  // Load profile when handle or userId changes
  useEffect(() => {
    // Only reload if wallet address has actually changed
    if (address === lastWalletAddress) return;

    setLastWalletAddress(address);

    // Force a reload of the profile data
    const loadProfile = async () => {
      if (!address) return;

      try {
        setIsLoading(true);
        const profileData = await getProfileByWallet(address, apiKey);
        if (profileData?.handle) {
          setProfile(profileData);
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setHasProfile(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [address, lastWalletAddress, apiKey]);

  // Initial load and guest wallet handling
  useEffect(() => {
    const storedWalletId = localStorage.getItem(GUEST_WALLET_KEY);
    if (storedWalletId) {
      setGuestWalletId(storedWalletId);
    }

    const storedUserId = localStorage.getItem(USER_ID_KEY);
    if (storedUserId) {
      setSavedUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedWallet = localStorage.getItem(GUEST_WALLET_KEY);
    if (!storedWallet) {
      const generated =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `guest-${crypto.randomUUID()}`
          : `guest-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_WALLET_KEY, generated);
      setGuestWalletId(generated);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      setError("");

      try {
        // Don't load again if we already have profile data
        if (profile.handle && profile.user_id) {
          return;
        }
        
        if (!userId && !handle && !address && !guestWalletId) {
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        const effectiveHandle = handle || address || guestWalletId;
        const data = userId
          ? await getProfileById(userId, apiKey)
          : await getProfile(effectiveHandle, apiKey);
        if (isActive && data?.handle) {
          setProfile(data);
          setHasProfile(true);
        }
      } catch {
        if (isActive) {
          setError("Unable to load profile from the API.");
          setHasProfile(false);
          if (!profile.handle) {
            setIsModalOpen(true);
          }
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
  }, [handle, userId, apiKey, guestWalletId]);

  const handleUpgrade = () => {
    setIsModalOpen(true);
  };

  const handleCreateProfile = async (payload: Profile) => {
    if (!apiKey) {
      console.error("API key is missing");
      throw new Error("API key is required to create a profile");
    }

    try {
      setIsSaving(true);

      // First, create the profile without the image if it's a base64 string
      let imageUrl = payload.image_url || defaultProfile.image_url || "";

      // Create initial profile data without the image if it's a base64 string
      const initialProfileData = {
        handle: profile.handle,
        display_name: payload.display_name || payload.handle,
        bio: payload.bio || "",
        image_url: imageUrl.startsWith("data:") ? "" : imageUrl, // Don't send base64 directly
        website: payload.website || "",
        twitter: payload.twitter || "",
        telegram: payload.telegram || "",
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        wallets: [
          {
            address: address || "",
            label: "Main Wallet",
            is_primary: true,
            network: "Zigchain",
          },
        ],
      };

      // console.log("Creating/Updating profile with data:", initialProfileData);

      // First create/update the profile
      let saved;
      if (hasProfile && profile.user_id) {
        // Include the handle in the update payload
        const updateData = {
          ...initialProfileData,
          user_id: profile.user_id,
          handle: payload.handle, // Use the new handle from the payload
        };
        saved = await updateProfile(updateData, apiKey);
      } else {
        saved = await createProfile(initialProfileData as Profile, apiKey);
      }

      // Then handle the image upload if it's a base64 string
      if (saved?.user_id && payload.image_url?.startsWith("data:")) {
        try {
          // console.log("Uploading profile image...");
          // Convert base64 to file
          const base64Response = await fetch(payload.image_url);
          const blob = await base64Response.blob();
          const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

          // Upload the image
          const uploadResult = await uploadProfileImage(
            saved.user_id,
            file,
            apiKey
          );
          imageUrl = uploadResult.image_url;

          // Update the profile with the new image URL
          if (imageUrl) {
            saved = await updateProfile(
              { ...saved, image_url: imageUrl },
              apiKey
            );
          }
        } catch (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          // Don't fail the whole process if image upload fails
        }
      }

      // console.log("Profile saved successfully:", saved);

      setProfile(saved);
      setHasProfile(true);
      setIsModalOpen(false);

      if (saved.user_id) {
        localStorage.setItem(USER_ID_KEY, saved.user_id.toString());
        setSavedUserId(saved.user_id.toString());
      }
      // Don't return the profile data as the function should return void
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(
        `Failed to save profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-black relative overflow-hidden p-0 md:px-4">
      <div
        className="fixed top-0 left-0 right-0 z-0 h-56 pointer-events-none"
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
      <div className="animate-header relative z-20 pt-2">
        <Navbar />
        <TopMarketToken />
      </div>
      <div className="grid relative z-10 min-h-screen grid-cols-1 pt-20 px-6 md:grid-cols-[260px,1fr]">
        <ProfileSidebar />
        <section className="px-6 py-6 md:px-10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-400">Overview</p>
            <div className="flex items-center gap-3">
              {!isWalletConnected ? (
                <button
                  type="button"
                  onClick={() => openView()}
                  className="rounded-sm bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                >
                  Connect Wallet
                </button>
              ) : !hasProfile ? (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-sm bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                >
                  Create Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-sm border border-green-500 px-4 py-2 text-xs font-semibold uppercase text-green-500 transition hover:bg-green-500 hover:text-black"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          {isWalletConnected ? (
            <ProfileHeader
              profile={profile}
              onUpgrade={handleUpgrade}
              isSaving={isSaving}
              onImageUpdate={handleImageUpdate}
              apiKey={apiKey || ""}
            />
          ) : (
            <div className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 text-center">
              <h3 className="mb-2 text-lg font-semibold text-white">
                Wallet Not Connected
              </h3>
              <p className="mb-4 text-sm text-neutral-400">
                Connect your wallet to view or create your profile
              </p>
              <button
                type="button"
                onClick={() => openView()}
                className="rounded-sm bg-green-500 px-6 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                Connect Wallet
              </button>
            </div>
          )}
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
        walletAddress={address ?? guestWalletId ?? undefined}
        initialProfile={profile}
        apiKey={apiKey}
      />
    </main>
  );
}
