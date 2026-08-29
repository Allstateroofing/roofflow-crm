
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();

  const [role, setRole] = useState("");

  useEffect(() => {
    loadRole();
  }, []);

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
      console.log(error.message);
      return;
    }

    if (data) {
      setRole(data.role);
    }
  }

  const menu = [
    {
      name: "Dashboard",
      path: "/dashboard",
      show: true,
    },
    {
      name: "Clients",
      path: "/dashboard/clients",
      show: true,
    },
    {
      name: "Estimates",
      path: "/dashboard/estimates",
      show: true,
    },
    {
      name: "Invoices",
      path: "/dashboard/invoices",
      show: true,
    },
    {
      name: "Jobs",
      path: "/dashboard/jobs",
      show: true,
    },
    {
      name: "Salesmen",
      path: "/dashboard/salesmen",
      show: role === "admin",
    },
    {
      name: "Payments",
      path: "/dashboard/payments",
      show: role === "admin",
    },
    {
      name: "Reports",
      path: "/dashboard/reports",
      show: role === "admin",
    },
    {
      name: "Users",
      path: "/dashboard/users",
      show: role === "admin",
    },
  ];

  const roleNames: Record<string, string> = {
    admin: "ADMINISTRATOR",
    secretary: "SECRETARY",
    manager: "MANAGER",
    salesman: "SALESMAN",
    worker: "WORKER",
  };

  const roleName = roleNames[role] || "USER";

  return (
    <div
      style={{
        width: 260,
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "25px 20px",
        boxSizing: "border-box",
      }}
    >
      {/* BRAND */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 800,
          lineHeight: "1.2",
          marginBottom: 8,
          whiteSpace: "nowrap",
          letterSpacing: "-0.3px",
        }}
      >
        🏠 All State Roofing
      </h2>

      <p
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          margin: 0,
          fontWeight: 500,
        }}
      >
        Roofing & Chimney Management
      </p>

      {/* ROLE */}
      <div
        style={{
          marginTop: 18,
          marginBottom: 20,
          padding: "11px 13px",
          borderRadius: 10,
          background: "#1F2937",
          border: "1px solid #374151",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "#9CA3AF",
            fontWeight: 700,
            letterSpacing: "1px",
            marginBottom: 5,
          }}
        >
          CURRENT ROLE
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: "#D4AF37",
            letterSpacing: "0.7px",
          }}
        >
          {roleName}
        </div>
      </div>

      <hr
        style={{
          marginTop: 5,
          marginBottom: 20,
          borderColor: "#374151",
        }}
      />

      {/* MENU */}
      <div style={{ marginTop: 10 }}>
        {menu
          .filter((item) => item.show)
          .map((item) => {
            const active = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: "block",
                  padding: "12px 15px",
                  marginBottom: 8,
                  borderRadius: 8,
                  textDecoration: "none",
                  color: "white",
                  fontSize: 14,
                  fontWeight: active ? 800 : 600,
                  background: active ? "#D4AF37" : "transparent",
                  boxShadow: active
                    ? "0 4px 12px rgba(212,175,55,0.20)"
                    : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {item.name}
              </Link>
            );
          })}
      </div>

      {/* LOGOUT */}
      <hr
        style={{
          margin: "25px 0",
          borderColor: "#374151",
        }}
      />

      <Link
        href="/auth/login"
        style={{
          display: "block",
          color: "#D1D5DB",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 600,
          padding: "10px 5px",
        }}
      >
        Logout
      </Link>
    </div>
  );
}
