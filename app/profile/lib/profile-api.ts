export type ProfileWallet = {
  address: string;
  label?: string;
  is_primary?: boolean;
  network?: string;
  updated_at?: string;
};

export type Profile = {
  handle: string;
  user_id?: number;
  display_name?: string;
  bio?: string;
  image_url?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  tags?: string[];
  wallets?: ProfileWallet[];
};

const DEFAULT_BASE_URL = "https://testnet-api.degenter.io";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;

const buildHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return headers;
};

const normalizeWallet = (wallet: any): ProfileWallet => ({
  address: wallet?.address ?? wallet?.wallet ?? "",
  label: wallet?.label ?? wallet?.name ?? "",
  is_primary: Boolean(wallet?.is_primary ?? wallet?.isPrimary),
  network: wallet?.network ?? wallet?.chain ?? "Zigchain",
  updated_at:
    wallet?.updated_at ??
    wallet?.updatedAt ??
    wallet?.lastUpdated ??
    wallet?.linked_at,
});

const normalizeProfile = (payload: any, fallbackHandle: string): Profile => ({
  handle:
    payload?.handle ??
    payload?.id ??
    payload?.user_id ??
    fallbackHandle ??
    "",
  user_id: payload?.user_id ?? payload?.id ?? undefined,
  display_name: payload?.display_name ?? payload?.displayName ?? "",
  bio: payload?.bio ?? "",
  image_url: payload?.image_url ?? payload?.imageUrl ?? "",
  website: payload?.website ?? "",
  twitter: payload?.twitter ?? "",
  telegram: payload?.telegram ?? "",
  tags: Array.isArray(payload?.tags) ? payload.tags : [],
  wallets: Array.isArray(payload?.wallets)
    ? payload.wallets.map(normalizeWallet)
    : [],
});

export async function getProfile(handle: string, apiKey?: string): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles/${handle}`, {
    method: "GET",
    headers: buildHeaders(apiKey),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  const json = await response.json();
  const payload = json?.data ?? json;

  return normalizeProfile(payload, handle);
}

export async function getProfileById(
  userId: string | number,
  apiKey?: string
): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles/${userId}`, {
    method: "GET",
    headers: buildHeaders(apiKey),
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`);
  }

  const json = await response.json();
  const payload = json?.data ?? json;

  return normalizeProfile(payload, String(userId));
}

export async function createProfile(
  profile: Profile,
  apiKey?: string
): Promise<Profile> {
  const response = await fetch(`${API_BASE}/profiles`, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(`Failed to create profile: ${response.status}`);
  }

  const json = await response.json();
  const payload = json?.data ?? json;

  return normalizeProfile(payload, profile.handle);
}

export async function updateProfile(
  profile: Profile,
  apiKey?: string
): Promise<Profile> {
  const identifier = profile.user_id ?? profile.handle;
  const response = await fetch(`${API_BASE}/profiles/${identifier}`, {
    method: "PUT",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`);
  }

  const json = await response.json();
  const payload = json?.data ?? json;

  return normalizeProfile(payload, profile.handle);
}
