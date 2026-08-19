"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function NewJobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = searchParams.get("client");

  const [client, setClient] = useState<any>(null);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [salesman, setSalesman] = useState("");
  const [status, setStatus] = useState("new");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }

    loadSalesmen();
  }, [clientId]);

  async function loadClient() {
    if (!clientId) return;

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setClient(data);
  }

  async function loadSalesmen() {
    const { data, error } = await supabase
      .from("salesmen")
      .select("id, name")
      .order("name");

    if (error) {
      console.log(error);
      return;
    }

    setSalesmen(data || []);
  }

  async function saveJob() {
    if (!client) {
      alert("Client not loaded");
      return;
    }

    if (!price) {
      alert("Please enter a job price");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("jobs").insert({
      client_id: client.id,
      salesman_id: salesman || null,
      status: status,
      total_price: Number(price),
      scheduled_date: date || null,
      notes: notes,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Job Created");

    router.push("/dashboard/clients/" + clientId);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "30px",
            fontWeight: 700,
            marginBottom: "25px",
            color: "#111827",
          }}
        >
          Create Job
        </h1>

        {client && (
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "15px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "15px",
              }}
            >
              Client Information
            </h2>

            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              <div>
                <strong>Name:</strong> {client.name || "-"}
              </div>

              <div>
                <strong>Address:</strong> {client.address || "-"}
              </div>

              <div>
                <strong>Phone:</strong> {client.phone || "-"}
              </div>

              <div>
                <strong>Email:</strong> {client.email || "-"}
              </div>
            </div>
          </div>
        )}

        {!clientId && (
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "15px",
              marginBottom: "20px",
              color: "#b91c1c",
            }}
          >
            No client selected.
          </div>
        )}

        <div
          style={{
            background: "#fff",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            Job Details
          </h2>

          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                Salesman
              </label>

              <select
                value={salesman}
                onChange={(e) => setSalesman(e.target.value)}
                style={{
                  padding: "10px",
                  width: "100%",
                  maxWidth: "400px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#fff",
                }}
              >
                <option value="">Select Salesman</option>

                {salesmen.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  padding: "10px",
                  width: "100%",
                  maxWidth: "400px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#fff",
                }}
              >
                <option value="new">New</option>
                <option value="inspection">Inspection</option>
                <option value="estimate_sent">Estimate Sent</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                Job Price
              </label>

              <input
                type="number"
                placeholder="Job Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                style={{
                  padding: "10px",
                  width: "100%",
                  maxWidth: "400px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                Scheduled Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  padding: "10px",
                  width: "100%",
                  maxWidth: "400px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: 600,
                }}
              >
                Notes
              </label>

              <textarea
                placeholder="Job notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                style={{
                  padding: "10px",
                  width: "100%",
                  maxWidth: "600px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "5px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  padding: "12px 22px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveJob}
                disabled={loading || !client}
                style={{
                  padding: "12px 22px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#D4AF37",
                  color: "#111",
                  cursor:
                    loading || !client ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  opacity: loading || !client ? 0.6 : 1,
                }}
              >
                {loading ? "Creating..." : "Create Job"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "30px",
            fontSize: "18px",
          }}
        >
          Loading...
        </div>
      }
    >
      <NewJobContent />
    </Suspense>
  );
}