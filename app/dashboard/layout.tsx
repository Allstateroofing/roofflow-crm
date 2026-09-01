"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { SessionProvider, useSession } from "@/components/SessionProvider";
import { canReach } from "@/lib/permissions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile } = useSession();

  const router = useRouter();
  const pathname = usePathname();

  // Nje roje e vetme per te gjitha faqet — perndryshe adresa e shkruar me dore
  // hap faqe qe menyja i fsheh (p.sh. sekretarja te /dashboard/reports).
  useEffect(() => {
    if (profile && !canReach(profile.role, pathname)) {
      router.replace("/dashboard");
    }
  }, [profile, pathname, router]);

  function roleTitle() {
    if (profile?.role === "admin") return "Administrator";
    if (profile?.role === "secretary") return "Office";
    if (profile?.role === "manager") return "Manager";
    if (profile?.role === "salesman") {
      return profile?.full_name || "Salesman";
    }
    if (profile?.role === "worker") return "Worker";

    return "User";
  }

  function roleAccount() {
    if (profile?.role === "admin") return "Admin Account";
    if (profile?.role === "secretary") return "Secretary Account";
    if (profile?.role === "manager") return "Manager Account";
    if (profile?.role === "salesman") return "Salesman Account";
    if (profile?.role === "worker") return "Worker Account";

    return "";
  }

  const allowed = profile ? canReach(profile.role, pathname) : false;

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
          className="dashboard-topbar"
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
          className="dashboard-content"
          style={{
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Mos e nxirr permbajtjen para se te dihet roli — perndryshe faqja
              e ndaluar duket per nje çast para se roja ta kthej mbrapsht. */}
          {allowed ? children : null}
        </main>
      </div>

      <style>{`
        .dashboard-content {
          padding: 30px;
        }

        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0 !important;
            width: 100% !important;
          }

          /* Sidebar-i ka tashme nje header fiks ne mobile — mos e dyfisho. */
          .dashboard-topbar {
            display: none !important;
          }

          /* Header-i mobil eshte fixed (64px) — lere hapesire ose permbajtja fshihet pas tij. */
          .dashboard-content {
            padding: 16px;
            padding-top: 80px;
          }
        }
      `}</style>
    </div>
  );
}