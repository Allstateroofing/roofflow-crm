"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, MapPin, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { can } from "@/lib/permissions";
import { useRole } from "@/lib/useRole";
import { mapsUrl, one, timeLabel } from "@/lib/format";
import { JOB_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/form-shell";
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  Toolbar,
} from "@/components/ui/list-page";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Puna behet e vertete kur pranohet — atehere ka cmim, ekip, foto e pagesa,
 * dhe vetem atehere ka kuptim te hapet faqja e saj.
 */
const REAL_JOB_STATUSES = ["scheduled", "done"];

const longDate = (value: string) =>
  new Date(value + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

/** Dita e punes per dispatch (SPEC §22): kush shkon ku, dhe kur. */
export default function SchedulePage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState(() => iso(new Date()));
  const [days, setDays] = useState(7);
  const [salesman, setSalesman] = useState("");

  const { role } = useRole();
  const canChangeStatus = can(role, "changeJobStatus");
  // Shitesi sheh vetem takimet e veta — filtri do t'i tregonte koleget kot.
  const seeSalesmen = can(role, "seeAllSalesmen");

  const load = useCallback(async () => {
    setLoading(true);

    const end = new Date(from + "T00:00:00");
    end.setDate(end.getDate() + days - 1);

    const [v, s] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, client_id, status, scheduled_date, scheduled_time, time_window, reason_for_call, job_type, notes, clients(name, phone, address), salesmen(name), job_workers(workers(name))"
        )
        .gte("scheduled_date", from)
        .lte("scheduled_date", iso(end))
        .neq("status", "cancelled")
        .order("scheduled_date", { ascending: true }),
      seeSalesmen
        ? supabase
            .from("salesmen")
            .select("id, name")
            .eq("active", true)
            .order("name")
        : Promise.resolve({ data: [], error: null }),
    ]);

    setLoading(false);

    if (v.error) {
      toast.error(v.error.message);
      return;
    }

    setVisits(v.data || []);
    setSalesmen(s.data || []);
  }, [from, days, seeSalesmen]);

  useEffect(() => {
    load();
  }, [load]);

  function shift(by: number) {
    const d = new Date(from + "T00:00:00");
    d.setDate(d.getDate() + by);
    setFrom(iso(d));
  }

  /** Statusi ndryshohet aty ku eshte takimi, pa hapur faqen e punes. */
  async function setStatus(jobId: string, value: string) {
    const { data, error } = await supabase
      .from("jobs")
      .update({ status: value })
      .eq("id", jobId)
      .select("id");

    if (error) {
      toast.error(error.message);
      return;
    }

    // RLS e ndalon shkrimin duke kthyer zero rreshta, jo nje gabim.
    if (!data?.length) {
      toast.error("You do not have permission to change this job.");
      return;
    }

    toast.success(`Moved to ${value.replace(/_/g, " ")}`);
    load();
  }

  const filtered = salesman
    ? visits.filter((v) => one<any>(v.salesmen)?.name === salesman)
    : visits;

  // Grupim sipas dites, ruajtur ne rradhen e query-se.
  const byDay = filtered.reduce<Record<string, any[]>>((acc, v) => {
    (acc[v.scheduled_date] ||= []).push(v);
    return acc;
  }, {});

  const dayKeys = Object.keys(byDay).sort();

  // Brenda dites: intervalet sipas ores se nisjes, pastaj oret e lira.
  const startHour = (v: any) =>
    v.time_window
      ? Number(v.time_window.split("-")[0])
      : v.scheduled_time
        ? Number(String(v.scheduled_time).split(":")[0])
        : 99;

  return (
    <>
      <PageHeader
        title="Schedule"
        description="Who to visit, and when. Cancelled visits are hidden."
      />

      <Toolbar>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous"
            onClick={() => shift(-days)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next"
            onClick={() => shift(days)}
          >
            <ChevronRight />
          </Button>
        </div>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Start date"
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        <div className="w-32">
          <NativeSelect
            value={String(days)}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Range"
          >
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </NativeSelect>
        </div>

        {seeSalesmen && (
          <div className="w-full sm:w-44">
            <NativeSelect
              value={salesman}
              onChange={(e) => setSalesman(e.target.value)}
              aria-label="Filter by salesman"
            >
              <option value="">All salesmen</option>
              {salesmen.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={() => setFrom(iso(new Date()))}>
          Today
        </Button>
      </Toolbar>

      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : dayKeys.length === 0 ? (
        <EmptyState
          title="Nothing booked"
          hint="No visits fall in this range. Try moving the dates."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {dayKeys.map((day) => {
            const rows = [...byDay[day]].sort(
              (a, b) => startHour(a) - startHour(b)
            );

            return (
              <section key={day}>
                <h2 className="mb-3 flex items-baseline gap-2 border-b border-border pb-2">
                  <span className="text-sm font-semibold">{longDate(day)}</span>
                  <span className="text-xs text-muted-foreground">
                    {rows.length} {rows.length === 1 ? "visit" : "visits"}
                  </span>
                </h2>

                <ul className="flex flex-col gap-2">
                  {rows.map((v) => {
                    const client = one<any>(v.clients);
                    const url = mapsUrl(client?.address);
                    const crew = (v.job_workers || [])
                      .map((jw: any) => one<any>(jw.workers)?.name)
                      .filter(Boolean);

                    return (
                      <li
                        key={v.id}
                        className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center"
                      >
                        <div className="text-sm font-semibold tabular-nums">
                          {timeLabel(v) || "Any time"}
                        </div>

                        <div className="min-w-0">
                          <div className="font-medium">
                            {client?.name || "—"}
                          </div>

                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
                              >
                                <MapPin className="size-3" />
                                {client.address}
                              </a>
                            )}

                            {client?.phone && (
                              <a
                                href={`tel:${String(client.phone).replace(/[^\d+]/g, "")}`}
                                className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
                              >
                                <Phone className="size-3" />
                                {client.phone}
                              </a>
                            )}

                            {v.reason_for_call && <span>{v.reason_for_call}</span>}

                            {crew.length > 0 && <span>Crew: {crew.join(", ")}</span>}
                          </div>

                          {v.notes && (
                            <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                              {v.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          {canChangeStatus ? (
                            <NativeSelect
                              className="h-8 min-w-[150px] text-xs"
                              value={v.status}
                              onChange={(e) => setStatus(v.id, e.target.value)}
                              aria-label={`Status for ${client?.name || "visit"}`}
                            >
                              {JOB_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </NativeSelect>
                          ) : (
                            <StatusBadge value={v.status} />
                          )}

                          {/* Kartela e klientit — historiku i telefonatave,
                              foto e kontaktet. Vlen ne cdo faze. */}
                          {v.client_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              render={
                                <Link href={`/dashboard/clients/${v.client_id}`} />
                              }
                            >
                              Client
                            </Button>
                          )}

                          {/* Faqja e punes ka kuptim vetem kur ka cfare te
                              mbahet aty: cmim, ekip, shpenzime, foto. */}
                          {REAL_JOB_STATUSES.includes(v.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              render={<Link href={`/dashboard/jobs/${v.id}`} />}
                            >
                              Open
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
