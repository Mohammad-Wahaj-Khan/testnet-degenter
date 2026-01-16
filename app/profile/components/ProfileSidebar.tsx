const overviewItems = [
  { label: "OVERVIEW", active: true },
  { label: "PRO SUBSCRIPTION", active: false },
];

const subscriptionItems = [
  { label: "Subscription", icon: "B", locked: true },
  { label: "Billing History", icon: "R", locked: true },
];

const footerItems = [
  { label: "DOWNLOAD CENTER", icon: "D", locked: true },
  { label: "DATA SERVICE", icon: "L", locked: true },
];

const IconBadge = ({ label }: { label: string }) => (
  <span className="flex h-5 w-5 items-center justify-center rounded border border-neutral-700 text-[10px] font-semibold text-neutral-500">
    {label}
  </span>
);

export default function ProfileSidebar() {
  return (
    <aside className="w-full max-w-[260px] border-r border-neutral-800 ">
      <div className=" px-6 py-5">
        <p className="text-lg font-semibold tracking-wide">PROFILE</p>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-3 text-xs font-semibold text-neutral-400">
          {overviewItems.map((item) => (
            <p
              key={item.label}
              className={item.active ? "text-orange-500" : ""}
            >
              {item.label}
            </p>
          ))}
        </div>
      </div>
      <div className="border-y border-neutral-800 px-6 py-4">
        <p className="text-xs font-semibold text-neutral-400">
          PRO SUBSCRIPTION
        </p>
        <div className="mt-4 space-y-4 text-sm text-neutral-500">
          {subscriptionItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 text-neutral-600"
            >
              <IconBadge label={item.icon} />
              <span>{item.label} (Locked)</span>
            </div>
          ))}
        </div>
      </div>
      {/* <div className="px-6 py-5">
        <div className="space-y-5 text-xs font-semibold text-neutral-400">
          {footerItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-neutral-600"
            >
              <span>{item.label}</span>
              <IconBadge label={item.icon} />
            </div>
          ))}
        </div>
      </div> */}
    </aside>
  );
}
