export const money = (value: unknown) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export const moneyExact = (value: unknown) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

/**
 * Nje `date` i thate ("2026-09-05") lexohet nga JavaScript si mesnate UTC.
 * Ne New Jersey kjo bie nje dite me pare, keshtu qe takimi i 5 shtatorit
 * shfaqej "Sep 4". Duke i shtuar oren e detyrojme te lexohet si ore vendore.
 * Vlerat me ore brenda (created_at) i lem si jane — ato e kane zonen e vet.
 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function toLocalDate(value: unknown) {
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  return new Date(value as string);
}

export const shortDate = (value: unknown) =>
  value
    ? toLocalDate(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

/** Supabase kthen objekt per relacion to-one, por tipet e nxjerrin si array. */
export function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

/** Ora e takimit: interval standard ose ore e lire (SPEC §4). */
export function timeLabel(job: {
  time_window?: string | null;
  scheduled_time?: string | null;
}) {
  if (job.time_window) {
    const [from, to] = job.time_window.split("-").map(Number);
    const fmt = (h: number) =>
      `${h > 12 ? h - 12 : h}${h >= 12 ? "PM" : "AM"}`;
    return `${fmt(from)}–${fmt(to)}`;
  }

  if (job.scheduled_time) {
    const [h, m] = String(job.scheduled_time).split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  return null;
}

/** Link qe hap Google Maps me adresen (SPEC §5). */
export function mapsUrl(address?: string | null) {
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
