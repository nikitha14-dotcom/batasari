import Week2Nav from "../components/Week2Nav";

const safetyAreas = [
  {
    name: "Downtown Toronto",
    level: "Moderate",
    description:
      "Busy urban area with good access to public services.",
  },
  {
    name: "North York",
    level: "Low",
    description:
      "Residential neighbourhood with access to transit and amenities.",
  },
  {
    name: "Scarborough",
    level: "Moderate",
    description:
      "Large residential area with diverse communities and services.",
  },
];

export default function SafetyPage() {
  return (
    <main className="week2-page">
      <Week2Nav />

      <div className="week2-container">
        <div className="week2-header">
          <p className="week2-eyebrow">KNEWSOONER</p>

          <h1>Neighbourhood Safety</h1>

          <p>
            Explore safety information to help you make a more informed
            neighbourhood decision.
          </p>
        </div>

        <section className="week2-card">
          <div className="week2-section-title">
            <h2>Neighbourhood Overview</h2>

            <p>
              Example information for your initial moving research.
            </p>
          </div>

          <div className="week2-safety-list">
            {safetyAreas.map((area) => (
              <article
                className="week2-safety-card"
                key={area.name}
              >
                <div>
                  <h3>{area.name}</h3>

                  <p>{area.description}</p>
                </div>

                <span className="week2-safety-level">
                  {area.level}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="week2-info-box">
          <h2>Before choosing a neighbourhood</h2>

          <ul>
            <li>Check local crime information.</li>
            <li>
              Consider access to public transportation.
            </li>
            <li>
              Look at nearby groceries and essential services.
            </li>
            <li>
              Compare the neighbourhood with your housing budget.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
