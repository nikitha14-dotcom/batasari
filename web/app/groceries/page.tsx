import Week2Nav from "../components/Week2Nav";

const groceryOptions = [
  {
    name: "No Frills",
    type: "Budget Grocery",
    description:
      "Useful for everyday groceries and budget-friendly shopping.",
  },
  {
    name: "FreshCo",
    type: "Grocery Store",
    description:
      "A convenient option for regular food and household shopping.",
  },
  {
    name: "Walmart",
    type: "Supermarket",
    description:
      "Offers groceries, household products and everyday essentials.",
  },
];

export default function GroceriesPage() {
  return (
    <main className="week2-page">
      <Week2Nav />

      <div className="week2-container">
        <div className="week2-header">
          <p className="week2-eyebrow">KNEWSOONER</p>

          <h1>Groceries & Essentials</h1>

          <p>
            Find everyday grocery and household shopping
            options near your new neighbourhood.
          </p>
        </div>

        <section className="week2-card">
          <div className="week2-section-title">
            <h2>Grocery Options</h2>

            <p>
              Example options for your initial moving research.
            </p>
          </div>

          <div className="week2-safety-list">
            {groceryOptions.map((store) => (
              <article
                className="week2-safety-card"
                key={store.name}
              >
                <div>
                  <h3>{store.name}</h3>

                  <p>{store.description}</p>
                </div>

                <span className="week2-safety-level">
                  {store.type}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="week2-info-box">
          <h2>Before moving</h2>

          <ul>
            <li>
              Check grocery stores near your selected
              neighbourhood.
            </li>
            <li>Compare everyday grocery prices.</li>
            <li>
              Consider walking and public transportation
              access.
            </li>
            <li>
              Check availability of essential household
              products.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
