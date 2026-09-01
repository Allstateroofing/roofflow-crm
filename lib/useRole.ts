"use client";

import { useSession } from "@/components/SessionProvider";

/**
 * Roli i perdoruesit aktual, per te fshehur veprimet qe RLS-ja s'do t'i lejonte.
 * Lexon nga sesioni i perbashket — nuk ben kerkese te vetën, ndaj nje faqe me
 * disa komponente qe e therrasin nuk paguan disa here per te njejten pergjigje.
 */
export function useRole() {
  const { role, loading } = useSession();

  return { role, isAdmin: role === "admin", loading };
}
