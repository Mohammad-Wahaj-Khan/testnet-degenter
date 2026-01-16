import { truncateMiddle } from "../lib/profile-format";
import type { Profile } from "../lib/profile-api";

type ProfileHeaderProps = {
  profile: Profile;
  onUpgrade: () => void;
  isSaving: boolean;
};

export default function ProfileHeader({
  profile,
  onUpgrade,
  isSaving,
}: ProfileHeaderProps) {
  const handleValue =
    profile.handle || profile.wallets?.[0]?.address || "3hXNpgKLFqCXB79h";
  const displayHandle = truncateMiddle(handleValue, 6, 6);
  const displayName =
    profile.display_name || profile.handle || displayHandle || "Profile";

  return (
    <section className="flex flex-col gap-6 border-b border-neutral-800 pb-6 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="h-24 w-24 overflow-hidden rounded-sm border border-neutral-700 bg-neutral-900">
          {profile.image_url ? (
            <img
              src={profile.image_url}
              alt={profile.display_name || "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-neutral-700 to-neutral-900" />
          )}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xl font-semibold text-white">{displayName}</p>
            <p className="text-sm text-neutral-500">{displayHandle}</p>
            {profile.bio && (
              <p className="mt-2 text-xs text-neutral-500">{profile.bio}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-neutral-500">Account Type</p>
              <p className="text-sm text-white">REGULAR</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onUpgrade}
                className="rounded-sm border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase text-neutral-500"
                disabled
              >
                Pro Upgrade (Locked)
              </button>
              <button
                type="button"
                className="text-xs font-semibold uppercase text-neutral-600"
                disabled
              >
                See Pro Benefits &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* <button
        type="button"
        className="self-start rounded-full border border-neutral-700 px-3 py-1 text-sm text-neutral-400"
        aria-label="More options"
      >
        ...
      </button> */}
    </section>
  );
}
