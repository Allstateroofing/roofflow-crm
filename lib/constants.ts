/** Vlerat e perbashketa te CRM-se. Duhet te perputhen me kufizimet ne databaze. */

export const TIME_WINDOWS = [
  { value: "9-11", label: "9:00 – 11:00 AM" },
  { value: "11-13", label: "11:00 AM – 1:00 PM" },
  { value: "13-15", label: "1:00 – 3:00 PM" },
  { value: "15-17", label: "3:00 – 5:00 PM" },
] as const;

/**
 * Vlera `scheduled` mbetet ashtu ne databaze — ndryshon vetem si shfaqet.
 * Keshtu s'ka nevoje per migrim dhe historiku nuk preket.
 */
export const JOB_STATUSES = [
  { value: "new", label: "New" },
  { value: "estimate_sent", label: "Estimate Sent" },
  { value: "scheduled", label: "Job to do" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/**
 * Vetem puna e mbaruar numerohet si shitje, dhe vetem atehere fitohet
 * komisioni. Deri atehere shuma eshte premtim, jo te ardhur.
 */
export const SOLD_STATUSES = ["done"] as const;

export const REASONS_FOR_CALL = [
  "Roof Leak",
  "Roof Repair",
  "Roof Replacement",
  "Chimney Repair",
  "Inspection",
  "Insurance",
  "Estimate",
  "Other",
] as const;

export const JOB_TYPES = [
  "Roof Replacement",
  "Roof Repair",
  "Chimney",
  "Gutters",
  "Skylight",
  "Inspection",
  "Other",
] as const;

export const PHOTO_CATEGORIES = [
  { value: "before", label: "Before" },
  { value: "during", label: "During" },
  { value: "after", label: "After" },
  { value: "other", label: "Other" },
] as const;

export const PAYMENT_METHODS = ["Cash", "Check", "Card", "Bank"] as const;

export const PAYMENT_TYPES = [
  { value: "deposit", label: "Deposit" },
  { value: "progress", label: "Progress" },
  { value: "balance", label: "Balance" },
  { value: "full", label: "Paid in full" },
] as const;

export const EXPENSE_TYPES = ["material", "labor", "dumpster", "other"] as const;

/**
 * Ngjyra e ZIP-it sipas dy shifrave te para — nje zone, nje ngjyre.
 * Kodet qe nuk jane ne liste dalin gri te zbehte, pa ngjyre te vetën.
 */
export const ZIP_TONES: Record<string, string> = {
  "07": "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  "08": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  "17": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  "18": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  "19": "bg-zinc-200 text-zinc-800 border-zinc-400 dark:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-500",
};

/** Dy shifrat e para — grupi me te cilin ngjyroset dhe filtrohet ZIP-i. */
export function zipArea(zip?: string | null) {
  const digits = String(zip ?? "").replace(/\D/g, "");
  return digits.length >= 2 ? digits.slice(0, 2) : "";
}
