"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstimate();
  }, []);

  async function loadEstimate() {
    const { data, error } = await supabase
      .from("estimates")
      .select(`
        *,
        clients(
          name,
          phone,
          email,
          address
        ),
        salesmen(
          name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setEstimate(data);
    setLoading(false);
  }

  async function convertToJob() {
    if (!estimate) return;

    const { data, error } = await supabase
.from("jobs")
.insert({
  client_id: estimate.client_id,
  salesman_id: estimate.salesman_id,
  estimate_id: estimate.id,
  total_price: Number(estimate.total),
  profit: 0,
  status: "approved",
  notes: estimate.title,
})

      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    await supabase
.from("estimates")
.update({
  status:"converted",
})
.eq("id",id);


    router.push(`/dashboard/jobs/${data.id}`);
  }

  function generatePDF() {
    if (!estimate) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("All State Roofing Estimate", 20, 20);

    doc.setFontSize(12);

    doc.text(`Client: ${estimate.clients?.name ?? ""}`, 20, 40);
    doc.text(`Phone: ${estimate.clients?.phone ?? ""}`, 20, 50);
    doc.text(`Email: ${estimate.clients?.email ?? ""}`, 20, 60);
    doc.text(`Address: ${estimate.clients?.address ?? ""}`, 20, 70);

    doc.text(`Estimate: ${estimate.title ?? ""}`, 20, 90);
    doc.text(
      `Total: $${Number(estimate.total || 0).toLocaleString()}`,
      20,
      100
    );

    let y = 120;

    doc.text("Items", 20, y);

    y += 10;
        estimate.items?.forEach((item: any) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const total = quantity * price;

      doc.text(
        `${item.description} | Qty: ${quantity} | Price: $${price} | Total: $${total}`,
        20,
        y
      );

      y += 10;
    });

    y += 10;

    doc.text(
      `Deposit: $${Number(
        estimate.deposit_amount || 0
      ).toLocaleString()}`,
      20,
      y
    );

    y += 10;

    doc.text(
      `Paid: $${Number(
        estimate.paid_amount || 0
      ).toLocaleString()}`,
      20,
      y
    );

    y += 10;

    doc.text(
      `Remaining: $${Number(
        estimate.remaining_amount || 0
      ).toLocaleString()}`,
      20,
      y
    );

    doc.save(`Estimate-${estimate.id}.pdf`);
  }

  if (loading) {
    return (
      <div style={{ padding: 30 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>

      <h1>Estimate Details</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 20,
          maxWidth: 900,
        }}
      >

        <h2>Client</h2>

        <p>
          <b>Name:</b> {estimate.clients?.name}
        </p>

        <p>
          <b>Phone:</b> {estimate.clients?.phone}
        </p>

        <p>
          <b>Email:</b> {estimate.clients?.email}
        </p>

        <p>
          <b>Address:</b> {estimate.clients?.address}
        </p>

        <hr />

        <h2>Salesman</h2>

        <p>{estimate.salesmen?.name || "Not Assigned"}</p>

        <hr />

        <h2>Estimate</h2>

        <p>
          <b>Title:</b> {estimate.title}
        </p>

        <p>
          <b>Status:</b> {estimate.status}
        </p>

        <h2>
          Total: $
          {Number(estimate.total || 0).toLocaleString()}
        </h2>

        <hr />

        <h2>Items</h2>

        {estimate.items?.map((item: any, index: number) => (
          <div
            key={index}
            style={{
              borderBottom: "1px solid #eee",
              padding: 10,
            }}
          >
            <p>{item.description}</p>

            <p>
              Qty: {item.quantity}
            </p>

            <p>
              Price: $
              {Number(item.price || 0).toLocaleString()}
            </p>

            <p>
              Total: $
              {(
                Number(item.quantity || 0) *
                Number(item.price || 0)
              ).toLocaleString()}
            </p>
          </div>
        ))}
                <hr />

        <h2>Payment</h2>

        <p>
          Deposit: $
          {Number(estimate.deposit_amount || 0).toLocaleString()}
        </p>

        <p>
          Paid: $
          {Number(estimate.paid_amount || 0).toLocaleString()}
        </p>

        <p>
          Remaining: $
          {Number(estimate.remaining_amount || 0).toLocaleString()}
        </p>

        <hr />

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={generatePDF}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            Download PDF
          </button>

          {estimate.status !== "converted" && (
            <button
              onClick={convertToJob}
              style={{
                padding: "12px 20px",
                cursor: "pointer",
              }}
            >
              Convert To Job
            </button>
          )}

          <button
            onClick={() => router.back()}
            style={{
              padding: "12px 20px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}