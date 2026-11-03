/**
 * City/country list backing the ONB-09 search.
 *
 * Moved out of the onboarding page so the screen file stays readable. This is
 * a static demo list, not a geocoding service — ONB-09's suggestions are
 * prefix/substring matches over these strings.
 */

export const MAJOR_CITIES = [
  "New York, USA", "Los Angeles, USA", "Chicago, USA", "Houston, USA", "Toronto, Canada",
  "Vancouver, Canada", "Montreal, Canada", "London, UK", "Manchester, UK", "Birmingham, UK",
  "Paris, France", "Marseille, France", "Berlin, Germany", "Munich, Germany", "Hamburg, Germany",
  "Tokyo, Japan", "Osaka, Japan", "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia",
  "Dubai, UAE", "Abu Dhabi, UAE", "Singapore", "Hong Kong", "Seoul, South Korea",
  "Mumbai, India", "Delhi, India", "Bangalore, India", "Hyderabad, India", "Chennai, India",
  "Sao Paulo, Brazil", "Rio de Janeiro, Brazil", "Mexico City, Mexico", "Guadalajara, Mexico",
  "Cape Town, South Africa", "Johannesburg, South Africa", "Nairobi, Kenya",
  "Amsterdam, Netherlands", "Barcelona, Spain", "Madrid, Spain", "Rome, Italy", "Milan, Italy",
  "Istanbul, Turkey", "Bangkok, Thailand", "Kuala Lumpur, Malaysia", "Jakarta, Indonesia",
  "Bandung, Indonesia", "Surabaya, Indonesia", "Bali, Indonesia",
  "Manila, Philippines", "Auckland, New Zealand", "Dublin, Ireland", "Lisbon, Portugal",
  "Stockholm, Sweden", "Copenhagen, Denmark", "Helsinki, Finland", "Oslo, Norway",
  "Warsaw, Poland", "Prague, Czech Republic", "Vienna, Austria", "Zurich, Switzerland",
  "Brussels, Belgium", "Lagos, Nigeria", "Accra, Ghana", "Cairo, Egypt", "Casablanca, Morocco",
  "Bogota, Colombia", "Lima, Peru", "Santiago, Chile", "Buenos Aires, Argentina",
  "Montevideo, Uruguay", "San Jose, Costa Rica", "Panama City, Panama",
];

const COUNTRY_NAMES = [
  ...new Set(
    MAJOR_CITIES.map((entry) => entry.split(",").slice(1).join(",").trim()).filter(Boolean),
  ),
];

/** Countries first, then "City, Country" — matching ONB-09B's ordering. */
export const PLACE_SUGGESTIONS = [...COUNTRY_NAMES, ...MAJOR_CITIES];

const MAX_SUGGESTIONS = 5;

export function suggestPlaces(query: string, limit = MAX_SUGGESTIONS): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const startsWith: string[] = [];
  const contains: string[] = [];

  for (const place of PLACE_SUGGESTIONS) {
    const lower = place.toLowerCase();
    if (lower.startsWith(needle)) startsWith.push(place);
    else if (lower.includes(needle)) contains.push(place);

    if (startsWith.length >= limit) break;
  }

  return [...startsWith, ...contains].slice(0, limit);
}

