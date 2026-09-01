"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { money, one, shortDate } from "@/lib/format";
import { EXPENSE_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/form-shell";
import {
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  StatCard,
  Toolbar,
} from "@/components/ui/list-page";

/**
 * Te gjitha shpenzimet e puneve ne nje vend (SPEC §24).
 * Vetem admin dhe manager — RLS-ja e mban kete edhe nese linku shperndahet.
 */
export default function ExpensesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("job_expenses")
      .select(
        "id, description, amount, type, created_at, job_id, jobs(id, total_price, status, clients(name))"
      )
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setRows(data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const text = search.toLowerCase();

  const filtered = rows.filter((r) => {
    const client = one<any>(one<any>(r.jobs)?.clients)?.name || "";
    const day = String(r.created_at).slice(0, 10);

    return (
      (!text ||
        [r.description, r.type, client]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(text)) &&
      (type ? r.type === type : true) &&
      (from ? day >= from : true) &&
      (to ? day <= to : true)
    );
  });

  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  const byType = EXPENSE_TYPES.map((t) => ({
    type: t,
    sum: filtered
      .filter((r) => r.type === t)
      .reduce((s, r) => s + Number(r.amount || 0), 0),
  })).filter((x) => x.sum > 0);

  const columns: Column<any>[] = [
    {
      key: "description",
      header: "Expense",
      primary: true,
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">
            {r.description || "No description"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {one<any>(one<any>(r.jobs)?.clients)?.name || "Unknown client"}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (r) =>
        r.type ? (
          <span className="capitalize">{r.type}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (r) => money(r.amount),
    },
    {
      key: "date",
      header: "Date",
      align: "right",
      hideOnMobile: true,
      cell: (r) => (
        <span className="text-muted-foreground">{shortDate(r.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      actions: true,
      cell: (r) =>
        r.job_id ? (
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/jobs/${r.job_id}`} />}
          >
            Open job
          </Button>
        ) : null,
    },
  ];

  const hasFilters = Boolean(search || type || from || to);

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Everything spent on jobs — materials, labour and the rest."
      />

      {!loading && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={money(total)} />
          {byType.map((t) => (
            <StatCard
              key={t.type}
              label={t.type[0].toUpperCase() + t.type.slice(1)}
              value={money(t.sum)}
            />
          ))}
        </div>
      )}

      <Toolbar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            placeholder="Description, type or client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-40">
          <NativeSelect
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Type"
          >
            <option value="">All types</option>
            {EXPENSE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </NativeSelect>
        </div>

        <Input
          type="date"
          className="h-9 w-full sm:w-40"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From"
        />
        <Input
          type="date"
          className="h-9 w-full sm:w-40"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setType("");
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </Button>
        )}
      </Toolbar>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(r) => r.id}
          empty={
            <EmptyState
              title={hasFilters ? "No expenses match" : "No expenses recorded"}
              hint={
                hasFilters
                  ? "Try clearing the filters."
                  : "Expenses are added from inside a job."
              }
            />
          }
        />
      )}
    </>
  );
}
