"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listIndiaCities, type IndiaCity } from "@/lib/api/india";
import styles from "./city-comparison.module.css";

const MAX_CITIES = 4;

type DirectoryState = "loading" | "ready" | "error";

const DATA_ROWS: { label: string; value: (city: IndiaCity) => string; group: string }[] = [
  { group: "Location", label: "State / territory", value: (city) => city.state || "Not listed" },
  { group: "Location", label: "Region", value: (city) => city.region || "Not listed" },
  { group: "Local context", label: "Languages listed", value: (city) => city.languages?.length ? city.languages.join(", ") : "Not listed" },
  { group: "Local context", label: "Currency", value: () => "INR" },
  { group: "Local context", label: "Time zone", value: () => "Asia/Kolkata (IST)" },
];

const UNAVAILABLE_ROWS = [
  "Cost of living and monthly budget",
  "Typical rent and housing availability",
  "Employment opportunities and current job openings",
  "Climate and seasonal conditions",
  "Public transport and connectivity",
  "Lifestyle and neighbourhood amenities",
];

export default function CityComparison() {
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
      const result = await listIndiaCities();
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
        <nav aria-label="Main navigation">
          <Link href="/india-guide">City guide</Link>
          <Link href="/plan">Move planner</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>MAKE AN INFORMED MOVE</p>
        <h1>Compare Indian cities</h1>
        <p className={styles.intro}>Put the city details currently available in Batasari side by side. Choose up to {MAX_CITIES} destinations to compare their regional and language context.</p>
        <div className={styles.notice} role="note">
          <strong>Transparent by design</strong>
          <span>We only show fields in the curated city directory. We do not estimate rent, living costs, salaries, job availability, climate, or transport quality without a sourced dataset.</span>
        </div>
      </section>

      <section className={styles.selector} aria-labelledby="select-heading">
        <div className={styles.sectionHeading}>
          <div><p className={styles.kicker}>STEP 1</p><h2 id="select-heading">Choose cities</h2></div>
          <span className={styles.count}>{selected.length} / {MAX_CITIES} selected</span>
        </div>
        <label className={styles.searchLabel} htmlFor="city-search">Search by city, state or region</label>
        <input id="city-search" className={styles.search} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Surat or Gujarat" />
        {status === "loading" && <p className={styles.state} role="status">Loading the supported city directory…</p>}
        {status === "error" && <div className={styles.error} role="alert"><span>{error}</span><button type="button" onClick={() => void loadCities()}>Try again</button></div>}
        {status === "ready" && (
          <>
            {filtered.length === 0 ? <p className={styles.state}>No cities match that search.</p> : (
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
            <p className={styles.sourceMeta}>Source: Batasari curated India city directory · Retrieved {retrievedAt || "just now"}</p>
          </>
        )}
      </section>

      <section className={styles.comparison} aria-labelledby="comparison-heading">
        <div className={styles.sectionHeading}>
          <div><p className={styles.kicker}>STEP 2</p><h2 id="comparison-heading">Side-by-side comparison</h2></div>
          {selected.length > 0 && <button type="button" className={styles.clear} onClick={() => setSelected([])}>Clear selection</button>}
        </div>
        {compared.length === 0 ? (
          <div className={styles.empty}><span aria-hidden="true">＋</span><h3>Your comparison starts here</h3><p>Select at least one city above. Add two or more to compare their details side by side.</p></div>
        ) : (
          <div className={styles.tableWrap} role="region" aria-label="Selected city comparison" tabIndex={0}>
            <table>
              <thead><tr><th scope="col">What to compare</th>{compared.map((city) => <th scope="col" key={city.name}>{city.name}<small>{city.state}</small></th>)}</tr></thead>
              <tbody>
                {["Location", "Local context"].map((group) => <>{DATA_ROWS.filter((row) => row.group === group).map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{compared.map((city) => <td key={city.name}>{row.value(city)}</td>)}</tr>)}</>)}
                <tr className={styles.groupRow}><th scope="row" colSpan={compared.length + 1}>Research still needed</th></tr>
                {UNAVAILABLE_ROWS.map((label) => <tr key={label}><th scope="row">{label}</th>{compared.map((city) => <td key={city.name}><span className={styles.unavailable}>Not available in verified data</span></td>)}</tr>)}
              </tbody>
            </table>
          </div>
        )}
        <p className={styles.disclaimer}>Directory fields are descriptive, not a city ranking or recommendation. Confirm local conditions and current costs independently before making a relocation decision.</p>
        <Link className={styles.plannerLink} href="/plan">Use a city in your move plan <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
