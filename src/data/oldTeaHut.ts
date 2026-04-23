export type OTHAddOn =
  | "honey" | "lemon" | "lime" | "ginger"
  | "gulaMelaka" | "almond" | "sourPlum" | "miloPowder";

export type OTHEvaMilkType = "full" | "no-nc" | "full-plus-o";
export type OTHIntensityType = "regular" | "extended";

export interface OTHDrink {
  code: string;
  name: string;
  intensity: OTHIntensityType | null;
  evaMilk: OTHEvaMilkType | null;
  addOns: OTHAddOn[];
  icedOnly?: boolean;
}

export interface OTHCategory {
  name: string;
  drinks: OTHDrink[];
}

export const ADD_ON_LABELS: Record<OTHAddOn, string> = {
  honey: "Honey",
  lemon: "Lemon",
  lime: "Lime",
  ginger: "Ginger",
  gulaMelaka: "Gula Melaka",
  almond: "Almond",
  sourPlum: "Sour Plum",
  miloPowder: "Milo Powder",
};

export const INTENSITY_OPTIONS: Record<OTHIntensityType, string[]> = {
  regular:  ["Regular", "Light", "Extra Light", "Strong"],
  extended: ["Regular", "Light", "Extra Light", "Strong", "Extra Strong"],
};

export const EVA_MILK_OPTIONS: Record<OTHEvaMilkType, string[]> = {
  "full":         ["Regular", "No Eva Milk", "Less", "Least", "More", "Extra"],
  "no-nc":        ["Regular", "Less", "Least", "More", "Extra"],
  "full-plus-o":  ["Regular", "No Eva Milk", "Less", "Least", "More", "Extra", "Without Any Milk"],
};

const EVA_MILK_DISPLAY: Record<string, string> = {
  "No Eva Milk":      "No Eva Milk",
  "Less":             "Less Milk",
  "Least":            "Least Milk",
  "More":             "More Milk",
  "Extra":            "Extra Milk",
  "Without Any Milk": "Without Milk",
};

export function composeOTHName(
  drink: OTHDrink,
  intensity: string,
  evaMilk: string,
  addOns: OTHAddOn[],
): string {
  const parts: string[] = [];
  if (intensity !== "Regular") parts.push(intensity);
  if (evaMilk !== "Regular") parts.push(EVA_MILK_DISPLAY[evaMilk] ?? evaMilk);
  for (const a of addOns) parts.push("+" + ADD_ON_LABELS[a]);
  if (parts.length === 0) return drink.name;
  return `${drink.name} (${parts.join(" · ")})`;
}

export const OTH_CATEGORIES: OTHCategory[] = [
  {
    name: "HE-CHÁ Premium Tea Blends",
    drinks: [
      { code: "JS",    name: "Japanese Sencha",            intensity: "regular", evaMilk: null,          addOns: ["honey", "lemon"] },
      { code: "HJS",   name: "Honey Japanese Sencha",       intensity: "regular", evaMilk: null,          addOns: ["lemon"] },
      { code: "HLeJS", name: "Honey Lemon Japanese Sencha", intensity: "regular", evaMilk: null,          addOns: ["lemon"] },
      { code: "OO",    name: "Golden Oolong",               intensity: "regular", evaMilk: null,          addOns: ["honey", "lemon"] },
      { code: "HOO",   name: "Honey Golden Oolong",         intensity: "regular", evaMilk: null,          addOns: ["lemon"] },
      { code: "HLeOO", name: "Honey Lemon Golden Oolong",   intensity: "regular", evaMilk: null,          addOns: ["lemon"] },
    ],
  },
  {
    name: "Coffee",
    drinks: [
      { code: "HKC",  name: "Honey Milk Coffee",      intensity: "extended", evaMilk: "no-nc",       addOns: [] },
      { code: "GMK",  name: "Gula Melaka Milk Coffee", intensity: "extended", evaMilk: "full",        addOns: [] },
      { code: "AK",   name: "Almond Milk Coffee",      intensity: "extended", evaMilk: "full-plus-o", addOns: ["ginger"] },
      { code: "MK",   name: "Milo Coffee",             intensity: "extended", evaMilk: "full-plus-o", addOns: [] },
      { code: "HKO",  name: "Honey Coffee O",          intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "GMKO", name: "Gula Melaka Coffee O",    intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "AKO",  name: "Almond Coffee O",         intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "KO",   name: "Coffee O",                intensity: "extended", evaMilk: null,          addOns: ["honey", "gulaMelaka", "lemon"] },
      { code: "K",    name: "Coffee",                  intensity: "extended", evaMilk: "full",        addOns: [] },
      { code: "KC",   name: "Coffee C",                intensity: "extended", evaMilk: "no-nc",       addOns: [] },
      { code: "YY",   name: "Yuan Yang",               intensity: "extended", evaMilk: "full-plus-o", addOns: [] },
    ],
  },
  {
    name: "Tea",
    drinks: [
      { code: "HTC",  name: "Honey Milk Tea",      intensity: "extended", evaMilk: "no-nc",       addOns: [] },
      { code: "GMT",  name: "Gula Melaka Milk Tea", intensity: "extended", evaMilk: "no-nc",       addOns: [] },
      { code: "GT",   name: "Ginger Milk Tea",      intensity: "extended", evaMilk: "full-plus-o", addOns: ["almond"] },
      { code: "AT",   name: "Almond Milk Tea",      intensity: "extended", evaMilk: "full-plus-o", addOns: ["ginger"] },
      { code: "HTO",  name: "Honey Tea O",          intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "GMTO", name: "Gula Melaka Tea O",    intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "ATO",  name: "Almond Tea O",         intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "GTO",  name: "Ginger Tea O",         intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "LeT",  name: "Lemon Tea",            intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "LiT",  name: "Lime Tea",             intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "HLeT", name: "Honey Lemon Tea",      intensity: "extended", evaMilk: null,          addOns: ["ginger", "lemon", "lime"] },
      { code: "HLiT", name: "Honey Lime Tea",       intensity: "extended", evaMilk: null,          addOns: ["ginger", "lemon", "lime"] },
      { code: "GLeT", name: "Ginger Lemon Tea",     intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "TO",   name: "Tea O",                intensity: "extended", evaMilk: null,          addOns: [] },
      { code: "T",    name: "Tea",                  intensity: "extended", evaMilk: "full",        addOns: ["almond"] },
      { code: "TC",   name: "Tea C",                intensity: "extended", evaMilk: "no-nc",       addOns: [] },
    ],
  },
  {
    name: "Oat Milk Goodness",
    drinks: [
      { code: "OM K",   name: "OMG Oat Coffee",           intensity: null, evaMilk: null, addOns: ["honey", "gulaMelaka"] },
      { code: "OM T",   name: "OMG Oat Tea",              intensity: null, evaMilk: null, addOns: ["honey", "gulaMelaka"] },
      { code: "OM YY",  name: "OMG Oat Yuan Yang",        intensity: null, evaMilk: null, addOns: [] },
      { code: "OM HKC", name: "Honey Oat Coffee",         intensity: null, evaMilk: null, addOns: [] },
      { code: "OM HTC", name: "Honey Oat Tea",            intensity: null, evaMilk: null, addOns: [] },
      { code: "OM GMK", name: "Gula Melaka Oat Coffee",   intensity: null, evaMilk: null, addOns: [] },
      { code: "OM GMT", name: "Gula Melaka Oat Tea",      intensity: null, evaMilk: null, addOns: [] },
    ],
  },
  {
    name: "Sparkling & Refreshers",
    drinks: [
      { code: "*SHLe", name: "Iced Sparkling Honey Lemon",    intensity: null, evaMilk: null, addOns: ["lemon", "lime", "sourPlum"],         icedOnly: true },
      { code: "*SHLi", name: "Iced Sparkling Honey Lime",     intensity: null, evaMilk: null, addOns: ["lemon", "lime", "sourPlum"],         icedOnly: true },
      { code: "*SSP",  name: "Iced Sparkling Sour Plum",      intensity: null, evaMilk: null, addOns: ["lemon", "lime"],                    icedOnly: true },
      { code: "*SH",   name: "Iced Sparkling Honey",          intensity: null, evaMilk: null, addOns: ["lemon", "lime", "sourPlum"],         icedOnly: true },
      { code: "HLe",   name: "Honey Lemon",                   intensity: null, evaMilk: null, addOns: ["ginger", "lemon", "lime"] },
      { code: "HLi",   name: "Honey Lime",                    intensity: null, evaMilk: null, addOns: ["lemon", "lime", "sourPlum"] },
      { code: "HSP",   name: "Honey Sour Plum",               intensity: null, evaMilk: null, addOns: ["lemon", "lime"] },
      { code: "HG",    name: "Honey Ginger",                  intensity: null, evaMilk: null, addOns: ["almond", "lemon"] },
      { code: "HO",    name: "Honey O",                       intensity: null, evaMilk: null, addOns: ["lemon", "lime", "sourPlum"] },
      { code: "GO",    name: "Ginger O",                      intensity: null, evaMilk: null, addOns: ["honey", "almond", "lemon"] },
      { code: "*SLe",  name: "Iced Himalayan Salted Lemon",   intensity: null, evaMilk: null, addOns: ["lemon", "lime", "sourPlum"],         icedOnly: true },
    ],
  },
  {
    name: "Milk",
    drinks: [
      { code: "AM",  name: "Almond Milk",   intensity: null, evaMilk: "full-plus-o", addOns: ["ginger"] },
      { code: "M",   name: "Milo",          intensity: null, evaMilk: "full-plus-o", addOns: [] },
      { code: "*MD", name: "Iced Milo Dino", intensity: null, evaMilk: "full",       addOns: ["miloPowder"], icedOnly: true },
    ],
  },
];
