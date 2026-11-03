"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { AppShell } from "@/components/navigation";
import { apiUrl } from "@/lib/api/apiBase";
import { getAccessToken } from "@/lib/supabase/client";
import styles from "./batasari-pages.module.css";

const CITIES = ["Ahmedabad", "Bengaluru", "Chennai", "Delhi NCR", "Hyderabad", "Indore", "Jaipur", "Kochi", "Kolkata", "Mumbai", "Pune"];

function useSavedChecks(storageKey: string) {
  const [checked, setChecked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved) && saved.every((item) => typeof item === "string")) setChecked(saved);
    } catch {
      setChecked([]);
    }
    setLoaded(true);
  }, [storageKey]);
  useEffect(() => {
    if (loaded) window.localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, loaded, storageKey]);
  function toggle(item: string) {
    setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  }
  return [checked, toggle] as const;
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className={styles.intro}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>;
}

const MOVE_OPTIONS = [
  { value: "within_india", label: "Moving between Indian cities" },
  { value: "returning_to_india", label: "Returning to India" },
  { value: "relocating_to_india", label: "Moving to India from abroad" },
];

export function MyMoveDashboard() {
  const [moveType, setMoveType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const ready = Boolean(moveType && from && to);
  async function saveMovePlan() {
    if (!ready || saving) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const token = await getAccessToken();
      const response = await fetch(apiUrl("/india/move-plans"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: `${from} to ${to}`,
          move_type: moveType,
          ...(moveType === "within_india" ? { origin_city: from } : { origin_country: from }),
          destination_city: to,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? "We could not save your move plan. Please try again.");
      }
      setSaveMessage("Your move plan is saved. You can find it in your Batasari account.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "We could not save your move plan. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <AppShell activeHref="/categories">
      <div className={styles.page}>
        <PageIntro eyebrow="YOUR INDIA MOVE" title="Let’s make a plan that fits you." description="Whether you’re changing cities or making a home in India from abroad, start with the move you’re planning." />
        <section className={styles.planner}>
          <div className={styles.plannerHead}><span className={styles.stepPill}>START HERE</span><h2>Your move at a glance</h2><p>Choose your route and destination to shape your planning checklist.</p></div>
          <div className={styles.formGrid}>
            <label>What kind of move?
              <select value={moveType} onChange={(event) => setMoveType(event.target.value)}><option value="">Select your move</option>{MOVE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </label>
            {moveType === "within_india" && <label>Moving from
              <select value={from} onChange={(event) => setFrom(event.target.value)}><option value="">Choose a city</option>{CITIES.map((city) => <option key={city}>{city}</option>)}</select>
            </label>}
            {(moveType === "returning_to_india" || moveType === "relocating_to_india") && <label>Coming from
              <select value={from} onChange={(event) => setFrom(event.target.value)}><option value="">Choose a country</option>{["Australia", "Canada", "Germany", "India (another city)", "Singapore", "United Arab Emirates", "United Kingdom", "United States", "Other country"].map((place) => <option key={place}>{place}</option>)}</select>
            </label>}
            <label>Moving to
              <select value={to} onChange={(event) => setTo(event.target.value)}><option value="">Choose an Indian city</option>{CITIES.map((city) => <option key={city}>{city}</option>)}</select>
            </label>
          </div>
          {ready && <div className={styles.snapshot} role="status"><span>YOUR MOVE</span><strong>{from ? `${from} → ` : ""}{to}</strong><p>{MOVE_OPTIONS.find((item) => item.value === moveType)?.label}. Your plan starts with the practical tasks below.</p><button className={styles.saveButton} type="button" disabled={saving} onClick={saveMovePlan}>{saving ? "Saving…" : "Save this move plan"}</button>{saveMessage && <p aria-live="polite">{saveMessage}</p>}</div>}
        </section>
        <div className={styles.cardGrid}>
          <Link className={styles.featureCard} href="/india-guide"><span className={styles.cardIcon}>⌖</span><span className={styles.cardMeta}>01 · CHOOSE YOUR PLACE</span><h2>Explore Indian cities</h2><p>Compare what matters for your next home and build a list of questions to research locally.</p><span className={styles.arrow}>Explore city guide →</span></Link>
          <Link className={styles.featureCard} href="/moving-shipping"><span className={styles.cardIcon}>↗</span><span className={styles.cardMeta}>02 · PLAN THE MOVE</span><h2>Household moving help</h2><p>Prepare for packers, local transport, intercity moves, and the questions to ask before booking.</p><span className={styles.arrow}>Compare your options →</span></Link>
          <Link className={styles.featureCard} href="/immigration"><span className={styles.cardIcon}>✳</span><span className={styles.cardMeta}>03 · GET READY TO ARRIVE</span><h2>Stay &amp; documents</h2><p>Keep entry, customs, identity, and arrival research together with official resources.</p><span className={styles.arrow}>View official resources →</span></Link>
          <Link className={styles.featureCard} href="/checklist"><span className={styles.cardIcon}>✓</span><span className={styles.cardMeta}>04 · KEEP YOUR NEXT STEPS</span><h2>Your moving checklist</h2><p>Break the move into manageable tasks for before, during, and after moving day.</p><span className={styles.arrow}>Open checklist →</span></Link>
        </div>
        <p className={styles.disclaimer}>Batasari is a planning guide. Service availability, prices, and official requirements vary. Confirm details with the relevant provider or authority.</p>
      </div>
    </AppShell>
  );
}

const CITY_PROMPTS = ["Rent and deposit expectations", "Commute options between home and work", "Language and community preferences", "School, childcare, or healthcare needs", "Moving-day access, lifts, parking, and timings"];

export function IndiaCityGuide() {
  const [city, setCity] = useState("Bengaluru");
  const questionList = useMemo(() => CITY_PROMPTS.map((item) => `${city}: ${item}`), [city]);
  return <AppShell activeHref="/india-guide"><div className={styles.page}><PageIntro eyebrow="CITY GUIDE" title="Find a city that feels right." description="Start with the places on your shortlist. Batasari helps you organise what to compare; always verify local details before you decide." />
    <section className={styles.cityPicker}><label htmlFor="city-select">Choose a city to explore</label><select id="city-select" value={city} onChange={(event) => setCity(event.target.value)}>{CITIES.map((item) => <option key={item}>{item}</option>)}</select><p>City-specific listings and local service data can be added as Batasari expands. For now, use this guide to focus your research around the needs that matter to your household.</p></section>
    <h2 className={styles.subheading}>Questions to take with you</h2><div className={styles.promptGrid}>{questionList.map((item, index) => <article key={item} className={styles.promptCard}><span>0{index + 1}</span><p>{item}</p></article>)}</div>
    <div className={styles.callout}><strong>Shortlisting more than one city?</strong><p>Use the same questions for each place so you can compare options on your own priorities.</p><Link href="/categories">Add your move details →</Link></div>
  </div></AppShell>;
}

const MOVE_SERVICES = [
  ["Packers and movers", "Ask what packing materials, loading, transport, unloading, and unpacking are included."],
  ["Intercity household move", "Confirm the vehicle size, route, transit estimate, delivery window, and how delays are handled."],
  ["Local transport", "Check vehicle access, building permissions, parking, lift bookings, and any hourly charges."],
  ["Storage and temporary stay", "Ask about access, security, insurance, minimum term, and any additional fees."],
];
const QUOTE_CHECKS = ["Written itemised quote in ₹ INR", "Pickup and delivery addresses and dates", "Packing, labour, taxes, and extra charges listed", "Declared value, transit cover, and claims process", "Cancellation, delay, and damage terms", "Company name, office details, and a receipt for payments"];

export function MovingServices() {
  const [checked, toggle] = useSavedChecks("batasari-quote-checks-v1");
  return <AppShell activeHref="/moving-shipping"><div className={styles.page}><PageIntro eyebrow="MOVING SERVICES" title="Choose help with confidence." description="Use these questions when comparing household movers, local transport, or an intercity move. Batasari does not endorse or verify providers yet." />
    <div className={styles.serviceGrid}>{MOVE_SERVICES.map(([title, description], index) => <article className={styles.serviceCard} key={title}><span className={styles.cardMeta}>OPTION 0{index + 1}</span><h2>{title}</h2><p>{description}</p></article>)}</div>
    <section className={styles.checkPanel}><div><p className={styles.eyebrow}>BEFORE YOU BOOK</p><h2>Quote comparison checklist</h2><p>Compare the same details across each quote. Prices and services vary by route and provider.</p></div><div className={styles.checkList}>{QUOTE_CHECKS.map((item) => <label key={item} className={styles.checkItem}><input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} /><span>{item}</span></label>)}</div><p className={styles.progress}>{checked.length} of {QUOTE_CHECKS.length} checked</p></section>
  </div></AppShell>;
}

const STAY_TASKS = ["Confirm the entry or stay documents that apply to your situation", "Keep passport, visa, OCI, and travel records together as relevant", "Review customs rules for household goods before shipping belongings", "Save copies of important documents securely", "Check local address, housing, and arrival arrangements"];

export function StayAndDocuments() {
  const [checked, toggle] = useSavedChecks("batasari-stay-checks-v1");
  return <AppShell activeHref="/immigration"><div className={styles.page}><PageIntro eyebrow="STAY & DOCUMENTS" title="Get ready for your stay in India." description="Entry and stay rules depend on your circumstances. Use official Government of India resources and confirm requirements for your own case." />
    <section className={styles.officialNotice}><span>OFFICIAL SOURCES</span><p>Use government portals for applications and current requirements. Be cautious of unofficial sites that charge for expedited visa services.</p></section>
    <div className={styles.resourceGrid}>
      <a className={styles.resourceCard} href="https://indianvisaonline.gov.in/" target="_blank" rel="noreferrer"><span>GOVERNMENT OF INDIA</span><h2>India Visa Online</h2><p>Official portal for Indian visa information and applications.</p><b>Visit official portal ↗</b></a>
      <a className={styles.resourceCard} href="https://www.mea.gov.in/overseas-citizenship-of-india-scheme.htm" target="_blank" rel="noreferrer"><span>MINISTRY OF EXTERNAL AFFAIRS</span><h2>Overseas Citizen of India</h2><p>Read the official OCI scheme information and check the details that apply to you.</p><b>Visit MEA ↗</b></a>
      <a className={styles.resourceCard} href="https://www.cbic.gov.in/entities/internationalTravellers" target="_blank" rel="noreferrer"><span>INDIAN CUSTOMS · CBIC</span><h2>International travellers</h2><p>Review current baggage, customs, and transfer-of-residence resources before shipping belongings.</p><b>Visit CBIC ↗</b></a>
    </div>
    <section className={styles.checkPanel}><div><p className={styles.eyebrow}>PERSONAL DOCUMENT FOLDER</p><h2>A few useful preparation steps</h2><p>This is a planning prompt, not a determination of eligibility or legal advice.</p></div><div className={styles.checkList}>{STAY_TASKS.map((item) => <label key={item} className={styles.checkItem}><input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} /><span>{item}</span></label>)}</div><p className={styles.progress}>{checked.length} of {STAY_TASKS.length} checked</p></section>
  </div></AppShell>;
}

const CHECKLIST_GROUPS = [
  { title: "Before the move", items: ["Confirm the destination city and target move date", "Create a moving budget in ₹ INR", "Research housing and temporary accommodation", "Shortlist movers and request written quotes"] },
  { title: "Packing and logistics", items: ["Make a household inventory and photograph valuable items", "Confirm packing, transit cover, pickup, and delivery details", "Arrange building access, parking, and lift bookings", "Check customs requirements before shipping goods to India"] },
  { title: "Moving day", items: ["Keep identity and booking documents with you", "Photograph item condition and review the inventory with the crew", "Confirm contact numbers and arrival arrangements"] },
  { title: "After arrival", items: ["Check delivered items against the inventory", "Save receipts and report any damage promptly", "Set up local connectivity and essential services", "Update your address where relevant"] },
];

export function MovingChecklist() {
  const items = CHECKLIST_GROUPS.flatMap((group) => group.items);
  const [checked, toggle] = useSavedChecks("batasari-moving-checklist-v1");
  return <AppShell activeHref="/checklist"><div className={styles.page}><PageIntro eyebrow="YOUR CHECKLIST" title="One step at a time." description="A practical starting list for a move within India or a move to India from abroad. Add dates and details as you make decisions." />
    <div className={styles.progressWrap}><div className={styles.progressTrack}><span style={{ width: `${items.length ? checked.length / items.length * 100 : 0}%` }} /></div><p>{checked.length} of {items.length} tasks complete</p></div>
    <div className={styles.taskGroups}>{CHECKLIST_GROUPS.map((group) => <section className={styles.taskGroup} key={group.title}><h2>{group.title}</h2>{group.items.map((item) => <label className={styles.checkItem} key={item}><input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)} /><span>{item}</span></label>)}</section>)}</div>
    <p className={styles.disclaimer}>This checklist is a starting point. Requirements vary by route, city, service provider, and personal circumstances.</p>
  </div></AppShell>;
}

