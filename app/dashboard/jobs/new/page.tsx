"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mapsUrl } from "@/lib/format";
import {
  JOB_STATUSES,
  JOB_TYPES,
  REASONS_FOR_CALL,
  TIME_WINDOWS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FormActions,
  FormGrid,
  FormPage,
  NativeSelect,
} from "@/components/ui/form-shell";

function NewJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client");

  const [client, setClient] = useState<any>(null);

  const [status, setStatus] = useState("new");
  const [reason, setReason] = useState("");
  const [jobType, setJobType] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [timeMode, setTimeMode] = useState<"window" | "custom">("window");
  const [timeWindow, setTimeWindow] = useState("9-11");
  const [customTime, setCustomTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadClient = useCallback(async () => {
    if (!clientId) return;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    setClient(data);
  }, [clientId]);

  useEffect(() => {
    if (clientId) loadClient();
  }, [clientId, loadClient]);

  async function saveJob() {
    if (!client) {
      toast.error("Client not loaded");
      return;
    }

    const next: Record<string, string> = {};
    if (!reason) next.reason = "Pick why they called";
    if (price && Number(price) < 0) next.price = "Price cannot be negative";
    if (timeMode === "custom" && date && !customTime)
      next.time = "Enter the time, or switch to a window";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);

    // Databaza lejon ose interval ose ore te lire, kurre te dyja.
    const { error } = await supabase.from("jobs").insert({
      client_id: client.id,
      status,
      reason_for_call: reason,
      job_type: jobType || null,
      total_price: price ? Number(price) : 0,
      scheduled_date: date || null,
      time_window: date && timeMode === "window" ? timeWindow : null,
      scheduled_time: date && timeMode === "custom" ? customTime : null,
      notes,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Visit booked");
    router.push("/dashboard/clients");
  }

  const address = client?.address;
  const url = mapsUrl(address);

  return (
    <FormPage
      title="Book a Visit"
      description="Every call that leads to a visit becomes a job."
      backHref={clientId ? `/dashboard/clients/${clientId}` : "/dashboard/clients"}
    >
      {client && (
        <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="mb-3 text-sm font-semibold">{client.name}</h2>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Phone:</dt>
              <dd className="font-medium">{client.phone || "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Email:</dt>
              <dd className="font-medium">{client.email || "—"}</dd>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-muted-foreground">Address:</dt>
              <dd className="font-medium">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    <MapPin className="size-3.5" />
                    {address}
                  </a>
                ) : (
                  address || "—"
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {!clientId && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No client selected. Open this from a client to book their visit.
        </div>
      )}

      <FormGrid>
        <FormGrid cols={2}>
          <Field
            label="Reason for call"
            htmlFor="reason"
            required
            error={errors.reason}
          >
            <NativeSelect
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Why did they call?</option>
              {REASONS_FOR_CALL.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Job type" htmlFor="jobType">
            <NativeSelect
              id="jobType"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="">Not decided yet</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </FormGrid>

        <FormGrid cols={2}>
          <Field label="Status" htmlFor="status">
            <NativeSelect
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {JOB_STATUSES.filter((s) => s.value !== "cancelled").map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </FormGrid>

        {/* ---- Takimi ---- */}
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-4 text-sm font-semibold">Appointment</h3>

          <FormGrid>
            <FormGrid cols={2}>
              <Field label="Date" htmlFor="date">
                <Input
                  id="date"
                  type="date"
                  className="h-9"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>

              <Field label="Time" htmlFor="timeMode">
                <NativeSelect
                  id="timeMode"
                  value={timeMode}
                  onChange={(e) =>
                    setTimeMode(e.target.value as "window" | "custom")
                  }
                >
                  <option value="window">Standard window</option>
                  <option value="custom">Exact time</option>
                </NativeSelect>
              </Field>
            </FormGrid>

            {timeMode === "window" ? (
              <Field label="Window" htmlFor="window">
                <NativeSelect
                  id="window"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                >
                  {TIME_WINDOWS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : (
              <Field
                label="Exact time"
                htmlFor="customTime"
                error={errors.time}
                hint="For appointments that don't fit a two-hour window."
                className="sm:max-w-[200px]"
              >
                <Input
                  id="customTime"
                  type="time"
                  className="h-9"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
              </Field>
            )}
          </FormGrid>
        </div>

        <Field
          label="Job Price"
          htmlFor="price"
          error={errors.price}
          hint="Leave empty until the estimate is done."
          className="sm:max-w-[220px]"
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              className="h-9 pl-7"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </Field>

        <Field label="Note" htmlFor="notes">
          <Textarea
            id="notes"
            rows={4}
            placeholder="Water coming through bedroom ceiling. Call 30 minutes before arrival."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </FormGrid>

      <FormActions>
        <Button variant="outline" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button size="lg" onClick={saveJob} disabled={loading || !client}>
          {loading ? "Booking…" : "Book Visit"}
        </Button>
      </FormActions>
    </FormPage>
  );
}

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground">Loading…</div>
      }
    >
      <NewJobContent />
    </Suspense>
  );
}
