"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Download, MapPin, Phone, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mapsUrl, money, moneyExact, one, shortDate, timeLabel } from "@/lib/format";
import {
  EXPENSE_TYPES,
  JOB_STATUSES,
  JOB_TYPES,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  REASONS_FOR_CALL,
  TIME_WINDOWS,
} from "@/lib/constants";
import { can } from "@/lib/permissions";
import { downloadDocument } from "@/lib/pdf";
import PhotoGallery from "@/components/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormGrid, NativeSelect } from "@/components/ui/form-shell";
import { StatusBadge } from "@/components/ui/list-page";

/** Kartë seksioni — e njëjta formë kudo në faqe. */
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  const [expenses, setExpenses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobWorkers, setJobWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [workerId, setWorkerId] = useState("");
  const [etype, setEtype] = useState("material");
  const [edesc, setEdesc] = useState("");
  const [eamount, setEamount] = useState("");
  const [pamount, setPamount] = useState("");
  const [pmethod, setPmethod] = useState("Cash");
  const [ptype, setPtype] = useState("deposit");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [editingVisit, setEditingVisit] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState("");

  // ---- Lejet (SPEC §2, V4) ----
  const seePrice = can(role, "seeJobPrice");
  const seeExpenses = can(role, "seeExpenses");
  const seePayments = can(role, "seePayments");
  const seeProfit = can(role, "seeProfit");
  const seeCommission = can(role, "seeCommission");
  const canSchedule = can(role, "scheduleJobs");
  const canAssignWorkers = can(role, "assignWorkers");
  const canAddExpenses = can(role, "addExpenses");
  const canDeleteExpenses = can(role, "deleteExpenses");
  const canAddPayments = can(role, "addPayments");
  const canDeletePayments = can(role, "deletePayments");
  const canEditPrice = can(role, "editJobPrice");

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    setRole(data?.role ?? null);
    setFullName(data?.full_name ?? "");
  }, []);

  /** Njoftim per adminet kur ndodh dicka e rendesishme. */
  const notifyAdmins = useCallback(
    async (title: string, message: string, type: string) => {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (!admins?.length) return;

      await supabase.from("notifications").insert(
        admins.map((a: any) => ({
          user_id: a.id,
          title,
          message: `${message}${fullName ? ` — by ${fullName}` : ""}`,
          type,
          read: false,
        }))
      );
    },
    [fullName]
  );

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `*,
         clients(id, name, phone, email, zip_code, address),
         salesmen(id, name, salesman_pay(commission_percent)),
         job_financials(profit)`
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      toast.error("Job not found");
      setLoading(false);
      return;
    }

    setJob(data);
    setCancelReason(data.cancel_reason || "");

    // Cdo query me poshte mund te kthehet bosh nga RLS — kjo eshte e pritshme.
    const [ex, pa, wk, jw] = await Promise.all([
      supabase.from("job_expenses").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("job_id", id).order("created_at", { ascending: false }),
      supabase.from("workers").select("*").eq("active", true).order("name"),
      supabase
        .from("job_workers")
        .select("id, worker_id, workers(id, name, phone, role)")
        .eq("job_id", id),
    ]);

    setExpenses(ex.data || []);
    setPayments(pa.data || []);
    setWorkers(wk.data || []);
    setJobWorkers(jw.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProfile();
    load();
  }, [loadProfile, load]);

  // ---------- Veprimet ----------

  async function patchJob(patch: Record<string, unknown>, success: string) {
    const { data, error } = await supabase
      .from("jobs")
      .update(patch)
      .eq("id", id)
      .select("id");

    if (error) {
      toast.error(error.message);
      return false;
    }

    if (!data?.length) {
      toast.error("You do not have permission to change this job.");
      return false;
    }

    toast.success(success);
    load();
    return true;
  }

  async function updateStatus(value: string) {
    const previous = job?.status;
    const ok = await patchJob({ status: value }, `Moved to ${value.replace(/_/g, " ")}`);

    if (ok && previous !== value) {
      notifyAdmins(
        "Job status changed",
        `${one<any>(job.clients)?.name ?? "Client"}: ${previous} → ${value}`,
        "status"
      );
    }
  }

  async function addExpense() {
    if (!eamount || Number(eamount) <= 0) {
      toast.error("Enter an amount above 0.");
      return;
    }

    const { error } = await supabase.from("job_expenses").insert({
      job_id: id,
      type: etype,
      description: edesc,
      amount: Number(eamount),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    // jobs.profit rillogaritet nga nje trigger — mos e shkruaj me dore.
    notifyAdmins(
      "Expense added",
      `${one<any>(job.clients)?.name ?? "Client"} — ${moneyExact(Number(eamount))} (${etype})`,
      "expense"
    );

    setEdesc("");
    setEamount("");
    toast.success("Expense added");
    load();
  }

  async function removeRow(table: string, rowId: string, label: string) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", rowId)
      .select("id");

    setConfirm(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data?.length) {
      toast.error(`You do not have permission to delete ${label}.`);
      return;
    }

    toast.success("Deleted");
    load();
  }

  async function addPayment() {
    if (!pamount || Number(pamount) <= 0) {
      toast.error("Enter an amount above 0.");
      return;
    }

    const isDeposit = ptype === "deposit";

    const { error } = await supabase.from("payments").insert({
      job_id: id,
      client_id: job?.client_id ?? null,
      amount: Number(pamount),
      // Fushat e depozites mbushen vetem kur pagesa ESHTE depozite.
      payment_type: ptype,
      deposit_mode: isDeposit ? "amount" : null,
      deposit_value: isDeposit ? Number(pamount) : null,
      method: pmethod,
      paid_at: new Date().toISOString(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    notifyAdmins(
      "Payment received",
      `${one<any>(job.clients)?.name ?? "Client"} — ${moneyExact(Number(pamount))} (${pmethod})`,
      "payment"
    );

    setPamount("");
    toast.success("Payment recorded");
    load();
  }

  async function addWorker() {
    if (!workerId) return;

    const { error } = await supabase
      .from("job_workers")
      .insert({ job_id: id, worker_id: workerId });

    if (error) {
      toast.error(
        error.code === "23505"
          ? "That worker is already on this job."
          : error.message
      );
      return;
    }

    setWorkerId("");
    toast.success("Worker assigned");
    load();
  }

  async function savePrice() {
    const value = Number(priceDraft);

    if (!priceDraft || Number.isNaN(value) || value < 0) {
      toast.error("Enter a price of 0 or more.");
      return;
    }

    // Trigger-i ne databaze lejon vetem admin/sekretare/manager ta ndryshojne.
    const ok = await patchJob({ total_price: value }, "Price updated");
    if (ok) setEditingPrice(false);
  }

  async function markCommissionPaid() {
    await patchJob(
      {
        salesman_commission_paid: true,
        salesman_commission_paid_at: new Date().toISOString(),
      },
      "Commission marked as paid"
    );
  }

  // ---------- Llogaritjet ----------
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const price = Number(job?.total_price || 0);
  const balance = price - paid;

  /** Pasqyra qe i jepet klientit — zevendeson faturen e vjeter. */
  async function downloadStatement() {
    const { data: settings } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    downloadDocument(settings || {}, {
      kind: "STATEMENT",
      number: `JOB-${String(job.id).slice(0, 8).toUpperCase()}`,
      date: shortDate(job.scheduled_date || job.created_at),
      status: job.status,
      client: client || {},
      items: [
        {
          description:
            [job.reason_for_call, job.job_type].filter(Boolean).join(" · ") ||
            "Roofing work as agreed",
          quantity: 1,
          price,
        },
      ],
      total: price,
      paid,
      notes: job.notes,
      terms: settings?.invoice_terms,
    });
  }

  // SPEC V5/V6: komisioni mbi fitimin bruto; Net = bruto − komision.
  const grossProfit = Number(one<any>(job?.job_financials)?.profit ?? price - expenseTotal);
  const commissionPercent = Number(
    one<any>(one<any>(job?.salesmen)?.salesman_pay)?.commission_percent ?? 0
  );
  const commission = (grossProfit * commissionPercent) / 100;
  const netProfit = grossProfit - commission;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium">Job not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted, or you may not have access to it.
        </p>
        <Button className="mt-4" render={<Link href="/dashboard/jobs" />}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  const client = one<any>(job.clients);
  const salesman = one<any>(job.salesmen);
  const url = mapsUrl(client?.address);

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* ---------- Koka ---------- */}
      <Link
        href="/dashboard/jobs"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Jobs
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {client?.name || "Job"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.reason_for_call || "No reason recorded"}
            {job.job_type ? ` · ${job.job_type}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge value={job.status} />

          <Button variant="outline" size="lg" onClick={downloadStatement}>
            <Download data-icon="inline-start" />
            PDF
          </Button>

          {canSchedule && (
            <div className="w-44">
              <NativeSelect
                value={job.status}
                onChange={(e) => updateStatus(e.target.value)}
                aria-label="Change status"
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
        </div>
      </div>

      {job.status === "cancelled" && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <strong className="block">Cancelled {shortDate(job.cancelled_at)}</strong>
          {job.cancel_reason || "No reason recorded."}
          {canSchedule && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                className="h-8 max-w-xs"
                placeholder="Why was it cancelled?"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  patchJob({ cancel_reason: cancelReason }, "Reason saved")
                }
              >
                Save reason
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- Klienti ---------- */}
        <Card
          title="Client"
          action={
            client?.id && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/dashboard/clients/${client.id}`} />}
              >
                Open client
              </Button>
            )
          }
        >
          <dl>
            <Row label="Name" value={client?.name || "—"} />
            <Row
              label="Phone"
              value={
                client?.phone ? (
                  <a
                    href={`tel:${String(client.phone).replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    <Phone className="size-3.5 text-muted-foreground" />
                    {client.phone}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Row label="Email" value={client?.email || "—"} />
            <Row
              label="Address"
              value={
                url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-right underline-offset-2 hover:underline"
                  >
                    <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                    {client.address}
                  </a>
                ) : (
                  client?.address || "—"
                )
              }
            />
            <Row label="ZIP" value={client?.zip_code || "—"} />
          </dl>
        </Card>

        {/* ---------- Takimi ---------- */}
        <Card
          title="Appointment"
          action={
            canSchedule && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingVisit((v) => !v)}
              >
                {editingVisit ? "Close" : "Edit"}
              </Button>
            )
          }
        >
          {editingVisit ? (
            <VisitEditor job={job} onSave={patchJob} />
          ) : (
            <dl>
              <Row
                label="Date"
                value={
                  job.scheduled_date ? shortDate(job.scheduled_date) : "Not scheduled"
                }
              />
              <Row label="Time" value={timeLabel(job) || "—"} />
              <Row label="Reason" value={job.reason_for_call || "—"} />
              <Row label="Job type" value={job.job_type || "—"} />
              <Row label="Salesman" value={salesman?.name || "Unassigned"} />
            </dl>
          )}

          {job.notes && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
              {job.notes}
            </div>
          )}
        </Card>

        {/* ---------- Financat ---------- */}
        {seePrice && (
          <Card
            title="Financial"
            description={
              seeProfit
                ? "Net profit is gross minus the salesman's commission."
                : undefined
            }
            action={
              canEditPrice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPriceDraft(String(price || ""));
                    setEditingPrice((v) => !v);
                  }}
                >
                  {editingPrice ? "Cancel" : "Set price"}
                </Button>
              )
            }
          >
            {editingPrice && (
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-9 pl-7"
                    placeholder="0.00"
                    value={priceDraft}
                    onChange={(e) => setPriceDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && savePrice()}
                    aria-label="Job price"
                  />
                </div>
                <Button onClick={savePrice}>Save</Button>
              </div>
            )}

            <dl>
              <Row label="Job price" value={money(price)} />

              {seePayments && (
                <>
                  <Row label="Paid" value={money(paid)} />
                  <Row
                    label="Balance"
                    value={
                      <span className={balance > 0 ? "text-destructive" : ""}>
                        {money(balance)}
                      </span>
                    }
                  />
                </>
              )}

              {seeExpenses && <Row label="Expenses" value={money(expenseTotal)} />}

              {seeProfit && (
                <>
                  <Row label="Gross profit" value={money(grossProfit)} />
                  {seeCommission && (
                    <Row
                      label={`Commission (${commissionPercent}%)`}
                      value={money(commission)}
                    />
                  )}
                  <Row
                    label="Net profit"
                    value={
                      <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                        {money(netProfit)}
                      </span>
                    }
                  />
                </>
              )}
            </dl>

            {seeCommission && salesman && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="text-sm">
                  <div className="font-medium">Commission</div>
                  <div className="text-xs text-muted-foreground">
                    {job.salesman_commission_paid
                      ? `Paid ${shortDate(job.salesman_commission_paid_at)}`
                      : "Not paid yet"}
                  </div>
                </div>

                {!job.salesman_commission_paid && (
                  <Button size="sm" onClick={markCommissionPaid}>
                    Mark paid
                  </Button>
                )}
              </div>
            )}
          </Card>
        )}

        {/* ---------- Ekipi ---------- */}
        <Card
          title="Crew"
          description={`${jobWorkers.length} assigned`}
        >
          {canAssignWorkers && (
            <div className="mb-4 flex gap-2">
              <div className="flex-1">
                <NativeSelect
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  aria-label="Add worker"
                >
                  <option value="">Add a worker…</option>
                  {workers
                    .filter(
                      (w) => !jobWorkers.some((jw) => jw.worker_id === w.id)
                    )
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                        {w.role ? ` — ${w.role}` : ""}
                      </option>
                    ))}
                </NativeSelect>
              </div>
              <Button size="lg" onClick={addWorker} disabled={!workerId}>
                <Plus />
              </Button>
            </div>
          )}

          {jobWorkers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nobody assigned yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {jobWorkers.map((jw) => {
                const w = one<any>(jw.workers);
                return (
                  <li
                    key={jw.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{w?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {w?.role || "Crew"} · {w?.phone || "No phone"}
                      </div>
                    </div>

                    {canAssignWorkers &&
                      (confirm === jw.id ? (
                        <span className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeRow("job_workers", jw.id, "crew")}
                          >
                            Remove
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${w?.name}`}
                          onClick={() => setConfirm(jw.id)}
                        >
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      ))}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------- Shpenzimet ---------- */}
      {seeExpenses && (
        <div className="mt-4">
          <Card
            title="Expenses"
            description={`${money(expenseTotal)} total`}
          >
            {canAddExpenses && (
              <FormGrid cols={2} className="mb-4 sm:grid-cols-4">
                <Field label="Type" htmlFor="etype">
                  <NativeSelect
                    id="etype"
                    value={etype}
                    onChange={(e) => setEtype(e.target.value)}
                  >
                    {EXPENSE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t[0].toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field label="Description" htmlFor="edesc" className="sm:col-span-2">
                  <Input
                    id="edesc"
                    className="h-9"
                    placeholder="Shingles, dumpster, crew…"
                    value={edesc}
                    onChange={(e) => setEdesc(e.target.value)}
                  />
                </Field>

                <Field label="Amount" htmlFor="eamount">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="eamount"
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-9 pl-7"
                        value={eamount}
                        onChange={(e) => setEamount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addExpense()}
                      />
                    </div>
                    <Button size="lg" onClick={addExpense}>
                      <Plus />
                    </Button>
                  </div>
                </Field>
              </FormGrid>
            )}

            {expenses.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No expenses recorded.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {expenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {e.description || "No description"}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {e.type || "other"} · {shortDate(e.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {money(e.amount)}
                      </span>

                      {canDeleteExpenses &&
                        (confirm === e.id ? (
                          <span className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                removeRow("job_expenses", e.id, "expenses")
                              }
                            >
                              Delete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirm(null)}
                            >
                              No
                            </Button>
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete expense"
                            onClick={() => setConfirm(e.id)}
                          >
                            <Trash2 className="text-muted-foreground" />
                          </Button>
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ---------- Pagesat ---------- */}
      {seePayments && (
        <div className="mt-4">
          <Card
            title="Payments"
            description={`${money(paid)} received · ${money(balance)} outstanding`}
          >
            {canAddPayments && (
            <FormGrid cols={2} className="mb-4 sm:grid-cols-4">
              <Field label="Type" htmlFor="ptype">
                <NativeSelect
                  id="ptype"
                  value={ptype}
                  onChange={(e) => setPtype(e.target.value)}
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field label="Method" htmlFor="pmethod">
                <NativeSelect
                  id="pmethod"
                  value={pmethod}
                  onChange={(e) => setPmethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field label="Amount" htmlFor="pamount" className="sm:col-span-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="pamount"
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9 pl-7"
                      value={pamount}
                      onChange={(e) => setPamount(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPayment()}
                    />
                  </div>
                  <Button size="lg" onClick={addPayment}>
                    Record
                  </Button>
                </div>
              </Field>
            </FormGrid>
            )}

            {payments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No payments recorded.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize">
                        {p.payment_type || "payment"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.method || "—"} · {shortDate(p.paid_at || p.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {money(p.amount)}
                      </span>

                      {!canDeletePayments ? null : confirm === p.id ? (
                        <span className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeRow("payments", p.id, "payments")}
                          >
                            Delete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirm(null)}
                          >
                            No
                          </Button>
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete payment"
                          onClick={() => setConfirm(p.id)}
                        >
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ---------- Fotot ---------- */}
      <div className="mt-4">
        <Card title="Photos" description="Before, during and after the work.">
          <PhotoGallery jobId={id as string} />
        </Card>
      </div>
    </div>
  );
}

/** Redaktimi i takimit — datë, orë, arsye, lloj. */
function VisitEditor({
  job,
  onSave,
}: {
  job: any;
  onSave: (patch: Record<string, unknown>, msg: string) => Promise<boolean>;
}) {
  const [date, setDate] = useState(job.scheduled_date || "");
  const [mode, setMode] = useState<"window" | "custom">(
    job.scheduled_time ? "custom" : "window"
  );
  const [win, setWin] = useState(job.time_window || "9-11");
  const [custom, setCustom] = useState(
    job.scheduled_time ? String(job.scheduled_time).slice(0, 5) : ""
  );
  const [reason, setReason] = useState(job.reason_for_call || "");
  const [jobType, setJobType] = useState(job.job_type || "");
  const [notes, setNotes] = useState(job.notes || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);

    // Databaza pranon ose interval ose ore te lire, kurre te dyja.
    await onSave(
      {
        scheduled_date: date || null,
        time_window: date && mode === "window" ? win : null,
        scheduled_time: date && mode === "custom" ? custom || null : null,
        reason_for_call: reason || null,
        job_type: jobType || null,
        notes,
      },
      "Appointment updated"
    );

    setSaving(false);
  }

  return (
    <FormGrid>
      <FormGrid cols={2}>
        <Field label="Date" htmlFor="vdate">
          <Input
            id="vdate"
            type="date"
            className="h-9"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field label="Time" htmlFor="vmode">
          <NativeSelect
            id="vmode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "window" | "custom")}
          >
            <option value="window">Standard window</option>
            <option value="custom">Exact time</option>
          </NativeSelect>
        </Field>
      </FormGrid>

      {mode === "window" ? (
        <Field label="Window" htmlFor="vwin">
          <NativeSelect
            id="vwin"
            value={win}
            onChange={(e) => setWin(e.target.value)}
          >
            {TIME_WINDOWS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : (
        <Field label="Exact time" htmlFor="vcustom" className="sm:max-w-[180px]">
          <Input
            id="vcustom"
            type="time"
            className="h-9"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </Field>
      )}

      <FormGrid cols={2}>
        <Field label="Reason for call" htmlFor="vreason">
          <NativeSelect
            id="vreason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">—</option>
            {REASONS_FOR_CALL.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Job type" htmlFor="vtype">
          <NativeSelect
            id="vtype"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            <option value="">—</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </FormGrid>

      <Field label="Note" htmlFor="vnotes">
        <Textarea
          id="vnotes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save appointment"}
        </Button>
      </div>
    </FormGrid>
  );
}
