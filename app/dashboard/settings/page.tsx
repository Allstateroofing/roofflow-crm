"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIME_WINDOWS } from "@/lib/constants";
import {
  Field,
  FormActions,
  FormGrid,
  FormPage,
} from "@/components/ui/form-shell";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [commission, setCommission] = useState(15);
  const [deposit, setDeposit] = useState(40);
  const [terms, setTerms] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setName(data.company_name || "");
    setAddress(data.company_address || "");
    setPhone(data.company_phone || "");
    setEmail(data.company_email || "");
    setCommission(Number(data.default_commission ?? 15));
    setDeposit(Number(data.default_deposit ?? 40));
    setTerms(data.invoice_terms || "");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);

    const { data, error } = await supabase
      .from("app_settings")
      .update({
        company_name: name,
        company_address: address,
        company_phone: phone,
        company_email: email,
        default_commission: commission,
        default_deposit: deposit,
        invoice_terms: terms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select("id");

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data || data.length === 0) {
      toast.error("Only an admin can change settings.");
      return;
    }

    toast.success("Settings saved");
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <FormPage
        title="Settings"
        description="Company details and the defaults used across the CRM."
      >
        {loading ? (
          <div className="space-y-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <FormGrid>
              <h2 className="text-sm font-semibold">Company</h2>

              <Field label="Company name" htmlFor="name" required>
                <Input
                  id="name"
                  className="h-9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field
                label="Address"
                htmlFor="address"
                hint="Appears on the job statement you hand the customer."
              >
                <Input
                  id="address"
                  className="h-9"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
            </FormGrid>

            <div className="mt-8 border-t border-border pt-6">
              <FormGrid>
                <h2 className="text-sm font-semibold">Defaults</h2>

                <FormGrid cols={2}>
                  <Field
                    label="Commission"
                    htmlFor="commission"
                    hint="Applied to new salesmen. Calculated on job profit."
                  >
                    <div className="relative">
                      <Input
                        id="commission"
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        className="h-9 pr-8"
                        value={commission}
                        onChange={(e) => setCommission(Number(e.target.value))}
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </Field>

                  <Field
                    label="Deposit"
                    htmlFor="deposit"
                    hint="Suggested deposit when a job is priced."
                  >
                    <div className="relative">
                      <Input
                        id="deposit"
                        type="number"
                        min={0}
                        max={100}
                        step="5"
                        className="h-9 pr-8"
                        value={deposit}
                        onChange={(e) => setDeposit(Number(e.target.value))}
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </Field>
                </FormGrid>

                <Field
                  label="Payment terms"
                  htmlFor="terms"
                  className="sm:max-w-[240px]"
                >
                  <Input
                    id="terms"
                    className="h-9"
                    placeholder="Net 30"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  />
                </Field>
              </FormGrid>
            </div>

            {/* Intervalet jane te ngulitura ne databaze si kufizim, ndaj
                shfaqen ketu vetem per informacion. */}
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="mb-3 text-sm font-semibold">Appointment windows</h2>
              <div className="flex flex-wrap gap-2">
                {TIME_WINDOWS.map((w) => (
                  <span
                    key={w.value}
                    className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
                  >
                    {w.label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Any other time is booked as an exact time on the visit.
              </p>
            </div>

            <FormActions>
              <Button size="lg" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save Settings"}
              </Button>
            </FormActions>
          </>
        )}
      </FormPage>
    </RoleGuard>
  );
}
