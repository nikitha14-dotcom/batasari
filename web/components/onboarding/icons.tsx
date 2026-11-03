/**
 * Inline SVG icons for the onboarding flow.
 *
 * Figma exports these as hosted SVG assets on a short-lived URL. They are
 * redrawn here so the bundle has no external image dependency and the icons
 * inherit `currentColor` from their container.
 */

type IconProps = {
  className?: string;
  size?: number;
};

function svgProps(size: number, strokeWidth = 2) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function ArrowLeftIcon({ className, size = 30 }: IconProps) {
  return (
    <svg className={className} {...svgProps(size, 1.8)}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function CalendarIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} {...svgProps(size, 1.8)}>
      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
      <line x1="3" y1="9.5" x2="21" y2="9.5" />
      <line x1="8" y1="2.5" x2="8" y2="6.5" />
      <line x1="16" y1="2.5" x2="16" y2="6.5" />
    </svg>
  );
}

export function ChevronIcon({ className, size = 12, up = false }: IconProps & { up?: boolean }) {
  return (
    <svg className={className} {...svgProps(size, 2.4)}>
      {up ? <polyline points="6 15 12 9 18 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );
}

export function SearchIcon({ className, size = 17 }: IconProps) {
  return (
    <svg className={className} {...svgProps(size, 2)}>
      <circle cx="11" cy="11" r="7.5" />
      <line x1="21" y1="21" x2="16.8" y2="16.8" />
    </svg>
  );
}

export function CloseIcon({ className, size = 26 }: IconProps) {
  return (
    <svg className={className} {...svgProps(size, 1.8)}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function MinusIcon({ className, size = 14 }: IconProps) {
  return (
    <svg className={className} {...svgProps(size, 2)}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function PlusIcon({ className, size = 14 }: IconProps) {
  return (
    <svg className={className} {...svgProps(size, 2)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </svg>
  );
}

