// Fuzzy / synonym-aware drink search. Pure client-side: tokenises input,
// expands English-mode synonyms back to the kopitiam terms in the catalogue,
// scores each candidate by best token-match, returns top suggestions.
//
// Designed for typos ("kopi c siu dai pneg"), case/order ("PENG KOPI"),
// EN ↔ SIN synonyms ("iced coffee less sweet" → Kopi Siew Dai Peng),
// and multi-drink chunks ("2 kopi c, 1 teh peng").

export interface Match {
  name: string;
  description: string;
  /** 0–N range; higher = better. Compared between candidates, not absolute. */
  score: number;
}

export interface Chunk {
  qty: number;
  query: string;
}

/**
 * Reverse-synonym map: typed English phrase → kopitiam token(s) that drinks
 * are stored under. Mirrors src/lib/drinkName.ts MODIFIER_TRANSLATIONS plus
 * common everyday variants ("ice", "cold", "strong", "frothy"). Multi-word
 * keys must be matched before single-word ones so "less sweet" beats "less".
 */
const SYNONYMS: ReadonlyArray<readonly [string, string[]]> = [
  // Multi-word first (longest-match wins in expandPhrase below)
  ["less sweet",   ["siew", "dai"]],
  ["extra sweet",  ["gah", "dai"]],
  ["no sugar",     ["kosong"]],
  ["extra strong", ["di", "lo"]],
  ["extra thick",  ["gao"]],
  ["ginger tea",   ["teh", "halia"]],
  ["milk tea",     ["teh"]],
  ["soya milk",    ["soya"]],

  // Single-word EN → SIN
  ["iced",    ["peng"]],
  ["ice",     ["peng"]],
  ["cold",    ["peng"]],
  ["lukewarm",["pua", "sio"]],
  ["warm",    ["pua", "sio"]],
  ["strong",  ["gao"]],
  ["thick",   ["gao"]],
  ["weak",    ["po"]],
  ["pulled",  ["tarik"]],
  ["frothy",  ["tarik"]],
  ["coffee",  ["kopi"]],
  ["tea",     ["teh"]],
  ["ginger",  ["halia"]],

  // Common kopitiam abbreviations people actually type
  ["siu",     ["siew"]],
  ["dino",    ["dinosaur"]],
  ["godz",    ["godzilla"]],
];

/** Lowercase + strip punctuation + tokenise on whitespace. */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Expand multi-word synonym phrases in the input string before tokenisation.
 * Greedy longest-match so "less sweet" becomes the SIN tokens before
 * "less" gets matched alone.
 */
function expandPhrases(s: string): string {
  let out = " " + s.toLowerCase() + " ";
  for (const [phrase, replacement] of SYNONYMS) {
    if (phrase.includes(" ")) {
      const re = new RegExp(`\\s${phrase}\\s`, "gi");
      out = out.replace(re, ` ${replacement.join(" ")} `);
    }
  }
  return out.trim();
}

/** Single-token synonyms after tokenisation. Returns [original, ...synonyms]. */
function expandToken(tok: string): string[] {
  for (const [phrase, repl] of SYNONYMS) {
    if (!phrase.includes(" ") && phrase === tok) return [tok, ...repl];
  }
  return [tok];
}

/**
 * Capped Levenshtein. Returns Infinity if distance > cap (cheap early-exit).
 */
function levenshtein(a: string, b: string, cap: number): number {
  if (Math.abs(a.length - b.length) > cap) return Infinity;
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > cap) return Infinity;
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** 0–1 similarity between two tokens. 1 = exact, 0 = no relation. */
function tokenSimilarity(input: string, target: string): number {
  if (input === target) return 1;
  if (target.startsWith(input) && input.length >= 2) {
    return 0.85 * (input.length / target.length) + 0.15;
  }
  if (input.startsWith(target) && target.length >= 2) {
    return 0.85 * (target.length / input.length) + 0.15;
  }
  const maxLen = Math.max(input.length, target.length);
  // Allow up to 2 edits on short tokens (3-4 chars) — "siu"→"siew",
  // "pneg"→"peng" should both pass. Longer tokens stay tighter.
  const cap = maxLen <= 4 ? 2 : Math.min(3, Math.floor(maxLen / 2));
  const dist = levenshtein(input, target, cap);
  if (!isFinite(dist)) return 0;
  const sim = 1 - dist / maxLen;
  return sim < 0.45 ? 0 : sim;
}

/**
 * Score a drink against tokenised input. Sum of best-match-per-input-token,
 * minus a penalty for drinks that carry extra tokens not represented in
 * the input (so "kopi" doesn't tie with "kopi c siew dai peng").
 */
function scoreDrink(inputTokens: string[], drinkName: string): number {
  const drinkTokens = tokenize(drinkName);
  let score = 0;
  for (const inp of inputTokens) {
    const candidates = expandToken(inp);
    let best = 0;
    for (const cand of candidates) {
      for (const dt of drinkTokens) {
        const s = tokenSimilarity(cand, dt);
        if (s > best) best = s;
      }
    }
    score += best;
  }
  // Penalise drinks with significantly more tokens than the input asked for.
  // Allow one or two extra (the base name has 1-2 tokens that may not be typed).
  const extras = Math.max(0, drinkTokens.length - inputTokens.length);
  score -= extras * 0.25;
  return Math.max(0, score);
}

/**
 * Match an input string against the catalogue. Returns up to `limit` drinks
 * sorted by score; filters out matches below 50% of the top score, so a
 * very strong match doesn't get diluted by weak ones.
 */
export function searchDrinks(
  input: string,
  catalogue: ReadonlyArray<{ name: string; description: string }>,
  limit = 5
): Match[] {
  const expanded = expandPhrases(input);
  const inputTokens = tokenize(expanded);
  if (!inputTokens.length) return [];

  const scored = catalogue.map((d) => ({
    name: d.name,
    description: d.description,
    score: scoreDrink(inputTokens, d.name),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? 0;
  if (top < 0.5) return []; // nothing convincing
  const threshold = Math.max(0.5, top * 0.5);
  return scored.filter((s) => s.score >= threshold).slice(0, limit);
}

/** English number words → integer. Covers the realistic typing range. */
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12,
  // Tolerate common single-letter shorthands
  a: 1, an: 1,
};

/**
 * Parse multi-drink input. "2 kopi c, 1 teh peng" → two chunks. Recognised
 * separators: comma, "and", "+", "&". Leading qty can be either a digit
 * ("2 kopi") or an English number word ("two kopi", "a teh"). No separator
 * → single chunk with qty 1.
 */
export function parseChunks(input: string): Chunk[] {
  const parts = input
    .split(/\s*,\s*|\s+and\s+|\s*\+\s*|\s*&\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((part) => {
    // Digit prefix
    const digit = part.match(/^(\d+)\s*(?:x\s+|×\s+)?(.+)$/i);
    if (digit) {
      const qty = Math.min(99, Math.max(1, parseInt(digit[1], 10)));
      return { qty, query: digit[2].trim() };
    }
    // Word prefix ("two kopi c", "a teh peng")
    const word = part.match(/^(\w+)\s+(.+)$/);
    if (word) {
      const key = word[1].toLowerCase();
      if (key in NUMBER_WORDS) {
        return { qty: NUMBER_WORDS[key], query: word[2].trim() };
      }
    }
    return { qty: 1, query: part };
  });
}

