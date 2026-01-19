import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiHome,
  FiSettings,
  FiUser,
  FiActivity,
  FiBell,
  FiHelpCircle,
} from "react-icons/fi";

const navItems = [
  {
    label: "Overview",
    icon: <FiHome className="w-5 h-5" />,
    href: "/profile",
    badge: null,
  },
  {
    label: "Activity",
    icon: <FiActivity className="w-5 h-5" />,
    href: "/profile/activity",
    badge: null,
  },
  {
    label: "Notifications",
    icon: <FiBell className="w-5 h-5" />,
    href: "/profile/notifications",
    badge: "3",
  },
  {
    label: "Settings",
    icon: <FiSettings className="w-5 h-5" />,
    href: "/profile/settings",
    badge: null,
  },
];

const helpItems = [
  {
    label: "Help & Support",
    icon: <FiHelpCircle className="w-5 h-5" />,
    href: "/help",
  },
];

const NavItem = ({
  item,
  isActive,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
}) => {
  const isLocked = item.label !== "Overview";

  const content = (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        isActive
          ? "bg-neutral-800 text-green-500"
          : isLocked
          ? "text-neutral-600 cursor-not-allowed"
          : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={
            isActive
              ? "text-green-500"
              : isLocked
              ? "text-neutral-700"
              : "text-neutral-500"
          }
        >
          {item.icon}
        </span>
        <span className="text-sm font-medium flex items-center gap-2">
          {item.label}
          {isLocked && (
            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">
              Coming Soon
            </span>
          )}
        </span>
      </div>
      {item.badge && !isLocked && (
        <span className="flex items-center justify-center h-5 px-2 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
          {item.badge}
        </span>
      )}
    </div>
  );

  return isLocked ? (
    <div className="relative">{content}</div>
  ) : (
    <Link href={item.href}>{content}</Link>
  );
};

export default function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-[260px] border-r border-neutral-800 bg-black/30 backdrop-blur-sm h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 border-b border-neutral-800">
        <h2 className="text-xl font-bold bg-gradient-to-r from-green-500 to-yellow-400 bg-clip-text text-transparent">
          Profile
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Manage your account and settings
        </p>
      </div>

      <nav className="p-4 space-y-1">
        <h3 className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Navigation
        </h3>
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      <div className="p-4 mt-4 border-t border-neutral-800">
        <h3 className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Support
        </h3>
        <div className="space-y-1">
          {helpItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-3 text-sm font-medium text-neutral-400 rounded-lg hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors"
            >
              <span className="text-neutral-500">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
