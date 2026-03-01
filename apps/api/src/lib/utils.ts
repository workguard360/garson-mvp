import { nanoid } from "nanoid";

export function nowUtc() {
  return new Date();
}

export function addMinutes(d: Date, minutes: number) {
  return new Date(d.getTime() + minutes * 60_000);
}

export function id(prefix: string) {
  return `${prefix}_${nanoid(8)}`;
}

export function shaLikeDemo(token: string) {
  // DEMO: gerçek hash değil. Prod'da sha256 + salt kullan.
  return `hash_${token}`;
}
