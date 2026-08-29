"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    loadProfile();
    loadJobs();
  }, []);

  async function loadProfile() {
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
      console.log("PROFILE ERROR:", error);
      return;
    }

    setProfile(data);
  }

  async function loadJobs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        status,
        scheduled_date,
        scheduled_time,
        total_price,
        profit,
        created_at,

        clients(
          name,
          phone,
          zip_code
        ),

        salesmen(
          name,
          commission_percent
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("JOBS ERROR:", error);
      alert(error.message);
      setLoading(false);
      return;
    }

    setJobs(data || []);
    setLoading(false);
  }

  async function deleteJob(id: string) {
    if (!confirm("Delete this job?")) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadJobs();
  }

  const filteredJobs = jobs.filter((job) => {
    const text = `
      ${job.clients?.name || ""}
      ${job.clients?.phone || ""}
      ${job.salesmen?.name || ""}
      ${job.status || ""}
    `.toLowerCase();

    return (
      text.includes(search.toLowerCase()) &&
      (status ? job.status === status : true) &&
      (date ? job.scheduled_date === date : true) &&
      (time ? job.scheduled_time === time : true)
    );
  });

  if (loading) {
    return (
      <div
        style={{
          padding: 30,
          fontSize: 18,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Loading Jobs...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 30,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        className="jobs-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
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
            Jobs
          </h1>

          <p
            style={{
              color: "#6B7280",
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Manage roofing projects
          </p>
        </div>

        <Link href="/dashboard/jobs/new">
          <button
            style={{
              background: "#D4AF37",
              border: 0,
              padding: "12px 22px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + New Job
          </button>
        </Link>
      </div>

      {/* TOTAL JOBS */}
      <div
        style={{
          marginTop: 25,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "#111827",
          color: "#FFFFFF",
          padding: "12px 18px",
          borderRadius: 12,
          fontWeight: 700,
        }}
      >
        <span
          style={{
            color: "#D4AF37",
          }}
        >
          Total Jobs:
        </span>

        <span
          style={{
            fontSize: 20,
          }}
        >
          {jobs.length}
        </span>
      </div>

      {/* FILTERS */}
      <div
        className="jobs-filters"
        style={{
          marginTop: 25,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search client, phone, salesman..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 12,
            width: 350,
            maxWidth: "100%",
            borderRadius: 8,
            border: "1px solid #D1D5DB",
            boxSizing: "border-box",
          }}
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #D1D5DB",
          }}
        />

        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #D1D5DB",
            background: "#FFFFFF",
          }}
        >
          <option value="">All Times</option>

          <option value="09:00-11:00">
            9 AM - 11 AM
          </option>

          <option value="11:00-13:00">
            11 AM - 1 PM
          </option>

          <option value="13:00-15:00">
            1 PM - 3 PM
          </option>

          <option value="15:00-17:00">
            3 PM - 5 PM
          </option>

          <option value="11:00">
            11:00 Exact
          </option>

          <option value="14:00">
            2:00 Exact
          </option>

          <option value="15:30">
            3:30 Exact
          </option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #D1D5DB",
            background: "#FFFFFF",
          }}
        >
          <option value="">All Status</option>

          <option value="new">
            New
          </option>

          <option value="inspection">
            Inspection
          </option>

          <option value="approved">
            Approved
          </option>

          <option value="scheduled">
            Scheduled
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="done">
            Done
          </option>
        </select>

        {/* CLEAR FILTERS */}
        {(search || status || date || time) && (
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setDate("");
              setTime("");
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              border: "none",
              background: "#E5E7EB",
              color: "#111827",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* FILTERED COUNT */}
      {(search || status || date || time) && (
        <div
          style={{
            marginTop: 15,
            color: "#6B7280",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      )}

      {/* TABLE */}
      <div
        style={{
          marginTop: 25,
          background: "#FFFFFF",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          overflowX: "auto",
          width: "100%",
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
                Salesman
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
                Price
              </th>

              <th
                style={{
                  padding: 15,
                  textAlign: "left",
                }}
              >
                Profit
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
                Time
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
            {filteredJobs.map(
              (job: any, index: number) => (
                <tr
                  key={job.id}
                  style={{
                    borderBottom:
                      "1px solid #E5E7EB",
                  }}
                >
                  {/* NUMBER */}
                  <td
                    style={{
                      padding: 15,
                      textAlign: "center",
                      fontWeight: 800,
                      color: "#6B7280",
                    }}
                  >
                    {index + 1}
                  </td>

                  {/* CLIENT */}
                  <td
                    style={{
                      padding: 15,
                    }}
                  >
                    <b
                      style={{
                        color: "#111827",
                      }}
                    >
                      {job.clients?.name || "-"}
                    </b>

                    <br />

                    <span
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                      }}
                    >
                      {job.clients?.phone || "-"}
                    </span>
                  </td>

                  {/* SALESMAN */}
                  <td
                    style={{
                      padding: 15,
                    }}
                  >
                    {job.salesmen?.name ||
                      "Not Assigned"}
                  </td>

                  {/* STATUS */}
                  <td
                    style={{
                      padding: 15,
                    }}
                  >
                    <span
                      style={{
                        background: "#FEF3C7",
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontWeight: 700,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job.status || "New"}
                    </span>
                  </td>

                  {/* PRICE */}
                  <td
                    style={{
                      padding: 15,
                      fontWeight: 700,
                    }}
                  >
                    $
                    {Number(
                      job.total_price || 0
                    ).toLocaleString()}
                  </td>

                  {/* PROFIT */}
                  <td
                    style={{
                      padding: 15,
                      fontWeight: 700,
                      color: "#059669",
                    }}
                  >
                    $
                    {Number(
                      job.profit || 0
                    ).toLocaleString()}
                  </td>

                  {/* DATE */}
                  <td
                    style={{
                      padding: 15,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.scheduled_date || "-"}
                  </td>

                  {/* TIME */}
                  <td
                    style={{
                      padding: 15,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.scheduled_time || "-"}
                  </td>

                  {/* ACTION */}
                  <td
                    style={{
                      padding: 15,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                    >
                      <button
                        style={{
                          background: "#111827",
                          color: "#FFFFFF",
                          border: 0,
                          padding: "8px 14px",
                          borderRadius: 8,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    </Link>

                    {profile?.role === "admin" && (
                      <button
                        onClick={() =>
                          deleteJob(job.id)
                        }
                        style={{
                          marginLeft: 8,
                          background: "#DC2626",
                          color: "#FFFFFF",
                          border: 0,
                          padding: "8px 14px",
                          borderRadius: 8,
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

            {/* NO JOBS */}
            {filteredJobs.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 35,
                    textAlign: "center",
                    color: "#6B7280",
                    fontWeight: 600,
                  }}
                >
                  No jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CSS */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .jobs-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .jobs-header a {
            width: 100%;
          }

          .jobs-header a button {
            width: 100%;
          }

          .jobs-filters {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .jobs-filters input,
          .jobs-filters select,
          .jobs-filters button {
            width: 100% !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}