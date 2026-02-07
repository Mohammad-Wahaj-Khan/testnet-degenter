import React from "react";

interface NewTokenBadgeProps {
  title?: string;
  className?: string;
}

const NewTokenBadge: React.FC<NewTokenBadgeProps> = ({
  title = "Recently Launched", // token whose launched on last 5 days
  className,
}) => (
  <div
    title={title}
    className={`new-token-badge new-token-badge-flare inline-flex items-center rounded-full border border-red-400/60 bg-red-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300 ${className ?? ""}`}
  >
    New
  </div>
);

export default NewTokenBadge;
