"use client";
import { useState } from "react";
import Link from "next/link";
import { RequireSession } from "@/lib/supabase/RequireSession";
import { AppShell } from "@/components/navigation";
import AICopilot from "@/components/copilot/AICopilot";
import { BUILD_ITEMS, type SubItem } from "../data";
import {
  NewcomerIcon,
  NoCreditIcon,
  CosignersIcon,
  BuilderLoanIcon,
  RentIcon,
  MistakesIcon,
} from "../icons";

const ICON_MAP: Record<string, React.ReactNode> = {
  "newcomer-programs": <NewcomerIcon />,
  "no-history": <NoCreditIcon />,
  "cosigners": <CosignersIcon />,
  "builder-loans": <BuilderLoanIcon />,
  "rent-reporting": <RentIcon />,
  "common-mistakes": <MistakesIcon />,
};

function ItemRow({ item, open, onToggle }: { item: SubItem; open: boolean; onToggle: () => void }) {
  return (
    <div className={"bmm-acc-row" + (open ? " bmm-acc-row--open" : "")}>
      <button className="bmm-acc-header" onClick={onToggle} aria-expanded={open}>
        {ICON_MAP[item.id]}
        <div className="bmm-acc-header-text">
          <span className="bmm-acc-title">{item.title}</span>
          {item.subtitle && <span className="bmm-acc-sub">{item.subtitle}</span>}
        </div>
        <span className="bmm-acc-chevron" aria-hidden="true">&#8250;</span>
      </button>
      {open && (
        <div className="bmm-acc-body">
          <div className="bmm-detail">
            {item.links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="bmm-detail-link">{link.label} &#8250;</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PageContent() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen(p => p === id ? null : id);
  return (
    <AppShell activeHref="/finance">
      <div className="fin-page-layout">
        <div className="fin-page-main">
          <Link href="/finance/credit" className="back-link fin-back-link">
            &lt; Credit &amp; Borrowing
          </Link>
          <h1 className="bmm-heading">Build your credit as a newcomer</h1>
          <div className="bmm-acc-list" style={{ marginTop: "24px" }}>
            {BUILD_ITEMS.map((item) => <ItemRow key={item.id} item={item} open={open === item.id} onToggle={() => toggle(item.id)} />)}
          </div>
        </div>
        <aside className="fin-copilot-col"><AICopilot category="Finance" subcategory="Credit and Borrowing" /></aside>
      </div>
    </AppShell>
  );
}

export default function BuildCreditPage() {
  return <RequireSession><PageContent /></RequireSession>;
}

