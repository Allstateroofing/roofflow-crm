"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { money, one } from "@/lib/format";
import { JOB_STATUSES, SOLD_STATUSES } from "@/lib/constants";
import { Download } from "lucide-react";
import { exportSheets } from "@/lib/excel";
import { NativeSelect } from "@/components/ui/form-shell";
import { Button } from "@/components/ui/button";
import {
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  Toolbar,
} from "@/components/ui/list-page";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Intervalet e gatshme (SPEC §20). */
function rangeFor(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const today = iso(now);

  if (preset === "today") return { from: today, to: today };

  if (preset === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // e hene
    return { from: iso(start), to: today };
  }

  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: iso(start), to: today };
  }

  return null; // all / custom
}

export default function ReportsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [salesman, setSalesman] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    const [j, e, p] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, status, total_price, created_at, scheduled_date, salesman_commission_paid, clients(name, address), salesmen(id, name, salesman_pay(commission_percent)), job_financials(profit)"
        ),
      supabase.from("job_expenses").select("*"),
      supabase.from("payments").select("*"),
    ]);

    setLoading(false);

    const failed = [j, e, p].find((r) => r.error);
    if (failed?.error) {
      toast.error(failed.error.message);
      return;
    }

    setJobs(j.data || []);
    setExpenses(e.data || []);
    setPayments(p.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Filtrimi ----
  const range = preset === "custom" ? { from, to } : rangeFor(preset);

  const inRange = (value?: string | null) => {
    if (!range || (!range.from && !range.to)) return true;
    if (!value) return false;
    const d = String(value).slice(0, 10);
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  };

  const filteredJobs = jobs.filter(
    (j) =>
      inRange(j.created_at) &&
      (salesman ? one<any>(j.salesmen)?.id === salesman : true) &&
      (status ? j.status === status : true)
  );

  const jobIds = new Set(filteredJobs.map((j) => j.id));
  const filteredExpenses = expenses.filter((e) => jobIds.has(e.job_id));
  const filteredPayments = payments.filter(
    (p) => jobIds.has(p.job_id) || (!p.job_id && inRange(p.created_at))
  );

  // ---- Financat ----
  const profitOf = (j: any) => Number(one<any>(j.job_financials)?.profit || 0);

  const commissionOf = (j: any) => {
    const pay = one<any>(one<any>(j.salesmen)?.salesman_pay);
    // SPEC V5: komisioni mbi fitimin, jo mbi shitjen.
    return (profitOf(j) * Number(pay?.commission_percent ?? 0)) / 100;
  };

  // SPEC V7: shitje jane vetem punet e pranuara e tutje.
  const soldJobs = filteredJobs.filter((j) =>
    (SOLD_STATUSES as readonly string[]).includes(j.status)
  );

  const totalSales = soldJobs.reduce(
    (s, j) => s + Number(j.total_price || 0),
    0
  );

  // Puna e nisur por e pambaruar — para qe pritet, jo te ardhur.
  const pipelineValue = filteredJobs
    .filter((j) => ["new", "estimate_sent", "scheduled"].includes(j.status))
    .reduce((s, j) => s + Number(j.total_price || 0), 0);

  const totalPaid = filteredPayments.reduce(
    (s, p) => s + Number(p.amount || 0),
    0
  );

  const totalExpenses = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const grossProfit = soldJobs.reduce((s, j) => s + profitOf(j), 0);
  const totalCommission = soldJobs.reduce((s, j) => s + commissionOf(j), 0);

  // Sa mbetet per t'u paguar shitesve.
  const commissionOwed = soldJobs
    .filter((j) => !j.salesman_commission_paid)
    .reduce((s, j) => s + commissionOf(j), 0);

  const netProfit = grossProfit - totalCommission;
  const outstanding = totalSales - totalPaid;

  const cancelled = filteredJobs.filter((j) => j.status === "cancelled").length;

  // ---- Raporti sipas shitesit (SPEC §20, vetem admin) ----
  const bySalesman = Object.values(
    soldJobs.reduce<Record<string, any>>((acc, j) => {
      const s = one<any>(j.salesmen);
      const key = s?.id || "unassigned";

      acc[key] ||= {
        name: s?.name || "Unassigned",
        jobs: 0,
        sales: 0,
        profit: 0,
        commission: 0,
        owed: 0,
      };

      acc[key].jobs += 1;
      acc[key].sales += Number(j.total_price || 0);
      acc[key].profit += profitOf(j);
      acc[key].commission += commissionOf(j);
      if (!j.salesman_commission_paid) acc[key].owed += commissionOf(j);

      return acc;
    }, {})
  ).sort((a: any, b: any) => b.sales - a.sales);

  const salesmenOptions = Array.from(
    new Map(
      jobs
        .map((j) => one<any>(j.salesmen))
        .filter(Boolean)
        .map((s: any) => [s.id, s.name])
    )
  );

  const jobColumns: Column<any>[] = [
    {
      key: "client",
      header: "Client",
      primary: true,
      cell: (j) => (
        <div className="min-w-0">
          <div className="truncate font-medium">
            {one<any>(j.clients)?.name || "—"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {one<any>(j.clients)?.address || "No address"}
          </div>
        </div>
      ),
    },
    {
      key: "salesman",
      header: "Salesman",
      cell: (j) => one<any>(j.salesmen)?.name || "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (j) => <StatusBadge value={j.status} />,
    },
    {
      key: "sale",
      header: "Sale",
      align: "right",
      cell: (j) => money(j.total_price),
    },
    {
      key: "profit",
      header: "Gross profit",
      align: "right",
      cell: (j) => (
        <span className="text-muted-foreground">{money(profitOf(j))}</span>
      ),
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      cell: (j) => (
        <span className="text-muted-foreground">{money(commissionOf(j))}</span>
      ),
    },
  ];

  const salesmanColumns: Column<any>[] = [
    {
      key: "name",
      header: "Salesman",
      primary: true,
      cell: (s) => <span className="font-medium">{s.name}</span>,
    },
    { key: "jobs", header: "Jobs", align: "right", cell: (s) => s.jobs },
    { key: "sales", header: "Sales", align: "right", cell: (s) => money(s.sales) },
    {
      key: "profit",
      header: "Gross profit",
      align: "right",
      cell: (s) => money(s.profit),
    },
    {
      key: "commission",
      header: "Earned",
      align: "right",
      cell: (s) => money(s.commission),
    },
    {
      key: "owed",
      header: "To pay",
      align: "right",
      cell: (s) =>
        s.owed > 0 ? (
          <span className="text-destructive">{money(s.owed)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  /** SPEC §21 — tri flete ne nje skedar. */
  function exportAll() {
    const ok = exportSheets(
      [
        {
          name: "Financial",
          rows: [
            {
              "Total Sales": totalSales,
              "Total Payments": totalPaid,
              "Outstanding Balance": outstanding,
              "Total Expenses": totalExpenses,
              "Salesman Commissions": totalCommission,
              "Commissions to pay": commissionOwed,
              "Net Profit": netProfit,
              "Work in hand (not finished)": pipelineValue,
            },
          ],
        },
        {
          name: "By Salesman",
          rows: bySalesman.map((s: any) => ({
            Salesman: s.name,
            Jobs: s.jobs,
            Sales: s.sales,
            "Gross profit": s.profit,
            "Commission earned": s.commission,
            "Commission to pay": s.owed,
          })),
        },
        {
          name: "Jobs",
          rows: filteredJobs.map((j) => ({
            Client: one<any>(j.clients)?.name ?? "",
            Salesman: one<any>(j.salesmen)?.name ?? "",
            Status: j.status,
            Date: j.scheduled_date ?? "",
            Sale: Number(j.total_price || 0),
            "Gross profit": profitOf(j),
            Commission: commissionOf(j),
          })),
        },
      ],
      "report"
    );

    if (!ok) toast.error("Nothing to export.");
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Only finished jobs count as sales — that is when commission is earned."
        action={
          <Button variant="outline" size="lg" onClick={exportAll}>
            <Download data-icon="inline-start" />
            Export
          </Button>
        }
      />

      <Toolbar>
        <div className="w-full sm:w-40">
          <NativeSelect
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            aria-label="Period"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="custom">Custom range</option>
          </NativeSelect>
        </div>

        {preset === "custom" && (
          <>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From"
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To"
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </>
        )}

        <div className="w-full sm:w-44">
          <NativeSelect
            value={salesman}
            onChange={(e) => setSalesman(e.target.value)}
            aria-label="Salesman"
          >
            <option value="">All salesmen</option>
            {salesmenOptions.map(([id, name]) => (
              <option key={id as string} value={id as string}>
                {name as string}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="w-full sm:w-40">
          <NativeSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {JOB_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        {(preset !== "all" || salesman || status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreset("all");
              setFrom("");
              setTo("");
              setSalesman("");
              setStatus("");
            }}
          >
            Clear
          </Button>
        )}
      </Toolbar>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* ---- Rrjedha financiare (SPEC §33) ---- */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total Sales" value={money(totalSales)} />
            <StatCard label="Total Payments" value={money(totalPaid)} />
            <StatCard
              label="Outstanding Balance"
              value={money(outstanding)}
              tone={outstanding > 0 ? "negative" : "default"}
            />
            <StatCard label="Total Expenses" value={money(totalExpenses)} />
            <StatCard
              label="Salesman Commissions"
              value={money(totalCommission)}
            />
            <StatCard
              label="Net Profit"
              value={money(netProfit)}
              tone={netProfit >= 0 ? "positive" : "negative"}
            />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <StatCard
              label="Commissions to pay"
              value={money(commissionOwed)}
              tone={commissionOwed > 0 ? "negative" : "default"}
            />
            <StatCard label="Work in hand (not finished)" value={money(pipelineValue)} />
            <StatCard label="Jobs sold" value={String(soldJobs.length)} />
            <StatCard label="Cancelled" value={String(cancelled)} />
          </div>

          {/* ---- Sipas shitesit ---- */}
          <div className="mt-8">
            <h2 className="mb-4 text-sm font-semibold">
              By Salesman
              <span className="ml-2 font-normal text-muted-foreground">
                sold jobs only
              </span>
            </h2>

            <DataTable
              columns={salesmanColumns}
              rows={bySalesman}
              getKey={(s: any) => s.name}
              empty={
                <EmptyState
                  title="Nothing sold in this period"
                  hint="Try a wider date range."
                />
              }
            />
          </div>

          {/* ---- Punet ---- */}
          <div className="mt-8">
            <h2 className="mb-4 text-sm font-semibold">
              Jobs
              <span className="ml-2 font-normal text-muted-foreground">
                {filteredJobs.length}
              </span>
            </h2>

            <DataTable
              columns={jobColumns}
              rows={filteredJobs}
              getKey={(j) => j.id}
              empty={
                <EmptyState
                  title="No jobs match"
                  hint="Adjust the period or filters."
                />
              }
            />
          </div>
        </>
      )}
    </>
  );
}
