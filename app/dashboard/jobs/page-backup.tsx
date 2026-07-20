"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        status,
        scheduled_date,
        total_price,
        notes,
        clients (
          name,
          phone,
          address
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setJobs(data || []);
  }

  return (
    <div style={{ padding: 20 }}>

      <h1>Jobs</h1>

      <Link href="/dashboard/jobs/new">
        <button>
          Create New Job
        </button>
      </Link>

      <hr />

      {jobs.length === 0 && (
        <p>
          No jobs found
        </p>
      )}

{jobs.map((job) => (
  <Link
    key={job.id}
    href={`/dashboard/jobs/${job.id}`}
    style={{
      textDecoration: "none",
      color: "black",
    }}
  >

  <div
    style={{
      border: "1px solid #ccc",
      padding: 15,
      marginTop: 15,
      borderRadius: 8,
      cursor: "pointer",
    }}
  >

          <h2>
            {job.clients?.name || "Unknown Client"}
          </h2>

          <p>
            Phone: {job.clients?.phone}
          </p>

          <p>
            Address: {job.clients?.address}
          </p>

          <p>
            Status: {job.status}
          </p>

          <p>
            Date: {job.scheduled_date || "Not set"}
          </p>

          <p>
            Price: ${job.total_price || 0}
          </p>

          <p>
            Notes: {job.notes}
          </p>

        </div>

        </Link>
      ))}

    </div>
  );
}