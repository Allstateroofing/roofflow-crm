"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("PROFILE:", data);
    console.log("PROFILE ERROR:", error);

    setProfile(data);
  }

  function roleTitle() {
    if (profile?.role === "admin") return "Administrator";
    if (profile?.role === "secretary") return "Office";
    if (profile?.role === "salesman") {
      return profile?.full_name || "Salesman";
    }
    if (profile?.role === "worker") return "Worker";

    return "User";
  }

  function roleAccount() {
    if (profile?.role === "admin") return "Admin Account";
    if (profile?.role === "secretary") return "Secretary Account";
    if (profile?.role === "salesman") return "Salesman Account";
    if (profile?.role === "worker") return "Worker Account";

    return "";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <Sidebar />

      {/* MAIN AREA */}
      <div
        className="dashboard-main"
        style={{
          marginLeft: 270,
          minHeight: "100vh",
          width: "calc(100% - 270px)",
          boxSizing: "border-box",
        }}
      >
        {/* TOP BAR */}
        <header
          style={{
            height: 70,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            padding: "0 30px",
            gap: 12,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              minWidth: 42,
              borderRadius: "50%",
              background: "#D4AF37",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              color: "#111827",
              fontSize: 17,
            }}
          >
            {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#111827",
                fontSize: 15,
              }}
            >
              {roleTitle()}
            </div>

            <span
              style={{
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              {roleAccount()}
            </span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            padding: 30,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}