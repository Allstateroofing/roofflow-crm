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

    if (!user) {
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.log("SIDEBAR ROLE ERROR:", error);
      return;
    }

    if (data?.role) {
      setRole(data.role);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const adminMenu = [
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

  const secretaryMenu = [
    ["🏠", "Dashboard", "/dashboard"],
    ["🔎", "Search", "/dashboard/search"],
    ["👥", "Clients", "/dashboard/clients"],
    ["📑", "Estimates", "/dashboard/estimates"],
    ["🧾", "Invoices", "/dashboard/invoices"],
    ["🏗️", "Jobs", "/dashboard/jobs"],
  ];

  const salesmanMenu = [
    ["🏠", "Dashboard", "/dashboard"],
    ["🔎", "Search", "/dashboard/search"],
    ["👥", "My Clients", "/dashboard/clients"],
    ["📑", "My Estimates", "/dashboard/estimates"],
    ["🏗️", "My Jobs", "/dashboard/jobs"],
  ];

  const workerMenu = [
    ["🏠", "Dashboard", "/dashboard"],
    ["🏗️", "My Jobs", "/dashboard/jobs"],
  ];

  let menu = adminMenu;

  if (role === "secretary") {
    menu = secretaryMenu;
  }

  if (role === "salesman") {
    menu = salesmanMenu;
  }

  if (role === "worker") {
    menu = workerMenu;
  }

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setOpen(!open)}
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
          fontSize: 24,
          cursor: "pointer",
          display: "none",
        }}
        className="mobile-menu-button"
      >
        ☰
      </button>

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9998,
          }}
          className="mobile-overlay"
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          width: 270,
          background: "#111827",
          color: "#ffffff",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
        }}
        className={open ? "sidebar-open" : ""}
      >
        {/* LOGO */}
        <div
          style={{
            padding: 25,
            borderBottom: "1px solid #374151",
          }}
        >
          <img
            src="/logo.png"
            alt="All State Roofing"
            style={{
              width: 60,
              height: 60,
              objectFit: "contain",
              borderRadius: 12,
              display: "block",
            }}
          />

          <h2
            style={{
              marginTop: 15,
              marginBottom: 5,
              fontSize: 20,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            All State Roofing
          </h2>

          <p
            style={{
              color: "#9CA3AF",
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Roofing & Chimney Management
          </p>
        </div>

        {/* MENU */}
        <div
          style={{
            flex: 1,
            padding: 15,
            overflowY: "auto",
          }}
        >
          {menu.map((item) => {
            const icon = item[0];
            const title = item[1];
            const href = item[2];

            const active =
              pathname === href ||
              (href !== "/dashboard" &&
                pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  marginBottom: 8,
                  borderRadius: 12,
                  textDecoration: "none",
                  background: active ? "#D4AF37" : "#1F2937",
                  color: active ? "#111827" : "#ffffff",
                  fontWeight: 700,
                  fontSize: 15,
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  style={{
                    width: 25,
                    textAlign: "center",
                    fontSize: 18,
                  }}
                >
                  {icon}
                </span>

                <span>{title}</span>
              </Link>
            );
          })}
        </div>

        {/* LOGOUT */}
        <div
          style={{
            padding: 20,
            borderTop: "1px solid #374151",
          }}
        >
          <button
            onClick={logout}
            style={{
              background: "transparent",
              border: "none",
              color: "#EF4444",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              padding: 0,
            }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MOBILE CSS */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block !important;
          }

          aside {
            left: -270px !important;
            transition: left 0.3s ease;
          }

          aside.sidebar-open {
            left: 0 !important;
          }
        }
      `}</style>
    </>
  );
}