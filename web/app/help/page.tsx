"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./help.module.css";

const FAQS = [
{question:"What is Batasari?",answer:"Batasari helps you plan a move within India or relocate to India from abroad. It organises moving tasks, city comparisons, useful services and official resources. Confirm prices, availability and legal requirements with the relevant provider or authority."},
{question:"Can I read the FAQ or ask the AI assistant without signing in?",answer:"Yes. The FAQ and public Batasari AI assistant are available without creating an account. Features that save personal plans or profile information may still require sign-in."},
{question:"How do I choose reliable packers and movers?",answer:"Compare at least three written quotations. Check business details, insurance, damage policy, GST invoice, reviews, packing materials, delivery timeline and cancellation terms. Avoid paying the full amount before verifying the provider."},
{question:"Which websites help with household moving and transport?",answer:"You can compare services from Agarwal Packers & Movers, NoBroker Packers & Movers and Porter. Coverage and prices vary by city and item type. Check the final quotation and terms directly; Batasari does not guarantee any provider."},
{question:"How do I change my Aadhaar address?",answer:"Use UIDAI’s official website to check the current online address-update process, accepted documents, fees and eligibility. Never share your Aadhaar OTP. Some updates may require visiting an Aadhaar centre."},
{question:"How do I update my passport address?",answer:"Use the official Passport Seva portal. Check the re-issue process, proof-of-address requirements, appointment availability and fee. Requirements can change, so rely on the official portal."},
{question:"How can I update my driving licence or vehicle address?",answer:"Use the Ministry of Road Transport and Highways’ Parivahan portal and select your state and service. Available online services and documents can differ by state."},
{question:"How do I redirect or track a parcel after moving?",answer:"For India Post shipments, use the official India Post website to track the consignment and contact the relevant post office about available options. Private courier redirection rules vary, so contact the courier through its official website or app."},
{question:"What should I check before renting a home?",answer:"Verify the owner or authorised agent, visit the property, inspect water and electricity, check commute and mobile network, read the complete rent agreement, confirm deposit deductions and maintenance charges, and get receipts. Do not transfer a deposit based only on photos or an unverified listing."},
{question:"Does Batasari guarantee prices, service quality or government approvals?",answer:"No. Batasari is an independent planning guide. Providers set their own prices and terms, and government rules can change. Verify important details with the provider or official authority before making a payment or decision."},
{question:"What if my question is not listed here?",answer:"Open the Batasari AI assistant and ask in plain language about moving checklists, city comparisons, household shifting, documents or settling in. Verify important and time-sensitive information using official sources."}
];
const RESOURCES = [
["UIDAI – Aadhaar services","https://uidai.gov.in/","Official Aadhaar updates and services."],
["Passport Seva","https://www.passportindia.gov.in/","Passport re-issue, address changes and appointments."],
["Parivahan","https://parivahan.gov.in/","Driving licence and vehicle-related services."],
["India Post","https://www.indiapost.gov.in/","Postal services and consignment information."],
["DigiLocker","https://www.digilocker.gov.in/","Access and share eligible digital documents."],
["Voters’ Services Portal","https://voters.eci.gov.in/","Electoral roll and voter detail services."],
["Agarwal Packers & Movers","https://www.agarwalpackers.in/","Household relocation quotations and services."],
["NoBroker Packers & Movers","https://www.nobroker.in/packers-and-movers","Compare household shifting services in supported cities."],
["Porter","https://porter.in/","Local goods transport and mini-truck services in supported cities."]
];

export default function HelpPage() {
const [openIndex,setOpenIndex]=useState<number|null>(0);
return <main className={styles.publicPage}>
<header className={styles.publicHeader}><Link href="/" className={styles.wordmark}>Batasari</Link><nav aria-label="Main navigation"><Link href="/ask">Ask AI</Link><Link href="/login">Sign in</Link></nav></header>
<div className={styles.page}>
<p className={styles.eyebrow}>BATASARI SUPPORT</p><h1>Help &amp; frequently asked questions</h1>
<p className={styles.description}>Clear answers for planning your move, finding services and updating your details. This page is public — you do not need to sign in.</p>
<section className={styles.faqSection} aria-labelledby="faq-heading"><h2 id="faq-heading">Frequently asked questions</h2>
<div className={styles.card} data-testid="faq-accordion">{FAQS.map((item,index)=>{const open=openIndex===index;return <div className={styles.item+" "+(open?styles.itemOpen:"")} key={item.question}>
<button type="button" className={styles.itemButton} aria-expanded={open} aria-controls={"faq-answer-"+index} onClick={()=>setOpenIndex(open?null:index)}><span>{item.question}</span><span aria-hidden="true">{open?"−":"+"}</span></button>
{open&&<div id={"faq-answer-"+index} className={styles.answer}><p>{item.answer}</p></div>}</div>;})}</div></section>
<section className={styles.resources} aria-labelledby="resources-heading"><h2 id="resources-heading">Useful websites for moving and address changes</h2>
<p>Start with official government portals and established service websites. Check coverage, terms and fees directly. Listing a provider does not mean Batasari guarantees or endorses its services.</p>
<div className={styles.resourceGrid}>{RESOURCES.map(([name,url,detail])=><a key={url} href={url} target="_blank" rel="noopener noreferrer"><strong>{name} ↗</strong><span>{detail}</span></a>)}</div></section>
<section className={styles.askCard}><div><h2>Still have a question?</h2><p>Ask the Batasari AI assistant. No account is needed to start.</p></div><Link href="/ask">Ask Batasari AI →</Link></section>
<p className={styles.disclaimer}>Batasari is an independent planning guide, not a government service or moving company. External websites have their own terms and privacy policies. Verify current requirements before acting.</p>
</div></main>;
}
