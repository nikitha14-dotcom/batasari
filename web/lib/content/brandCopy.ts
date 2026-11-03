/** Replace product names in older content supplied by the content API. */
export function withKnewSoonerBrand(text: string): string {
  return text.replace(/\b(?:Moving Assistant|KnewSooner)\b/g, "Batasari");
}

