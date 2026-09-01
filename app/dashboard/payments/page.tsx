"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { money, one, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Column,
  DataTable,
  EmptyState,
  PageHeader,
} from "@/components/ui/list-page";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    const { data, error } = await supabase
      .from("payments")
      .select("*, clients(name), jobs(id, total_price, clients(name))")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setPayments(data || []);
  }

  const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const columns: Column<any>[] = [
    {
      key: "client",
      header: "Client",
      primary: true,
      cell: (p) => (
        <span className="font-medium">
          {/* Pagesat e lidhura vetem me klientin s'kane pune — bjer te ajo. */}
          {one<any>(p.clients)?.name ||
            one<any>(one<any>(p.jobs)?.clients)?.name ||
            "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      cell: (p) => money(p.amount),
    },
    {
      key: "method",
      header: "Method",
      cell: (p) => p.method || "—",
    },
    {
      key: "date",
      header: "Date",
      align: "right",
      cell: (p) => (
        <span className="text-muted-foreground">{shortDate(p.created_at)}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description={
          payments.length > 0
            ? `${payments.length} payments · ${money(total)} received`
            : "Money received from customers."
        }
        action={
          <Button render={<Link href="/dashboard/payments/new" />} size="lg">
            <Plus data-icon="inline-start" />
            Add Payment
          </Button>
        }
      />

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : (
        <DataTable
          columns={columns}
          rows={payments}
          getKey={(p) => p.id}
          empty={
            <EmptyState
              title="No payments recorded"
              hint="Payments you log against an invoice show up here."
              action={
                <Button render={<Link href="/dashboard/payments/new" />}>
                  Add Payment
                </Button>
              }
            />
          }
        />
      )}
    </>
  );
}
