import type { IconName } from "@/content/types";

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : "icon"} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}
