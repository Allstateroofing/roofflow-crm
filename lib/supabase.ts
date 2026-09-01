import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!supabaseKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
}

/**
 * Klienti i browser-it.
 *
 * `createBrowserClient` e ruan sesionin ne COOKIES, jo ne localStorage.
 * Kjo eshte arsyeja pse serveri (proxy.ts dhe route handler-at) mund ta
 * lexoje dhe ta verifikoje kush eshte i loguar.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
