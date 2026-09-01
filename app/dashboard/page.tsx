"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { money, one, shortDate, timeLabel } from "@/lib/format";
import { SOLD_STATUSES } from "@/lib/constants";
import { useSession } from "@/components/SessionProvider";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { StatCard, StatusBadge } from "@/components/ui/list-page";

/** Ngjyrat e statuseve, te njejtat qe perdor StatusBadge. */
const STAGE_COLORS: Record<string, string> = {
  New: "#94a3b8",
  "Estimate Sent": "#60a5fa",
  "Job to do": "#60a5fa",
  Done: "#10b981",
};

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unlinked, setUnlinked] = useState<string | null>(null);

  const [jobs, setJobs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const { profile: me, loading: sessionLoading } = useSession();

  const load = useCallback(async () => {
    if (sessionLoading) return;

    if (!me) {
      setLoading(false);
      return;
    }

    setProfile(me);
    const role = me?.role;

    let query = supabase.from("jobs").select(
      `id, status, total_price, created_at, scheduled_date, scheduled_time,
       time_window, reason_for_call, salesman_id, client_id,
       salesman_commission_paid,
       clients(name, address),
       salesmen(id, name, salesman_pay(commission_percent)),
       job_financials(profit)`
    );

    // Lidhja shites↔login rri te profiles (SPEC V3).
    if (role === "salesman") {
      if (!me?.salesman_id) {
        setUnlinked("salesman");
        setLoading(false);
        return;
      }
      query = query.eq("salesman_id", me.salesman_id);
    }

    if (role === "worker") {
      if (!me?.worker_id) {
        setUnlinked("worker");
        setLoading(false);
        return;
      }

      const { data: mine } = await supabase
        .from("job_workers")
        .select("job_id")
        .eq("worker_id", me.worker_id);

      const ids = (mine || []).map((x: any) => x.job_id);

      if (ids.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      query = query.in("id", ids);
    }

    const [j, e, p] = await Promise.all([
      query.order("created_at", { ascending: false }),
      // Te dyja kthehen bosh nga RLS per rolet qe s'i shohin — kjo pritet.
      supabase.from("job_expenses").select("amount"),
      // Pa limit: i njejti varg perdoret per TOTALIN e paguar.
      // Lista e fundit merret me slice(0, 5) ne render.
      supabase
        .from("payments")
        .select("id, amount, status, method, created_at, paid_at, clients(name)")
        .order("created_at", { ascending: false }),
    ]);

    if (j.error) {
      toast.error(j.error.message);
      setLoading(false);
      return;
    }

    setJobs(j.data || []);
    setExpenses(e.data || []);
    setPayments(p.data || []);
    setLoading(false);
  }, [me, sessionLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const role = profile?.role;
  const seeFinances = can(role, "seeProfit");
  const seePayments = can(role, "seePayments");
  const seeExpenses = can(role, "seeExpenses");
  const seePerformance = can(role, "seeSalesmanPerformance");
  const seePrice = can(role, "seeJobPrice");

  // ---------- Llogaritjet ----------
  const profitOf = (j: any) => Number(one<any>(j.job_financials)?.profit || 0);

  const commissionOf = (j: any) => {
    const pay = one<any>(one<any>(j.salesmen)?.salesman_pay);
    // SPEC V5: komisioni mbi fitimin.
    return (profitOf(j) * Number(pay?.commission_percent ?? 0)) / 100;
  };

  // Shitje quhet vetem puna e mbaruar.
  const sold = jobs.filter((j) =>
    (SOLD_STATUSES as readonly string[]).includes(j.status)
  );

  const revenue = sold.reduce((s, j) => s + Number(j.total_price || 0), 0);
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const grossProfit = sold.reduce((s, j) => s + profitOf(j), 0);
  // SPEC: komisioni i fituar gjithsej, dhe ai qe mbetet per t'u paguar.
  const commissionEarned = sold.reduce((s, j) => s + commissionOf(j), 0);

  const commissionOwed = sold
    .filter((j) => !j.salesman_commission_paid)
    .reduce((s, j) => s + commissionOf(j), 0);

  const netProfit = grossProfit - commissionEarned;

  const stages = [
    ["New", "new"],
    ["Estimate Sent", "estimate_sent"],
    ["Job to do", "scheduled"],
    ["Done", "done"],
  ].map(([label, value]) => ({
    name: label,
    value: jobs.filter((j) => j.status === value).length,
  }));

  const bySalesman = Object.values(
    sold.reduce<Record<string, any>>((acc, j) => {
      const s = one<any>(j.salesmen);
      const key = s?.id || "unassigned";

      acc[key] ||= {
        name: s?.name || "Unassigned",
        jobs: 0,
        sales: 0,
        commission: 0,
        owed: 0,
      };

      acc[key].jobs += 1;
      acc[key].sales += Number(j.total_price || 0);
      acc[key].commission += commissionOf(j);
      if (!j.salesman_commission_paid) acc[key].owed += commissionOf(j);

      return acc;
    }, {})
  ).sort((a: any, b: any) => b.sales - a.sales);

  // Punet e ardhshme — ajo qe i duhet nje punetori a shitesi ne telefon.
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = jobs
    .filter(
      (j) =>
        j.scheduled_date &&
        j.scheduled_date >= today &&
        j.status !== "cancelled"
    )
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    .slice(0, 6);

  const recentJobs = jobs.slice(0, 5);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile?.full_name
            ? `Welcome back, ${String(profile.full_name).split(" ")[0]}`
            : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {seeFinances
            ? "Where the company stands right now."
            : "Your work at a glance."}
        </p>
      </div>

      {unlinked && (
        <div className="mb-6 rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <strong className="mb-1 block">Your account is not linked yet</strong>
          Ask an admin to connect your login to your{" "}
          {unlinked === "salesman" ? "salesman" : "worker"} record in Users →
          Edit. Until then this page has nothing to show you.
        </div>
      )}

      {/* ---------- Financat ---------- */}
      {seeFinances && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Revenue" value={money(revenue)} />
          <StatCard label="Paid" value={money(paid)} />
          <StatCard
            label="Balance"
            value={money(revenue - paid)}
            tone={revenue - paid > 0 ? "negative" : "default"}
          />
          <StatCard label="Expenses" value={money(expenseTotal)} />
          <StatCard label="Commissions earned" value={money(commissionEarned)} />
          <StatCard
            label="Net Profit"
            value={money(netProfit)}
            tone={netProfit >= 0 ? "positive" : "negative"}
          />
          <StatCard
            label="Commissions to pay"
            value={money(commissionOwed)}
            tone={commissionOwed > 0 ? "negative" : "default"}
          />
        </div>
      )}

      {!seeFinances && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="My jobs" value={String(jobs.length)} />
          <StatCard
            label="Job to do"
            value={String(jobs.filter((j) => j.status === "scheduled").length)}
          />
          <StatCard
            label="Done"
            value={String(jobs.filter((j) => j.status === "done").length)}
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ---------- Punet sipas statusit ---------- */}
        <Card
          title="Jobs by status"
          description={`${jobs.length} jobs in total`}
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/jobs" />}
            >
              Open
            </Button>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stages}
                margin={{ top: 8, right: 8, bottom: 8, left: -20 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={54}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stages.map((s) => (
                    <Cell key={s.name} fill={STAGE_COLORS[s.name] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ---------- Takimet e ardhshme ---------- */}
        <Card
          title="Coming up"
          description="Next visits on the calendar"
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/schedule" />}
            >
              Schedule
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing scheduled ahead.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {upcoming.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {one<any>(j.clients)?.name || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {shortDate(j.scheduled_date)}
                      {timeLabel(j) ? ` · ${timeLabel(j)}` : ""}
                      {j.reason_for_call ? ` · ${j.reason_for_call}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge value={j.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/dashboard/jobs/${j.id}`} />}
                    >
                      Open
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ---------- Punet e fundit ---------- */}
        <Card
          title="Recent jobs"
          action={
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/jobs" />}
            >
              All jobs
            </Button>
          }
        >
          {recentJobs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No jobs yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {recentJobs.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {one<any>(j.clients)?.name || "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {one<any>(j.salesmen)?.name || "Unassigned"}
                      {" · "}
                      {shortDate(j.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {seePrice && Number(j.total_price) > 0 && (
                      <span className="text-sm font-medium tabular-nums">
                        {money(j.total_price)}
                      </span>
                    )}
                    <StatusBadge value={j.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ---------- Shitesit / Pagesat ---------- */}
        {seePerformance ? (
          <Card
            title="Salesman performance"
            description="Sold jobs only"
            action={
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/reports" />}
              >
                Reports
              </Button>
            }
          >
            {bySalesman.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing sold yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {bySalesman.map((s: any) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.jobs} {s.jobs === 1 ? "job" : "jobs"}
                      </div>
                    </div>

                    <div className="text-right tabular-nums">
                      <div className="text-sm font-medium">
                        {money(s.sales)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {money(s.commission)} earned
                        {s.owed > 0 && ` · ${money(s.owed)} to pay`}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : seePayments ? (
          <Card
            title="Recent payments"
            action={
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/payments" />}
              >
                All payments
              </Button>
            }
          >
            {payments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No payments recorded.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {payments.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {one<any>(p.clients)?.name || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.method || "—"} ·{" "}
                        {shortDate(p.paid_at || p.created_at)}
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {money(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : (
          <Card title="Your crew view" description="What you can do from here">
            <ul className="grid gap-2">
              {[
                ["See today's visits", "/dashboard/schedule"],
                ["Open your jobs", "/dashboard/jobs"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="lg"
                    render={<Link href={href} />}
                  >
                    {label}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
