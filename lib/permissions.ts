/**
 * Lejet sipas rolit — burimi i vetem i te vertetes ne klient.
 * Kopjon docs/SPEC.md §2 dhe vendimin V4.
 *
 * KUJDES: kjo fsheh vetem UI-ne. Mbrojtja e vertete rri te politikat RLS
 * (supabase/policies.sql) dhe te requireRole() ne server. Nje kontroll ketu
 * pa nje politike perkatese ne databaze nuk mbron asgje.
 */

export type Role = "admin" | "secretary" | "manager" | "salesman" | "worker";

export const ALL_ROLES: Role[] = [
  "admin",
  "secretary",
  "manager",
  "salesman",
  "worker",
];

/** Cfare mund te shohe/beje secili. */
const CAPABILITIES = {
  // ---- Financat ----
  /** Fitimi, komisioni, raportet financiare. Vetem admini (SPEC §18, §20). */
  seeProfit: ["admin"],
  seeCommission: ["admin"],
  seeFinancialReports: ["admin"],
  /** Performanca e shitesve — admini, jo manager-i (SPEC §5, §20). */
  seeSalesmanPerformance: ["admin"],
  /** Pagesat e klientit. */
  seePayments: ["admin", "secretary", "salesman"],
  /** Cmimi i punes. Manager-i e sheh (V4). */
  seeJobPrice: ["admin", "secretary", "manager", "salesman"],
  /** Ndryshimi i cmimit — perputhet me trigger-in fn_guard_commission_columns. */
  editJobPrice: ["admin", "secretary", "manager"],
  /**
   * Shpenzimet dhe pagesat. Shitesi i SHTON nga terreni — blen materialin,
   * merr paren ne dore — por nuk i ndryshon dhe nuk i fshin dot pastaj.
   */
  seeExpenses: ["admin", "manager", "salesman"],
  addExpenses: ["admin", "manager", "salesman"],
  deleteExpenses: ["admin", "manager"],
  addPayments: ["admin", "secretary", "salesman"],
  deletePayments: ["admin"],

  // ---- Klientet dhe shitja ----
  manageClients: ["admin", "secretary"],
  deleteClients: ["admin"],
  /** Caktimi i shitesit — jo sekretarja (SPEC §4). */
  assignSalesman: ["admin", "manager"],
  /**
   * Kush i sheh shitesit e tjere. Nje shites sheh vetem punen e vet, prandaj
   * as lista e kolegeve as filtri sipas tyre nuk kane kuptim per te.
   */
  seeAllSalesmen: ["admin", "secretary", "manager"],
  /** Nxjerrja e listave ne Excel — jo per shitesin dhe punetorin. */
  exportData: ["admin", "secretary", "manager"],

  // ---- Operacionet ----
  scheduleJobs: ["admin", "secretary", "manager"],
  changeJobStatus: ["admin", "secretary", "manager", "salesman", "worker"],
  /** Ekipet — jo sekretarja (SPEC §4). */
  manageWorkers: ["admin", "manager"],
  assignWorkers: ["admin", "manager"],

  // ---- Administrimi ----
  manageUsers: ["admin"],
  manageSalesmen: ["admin"],
  manageSettings: ["admin"],
  managePhotos: ["admin", "secretary", "manager", "salesman", "worker"],
  deletePhotos: ["admin"],
} as const;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: string | null | undefined, what: Capability) {
  if (!role) return false;
  return (CAPABILITIES[what] as readonly string[]).includes(role);
}

/** Menuja anesore, e filtruar sipas rolit (SPEC §24). */
export const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", roles: ALL_ROLES },
  { href: "/dashboard/clients", label: "Clients", icon: "👥", roles: ["admin", "secretary", "manager"] },
  { href: "/dashboard/schedule", label: "Schedule", icon: "📅", roles: ALL_ROLES },
  { href: "/dashboard/jobs", label: "Jobs", icon: "🏗️", roles: ALL_ROLES },
  { href: "/dashboard/payments", label: "Payments", icon: "💳", roles: ["admin", "secretary"] },
  { href: "/dashboard/expenses", label: "Expenses", icon: "🧮", roles: ["admin", "manager"] },
  { href: "/dashboard/reports", label: "Reports", icon: "📈", roles: ["admin"] },
  { href: "/dashboard/search", label: "Search", icon: "🔎", roles: ["admin", "secretary", "manager", "salesman"] },
  { href: "/dashboard/users", label: "Users", icon: "👤", roles: ["admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️", roles: ["admin"] },
] as const;

export function navFor(role: string | null | undefined) {
  if (!role) return [];
  return NAV.filter((item) => (item.roles as readonly string[]).includes(role));
}

/**
 * A e ka nje rol te drejten ta hape kete adrese?
 * Perdor te njejten liste NAV qe ndertoni menyne, qe roja dhe menyja te mos
 * ndahen kurre nga njera-tjetra. Adresat e panjohura i le te kalojne — kjo
 * vendos vetem per faqet qe menyja i njeh.
 *
 * KUJDES: kjo fsheh faqen, nuk mbron te dhenat. Mbrojtja rri te RLS.
 */
/**
 * Faqe qe arrihen me link edhe kur menyja nuk i tregon.
 * Shitesi e hap karteln e nje klienti nga takimi ose puna e vet — por jo
 * listen e plote dhe jo formen e krijimit.
 */
const REACHABLE_WITHOUT_NAV: Record<string, (path: string) => boolean> = {
  salesman: (path) =>
    /^\/dashboard\/clients\/[^/]+$/.test(path) && !path.endsWith("/new"),
};

export function canReach(role: string | null | undefined, pathname: string) {
  if (!role) return false;

  const path = pathname.replace(/\/+$/, "") || "/dashboard";
  if (path === "/dashboard") return true;

  if (REACHABLE_WITHOUT_NAV[role]?.(path)) return true;

  // Merr perputhjen me te gjate: /dashboard/jobs/123 i takon /dashboard/jobs.
  const match = NAV.filter((item) => item.href !== "/dashboard")
    .filter(
      (item) => path === item.href || path.startsWith(item.href + "/")
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (!match) return true;

  return (match.roles as readonly string[]).includes(role);
}
