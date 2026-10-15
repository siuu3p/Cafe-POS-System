import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 64).toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest || !/^[a-f0-9]{128}$/i.test(digest)) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(pin, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
