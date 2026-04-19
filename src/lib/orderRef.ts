// Excludes visually ambiguous chars: 0, O, 1, I
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderRef(): string {
  let ref = "KP-";
  for (let i = 0; i < 4; i++) {
    ref += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return ref;
}
