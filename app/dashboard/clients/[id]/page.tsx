"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, MapPin, Phone, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mapsUrl, money, one, shortDate, timeLabel } from "@/lib/format";
import { SOLD_STATUSES } from "@/lib/constants";
import { can, canReach } from "@/lib/permissions";
import { useRole } from "@/lib/useRole";
import PhotoGallery from "@/components/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormGrid } from "@/components/ui/form-shell";
import { StatusBadge } from "@/components/ui/list-page";

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

/** Kuti informacioni si te SPEC §25 — etiketë sipër, vlerë e madhe poshtë. */
function InfoBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium break-words">{children}</div>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [client, setClient] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");

  const { role } = useRole();
  const canEdit = can(role, "manageClients");
  const canSeePayments = can(role, "seePayments");
  const canSeePrice = can(role, "seeJobPrice");
  const canDelete = can(role, "deleteClients");

  // Shitesi nuk e ka listen e klienteve — kthehu aty nga ku erdhi vertet.
  const backHref = canReach(role, "/dashboard/clients")
    ? "/dashboard/clients"
    : "/dashboard/schedule";
  const backLabel = backHref === "/dashboard/clients" ? "Clients" : "Schedule";

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast.error(error?.message || "Client not found");
      setLoading(false);
      return;
    }

    setClient(data);
    setName(data.name || "");
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setAddress(data.address || "");
    setZip(data.zip_code || "");

    const [v, p] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, status, scheduled_date, scheduled_time, time_window, reason_for_call, job_type, notes, total_price, created_at, salesmen!jobs_salesman_id_fkey(name)"
        )
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
    ]);

    setVisits(v.data || []);
    setPayments(p.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveClient() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("clients")
      .update({ name, phone, email, address, zip_code: zip })
      .eq("id", id)
      .select("id");

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data?.length) {
      toast.error("You do not have permission to edit clients.");
      return;
    }

    toast.success("Client saved");
    setEdit(false);
    load();
  }

  /**
   * Fshirja e klientit kaskadon te punet, ofertat dhe fotot, dhe i len
   * pagesat e faturat pa pronar. Prandaj lejohet vetem per nje kartele
   * krejt te zbrazet — nje emer i shtypur gabim ose i dyfishuar.
   */
  async function deleteClient() {
    setDeleting(true);

    const { data, error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .select("id");

    setDeleting(false);
    setConfirmDelete(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data?.length) {
      toast.error("You do not have permission to delete clients.");
      return;
    }

    toast.success("Client deleted");
    router.push(backHref);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium">Client not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted, or you may not have access to it.
        </p>
        <Button className="mt-4" render={<Link href={backHref} />}>
          Back to {backLabel}
        </Button>
      </div>
    );
  }

  const url = mapsUrl(client.address);
  const latest = visits[0];

  // Shitje quhet vetem puna e mbaruar — njesoj si te raportet.
  const totalSold = visits
    .filter((v) => (SOLD_STATUSES as readonly string[]).includes(v.status))
    .reduce((s, v) => s + Number(v.total_price || 0), 0);

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  // Cdo gje qe do te humbte bashke me klientin.
  const blockers = [
    [visits.length, "visit", "visits"],
    [payments.length, "payment", "payments"],
  ]
    .filter(([n]) => Number(n) > 0)
    .map(([n, one, many]) => `${n} ${Number(n) === 1 ? one : many}`);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {visits.length} {visits.length === 1 ? "visit" : "visits"} · client
            since {shortDate(client.created_at)}
          </p>
        </div>

        <Button
          size="lg"
          render={<Link href={`/dashboard/jobs/new?client=${client.id}`} />}
        >
          <Plus data-icon="inline-start" />
          Book Visit
        </Button>
      </div>

      {/* SPEC V2 — telefonata më e fundit në fokus, historiku poshtë. */}
      {latest && (
        <div className="mb-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Latest visit</h2>
            <div className="flex items-center gap-3">
              <StatusBadge value={latest.status} />
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/dashboard/jobs/${latest.id}`} />}
              >
                Open
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox label="Reason">{latest.reason_for_call || "—"}</InfoBox>
            <InfoBox label="When">
              {latest.scheduled_date
                ? `${shortDate(latest.scheduled_date)}${
                    timeLabel(latest) ? ` · ${timeLabel(latest)}` : ""
                  }`
                : "Not scheduled"}
            </InfoBox>
            <InfoBox label="Salesman">
              {one<any>(latest.salesmen)?.name || "Unassigned"}
            </InfoBox>
            {canSeePrice && (
              <InfoBox label="Price">{money(latest.total_price)}</InfoBox>
            )}
          </div>

          {latest.notes && (
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
              {latest.notes}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- Kontakti ---------- */}
        <Card
          title="Contact"
          action={
            canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEdit((v) => !v)}
              >
                {edit ? "Cancel" : "Edit"}
              </Button>
            )
          }
        >
          {edit ? (
            <FormGrid>
              <Field label="Name" htmlFor="name" required>
                <Input
                  id="name"
                  className="h-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <FormGrid cols={2}>
                <Field label="Phone" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    className="h-9"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Field>

                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    className="h-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              </FormGrid>

              <Field label="Address" htmlFor="address">
                <Input
                  id="address"
                  className="h-9"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Field>

              <Field label="ZIP code" htmlFor="zip" className="sm:max-w-[160px]">
                <Input
                  id="zip"
                  className="h-9"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </Field>

              <div className="flex justify-end">
                <Button onClick={saveClient} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </FormGrid>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBox label="Client name">{client.name}</InfoBox>

              <InfoBox label="Phone">
                {client.phone ? (
                  <a
                    href={`tel:${String(client.phone).replace(/[^\d+]/g, "")}`}
                    className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
                  >
                    <Phone className="size-3.5 text-muted-foreground" />
                    {client.phone}
                  </a>
                ) : (
                  "—"
                )}
              </InfoBox>

              <InfoBox label="Email">{client.email || "—"}</InfoBox>

              <InfoBox label="ZIP code">{client.zip_code || "—"}</InfoBox>

              <div className="sm:col-span-2">
                <InfoBox label="Address">
                  {client.address || "—"}
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-normal text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      <MapPin className="size-3.5" />
                      Open in Google Maps
                    </a>
                  )}
                </InfoBox>
              </div>
            </div>
          )}
        </Card>

        {/* ---------- Financat e klientit ---------- */}
        {canSeePrice && (
          <Card
            title="Money"
            description="Across every sold job for this client."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBox label="Sold">{money(totalSold)}</InfoBox>
              {canSeePayments && (
                <>
                  <InfoBox label="Paid">{money(totalPaid)}</InfoBox>
                  <div className="sm:col-span-2">
                    <InfoBox label="Balance">
                      <span
                        className={
                          totalSold - totalPaid > 0 ? "text-destructive" : ""
                        }
                      >
                        {money(totalSold - totalPaid)}
                      </span>
                    </InfoBox>
                  </div>
                </>
              )}
            </div>

            {canSeePayments && payments.length > 0 && (
              <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
                {payments.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium capitalize">
                        {p.payment_type || "payment"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.method || "—"} · {shortDate(p.paid_at || p.created_at)}
                      </div>
                    </div>
                    <span className="font-medium tabular-nums">
                      {money(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {/* ---------- Historiku i vizitave ---------- */}
      <div className="mt-4">
        <Card
          title="Visit history"
          description="Every call and job, newest first."
        >
          {visits.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No visits yet. Book the first one.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {visits.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {v.reason_for_call || "No reason recorded"}
                      </span>
                      <StatusBadge value={v.status} />
                    </div>

                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {v.scheduled_date
                        ? `${shortDate(v.scheduled_date)}${
                            timeLabel(v) ? ` · ${timeLabel(v)}` : ""
                          }`
                        : `Logged ${shortDate(v.created_at)}`}
                      {" · "}
                      {one<any>(v.salesmen)?.name || "Unassigned"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {canSeePrice && Number(v.total_price) > 0 && (
                      <span className="text-sm font-medium tabular-nums">
                        {money(v.total_price)}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/dashboard/jobs/${v.id}`} />}
                    >
                      Open
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------- Fotot e klientit ---------- */}
      <div className="mt-4">
        <Card
          title="Photos"
          description="Photos kept against the client, not a single job."
        >
          <PhotoGallery clientId={client.id} />
        </Card>
      </div>

      {/* ---------- Fshirja ---------- */}
      {canDelete && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Delete client</h2>

          {blockers.length > 0 ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                This client has {blockers.join(", ")}. Deleting them would take
                that history with it, so the record stays.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Cancel the visits instead — they keep the history and drop off
                the schedule.
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                Nothing is attached to this client, so removing them loses
                nothing. This cannot be undone.
              </p>

              <div className="mt-4 flex justify-end">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Delete {client.name}?
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteClient}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting…" : "Yes, delete"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete client
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
