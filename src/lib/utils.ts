import { nanoid } from "nanoid";

/**
 * Generate a URL-safe slug for a pet profile.
 * Uses nanoid for short, unique, URL-safe IDs.
 */
export function generatePetSlug(): string {
  return nanoid(8);
}

/**
 * Generate a tag activation code.
 * 12-char alphanumeric, uppercase for easy human entry.
 */
export function generateTagCode(): string {
  return nanoid(12).toUpperCase();
}

/**
 * Format a date relative to locale.
 */
export function formatDate(
  date: Date | string,
  locale: string = "pt-BR"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Calculate pet age from birth date.
 */
export function calculatePetAge(
  birthDate: Date | string
): { years: number; months: number } | null {
  if (!birthDate) return null;
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months };
}

/**
 * Hash an IP address for LGPD-compliant click tracking.
 * Uses a simple SHA-256 hash with daily salt.
 */
export async function hashIP(ip: string): Promise<string> {
  const salt = new Date().toISOString().split("T")[0]; // daily rotation
  const data = new TextEncoder().encode(`${ip}:${salt}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get the app URL (with trailing slash removed).
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}
