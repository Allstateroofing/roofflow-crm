"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { TIME_WINDOWS } from "@/lib/constants";
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

export default function NewClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inspektimi eshte pjese e njejtes forme — telefonata e pare zakonisht
  // sjell edhe klientin edhe takimin, pa e ndare ne dy hapa.
  const [booking, setBooking] = useState(false);
  const [date, setDate] = useState("");
  const [timeMode, setTimeMode] = useState<"window" | "custom">("window");
  const [timeWindow, setTimeWindow] = useState("9-11");
  const [customTime, setCustomTime] = useState("");
  const [note, setNote] = useState("");

  async function saveClient() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Client name is required";
    if (booking && !date) next.date = "Pick the inspection date";
    if (booking && timeMode === "custom" && !customTime)
      next.time = "Enter the time, or switch to a window";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);

    const { data: client, error } = await supabase
      .from("clients")
      .insert({ name, phone, email, address, zip_code: zipCode })
      .select("id")
      .maybeSingle();

    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }

    if (!booking) {
      setSaving(false);
      toast.success("Client created");
      router.push("/dashboard/clients");
      return;
    }

    if (!client?.id) {
      setSaving(false);
      toast.error("Client saved, but the inspection could not be booked.");
      router.push("/dashboard/clients");
      return;
    }

    // Databaza pranon ose interval ose ore te sakte, kurre te dyja.
    const { error: jobError } = await supabase.from("jobs").insert({
      client_id: client.id,
      status: "new",
      reason_for_call: "Inspection",
      scheduled_date: date,
      time_window: timeMode === "window" ? timeWindow : null,
      scheduled_time: timeMode === "custom" ? customTime : null,
      notes: note,
    });

    setSaving(false);

    if (jobError) {
      toast.error(`Client saved, but the inspection failed: ${jobError.message}`);
      router.push(`/dashboard/clients/${client.id}`);
      return;
    }

    toast.success("Client created and inspection booked");
    router.push("/dashboard/clients");
  }

  return (
    <FormPage
      title="New Client"
      description="Add a customer to your database."
      backHref="/dashboard/clients"
    >
      <FormGrid>
        <Field label="Client Name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            className="h-9"
            placeholder="John Smith"
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
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              className="h-9"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </FormGrid>

        <Field label="Address" htmlFor="address">
          <Input
            id="address"
            className="h-9"
            placeholder="123 Main St"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>

        <Field
          label="ZIP Code"
          htmlFor="zip"
          hint="Used to match the client to a sales zone."
          className="sm:max-w-[200px]"
        >
          <Input
            id="zip"
            className="h-9"
            placeholder="10001"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
          />
        </Field>

        {/* ---- Inspektimi, pa dale nga faqja ---- */}
        <div className="rounded-lg border border-border p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4"
              checked={booking}
              onChange={(e) => setBooking(e.target.checked)}
            />
            <span>
              <span className="text-sm font-medium">Book an inspection</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Books the first visit together with the client. Leave it off and
                you can book one later from their page.
              </span>
            </span>
          </label>

          {booking && (
            <div className="mt-4 border-t border-border pt-4">
              <FormGrid>
                <FormGrid cols={2}>
                  <Field
                    label="Date"
                    htmlFor="date"
                    required
                    error={errors.date}
                  >
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

                <Field label="Note" htmlFor="note">
                  <Textarea
                    id="note"
                    rows={3}
                    placeholder="Water coming through bedroom ceiling. Call 30 minutes before arrival."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </Field>
              </FormGrid>
            </div>
          )}
        </div>
      </FormGrid>

      <FormActions>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/dashboard/clients")}
        >
          Cancel
        </Button>
        <Button size="lg" onClick={saveClient} disabled={saving}>
          {saving
            ? "Saving…"
            : booking
              ? "Save & Book Inspection"
              : "Save Client"}
        </Button>
      </FormActions>
    </FormPage>
  );
}
