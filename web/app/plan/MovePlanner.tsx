"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./planner.module.css";
import { createIndiaMovePlan, listIndiaCities, updateIndiaMovePlan } from "@/lib/api/india";
import { getAccessToken } from "@/lib/supabase/client";

type MoveDraft = {
  moveType: string;
  origin: string;
  destination: string;
  moveDate: string;
  household: string;
  homeType: string;
  budget: string;
  notes: string;
};
type Task = { id: string; title: string; group: string };
const STORAGE_KEY = "batasari-planner-v1";
const CITIES = ["Ahmedabad", "Amritsar", "Bengaluru", "Bhopal", "Bhubaneswar", "Chandigarh", "Chennai", "Coimbatore", "Dehradun", "Delhi", "Goa", "Guwahati", "Hyderabad", "Indore", "Jaipur", "Kochi", "Kolkata", "Lucknow", "Mangaluru", "Mumbai", "Mysuru", "Nagpur", "Nellore", "Pune", "Rajamahendravaram", "Surat", "Thiruvananthapuram", "Tirupati", "Vadodara", "Visakhapatnam", "Other city"];
const TASKS: Task[] = [
  { id: "date", title: "Confirm your moving date and key handover dates", group: "Before the move" },
  { id: "quotes", title: "Request and compare at least three written moving quotes", group: "Before the move" },
  { id: "inventory", title: "Create a household inventory and photograph valuables", group: "Before the move" },
  { id: "documents", title: "Keep identity, travel and property documents together", group: "Before the move" },
  { id: "utilities", title: "Plan utility, internet and address changes", group: "Before the move" },
  { id: "packing", title: "Label boxes by room and prepare an essentials bag", group: "Moving week" },
  { id: "handover", title: "Record meter readings and document property condition", group: "Moving week" },
  { id: "transport", title: "Confirm vehicle, pickup window and delivery contact", group: "Moving week" },
  { id: "inspect", title: "Inspect delivered items and note any damage promptly", group: "After arrival" },
  { id: "local", title: "Find nearby healthcare, groceries and essential services", group: "After arrival" },
  { id: "address", title: "Update important addresses and local registrations as applicable", group: "After arrival" },
  { id: "settle", title: "Unpack essentials and review remaining tasks", group: "After arrival" },
];
const INITIAL: MoveDraft = { moveType: "within_india", origin: "", destination: "", moveDate: "", household: "2", homeType: "2 BHK", budget: "", notes: "" };

export default function MovePlanner() {
  const [draft, setDraft] = useState<MoveDraft>(INITIAL);
  const [checked, setChecked] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<{ id: number; label: string; amount: string }[]>([
    { id: 1, label: "Packing and movers", amount: "" },
    { id: 2, label: "Transport / travel", amount: "" },
    { id: 3, label: "Temporary accommodation", amount: "" },
    { id: 4, label: "Deposits and setup", amount: "" },
  ]);
  const [saved, setSaved] = useState(false);
  const [synced, setSynced] = useState(false);
  const [ready, setReady] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>(CITIES);
  const [remotePlanId, setRemotePlanId] = useState<string | null>(null);
  const [remotePlanType, setRemotePlanType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    listIndiaCities().then((cities) => {
      if (cities.length) setCityOptions(cities.map((city) => city.name));
    }).catch(() => { /* Keep the built-in city list when the API is offline. */ });
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { draft?: MoveDraft; checked?: string[]; expenses?: typeof expenses };
        if (data.draft) setDraft({ ...INITIAL, ...data.draft });
        if (Array.isArray(data.checked)) setChecked(data.checked.filter((id) => TASKS.some((task) => task.id === id)));
        if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        if (typeof (data as { remotePlanId?: unknown }).remotePlanId === "string") setRemotePlanId((data as { remotePlanId: string }).remotePlanId);
        if (typeof (data as { remotePlanType?: unknown }).remotePlanType === "string") setRemotePlanType((data as { remotePlanType: string }).remotePlanType);
      }
    } catch { /* Ignore invalid or unavailable local data. */ }
    setReady(true);
  }, []);

  const total = useMemo(() => expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [expenses]);
  const progress = Math.round((checked.length / TASKS.length) * 100);
  const update = (key: keyof MoveDraft, value: string) => { setDraft((current) => ({ ...current, [key]: value })); setSaved(false); };
  const toggleTask = (id: string) => { setChecked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); setSaved(false); };
  const save = async () => {
    setSaving(true);
    setSynced(false);
    setSaveError("");
    try {
      let nextRemotePlanId = remotePlanId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, checked, expenses, remotePlanId: nextRemotePlanId, remotePlanType, savedAt: new Date().toISOString() }));
      setSaved(true);
      const token = await getAccessToken();
      if (token) {
        try {
          if (!draft.destination.trim()) throw new Error("Choose your destination city to sync this plan.");
          if (!draft.origin.trim()) throw new Error("Enter your starting city or origin country to sync this plan.");
          const payload = {
            title: `${draft.origin || "Origin"} to ${draft.destination}`,
            move_type: draft.moveType as "within_india" | "returning_to_india" | "relocating_to_india",
            origin_city: draft.moveType === "within_india" ? draft.origin.trim() : null,
            origin_country: draft.moveType === "within_india" ? null : draft.origin.trim(),
            destination_city: draft.destination,
            move_date: draft.moveDate || null,
            household_size: Math.max(1, Number.parseInt(draft.household, 10) || 1),
            services: [] as ("packers_movers" | "local_transport" | "storage" | "international_shipping")[],
            notes: [draft.notes.trim(), draft.budget ? `Target budget INR: ${draft.budget}` : ""].filter(Boolean).join("\n") || null,
          };
          const { move_type: _moveType, ...updatePayload } = payload;
          const result = nextRemotePlanId && remotePlanType === draft.moveType
            ? await updateIndiaMovePlan(nextRemotePlanId, updatePayload)
            : await createIndiaMovePlan(payload);
          nextRemotePlanId = result.id;
          setRemotePlanId(result.id);
          setRemotePlanType(draft.moveType);
          setSynced(true);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, checked, expenses, remotePlanId: nextRemotePlanId, remotePlanType: draft.moveType, savedAt: new Date().toISOString() }));
        } catch (syncError) {
          setSaveError(`Saved on this device, but account sync failed: ${syncError instanceof Error ? syncError.message : "Please try again."}`);
        }
      }
    } catch (error) {
      setSaved(false);
      setSaveError(error instanceof Error ? error.message : "Unable to save your plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const download = () => {
    const lines = [
      "BATASARI - YOUR MOVE PLAN", "",
      `Move: ${draft.moveType}`, `From: ${draft.origin || "Not set"}`, `To: ${draft.destination || "Not set"}`,
      `Moving date: ${draft.moveDate || "Not set"}`, `Household: ${draft.household}`, `Home size: ${draft.homeType}`,
      `Budget target (INR): ${draft.budget || "Not set"}`, "", "ESTIMATED COSTS (entered by you)",
      ...expenses.map((item) => `${item.label}: ₹${item.amount || "0"}`), `Total entered: ₹${total.toLocaleString("en-IN")}`,
      "", "CHECKLIST", ...TASKS.map((task) => `[${checked.includes(task.id) ? "x" : " "}] ${task.group}: ${task.title}`),
      "", "Planning aid only. Verify prices, availability and legal requirements with providers and official authorities."
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "batasari-move-plan.txt"; anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/"><span className={styles.brandMark}>ब</span>Batasari</Link>
        <nav aria-label="Planner navigation"><Link href="/india-guide">City guide</Link><Link href="/moving-shipping">Moving help</Link><Link href="/checklist">Checklist</Link></nav>
        <Link className={styles.topAction} href="/categories">My move hub ↗</Link>
      </header>
      <div className={styles.container}>
        <div className={styles.breadcrumb}><Link href="/">Home</Link><span>/</span> Move planner</div>
        <section className={styles.hero}>
          <div><p className={styles.kicker}>YOUR PERSONAL RELOCATION WORKSPACE</p><h1>A calmer move<br /><em>starts with a plan.</em></h1><p className={styles.heroText}>Bring your route, timeline, budget and essential tasks together. Save locally as a guest, or sign in to sync your move details to your account.</p></div>
          <aside className={styles.progressCard}><div className={styles.progressTop}><span>MOVE READINESS</span><strong>{progress}%</strong></div><div className={styles.track}><span style={{ width: `${progress}%` }} /></div><p>{checked.length} of {TASKS.length} tasks completed</p><button type="button" onClick={save} className={styles.saveButton} disabled={saving}>{saving ? "Saving…" : "Save my plan"}</button>{saved && <span className={styles.saved} role="status">{synced ? "Synced to your account and saved on this device ✓" : "Saved on this device ✓"}</span>}{saveError && <span className={styles.saveError} role="alert">{saveError}</span>}</aside>
        </section>

        <section className={styles.section} aria-labelledby="details-heading">
          <div className={styles.sectionTitle}><span>01</span><div><h2 id="details-heading">Your move details</h2><p>Start with the basics. You can update these details any time.</p></div></div>
          <div className={styles.formCard}>
            <label className={styles.field}>Type of move<select value={draft.moveType} onChange={(e) => update("moveType", e.target.value)}><option value="within_india">Moving between Indian cities</option><option value="returning_to_india">Returning to India</option><option value="relocating_to_india">Relocating to India from abroad</option></select></label>
            <label className={styles.field}>{draft.moveType === "within_india" ? "Moving from (city)" : "Moving from (city / country)"}<input value={draft.origin} onChange={(e) => update("origin", e.target.value)} placeholder={draft.moveType === "within_india" ? "e.g. Surat" : "e.g. London, United Kingdom"} /></label>
            <label className={styles.field}>Moving to (Indian city)<select value={draft.destination} onChange={(e) => update("destination", e.target.value)}><option value="">Choose destination</option>{cityOptions.map((city) => <option key={city}>{city}</option>)}</select></label>
            <label className={styles.field}>Expected moving date<input type="date" value={draft.moveDate} onChange={(e) => update("moveDate", e.target.value)} /></label>
            <label className={styles.field}>People moving<select value={draft.household} onChange={(e) => update("household", e.target.value)}>{["1","2","3","4","5","6","7","8+"].map((n) => <option key={n} value={n}>{n} {n === "1" ? "person" : "people"}</option>)}</select></label>
            <label className={styles.field}>Current home size<select value={draft.homeType} onChange={(e) => update("homeType", e.target.value)}>{["Studio","1 BHK","2 BHK","3 BHK","4+ BHK","Not sure"].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label className={styles.field}>Your target budget (₹)<input inputMode="numeric" type="number" min="0" value={draft.budget} onChange={(e) => update("budget", e.target.value)} placeholder="e.g. 75000" /></label>
            <label className={styles.field}>Notes for your move<textarea rows={3} value={draft.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Special items, pets, accessibility needs, timing..." /></label>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="budget-heading">
          <div className={styles.sectionTitle}><span>02</span><div><h2 id="budget-heading">Build your moving budget</h2><p>Enter quotes or your own estimates. Batasari does not invent live market prices.</p></div></div>
          <div className={styles.budgetCard}><div className={styles.expenseList}>{expenses.map((item) => <div className={styles.expenseRow} key={item.id}><label htmlFor={`expense-${item.id}`}>{item.label}</label><div><span>₹</span><input id={`expense-${item.id}`} type="number" min="0" inputMode="numeric" placeholder="0" value={item.amount} onChange={(e) => { setExpenses((current) => current.map((expense) => expense.id === item.id ? { ...expense, amount: e.target.value } : expense)); setSaved(false); }} /></div></div>)}</div><div className={styles.totalBox}><span>Total of your entered estimates</span><strong>₹{total.toLocaleString("en-IN")}</strong>{draft.budget && <small>{total > Number(draft.budget) ? "Your estimates are above your target budget." : `₹${(Number(draft.budget) - total).toLocaleString("en-IN")} remaining against your target.`}</small>}</div></div>
        </section>

        <section className={styles.section} aria-labelledby="checklist-heading">
          <div className={styles.sectionTitle}><span>03</span><div><h2 id="checklist-heading">Your moving checklist</h2><p>Tick off tasks as you complete them. Progress is saved when you save your plan.</p></div></div>
          <div className={styles.taskGrid}>{["Before the move", "Moving week", "After arrival"].map((group) => <div className={styles.taskGroup} key={group}><h3>{group}</h3>{TASKS.filter((task) => task.group === group).map((task) => <label className={`${styles.task} ${checked.includes(task.id) ? styles.taskDone : ""}`} key={task.id}><input type="checkbox" checked={checked.includes(task.id)} onChange={() => toggleTask(task.id)} /><span>{task.title}</span></label>)}</div>)}</div>
        </section>

        <section className={styles.finalCard}><div><p className={styles.kicker}>KEEP YOUR PLAN CLOSE</p><h2>Your next chapter, one step at a time.</h2><p>Save your progress on this device or export a copy to share with your family or moving provider.</p></div><div className={styles.finalActions}><button type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save plan"}</button><button type="button" onClick={download} className={styles.secondaryButton}>Download plan ↓</button></div></section>
        <p className={styles.disclaimer}>Privacy note: your detailed budget and checklist stay in this browser. If you sign in, the move route and basic details are also saved to your Batasari account. Budget figures are your own inputs, not provider quotes. For immigration, visa, OCI and customs matters, confirm current requirements with official authorities.</p>
      </div>
      <footer className={styles.footer}><Link href="/">Batasari</Link><span>Plan thoughtfully. Move confidently.</span><Link href="/privacy-statement">Privacy</Link></footer>
    </main>
  );
}
