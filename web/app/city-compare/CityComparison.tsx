"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IndiaCity } from "@/lib/api/india";
import { INDIA_CITY_DIRECTORY } from "@/lib/data/indiaCities";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import styles from "./city-comparison.module.css";

const MAX_CITIES = 4;

type DirectoryState = "loading" | "ready" | "error";

const DATA_ROWS: { label: string; value: (city: IndiaCity) => string; group: string }[] = [
  { group: "Location", label: "state", value: (city) => city.state || "Not listed" },
  { group: "Location", label: "region", value: (city) => city.region || "Not listed" },
  { group: "Local context", label: "languages", value: (city) => city.languages?.length ? city.languages.join(", ") : "Not listed" },
  { group: "Local context", label: "currency", value: () => "INR" },
  { group: "Local context", label: "timezone", value: () => "Asia/Kolkata (IST)" },
];

const UNAVAILABLE_ROWS = [
  "cost",
  "rent",
  "jobs",
  "climate",
  "transport",
  "lifestyle",
];

export default function CityComparison() {
  const { t } = useLanguage();
  const [cities, setCities] = useState<IndiaCity[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DirectoryState>("loading");
  const [error, setError] = useState("");
  const [retrievedAt, setRetrievedAt] = useState("");

  async function loadCities() {
    setStatus("loading");
    setError("");
    try {
      let result: IndiaCity[] = INDIA_CITY_DIRECTORY;
      setCities(result);
      setRetrievedAt(new Date().toLocaleString());
      setStatus("ready");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The city directory could not be loaded.");
      setStatus("error");
    }
  }

  useEffect(() => { void loadCities(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return cities.filter((city) => !needle || [city.name, city.state, city.region].some((value) => value.toLocaleLowerCase().includes(needle)));
  }, [cities, query]);

  const compared = cities.filter((city) => selected.includes(city.name));

  function toggleCity(name: string) {
    setSelected((current) => {
      if (current.includes(name)) return current.filter((item) => item !== name);
      if (current.length >= MAX_CITIES) return current;
      return [...current, name];
    });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Batasari home"><span className={styles.mark}>ब</span>Batasari</Link>
        <LanguageSwitcher compact />
        <nav aria-label="Main navigation">
          <Link href="/india-guide">{t("cityGuide")}</Link>
          <Link href="/plan">{t("movePlanner")}</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("makeMove")}</p>
        <h1>{t("compareTitle")}</h1>
        <p className={styles.intro}>{t("compareIntro")}</p>
        <div className={styles.notice} role="note">
          <strong>{t("transparent")}</strong>
          <span>{t("transparentText")}</span>
        </div>
      </section>

      <section className={styles.selector} aria-labelledby="select-heading">
        <div className={styles.sectionHeading}>
          <div><p className={styles.kicker}>{t("step1")}</p><h2 id="select-heading">{t("chooseCities")}</h2></div>
          <span className={styles.count}>{selected.length} / {MAX_CITIES} {t("selected")}</span>
        </div>
        <label className={styles.searchLabel} htmlFor="city-search">{t("searchCity")}</label>
        <input id="city-search" className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} />
        {status === "loading" && <p className={styles.state} role="status">{t("loadingCities")}</p>}
        {status === "error" && <div className={styles.error} role="alert"><span>{error}</span><button type="button" onClick={() => void loadCities()}>{t("tryAgain")}</button></div>}
        {status === "ready" && (
          <>
            {filtered.length === 0 ? <p className={styles.state}>{t("noMatch")}</p> : (
              <div className={styles.cityGrid}>
                {filtered.map((city) => {
                  const checked = selected.includes(city.name);
                  const limitReached = selected.length >= MAX_CITIES && !checked;
                  return <label className={checked ? styles.cityOptionSelected : styles.cityOption} key={city.name}>
                    <input type="checkbox" checked={checked} disabled={limitReached} onChange={() => toggleCity(city.name)} />
                    <span><strong>{city.name}</strong><small>{city.state} · {city.region}</small></span>
                  </label>;
                })}
              </div>
            )}
            <p className={styles.sourceMeta}>{t("source")} {retrievedAt || "just now"}</p>
          </>
        )}
      </section>

      <section className={styles.comparison} aria-labelledby="comparison-heading">
        <div className={styles.sectionHeading}>
          <div><p className={styles.kicker}>{t("step2")}</p><h2 id="comparison-heading">{t("sideBySide")}</h2></div>
          {selected.length > 0 && <button type="button" className={styles.clear} onClick={() => setSelected([])}>{t("clear")}</button>}
        </div>
        {compared.length === 0 ? (
          <div className={styles.empty}><span aria-hidden="true">＋</span><h3>{t("startCompare")}</h3><p>{t("selectHint")}</p></div>
        ) : (
          <div className={styles.tableWrap} role="region" aria-label="Selected city comparison" tabIndex={0}>
            <table>
              <thead><tr><th scope="col">{t("whatCompare")}</th>{compared.map((city) => <th scope="col" key={city.name}>{city.name}<small>{city.state}</small></th>)}</tr></thead>
              <tbody>
                {["location", "local"].flatMap((group) => DATA_ROWS.filter((row) => row.group === (group === "location" ? "Location" : "Local context")).map((row) => <tr key={row.label}><th scope="row">{t(row.label)}</th>{compared.map((city) => <td key={city.name}>{row.value(city)}</td>)}</tr>))}
                <tr className={styles.groupRow}><th scope="row" colSpan={compared.length + 1}>{t("research")}</th></tr>
                {UNAVAILABLE_ROWS.map((label) => <tr key={label}><th scope="row">{t(label)}</th>{compared.map((city) => <td key={city.name}><span className={styles.unavailable}>{t("notAvailable")}</span></td>)}</tr>)}
              </tbody>
            </table>
          </div>
        )}
        <p className={styles.disclaimer}>{t("disclaimer")}</p>
        <Link className={styles.plannerLink} href="/plan">{t("usePlan")} <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
