"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Download, Plus, Search } from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { supabase } from "@/lib/supabase";
import { money, one, shortDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useSession } from "@/components/SessionProvider";

/**
 * Kjo faqe eshte vetem per punen e shitur. Telefonatat, ofertat dhe te
 * anulluarat rrine te Schedule ose te kartela e klientit — ketu nuk duken.
 */
const WORK_STATUSES = ["scheduled", "done"];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/form-shell";
import {
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Toolbar,
} from "@/components/ui/list-page";

const TIME_SLOTS = ["09:00", "11:00", "13:00", "14:00", "15:30"];

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Roli vjen nga sesioni i perbashket — pa kerkese te vetën.
  const { profile } = useSession();

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, status, scheduled_date, scheduled_time, time_window, total_price, created_at, reason_for_call, job_type, clients(name, phone, zip_code), salesmen(name)"
      )
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setJobs(data || []);
  }

  async function deleteJob(id: string) {
    const { error } = await supabase.from("jobs").delete().eq("id", id);

    setConfirmId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Job deleted");
    await loadJobs();
  }

  const filtered = jobs.filter((job) => {
    const client = one<any>(job.clients);
    const salesman = one<any>(job.salesmen);

    const text = [client?.name, client?.phone, salesman?.name, job.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      WORK_STATUSES.includes(job.status) &&
      (date ? job.scheduled_date === date : true) &&
      (time ? String(job.scheduled_time || "").startsWith(time) : true)
    );
  });

  const isAdmin = profile?.role === "admin";
  const canExport = can(profile?.role, "exportData");
  const seeSalesmen = can(profile?.role, "seeAllSalesmen");

  function exportRows() {
    const rows = filtered.map((job) => ({
      Client: one<any>(job.clients)?.name ?? "",
      Phone: one<any>(job.clients)?.phone ?? "",
      ...(seeSalesmen
        ? { Salesman: one<any>(job.salesmen)?.name ?? "" }
        : {}),
      Date: job.scheduled_date ?? "",
      Time: job.time_window ?? job.scheduled_time ?? "",
      Status: job.status ?? "",
      Reason: job.reason_for_call ?? "",
      "Job type": job.job_type ?? "",
      Total: Number(job.total_price || 0),
    }));

    if (!exportToExcel(rows, "jobs")) toast.error("Nothing to export.");
  }
  const hasFilters = Boolean(search || date || time);

  const columns: Column<any>[] = [
    {
      key: "client",
      header: "Client",
      primary: true,
      cell: (job) => {
        const client = one<any>(job.clients);
        return (
          <div className="min-w-0">
            <div className="truncate font-medium">{client?.name || "—"}</div>
            <div className="truncate text-xs text-muted-foreground">
              {client?.phone || "No phone"}
            </div>
          </div>
        );
      },
    },
    // Shitesit i dalin vetem punet e veta — kolona do t'i perseriste emrin.
    ...(seeSalesmen
      ? [{
          key: "salesman",
          header: "Salesman",
          cell: (job: any) =>
            one<any>(job.salesmen)?.name ?? (
              <span className="text-muted-foreground">Unassigned</span>
            ),
        } as Column<any>]
      : []),
    {
      key: "status",
      header: "Status",
      cell: (job) => <StatusBadge value={job.status || "New"} />,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      cell: (job) => money(job.total_price),
    },
    {
      key: "scheduled",
      header: "Scheduled",
      align: "right",
      cell: (job) =>
        job.scheduled_date ? (
          <span>
            {shortDate(job.scheduled_date)}
            {job.scheduled_time && (
              <span className="ml-1.5 text-muted-foreground">
                {String(job.scheduled_time).slice(0, 5)}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">Not scheduled</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      actions: true,
      cell: (job) =>
        confirmId === job.id ? (
          <span className="flex items-center justify-end gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteJob(job.id)}
            >
              Confirm
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
          </span>
        ) : (
          <span className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/dashboard/jobs/${job.id}`} />}
            >
              View
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmId(job.id)}
              >
                Delete
              </Button>
            )}
          </span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Jobs"
        description={`${filtered.length} sold — to do or finished.`}
        action={
          <div className="flex gap-2">
            {canExport && (
              <Button variant="outline" size="lg" onClick={exportRows}>
                <Download data-icon="inline-start" />
                Export
              </Button>
            )}
            <Button render={<Link href="/dashboard/jobs/new" />} size="lg">
              <Plus data-icon="inline-start" />
              New Job
            </Button>
          </div>
        }
      />

      <Toolbar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            placeholder="Client, phone or salesman…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Input
          type="date"
          className="h-9 w-full sm:w-40"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Filter by date"
        />

        <div className="w-full sm:w-32">
          <NativeSelect
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Filter by time"
          >
            <option value="">All times</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setDate("");
              setTime("");
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
          getKey={(job) => job.id}
          empty={
            <EmptyState
              title={hasFilters ? "No jobs match" : "No jobs yet"}
              hint={
                hasFilters
                  ? "Try clearing the filters."
                  : "Create a job from a client's page."
              }
            />
          }
        />
      )}
    </>
  );
}
