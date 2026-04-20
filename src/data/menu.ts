export interface DrinkSpecial { label: string; fullName?: string; }

export interface DrinkBase {
  id: string;
  label: string;
  milk: string[];       // 'O' / 'C' — empty = no milk row (e.g. Bandung)
  strength: string[];   // 'Gao' / 'Po' / 'Di Lo'
  sweetness: string[];  // 'Siew Dai' / 'Gah Dai' / 'Kosong'
  temp: string[];       // 'Peng' / 'Pua Sio'
  specials: DrinkSpecial[];
}

export const DRINK_BASES: DrinkBase[] = [
  {
    id: "kopi", label: "Kopi",
    milk: ["O", "C"],
    strength: ["Gao", "Po", "Di Lo"],
    sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
    temp: ["Peng", "Pua Sio"],
    specials: [{ label: "Tarik" }, { label: "Gu You" }, { label: "Ka Dai" }],
  },
  {
    id: "teh", label: "Teh",
    milk: ["O", "C"],
    strength: ["Gao", "Po"],
    sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
    temp: ["Peng", "Pua Sio"],
    specials: [
      { label: "Tarik" },
      { label: "C Peng Special", fullName: "Teh C Peng Special" },
    ],
  },
  {
    id: "teh-halia", label: "Teh Halia",
    milk: ["O", "C"],
    strength: ["Gao"],
    sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
    temp: ["Peng"],
    specials: [{ label: "Tarik" }],
  },
  {
    id: "yuan-yang", label: "Yuan Yang",
    milk: ["O", "C"],
    strength: ["Gao"],
    sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
    temp: ["Peng"],
    specials: [{ label: "Kopi Cham", fullName: "Kopi Cham" }],
  },
  {
    id: "milo", label: "Milo",
    milk: ["C"],
    strength: ["Gao"],
    sweetness: ["Siew Dai", "Gah Dai", "Kosong"],
    temp: ["Peng"],
    specials: [
      { label: "Dinosaur" },
      { label: "Godzilla" },
      { label: "Cino" },
      { label: "Neslo", fullName: "Neslo" },
      { label: "Neslo Peng", fullName: "Neslo Peng" },
      { label: "Tak Giu", fullName: "Tak Giu" },
    ],
  },
  {
    id: "horlicks", label: "Horlicks",
    milk: ["C"],
    strength: ["Gao"],
    sweetness: ["Siew Dai", "Kosong"],
    temp: ["Peng"],
    specials: [{ label: "Dinosaur" }, { label: "Godzilla" }],
  },
  {
    id: "bandung", label: "Bandung",
    milk: [],
    strength: ["Gao"],
    sweetness: ["Siew Dai", "Kosong"],
    temp: ["Peng"],
    specials: [{ label: "Soda" }, { label: "Cincau" }, { label: "Dinosaur" }],
  },
];

export const OTHERS_DRINKS = [
  { name: "Michael Jackson", description: "Soya milk + black grass jelly" },
  { name: "Tiao He", description: "Chinese tea, teabag-style" },
  { name: "Barley", description: "Homemade barley drink (hot)" },
  { name: "Barley Peng", description: "Iced barley" },
  { name: "Soya Cincau", description: "Soya milk + grass jelly" },
  { name: "Lime Juice", description: "Fresh lime juice" },
  { name: "Sng Bao", description: "Frozen drink in plastic bag" },
];
