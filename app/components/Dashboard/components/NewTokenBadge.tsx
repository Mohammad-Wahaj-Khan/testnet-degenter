import Image from "next/image";
import React from "react";

interface NewTokenBadgeProps {
  title?: string;
  className?: string;
  width?: number;
  height?: number;
}

const DEFAULT_WIDTH = 50;
const DEFAULT_HEIGHT = 50;

const NewTokenBadge: React.FC<NewTokenBadgeProps> = ({
  title = "Recently Launched", // token whose launched on last 5 days
  className,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => (
  <div className={`new-token-badge new-token-badge-flare ${className ?? ""}`}>
    <Image
      src="/newimgyellow.png"
      alt="New token badge"
      width={width}
      height={height}
      title={title}
      className="block"
      draggable={false}
      priority
    />
  </div>
);

export default NewTokenBadge;
