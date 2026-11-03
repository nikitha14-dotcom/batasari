"use client";

import { CloseIcon, SearchIcon } from "./icons";
import styles from "./onboarding.module.css";

/**
 * ONB-09 -> 09C. One search field over a combined city/country list, with a
 * suggestion list underneath that bolds the matched substring.
 *
 * The four lettered frames are this component at four values: empty (09),
 * typed with suggestions (09A), a highlighted suggestion (09B), and a
 * committed selection with the list closed (09C).
 */
export function SearchSelect({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  disabled,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  disabled?: boolean;
  label: string;
}) {
  const query = value.trim();
  const showSuggestions = query.length > 0 && suggestions.length > 0 && !suggestions.includes(value);

  return (
    <div>
      <div className={styles.searchRow}>
        <div className={styles.searchField}>
          <SearchIcon />
          <input
            className={styles.searchInput}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={label}
            autoComplete="off"
          />
        </div>

        {value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onChange("")}
            disabled={disabled}
            aria-label="Clear"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {showSuggestions && (
        <>
          <p className={styles.suggestionsLabel}>Suggestions</p>
          <ul className={styles.suggestions}>
            {suggestions.map((suggestion, index) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className={`${styles.suggestion} ${index === 0 ? styles.suggestionActive : ""}`}
                  onClick={() => onSelect(suggestion)}
                  disabled={disabled}
                  /*
                   * The label is split into <span>match</span> + rest to bold
                   * the matched run. Accessible-name computation joins element
                   * children with a space, so without this the button announces
                   * as "Indo nesia". aria-label pins the real place name.
                   */
                  aria-label={suggestion}
                >
                  {highlight(suggestion, query)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Splits a suggestion around the matched query so the matching run renders
 * semibold, as in ONB-09B ("**Indo**nesia", "Jakarta, **Indo**nesia").
 */
function highlight(text: string, query: string) {
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return text;

  return (
    <>
      {text.slice(0, at)}
      <span className={styles.suggestionMatch}>{text.slice(at, at + query.length)}</span>
      {text.slice(at + query.length)}
    </>
  );
}

