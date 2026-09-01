"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { money, one, shortDate, timeLabel } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useRole } from "@/lib/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/list-page";

type Hit = {
  kind: "Client" | "Job" | "Salesman";
  href: string;
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
};

/** Kthen termin ne nje filter PostgREST `or` — pa presje qe e prishin sintaksen. */
function orFilter(term: string, columns: string[]) {
  const safe = term.replace(/[,()]/g, " ").trim();
  return columns.map((c) => `${c}.ilike.%${safe}%`).join(",");
}

function SearchContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") || "";

  const { role } = useRole();
  const seePrice = can(role, "seeJobPrice");

  const [term, setTerm] = useState(initial);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async (raw: string) => {
      const q = raw.trim();

      if (!q) {
        setHits(null);
        return;
      }

      setLoading(true);

      // Filtrimi behet ne databaze — nuk terheqim tabelat e plota ne shfletues.
      const JOB_COLS =
        "id, status, notes, reason_for_call, job_type, total_price, scheduled_date, time_window, scheduled_time";
      const like = `%${q.replace(/[,()]/g, " ").trim()}%`;

      const [clients, jobs, jobsByClient, jobsBySalesman, salesmen] =
        await Promise.all([
          supabase
            .from("clients")
            .select("id, name, phone, email, address, zip_code, salesmen(name)")
            .or(orFilter(q, ["name", "phone", "email", "address", "zip_code"]))
            .limit(25),
          supabase
            .from("jobs")
            .select(`${JOB_COLS}, clients(name), salesmen(name)`)
            .or(orFilter(q, ["status", "notes", "reason_for_call", "job_type"]))
            .limit(25),
          // Emri i klientit rri te tabela tjeter — duhet inner join per ta filtruar.
          supabase
            .from("jobs")
            .select(`${JOB_COLS}, clients!inner(name), salesmen(name)`)
            .ilike("clients.name", like)
            .limit(25),
          supabase
            .from("jobs")
            .select(`${JOB_COLS}, clients(name), salesmen!inner(name)`)
            .ilike("salesmen.name", like)
            .limit(25),
          supabase
            .from("salesmen")
            .select("id, name, phone, email, active")
            .or(orFilter(q, ["name", "phone", "email"]))
            .limit(25),
        ]);

      setLoading(false);

      const failed = [clients, jobs, jobsByClient, jobsBySalesman, salesmen].find(
        (r) => r.error
      );
      if (failed?.error) {
        toast.error(failed.error.message);
        return;
      }

      // Nje pune mund te dale nga disa kerkime — mbaje vetem njehere.
      const allJobs = [
        ...(jobs.data || []),
        ...(jobsByClient.data || []),
        ...(jobsBySalesman.data || []),
      ].filter(
        (j, i, arr) => arr.findIndex((other) => other.id === j.id) === i
      );

      const out: Hit[] = [];

      for (const c of clients.data || []) {
        out.push({
          kind: "Client",
          href: `/dashboard/clients/${c.id}`,
          title: c.name || "Unnamed client",
          subtitle: [c.phone, c.email].filter(Boolean).join(" · ") || "No contact",
          meta:
            [c.address, c.zip_code].filter(Boolean).join(", ") || undefined,
          status: one<any>(c.salesmen)?.name,
        });
      }

      for (const j of allJobs) {
        const when = j.scheduled_date
          ? `${shortDate(j.scheduled_date)} · ${timeLabel(j)}`
          : "Not scheduled";

        out.push({
          kind: "Job",
          href: `/dashboard/jobs/${j.id}`,
          title: one<any>(j.clients)?.name || "Job",
          subtitle: [j.reason_for_call, j.job_type].filter(Boolean).join(" · ") || when,
          meta: [
            when,
            one<any>(j.salesmen)?.name,
            seePrice && j.total_price ? money(j.total_price) : null,
          ]
            .filter(Boolean)
            .join(" · "),
          status: j.status,
        });
      }

      for (const s of salesmen.data || []) {
        out.push({
          kind: "Salesman",
          href: "/dashboard/salesmen",
          title: s.name || "Salesman",
          subtitle: [s.phone, s.email].filter(Boolean).join(" · ") || "No contact",
          status: s.active ? "active" : "inactive",
        });
      }

      setHits(out);
    },
    [seePrice]
  );

  // Nje kerkim direkt nga URL-ja, qe linket te jene te ndashme.
  useEffect(() => {
    if (initial) run(initial);
  }, [initial, run]);

  function submit() {
    const q = term.trim();
    router.replace(q ? `/dashboard/search?q=${encodeURIComponent(q)}` : "/dashboard/search");
    run(q);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Search"
        description="Clients, jobs and salesmen — everything in one place."
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="h-10 pl-9"
            placeholder="Name, phone, address, zip, status…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>
        <Button size="lg" onClick={submit} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      <div className="mt-6">
        {hits === null ? (
          <EmptyState
            title="Type what you remember"
            hint="A phone number, a street, a client's name — any part of it works."
          />
        ) : hits.length === 0 ? (
          <EmptyState
            title={`Nothing matches “${term.trim()}”`}
            hint="Try a shorter piece of the name or number."
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {hits.length} {hits.length === 1 ? "result" : "results"}
            </p>

            <ul className="space-y-2">
              {hits.map((h, i) => (
                <li key={`${h.kind}-${h.href}-${i}`}>
                  <Link
                    href={h.href}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        {h.kind}
                      </div>
                      <div className="mt-0.5 truncate text-sm font-medium">
                        {h.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {h.subtitle}
                      </div>
                      {h.meta && (
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {h.meta}
                        </div>
                      )}
                    </div>

                    {h.status && <StatusBadge value={h.status} />}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-sm text-muted-foreground">Loading…</div>}
    >
      <SearchContent />
    </Suspense>
  );
}
