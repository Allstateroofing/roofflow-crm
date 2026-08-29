"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const menu = [
    ["🏠", "Dashboard", "/dashboard"],
    ["🔎", "Search", "/dashboard/search"],
    ["👥", "Clients", "/dashboard/clients"],
    ["📑", "Estimates", "/dashboard/estimates"],
    ["🧾", "Invoices", "/dashboard/invoices"],
    ["🏗️", "Jobs", "/dashboard/jobs"],
    ["💳", "Payments", "/dashboard/payments"],
    ["📊", "Reports", "/dashboard/reports"],
    ["👨‍💼", "Salesmen", "/dashboard/salesmen"],
    ["👤", "Users", "/dashboard/users"],
  ];

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  return (
    <>
      {/* MOBILE BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          top: 15,
          left: 15,
          zIndex: 99999,
          width: 45,
          height: 45,
          border: "none",
          borderRadius: 10,
          background: "#111827",
          color: "white",
          fontSize: 24,
        }}
        className="sidebar-mobile-button"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* SIDEBAR */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 270,
          background: "#111827",
          zIndex: 99998,
          color: "white",
          overflowY: "auto",
          boxSizing: "border-box",
          transform: open
            ? "translateX(0)"
            : undefined,
        }}
        className="main-sidebar"
      >
        {/* LOGO */}
        <div
          style={{
            padding: "25px 20px",
            borderBottom: "1px solid #374151",
          }}
        >
          <img
            src="/logo.png"
            alt="All State Roofing"
            style={{
              width: 70,
              height: 70,
              objectFit: "contain",
              display: "block",
              marginBottom: 12,
            }}
          />

          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            All State Roofing
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#9CA3AF",
            }}
          >
            Roofing & Chimney Management
          </div>
        </div>

        {/* MENU */}
        <div
          style={{
            padding: "18px 10px",
          }}
        >
          {menu.map((item) => {
            const icon = item[0];
            const name = item[1];
            const href = item[2];

            const active =
              pathname === href ||
              (href !== "/dashboard" &&
                pathname.startsWith(href + "/"));

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  height: 52,
                  width: "100%",
                  padding: "0 15px",
                  marginBottom: 8,
                  borderRadius: 12,
                  boxSizing: "border-box",
                  textDecoration: "none",
                  background: active
                    ? "#D4AF37"
                    : "#1F2937",
                  color: active
                    ? "#111827"
                    : "#ffffff",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 28,
                    textAlign: "center",
                    fontSize: 19,
                  }}
                >
                  {icon}
                </span>

                <span>{name}</span>
              </Link>
            );
          })}
        </div>

        {/* LOGOUT */}
        <div
          style={{
            borderTop: "1px solid #374151",
            padding: "18px 20px",
            marginTop: 10,
          }}
        >
          <button
            onClick={logout}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "#EF4444",
              textAlign: "left",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              padding: 10,
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* MOBILE CSS */}
      <style>{`
        .main-sidebar {
          transition: transform 0.25s ease;
        }

        .sidebar-mobile-button {
          display: none;
        }

        @media (max-width: 768px) {
          .main-sidebar {
            transform: translateX(-100%);
            width: 280px !important;
          }

          .main-sidebar[style*="translateX(0)"] {
            transform: translateX(0) !important;
          }

          .sidebar-mobile-button {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}