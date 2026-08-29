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
      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <button
          onClick={() => setOpen(true)}
          className="mobile-menu-button"
          aria-label="Open menu"
        >
          ☰
        </button>

        <div className="mobile-title">
          All State Roofing
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`main-sidebar ${open ? "mobile-open" : ""}`}>

        {/* LOGO */}
        <div className="sidebar-header">

          <img
            src="/logo.png"
            alt="All State Roofing"
            className="sidebar-logo"
          />

          <div className="sidebar-company">
            All State Roofing
          </div>

          <div className="sidebar-subtitle">
            Roofing & Chimney Management
          </div>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">
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
                className={`sidebar-link ${
                  active ? "sidebar-link-active" : ""
                }`}
              >
                <span className="sidebar-icon">
                  {icon}
                </span>

                <span>{name}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="sidebar-logout">
          <button
            onClick={logout}
            className="logout-button"
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <style>{`

        /* =========================
           DESKTOP
        ========================= */

        .main-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 270px;
          background: #111827;
          color: white;
          z-index: 99998;
          overflow-y: auto;
          box-sizing: border-box;
          transition: transform 0.25s ease;
        }

        .sidebar-header {
          padding: 25px 20px;
          border-bottom: 1px solid #374151;
        }

        .sidebar-logo {
          width: 70px;
          height: 70px;
          object-fit: contain;
          display: block;
          margin-bottom: 12px;
        }

        .sidebar-company {
          font-size: 22px;
          font-weight: 800;
          color: white;
        }

        .sidebar-subtitle {
          margin-top: 6px;
          font-size: 13px;
          color: #9ca3af;
        }

        .sidebar-menu {
          padding: 18px 10px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 14px;
          height: 52px;
          width: 100%;
          padding: 0 15px;
          margin-bottom: 8px;
          border-radius: 12px;
          box-sizing: border-box;
          text-decoration: none;
          background: #1f2937;
          color: white;
          font-size: 16px;
          font-weight: 700;
          transition: 0.15s ease;
        }

        .sidebar-link:hover {
          background: #374151;
        }

        .sidebar-link-active {
          background: #d4af37 !important;
          color: #111827 !important;
        }

        .sidebar-icon {
          width: 28px;
          min-width: 28px;
          text-align: center;
          font-size: 19px;
        }

        .sidebar-logout {
          border-top: 1px solid #374151;
          padding: 18px 20px;
          margin-top: 10px;
        }

        .logout-button {
          width: 100%;
          border: none;
          background: transparent;
          color: #ef4444;
          text-align: left;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          padding: 10px;
        }

        .mobile-header {
          display: none;
        }

        .sidebar-overlay {
          display: none;
        }


        /* =========================
           MOBILE
        ========================= */

        @media (max-width: 768px) {

          .mobile-header {
            position: fixed;
            display: flex;
            align-items: center;
            top: 0;
            left: 0;
            right: 0;
            height: 64px;
            background: #111827;
            z-index: 99990;
            padding: 0 14px;
            box-sizing: border-box;
          }

          .mobile-menu-button {
            width: 44px;
            height: 44px;
            border: none;
            border-radius: 10px;
            background: #1f2937;
            color: white;
            font-size: 24px;
            cursor: pointer;
          }

          .mobile-title {
            margin-left: 14px;
            color: white;
            font-size: 18px;
            font-weight: 800;
          }

          .main-sidebar {
            width: 280px;
            transform: translateX(-100%);
            box-shadow: 10px 0 30px rgba(0,0,0,0.35);
          }

          .main-sidebar.mobile-open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.55);
            z-index: 99997;
          }

          .sidebar-header {
            padding-top: 80px;
          }
        }

      `}</style>
    </>
  );
}