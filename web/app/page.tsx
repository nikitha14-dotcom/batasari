import Link from "next/link";

import styles from "./batasari.module.css";

const steps = [
  { number: "01", title: "Tell us about your move", body: "Moving within India, returning, or arriving from abroad? Start with the route that fits you." },
  { number: "02", title: "Make a practical plan", body: "Organise your city research, home move, documents, and arrival tasks in one place." },
  { number: "03", title: "Settle in with confidence", body: "Keep important tasks visible and use official sources for rules that can change." },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/" aria-label="Batasari home"><span className={styles.mark}>ब</span>Batasari</Link>
        <nav className={styles.headerNav} aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <Link href="/login">Log in</Link>
          <Link className={styles.navButton} href="/signup">Get started</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> MADE FOR YOUR NEXT CHAPTER</p>
          <h1>Your move to India,<br /><em>made clearer.</em></h1>
          <p className={styles.lede}>A thoughtful place to plan a move between Indian cities or make a new home in India from abroad.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/signup">Start your move plan <span aria-hidden="true">↗</span></Link>
            <Link className={styles.textButton} href="/categories">Explore the guide <span aria-hidden="true">→</span></Link>
          </div>
          <p className={styles.note}>One plan for the move, the home, and settling in.</p>
        </div>
        <div className={styles.heroArt} aria-label="Illustration of a journey across India" role="img">
          <div className={styles.sun} />
          <div className={styles.route}><span className={styles.routeStart} /><span className={styles.routeEnd}>✦</span></div>
          <div className={`${styles.building} ${styles.buildingOne}`}><i /><i /><i /><i /></div>
          <div className={`${styles.building} ${styles.buildingTwo}`}><i /><i /><i /><i /><i /><i /></div>
          <div className={styles.house}><span /><b /><i /></div>
          <div className={styles.artLabel}><span>YOUR NEXT ADDRESS</span><strong>India, on your terms.</strong></div>
          <div className={styles.artBadge}>✳ &nbsp; A move that feels like yours</div>
        </div>
      </section>

      <section className={styles.audience} aria-label="Who Batasari is for">
        <p>WHEREVER YOU’RE STARTING FROM</p>
        <div><span>↗</span> Moving to India from abroad</div>
        <div><span>⌁</span> Moving between Indian cities</div>
        <div><span>⌂</span> Helping family make the move</div>
      </section>

      <section className={styles.process} id="how-it-works">
        <div className={styles.sectionIntro}><p className={styles.eyebrow}>A LITTLE LESS OVERWHELMING</p><h2>Big move. Clear next steps.</h2><p>Keep the important parts of your move together, from your first decision to your first week in a new city.</p></div>
        <div className={styles.stepGrid}>{steps.map((step) => <article className={styles.stepCard} key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div>
      </section>

      <footer className={styles.footer}><Link className={styles.wordmark} href="/"><span className={styles.mark}>ब</span>Batasari</Link><span>Move with a little more certainty.</span><Link href="/privacy-statement">Privacy</Link></footer>
    </main>
  );
}

