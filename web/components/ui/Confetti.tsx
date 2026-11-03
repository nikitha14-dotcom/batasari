import styles from "./ui.module.css";

/**
 * Party poppers and confetti flanking the "Thanks for Your Feedback" card
 * (Figma Feedback_3).
 *
 * Drawn here rather than exported from Figma: the design's decorations are
 * vector assets the repo has no pipeline for, and this is generic
 * celebration artwork, so redrawing it costs nothing. Purely decorative --
 * aria-hidden, and it never sits above the text.
 */
export function Confetti() {
  return (
    <span className={styles.confetti} aria-hidden="true">
      <span className={styles.confettiLeft}>
        <Popper />
      </span>
      <span className={styles.confettiRight}>
        <Popper />
      </span>
    </span>
  );
}

function Popper() {
  return (
    <svg width="164" height="164" viewBox="0 0 140 140" fill="none" focusable="false">
      {/* cone */}
      <path d="M6 134 L50 72 L82 100 Z" fill="#f2b705" />
      <path d="M6 134 L28 103 L54 126 Z" fill="#d99a02" opacity="0.35" />
      <path d="M50 72 L82 100 L70 112 L40 86 Z" fill="#ffd45e" opacity="0.55" />

      {/* streamers */}
      <path
        d="M78 70 C92 54 106 50 120 52"
        stroke="#1f8a4c"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M64 52 C70 34 82 24 96 20"
        stroke="#e2574c"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* confetti */}
      <circle cx="104" cy="74" r="6" fill="#e2574c" />
      <circle cx="122" cy="96" r="4.5" fill="#f2b705" />
      <circle cx="88" cy="34" r="5" fill="#3b82f6" />
      <circle cx="116" cy="30" r="4" fill="#1f8a4c" />
      <rect x="98" y="52" width="9" height="9" rx="2" fill="#8b5cf6" transform="rotate(24 98 52)" />
      <rect x="70" y="16" width="8" height="8" rx="2" fill="#f2b705" transform="rotate(-18 70 16)" />
      <rect x="126" y="62" width="8" height="8" rx="2" fill="#e2574c" transform="rotate(35 126 62)" />
    </svg>
  );
}

