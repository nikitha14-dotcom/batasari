import Week2Nav from "../components/Week2Nav";

const costs = [
  {
    title: "Monthly Rent",
    value: "$2,200",
    description: "Example monthly housing cost",
  },
  {
    title: "Moving Services",
    value: "$500+",
    description: "Example starting estimate",
  },
  {
    title: "Utilities",
    value: "$150+",
    description: "Example monthly estimate",
  },
  {
    title: "Initial Setup",
    value: "$300+",
    description: "Basic household setup",
  },
];

export default function RentPage() {
  return (
    <main className="week2-page">
      <Week2Nav />

      <div className="week2-container">
        <div className="week2-header">
          <p className="week2-eyebrow">KNEWSOONER</p>

          <h1>Rent & Moving Costs</h1>

          <p>
            Get a simple overview of the costs you may need
            to plan for when moving.
          </p>
        </div>

        <section className="week2-cost-grid">
          {costs.map((cost) => (
            <article
              className="week2-cost-card"
              key={cost.title}
            >
              <p>{cost.title}</p>

              <h2>{cost.value}</h2>

              <span>{cost.description}</span>
            </article>
          ))}
        </section>

        <section className="week2-card">
          <div className="week2-section-title">
            <h2>Plan Your Moving Budget</h2>

            <p>
              Housing is only one part of your moving expenses.
              Consider rent, deposits, utilities, transportation
              and initial household costs.
            </p>
          </div>

          <div className="week2-budget-row">
            <div>
              <strong>Housing</strong>
              <span>Rent + deposit</span>
            </div>

            <div>
              <strong>Moving</strong>
              <span>Transport + services</span>
            </div>

            <div>
              <strong>Setup</strong>
              <span>Utilities + essentials</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

