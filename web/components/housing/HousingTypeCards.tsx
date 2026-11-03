"use client";

import type { HousingTypeCard } from "@/lib/housing/housingContent";

import styles from "./housing.module.css";

/**
 * "Choose the right type of housing" (Figma FH-01, inside the first
 * accordion): a labelled row of three duration options, then a labelled row
 * of three type options, then University housing boards on its own wider
 * card with the student badge.
 *
 * Each option is a 36px round icon, a bold 12px title, an 11px blurb and a
 * "Learn more ›" that opens the expanded popup. The original markup used
 * bullet lists and `<a href="#temporary">` anchors that pointed at nothing.
 */

const ICON_GLYPH: Record<string, string> = {
  calendar: "📅",
  suitcase: "🧳",
  house: "🏠",
  "building-check": "🏢",
  key: "🔑",
  people: "👥",
  school: "🎓",
};

export function HousingTypeCards({
  cards,
  onOpen,
  disabled,
}: {
  cards: HousingTypeCard[];
  onOpen: (card: HousingTypeCard) => void;
  disabled?: boolean;
}) {
  const durations = cards.filter((c) => c.group === "duration");
  const types = cards.filter((c) => c.group === "type" && !c.wide);
  const wide = cards.filter((c) => c.group === "type" && c.wide);

  return (
    <>
      <p className={styles.groupLabel}>Find the duration that suits your needs</p>
      <div className={styles.optionGrid}>
        {durations.map((card) => (
          <Option key={card.id} card={card} onOpen={onOpen} disabled={disabled} />
        ))}
      </div>

      <p className={styles.groupLabel}>
        Find the type of housing that suits your needs
      </p>
      <div className={styles.optionGrid}>
        {types.map((card) => (
          <Option key={card.id} card={card} onOpen={onOpen} disabled={disabled} />
        ))}
        {wide.map((card) => (
          <Option
            key={card.id}
            card={card}
            onOpen={onOpen}
            disabled={disabled}
            wide
          />
        ))}
      </div>
    </>
  );
}

function Option({
  card,
  onOpen,
  disabled,
  wide,
}: {
  card: HousingTypeCard;
  onOpen: (card: HousingTypeCard) => void;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? `${styles.option} ${styles.optionWide}` : styles.option}>
      <span className={styles.optionIcon} aria-hidden="true">
        {ICON_GLYPH[card.icon] ?? "🏠"}
      </span>

      <div className={styles.optionText}>
        <div>
          <div className={styles.optionTitleRow}>
            <p className={styles.optionTitle}>{card.title}</p>
            {card.badge && <span className={styles.optionBadge}>{card.badge}</span>}
          </div>
          <p className={styles.optionBlurb}>{card.blurb}</p>
        </div>

        <button
          type="button"
          className={styles.learnMore}
          onClick={() => onOpen(card)}
          disabled={disabled}
          // The visible label is "Learn more" on all seven cards, so the
          // accessible name has to carry which one this is.
          aria-label={`Learn more about ${card.title}`}
        >
          Learn more ›
        </button>
      </div>
    </div>
  );
}

