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

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("SIDEBAR PROFILE ERROR:", error);
      return;
    }

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
      {/* MOBILE HAMBURGER */}
      <button
        className="mobile-menu-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          top: 15,
          left: 15,
          zIndex: 10001,
          width: 46,
          height: 46,
          borderRadius: 10,
          border: "none",
          background: "#111827",
          color: "#ffffff",
          fontSize: 25,
          cursor: "pointer",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        }}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9998,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`crm-sidebar ${open ? "sidebar-open" : ""}`}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 270,
          background: "#111827",
          color: "#ffffff",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          boxShadow: "4px 0 20px rgba(0,0,0,0.12)",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            padding: "28px 20px 22px",
            borderBottom: "1px solid #374151",
            flexShrink: 0,
          }}
        >
          <img
            src="/logo.png"
            alt="All State Roofing"
            style={{
              width: 65,
              height: 65,
              objectFit: "contain",
              display: "block",
              marginBottom: 15,
            }}
          />

          <h2
            style={{
              margin: 0,
              fontSize: 23,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.4px",
            }}
          >
            All State Roofing
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "#9CA3AF",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            Roofing & Chimney Management
          </p>
        </div>

        {/* MENU */}
        <nav
          style={{
            flex: 1,
            padding: "18px 10px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {menu.map((item) => {
            const active =
              pathname === item[2] ||
              (item[2] !== "/dashboard" &&
                pathname.startsWith(item[2] + "/"));

            return (
              <Link
                key={item[2]}
                href={item[2]}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  minHeight: 52,
                  padding: "0 16px",
                  marginBottom: 8,
                  borderRadius: 13,
                  boxSizing: "border-box",
                  textDecoration: "none",
                  background: active ? "#D4AF37" : "#1F2937",
                  color: active ? "#111827" : "#ffffff",
                  fontSize: 16,
                  fontWeight: 700,
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: 25,
                    textAlign: "center",
                    fontSize: 19,
                    flexShrink: 0,
                  }}
                >
                  {item[0]}
                </span>

                <span>{item[1]}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div
          style={{
            padding: "17px 20px",
            borderTop: "1px solid #374151",
            flexShrink: 0,
            background: "#111827",
          }}
        >
          <button
            onClick={logout}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "#EF4444",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              padding: "10px 0",
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* RESPONSIVE SIDEBAR CSS */}
      <style jsx global>{`
        .crm-main {
          margin-left: 270px;
          width: calc(100% - 270px);
        }

        .crm-sidebar {
          transform: translateX(0);
          transition: transform 0.25s ease;
        }

        @media (max-width: 768px) {
          .crm-main {
            margin-left: 0;
            width: 100%;
          }

          .mobile-menu-button {
            display: flex !important;
          }

          .crm-sidebar {
            transform: translateX(-100%);
            width: 280px !important;
          }

          .crm-sidebar.sidebar-open {
            transform: translateX(0);
          }
        }

        @media (min-width: 769px) {
          .mobile-sidebar-overlay {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          header {
            padding-left: 75px !important;
            padding-right: 16px !important;
          }

          main {
            padding: 18px !important;
          }
        }
      `}</style>
    </>
  );
}