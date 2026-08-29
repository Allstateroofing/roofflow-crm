"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [assignClient, setAssignClient] = useState<any>(null);
  const [selectedSalesman, setSelectedSalesman] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    loadClients();
    loadSalesmen();
    loadRole();
  }, []);

  async function loadClients() {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        id,
        name,
        phone,
        email,
        address,
        zip_code,
        created_at,

        jobs(
          id,
          status,
          total_price,
          created_at,
          salesman_id,

          salesmen(
            name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("CLIENTS ERROR:", error);
      alert(error.message);
      return;
    }

    const formatted = (data || []).map((client: any) => {
      const jobs = client.jobs || [];

      const latestJob = jobs.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0];

      return {
        ...client,
        job: latestJob || null,
      };
    });

    setClients(formatted);
  }

  async function loadSalesmen() {
    const { data, error } = await supabase
      .from("salesmen")
      .select("id,name")
      .order("name");

    if (error) {
      console.log("SALESMEN ERROR:", error);
      return;
    }

    setSalesmen(data || []);
  }

  async function loadRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("ROLE ERROR:", error);
      return;
    }

    setRole(data.role);
  }

  async function assignSalesman() {
    if (!assignClient || !selectedSalesman) return;

    if (!assignClient.job) {
      alert("Create a job first");
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        salesman_id: selectedSalesman,
      })
      .eq("id", assignClient.job.id);

    if (error) {
      alert(error.message);
      return;
    }

    setAssignClient(null);
    setSelectedSalesman("");

    await loadClients();
  }

  async function deleteClient(id: string) {
    if (!confirm("Delete this client?")) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadClients();
  }

  function getZipColor(zip: string) {
    if (!zip) return "#FFFFFF";

    const zone = String(zip).substring(0, 2);

    const colors: any = {
      "07": "#FEF3C7",
      "08": "#DBEAFE",
      "17": "#DCFCE7",
      "18": "#EDE9FE",
      "19": "#E5E7EB",
    };

    return colors[zone] || "#FFFFFF";
  }

  const filteredClients = clients.filter((client) => {
    const text = search.toLowerCase();

    return (
      client.name?.toLowerCase().includes(text) ||
      client.phone?.toLowerCase().includes(text) ||
      client.address?.toLowerCase().includes(text)
    );
  });

  return (
    <div
      style={{
        padding: 30,
        width: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#111827",
              margin: 0,
            }}
          >
            Clients
          </h1>

          <p
            style={{
              color: "#6B7280",
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Manage your customers and roofing projects
          </p>

          {/* TOTAL CLIENTS */}
          <div
            style={{
              marginTop: 12,
              display: "inline-flex",
              alignItems: "center",
              background: "#111827",
              color: "#FFFFFF",
              padding: "8px 14px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            <span style={{ color: "#D4AF37", marginRight: 6 }}>
              Total Clients:
            </span>

            {clients.length}
          </div>
        </div>

        <Link
          href="/dashboard/clients/new"
          style={{
            textDecoration: "none",
          }}
        >
          <button
            style={{
              background: "#D4AF37",
              border: 0,
              padding: "12px 22px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              color: "#111827",
            }}
          >
            + New Client
          </button>
        </Link>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search client..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          marginTop: 25,
          padding: 12,
          width: 350,
          maxWidth: "100%",
          borderRadius: 8,
          border: "1px solid #D1D5DB",
          boxSizing: "border-box",
          fontSize: 15,
        }}
      />

      {/* SEARCH RESULT COUNT */}
      {search && (
        <div
          style={{
            marginTop: 10,
            color: "#6B7280",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Showing {filteredClients.length} of {clients.length} clients
        </div>
      )}

      {/* CLIENT TABLE */}
      <div
        style={{
          marginTop: 30,
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          overflowX: "auto",
          width: "100%",
          boxShadow: "0 8px 25px rgba(0,0,0,0.04)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 950,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#111827",
                color: "#D4AF37",
              }}
            >
              {/* NUMBER */}
              <th
                style={{
                  padding: 15,
                  textAlign: "center",
                  width: 55,
                }}
              >
                #
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Client
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Address
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Phone
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                ZIP Code
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Salesman
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Price
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Status
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Date
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredClients.map(
              (client: any, index: number) => (
                <tr
                  key={client.id}
                  style={{
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  {/* NUMBER */}
                  <td
                    style={{
                      padding: 15,
                      textAlign: "center",
                      fontWeight: 800,
                      color: "#D4AF37",
                      fontSize: 16,
                    }}
                  >
                    {index + 1}
                  </td>

                  {/* CLIENT */}
                  <td
                    style={{
                      padding: 15,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {client.name}
                  </td>

                  {/* ADDRESS */}
                  <td style={{ padding: 15 }}>
                    {client.address || "-"}
                  </td>

                  {/* PHONE */}
                  <td style={{ padding: 15 }}>
                    {client.phone || "-"}
                  </td>

                  {/* ZIP */}
                  <td
                    style={{
                      padding: 15,
                      fontWeight: 700,
                      background: getZipColor(
                        client.zip_code
                      ),
                    }}
                  >
                    {client.zip_code || "-"}
                  </td>

                  {/* SALESMAN */}
                  <td style={{ padding: 15 }}>
                    {client.job?.salesmen?.name ||
                      "Not Assigned"}
                  </td>

                  {/* PRICE */}
                  <td
                    style={{
                      padding: 15,
                      fontWeight: 700,
                    }}
                  >
                    {client.job?.total_price
                      ? "$" +
                        Number(
                          client.job.total_price
                        ).toLocaleString()
                      : "-"}
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: 15 }}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        background:
                          client.job?.status === "done"
                            ? "#DCFCE7"
                            : client.job?.status ===
                              "in_progress"
                            ? "#DBEAFE"
                            : "#FEF3C7",
                        color:
                          client.job?.status === "done"
                            ? "#166534"
                            : client.job?.status ===
                              "in_progress"
                            ? "#1D4ED8"
                            : "#92400E",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {client.job?.status || "New"}
                    </span>
                  </td>

                  {/* DATE */}
                  <td style={{ padding: 15 }}>
                    {client.created_at
                      ? new Date(
                          client.created_at
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  {/* ACTION */}
                  <td
                    style={{
                      padding: 15,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      style={{
                        textDecoration: "none",
                      }}
                    >
                      <button
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: 0,
                          background: "#111827",
                          color: "#FFFFFF",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    </Link>

                    {role === "admin" && (
                      <button
                        onClick={() =>
                          setAssignClient(client)
                        }
                        style={{
                          marginLeft: 8,
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: 0,
                          background: "#D4AF37",
                          color: "#111827",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Assign
                      </button>
                    )}

                    {role === "admin" && (
                      <button
                        onClick={() =>
                          deleteClient(client.id)
                        }
                        style={{
                          marginLeft: 8,
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: 0,
                          background: "#DC2626",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              )
            )}

            {/* NO CLIENTS */}
            {filteredClients.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: 30,
                    textAlign: "center",
                    color: "#6B7280",
                    fontWeight: 600,
                  }}
                >
                  {search
                    ? "No clients match your search."
                    : "No clients found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN SALESMAN MODAL */}
      {assignClient && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20000,
            padding: 20,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              padding: 30,
              borderRadius: 15,
              width: "100%",
              maxWidth: 400,
              boxSizing: "border-box",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
              }}
            >
              Assign Salesman
            </h3>

            <select
              value={selectedSalesman}
              onChange={(e) =>
                setSelectedSalesman(e.target.value)
              }
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #D1D5DB",
                boxSizing: "border-box",
                fontSize: 15,
              }}
            >
              <option value="">
                Select Salesman
              </option>

              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                onClick={assignSalesman}
                disabled={!selectedSalesman}
                style={{
                  padding: "10px 20px",
                  border: 0,
                  borderRadius: 8,
                  background: selectedSalesman
                    ? "#D4AF37"
                    : "#E5E7EB",
                  color: "#111827",
                  fontWeight: 700,
                  cursor: selectedSalesman
                    ? "pointer"
                    : "not-allowed",
                }}
              >
                Save
              </button>

              <button
                onClick={() => {
                  setAssignClient(null);
                  setSelectedSalesman("");
                }}
                style={{
                  padding: "10px 20px",
                  border: 0,
                  borderRadius: 8,
                  background: "#E5E7EB",
                  color: "#111827",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
