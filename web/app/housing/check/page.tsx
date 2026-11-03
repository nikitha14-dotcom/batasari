"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Markdown } from "@/components/content/ContentCard";
import { Icon } from "@/components/navigation/icons";
import {
  ContentError,
  ContentLoading,
  HousingCard,
  HousingShell,
} from "@/components/housing";
import styles from "@/components/housing/housing.module.css";
import {
  CrimeRequestError,
  type CrimeStats,
  fetchCrimeStats,
  formatDifference,
  formatRate,
} from "@/lib/housing/crimeApi";
import {
  HOUSING_SUBCATEGORY,
  sectionByKey,
  useHousingContent,
} from "@/lib/housing/housingContent";
import { RequireSession } from "@/lib/supabase/RequireSession";

/**
 * Check the Place (Figma CP-01 empty, CP-02 with a result).
 *
 * CP-01 and CP-02 are the same screen before and after a lookup, so this is
 * one page: the address card is always there and the result block appears
 * once a real address resolves. Nothing is pre-filled -- the first version
 * opened with "123 Main St, Unit 1502" already "checked", so a number on
 * screen did not correspond to anything anyone had asked for.
 *
 * Two data sources: the guidance copy comes from static_content, the table
 * from the crime pipeline. The columns, the order of the nine offences and
 * the red/green treatment of the difference all follow CP-02.
 */
function CheckPlaceContent() {
  const { sections, error: contentError } =
    useHousingContent(HOUSING_SUBCATEGORY.check);

  const [address, setAddress] = useState("");
  const [analyzedAddress, setAnalyzedAddress] = useState<string | null>(null);
  const [stats, setStats] = useState<CrimeStats | null>(null);
  const [checking, setChecking] = useState(false);
  const [crimeError, setCrimeError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [statsOpen, setStatsOpen] = useState(true);

  // Abort an in-flight lookup when a second starts, so a slow first request
  // cannot land after a faster second and label the wrong address.
  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => () => inFlight.current?.abort(), []);

  const runCheck = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setChecking(true);
    setCrimeError(null);
    setSaved(false);
    setAnalyzedAddress(trimmed);

    try {
      const result = await fetchCrimeStats(trimmed, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setStats(result);
      setStatsOpen(true);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setStats(null);
      setCrimeError(
        err instanceof CrimeRequestError
          ? err.message
          : "Something went wrong looking up that address.",
      );
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  }, []);

  const crimeOverview = sectionByKey(sections, "crime-data-overview");
  const crimeSpecifics = sectionByKey(sections, "crime-data-specifics");

  return (
    <HousingShell
      step={3}
      title="Check the place"
      subcategory={HOUSING_SUBCATEGORY.check}
    >
      {contentError && <ContentError message={contentError} />}

      <div className={styles.checkStack}>
        <div className={styles.addressCard}>
          <span className={styles.optionIcon} aria-hidden="true">
            <Icon name="map-pin" size={18} />
          </span>

          <div className={styles.addressText}>
            <div>
              <p className={styles.addressTitle}>Enter an address</p>
              <p className={styles.addressSubtitle}>
                We&apos;ll analyze local crime rates and city averages
              </p>
            </div>

            <form
              className={styles.addressForm}
              onSubmit={(event) => {
                event.preventDefault();
                void runCheck(address);
              }}
            >
              <div className={styles.addressField}>
                <input
                  type="text"
                  className={styles.addressInput}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Search a Toronto address..."
                  aria-label="Address to check"
                  autoComplete="street-address"
                />
                {address && (
                  <button
                    type="button"
                    className={styles.addressClear}
                    onClick={() => setAddress("")}
                    aria-label="Clear address"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                className={styles.checkButton}
                disabled={!address.trim() || checking}
              >
                <Icon name="search" size={18} />
                {checking ? "Checking…" : "Check Address"}
              </button>
            </form>
          </div>
        </div>

        {checking && <ContentLoading label="Looking up that neighbourhood…" />}

        {!checking && crimeError && analyzedAddress && (
          <ContentError
            message={crimeError}
            onRetry={() => void runCheck(analyzedAddress)}
          />
        )}

        {!checking && stats && analyzedAddress && (
          <div className={styles.resultBlock}>
            <div className={styles.resultHeader}>
              <div className={styles.resultAddress}>
                <Icon name="map-pin" size={20} />
                <p className={styles.resultAddressText}>{analyzedAddress}</p>
                <span className={styles.resultStatus}>Checked just now</span>
              </div>

              <button
                type="button"
                className={styles.savePlace}
                onClick={() => setSaved((was) => !was)}
                aria-pressed={saved}
              >
                <Icon name="bookmark" size={17} />
                {saved ? "Saved" : "Save this place"}
              </button>
            </div>

            <HousingCard
              icon="⚠️"
              tone="warn"
              title={stats.neighbourhoodName}
              open={statsOpen}
              onToggle={() => setStatsOpen((o) => !o)}
              caption={`Reported crime rate per 100,000 residents${
                stats.rateYear ? ` • ${stats.rateYear}` : ""
              }`}
            >
              <div className={styles.statsBox}>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th scope="col">Offence</th>
                      <th scope="col">This neighborhood</th>
                      <th scope="col">Toronto average</th>
                      <th scope="col">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.rows.map((row) => (
                      <tr key={row.key}>
                        <td>{row.offence}</td>
                        <td>{formatRate(row.neighbourhoodRate)}</td>
                        <td>{formatRate(row.cityAverage)}</td>
                        <td className={row.isHigher ? styles.statsUp : styles.statsDown}>
                          {formatDifference(row.differencePercentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.statsFooter}>
                <span>
                  Toronto Police Service · Neighbourhood Crime Rates{" "}
                  <a
                    href="https://data.torontopolice.on.ca/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    (Open Data)
                  </a>
                </span>
                <span>
                  {stats.totalIncidents.toLocaleString()} incidents in range
                </span>
              </div>

              {crimeOverview?.bodyMarkdown && (
                <div className={styles.popupBody}>
                  <Markdown>{crimeOverview.bodyMarkdown}</Markdown>
                </div>
              )}
              {crimeSpecifics?.bodyMarkdown && (
                <div className={styles.popupBody}>
                  <Markdown>{crimeSpecifics.bodyMarkdown}</Markdown>
                </div>
              )}
            </HousingCard>
          </div>
        )}

      </div>
    </HousingShell>
  );
}

export default function CheckPlacePage() {
  return (
    <RequireSession>
      <CheckPlaceContent />
    </RequireSession>
  );
}

