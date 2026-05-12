// Colour marker keyed off a drink-name prefix. Used for visual scanning on
// the orders list and the last-order card. Picked to read on both cream and
// pure-black backgrounds.
export function drinkColor(name: string): string {
  const n = name.toLowerCase();
  if (n.startsWith("yuan yang")) return "#7a4e2a"; // coffee + tea blend
  if (n.startsWith("teh halia")) return "#b06228"; // ginger tea
  if (n.startsWith("kopi"))      return "#6f4e37"; // coffee brown
  if (n.startsWith("teh"))       return "#a86b3a"; // tea tan
  if (n.startsWith("milo"))      return "#2d8a3e"; // milo green
  if (n.startsWith("horlicks"))  return "#a47d3f"; // malted honey
  if (n.startsWith("bandung"))   return "#cb6f8a"; // rose
  return "#a8a29e";                                // stone-400 fallback
}
