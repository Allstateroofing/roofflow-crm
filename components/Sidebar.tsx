"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [role, setRole] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadRole();
  }, []);

  async function loadRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data) {
      setRole(data.role);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  let menu: any[] = [];

  if (role === "admin") {
    menu = [
      ["🏠", "Dashboard", "/dashboard"],
      ["🔎", "Search", "/dashboard/search"],
      ["👥", "Clients", "/dashboard/clients"],
      ["📑", "Estimates", "/dashboard/estimates"],
      ["🧾", "Invoices", "/dashboard/invoices"],
      ["🏗️", "Jobs", "/dashboard/jobs"],
      ["💵", "Payments", "/dashboard/payments"],
      ["📊", "Reports", "/dashboard/reports"],
      ["👨‍💼", "Salesmen", "/dashboard/salesmen"],
      ["👤", "Users", "/dashboard/users"],
    ];
  }

  if (role === "secretary") {
    menu = [
      ["🏠", "Dashboard", "/dashboard"],
      ["🔎", "Search", "/dashboard/search"],
      ["👥", "Clients", "/dashboard/clients"],
      ["📑", "Estimates", "/dashboard/estimates"],
      ["🧾", "Invoices", "/dashboard/invoices"],
      ["🏗️", "Jobs", "/dashboard/jobs"],
    ];
  }

  if (role === "salesman") {
    menu = [
      ["🏠", "Dashboard", "/dashboard"],
      ["🔎", "Search", "/dashboard/search"],
      ["👥", "My Clients", "/dashboard/clients"],
      ["📑", "My Estimates", "/dashboard/estimates"],
      ["🏗️", "My Jobs", "/dashboard/jobs"],
    ];
  }

  if (role === "worker") {
    menu = [
      ["🏠", "Dashboard", "/dashboard"],
      ["🏗️", "My Jobs", "/dashboard/jobs"],
    ];
  }

  return (
    <>
      {/* MOBILE MENU BUTTON */}

      <button
        onClick={() => setOpen(!open)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 10001,
          width: 44,
          height: 44,
          borderRadius: 10,
          border: "1px solid #374151",
          background: "#111827",
          color: "#FFFFFF",
          fontSize: 23,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.20)",
        }}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* DARK OVERLAY */}

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 10000,
          }}
        />
      )}

      {/* SIDEBAR */}

      <aside
        style={{
          width: 270,
          maxWidth: "85vw",
          background: "#111827",
          color: "#FFFFFF",
          position: "fixed",
          left: open ? 0 : -290,
          top: 0,
          bottom: 0,
          transition: "left 0.25s ease",
          zIndex: 10002,
          display: "flex",
          flexDirection: "column",
          boxShadow: open
            ? "8px 0 30px rgba(0,0,0,0.25)"
            : "none",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* LOGO / COMPANY */}

        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid #374151",
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="All State Roofing"
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              objectFit: "contain",
              display: "block",
            }}
          />

          <h2
            style={{
              margin: "14px 0 4px 0",
              fontSize: 20,
              lineHeight: 1.2,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            All State Roofing
          </h2>

          <p
            style={{
              color: "#9CA3AF",
              margin: 0,
              fontSize: 13,
              lineHeight: 1.4,
              fontWeight: 400,
            }}
          >
            Roofing & Chimney Management
          </p>
        </div>

        {/* MENU */}

        <nav
          style={{
            flex: 1,
            padding: 15,
            overflowY: "auto",
          }}
        >
          {menu.map((item) => {
            const active = pathname === item[2];

            return (
              <Link
                key={item[2]}
                href={item[2]}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  width: "100%",
                  minHeight: 48,
                  padding: "12px 14px",
                  marginBottom: 7,
                  borderRadius: 11,
                  textDecoration: "none",
                  background: active
                    ? "#D4AF37"
                    : "#1F2937",
                  color: active
                    ? "#111827"
                    : "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  boxSizing: "border-box",
                  transition:
                    "background 0.2s ease, color 0.2s ease",
                }}
              >
                <span
                  style={{
                    width: 24,
                    minWidth: 24,
                    textAlign: "center",
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  {item[0]}
                </span>

                <span
                  style={{
                    whiteSpace: "nowrap",
                  }}
                >
                  {item[1]}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}

        <div
          style={{
            padding: 20,
            borderTop: "1px solid #374151",
            flexShrink: 0,
          }}
        >
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "none",
              color: "#EF4444",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}
