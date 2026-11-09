"use client";

import Link from "next/link";
import styles from "./batasari.module.css";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export default function Home() {
  const { t } = useLanguage();
  const steps = [
    { number: "01", title: t("stepOneTitle"), body: t("stepOneBody") },
    { number: "02", title: t("stepTwoTitle"), body: t("stepTwoBody") },
    { number: "03", title: t("stepThreeTitle"), body: t("stepThreeBody") },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="Batasari home"><span className={styles.mark}>ब</span>Batasari</Link>
        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}><LanguageSwitcher compact /><nav className={styles.headerNav} aria-label="Main navigation">
          <a href="#how-it-works">{t("howItWorks")}</a>
          <Link href="/india-guide">{t("cities")}</Link>
          <Link href="/city-compare">{t("compareCities")}</Link>
          <Link href="/moving-shipping">{t("movingHelp")}</Link>
          <Link className={styles.navButton} href="/plan">{t("planMove")}</Link>
        </nav></div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> {t("heroEyebrow")}</p>
          <h1>{t("heroTitle")}<br /><em>{t("heroTitleAccent")}</em></h1>
          <p className={styles.lede}>{t("heroDescription")}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/plan">{t("startPlan")} <span aria-hidden="true">↗</span></Link>
            <Link className={styles.textButton} href="/india-guide">{t("exploreCities")} <span aria-hidden="true">→</span></Link>
          </div>
          <p className={styles.note}>{t("heroNote")}</p>
        </div>
        <div className={styles.heroArt} aria-label={t("addressTagline")} role="img">
          <div className={styles.sun} />
          <div className={styles.route}><span className={styles.routeStart} /><span className={styles.routeEnd}>✦</span></div>
          <div className={`${styles.building} ${styles.buildingOne}`}><i /><i /><i /><i /></div>
          <div className={`${styles.building} ${styles.buildingTwo}`}><i /><i /><i /><i /><i /><i /></div>
          <div className={styles.house}><span /><b /><i /></div>
          <div className={styles.artLabel}><span>{t("nextAddress")}</span><strong>{t("addressTagline")}</strong></div>
          <div className={styles.artBadge}>✳ &nbsp; {t("artBadge")}</div>
        </div>
      </section>

      <section className={styles.audience} aria-label={t("audienceTitle")}>
        <p>{t("audienceTitle")}</p>
        <div><span>↗</span> {t("audienceAbroad")}</div>
        <div><span>⌁</span> {t("audienceCities")}</div>
        <div><span>⌂</span> {t("audienceFamily")}</div>
      </section>

      <section className={styles.process} id="how-it-works">
        <div className={styles.sectionIntro}><p className={styles.eyebrow}>{t("sectionEyebrow")}</p><h2>{t("sectionTitle")}</h2><p>{t("sectionDescription")}</p></div>
        <div className={styles.stepGrid}>{steps.map((step) => <article className={styles.stepCard} key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div>
      </section>

      <footer className={styles.footer}><Link className={styles.wordmark} href="/"><span className={styles.mark}>ब</span>Batasari</Link><span>{t("footerTagline")}</span><Link href="/privacy-statement">{t("privacy")}</Link></footer>
    </main>
  );
}
