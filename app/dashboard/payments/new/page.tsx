"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/format";
import { PAYMENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FormActions,
  FormGrid,
  FormPage,
  NativeSelect,
} from "@/components/ui/form-shell";

function one<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

export default function NewPayment() {
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [job, setJob] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [ptype, setPtype] = useState("deposit");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    // Pagesa hyn te puna — nuk ka me fatura ndermjet.
    const { data, error } = await supabase
      .from("jobs")
      .select("id, client_id, total_price, status, clients(name)")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      return;
    }

    setJobs(data || []);
  }

  function labelFor(j: any) {
    const client = one<any>(j.clients)?.name ?? "Unknown client";
    return `${client} — ${money(j.total_price)}`;
  }

  async function savePayment() {
    const next: Record<string, string> = {};
    if (!job) next.job = "Select a job";
    if (!amount || Number(amount) <= 0) next.amount = "Enter an amount above 0";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);

    const chosen = jobs.find((j) => j.id === job);

    const { error } = await supabase.from("payments").insert({
      job_id: job,
      client_id: chosen?.client_id ?? null,
      payment_type: ptype,
      amount: Number(amount),
      method,
    });

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Payment recorded");
    router.push("/dashboard/payments");
  }

  return (
    <FormPage
      title="Add Payment"
      description="Record money received from a customer."
      backHref="/dashboard/payments"
    >
      <FormGrid>
        <Field label="Job" htmlFor="job" required error={errors.job}>
          <NativeSelect
            id="job"
            value={job || ""}
            onChange={(e) => setJob(e.target.value || null)}
          >
            <option value="">Choose a job…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {labelFor(j)}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Type" htmlFor="ptype" className="sm:max-w-[220px]">
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

        <FormGrid cols={2}>
          <Field label="Amount" htmlFor="amount" required error={errors.amount}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                className="h-9 pl-7"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Method" htmlFor="method">
            <NativeSelect
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Card">Card</option>
              <option value="Bank">Bank Transfer</option>
            </NativeSelect>
          </Field>
        </FormGrid>
      </FormGrid>

      <FormActions>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/dashboard/payments")}
        >
          Cancel
        </Button>
        <Button size="lg" onClick={savePayment} disabled={saving}>
          {saving ? "Saving…" : "Save Payment"}
        </Button>
      </FormActions>
    </FormPage>
  );
}
