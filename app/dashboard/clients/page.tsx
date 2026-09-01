"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { exportToExcel } from "@/lib/excel";
import { supabase } from "@/lib/supabase";
import { mapsUrl, one, shortDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { useRole } from "@/lib/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/form-shell";
import {
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  Toolbar,
  ZipBadge,
} from "@/components/ui/list-page";

/**
 * Libri i klienteve. Takimet nuk rrine me ketu — ato shihen te Schedule,
 * dhe puna vete te Jobs. Kjo faqe pergjigjet vetem: kush eshte klienti,
 * ku banon, dhe cili shites e mbulon.
 */
/** Sa kliente ne nje faqe. */
const PAGE_SIZE = 25;

/** "2026-09-01" → fillimi i asaj dite sipas ores vendore. */
const startOfDay = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toISOString();
};

/** Caku i siperm: mesnata e dites tjeter, qe dita e zgjedhur te hyje e plote. */
const startOfNextDay = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day + 1).toISOString();
};

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [salesman, setSalesman] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const { role } = useRole();
  const canAssign = can(role, "assignSalesman");
  // Nje shites sheh vetem klientet e vet — kolona dhe filtri i shitesve
  // do t'i tregonin gjithmone emrin e tij, dhe lista do t'i zbulonte koleget.
  const seeSalesmen = can(role, "seeAllSalesmen");
  const canExport = can(role, "exportData");

  const load = useCallback(async () => {
    setLoading(true);

    // Filtrimi dhe prerja behen ne DATABAZE. Me mijera kliente, terheqja e
    // gjithe tabeles per ta filtruar ne shfletues ngarkon serverin kot dhe
    // e ngadaleson faqen ne menyre qe rritet bashke me numrin e klienteve.
    let query = supabase
      .from("clients")
      .select(
        "id, name, phone, email, address, zip_code, created_at, salesman_id, salesmen(id, name)",
        { count: "exact" }
      );

    const text = term.trim().replace(/[,()]/g, " ").trim();
    if (text) {
      const like = `%${text}%`;
      query = query.or(
        ["name", "phone", "email", "address", "zip_code"]
          .map((c) => `${c}.ilike.${like}`)
          .join(",")
      );
    }

    // Datat vijne si dita vendore; kthehen ne caqe te sakta qe dita e fundit
    // te hyje e plote, pa e prere ne mesnate sipas ores se Grinuicit.
    if (from) query = query.gte("created_at", startOfDay(from));
    if (to) query = query.lt("created_at", startOfNextDay(to));

    if (salesman === "none") query = query.is("salesman_id", null);
    else if (salesman) query = query.eq("salesman_id", salesman);

    const offset = page * PAGE_SIZE;

    const [c, s] = await Promise.all([
      query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
      seeSalesmen
        ? supabase
            .from("salesmen")
            .select("id, name")
            .eq("active", true)
            .order("name")
        : Promise.resolve({ data: [], error: null }),
    ]);

    setLoading(false);

    if (c.error) {
      toast.error(c.error.message);
      return;
    }

    setClients(c.data || []);
    setTotal(c.count || 0);
    setSalesmen(s.data || []);
  }, [term, salesman, from, to, page, seeSalesmen]);

  // Shkrimi ne kutine e kerkimit nuk godet serverin per cdo shkronje.
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search);
      setPage(0);
    }, 350);

    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  /** Caktimi i shitesit behet aty ku eshte klienti, pa hapur faqe tjeter. */
  async function assign(clientId: string, salesmanId: string) {
    const { data, error } = await supabase
      .from("clients")
      .update({ salesman_id: salesmanId || null })
      .eq("id", clientId)
      .select("id");

    if (error) {
      toast.error(error.message);
      return;
    }

    // RLS e ndalon shkrimin duke kthyer zero rreshta, jo nje gabim.
    if (!data?.length) {
      toast.error("You do not have permission to assign salesmen.");
      return;
    }

    toast.success(salesmanId ? "Salesman assigned" : "Salesman cleared");
    load();
  }

  // Rreshtat vijne tashme te filtruar nga databaza.
  const filtered = clients;

  const hasFilters = Boolean(search || salesman || from || to);
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Client",
      primary: true,
      cell: (c) => {
        const url = mapsUrl(c.address);
        return (
          <div className="min-w-0">
            <div className="truncate font-medium">{c.name}</div>
            {c.address &&
              (url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  <MapPin className="size-3 shrink-0" />
                  {c.address}
                </a>
              ) : (
                <span className="truncate text-xs text-muted-foreground">
                  {c.address}
                </span>
              ))}
          </div>
        );
      },
    },
    { key: "phone", header: "Phone", cell: (c) => c.phone || "—" },
    {
      key: "email",
      header: "Email",
      hideOnMobile: true,
      cell: (c) => c.email || "—",
    },
    {
      key: "zip",
      header: "ZIP",
      cell: (c) => <ZipBadge value={c.zip_code} />,
    },
    ...(seeSalesmen
      ? [{
      key: "salesman",
      header: "Salesman",
      cell: (c: any) =>
        canAssign ? (
          <NativeSelect
            className="h-8 min-w-[150px] text-xs"
            value={c.salesman_id || ""}
            onChange={(e) => assign(c.id, e.target.value)}
            aria-label={`Salesman for ${c.name}`}
          >
            <option value="">Unassigned</option>
            {salesmen.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        ) : (
          <span className={one<any>(c.salesmen) ? "" : "text-muted-foreground"}>
            {one<any>(c.salesmen)?.name || "Unassigned"}
          </span>
        ),
        } as Column<any>]
      : []),
    {
      key: "added",
      header: "Added",
      align: "right",
      hideOnMobile: true,
      cell: (c) => (
        <span className="text-muted-foreground">{shortDate(c.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      actions: true,
      cell: (c) => (
        <span className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/clients/${c.id}`} />}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/dashboard/jobs/new?client=${c.id}`} />}
          >
            Book visit
          </Button>
        </span>
      ),
    },
  ];

  function exportRows() {
    const rows = filtered.map((c) => ({
      Name: c.name ?? "",
      Address: c.address ?? "",
      Phone: c.phone ?? "",
      Email: c.email ?? "",
      "ZIP code": c.zip_code ?? "",
      ...(seeSalesmen ? { Salesman: one<any>(c.salesmen)?.name ?? "" } : {}),
      Added: String(c.created_at).slice(0, 10),
    }));

    if (!exportToExcel(rows, "clients")) {
      toast.error("Nothing to export.");
    }
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone in your book, and who covers them."
        action={
          <div className="flex gap-2">
            {canExport && (
              <Button variant="outline" size="lg" onClick={exportRows}>
                <Download data-icon="inline-start" />
                Export
              </Button>
            )}
            <Button render={<Link href="/dashboard/clients/new" />} size="lg">
              <Plus data-icon="inline-start" />
              New Client
            </Button>
          </div>
        }
      />

      <Toolbar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            placeholder="Name, phone, address, email or ZIP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            type="date"
            className="h-9 w-full sm:w-40"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(0); }}
            aria-label="Added from"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            className="h-9 w-full sm:w-40"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(0); }}
            aria-label="Added to"
          />
        </div>

        {seeSalesmen && (
          <div className="w-full sm:w-44">
            <NativeSelect
              value={salesman}
              onChange={(e) => { setSalesman(e.target.value); setPage(0); }}
              aria-label="Filter by salesman"
            >
              <option value="">Any salesman</option>
              <option value="none">Unassigned</option>
              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setSalesman("");
              setFrom("");
              setTo("");
              setPage(0);
            }}
          >
            Clear
          </Button>
        )}

        <span className="text-sm text-muted-foreground">
          {total === 0
            ? "No clients"
            : `${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + filtered.length} of ${total}`}
        </span>
      </Toolbar>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(c) => c.id}
          empty={
            <EmptyState
              title={hasFilters ? "No clients match" : "No clients yet"}
              hint={
                hasFilters
                  ? "Try clearing the filters."
                  : "Add the first one to get started."
              }
              action={
                !hasFilters && (
                  <Button render={<Link href="/dashboard/clients/new" />}>
                    New Client
                  </Button>
                )
              }
            />
          }
        />
      )}

      {lastPage > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {lastPage + 1}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft data-icon="inline-start" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= lastPage || loading}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              Next
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
