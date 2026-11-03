"use client";

import { memo, useState, useRef, useEffect } from "react";
import styles from "./copilot.module.css";

export interface CopilotHeaderProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  onInfoClick?: () => void;
  onClearConversation?: () => void;
  onClearMemory?: () => void;
  disableExpand?: boolean;
}

function CopilotHeader({
  isExpanded,
  onToggleExpand,
  onClose,
  onInfoClick,
  onClearConversation,
  onClearMemory,
  disableExpand = false,
}: CopilotHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="copilot-header">
      <div className={styles.headerTop}>
        <div className={styles.headerTitleWrapper}>
          <div className={styles.headerTitleWithIcon}>
            <span className={styles.sparkleIcon} aria-hidden="true">✦</span>
            <h2>AI Co-Pilot</h2>
          </div>
          <p>
            Powered by Gemini (backup model DeepSeek V4 Flash){" "}
            <span
              role="button"
              tabIndex={0}
              onClick={onInfoClick}
              title="Verified sources across models"
              style={{ cursor: "pointer", marginLeft: "2px" }}
            >
              ⓘ
            </span>
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Settings menu */}
          <div className={styles.menuContainer} ref={menuRef}>
            <button
              className={styles.headerBtn}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Settings"
              title="Settings"
            >
              ⋮
            </button>

            {menuOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setMenuOpen(false);
                    onClearConversation?.();
                  }}
                >
                  🗑 Clear conversation
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => {
                    setMenuOpen(false);
                    onClearMemory?.();
                  }}
                >
                  🧹 Clear AI memory
                </button>
              </div>
            )}
          </div>

          {!disableExpand && (
          <button
            className={styles.headerBtn}
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Restore panel width" : "Maximize panel"}
            title={isExpanded ? "Restore" : "Maximize"}
          >
            {isExpanded ? "⧉" : "⛶"}
          </button>
          )}

        </div>
      </div>
    </div>
  );
}

export default memo(CopilotHeader);

