
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Receipt,
  BriefcaseBusiness,
  CircleDollarSign,
} from "lucide-react";

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);

  const [data, setData] = useState<any>({
    cards: {},
    chart: [],
    salesmanReport: [],
    recentJobs: [],
    recentPayments: [],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    console.log("Dashboard loading...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.log("PROFILE ERROR:", profileError);
      return;
    }

    setProfile(profileData);

    const role = profileData?.role;

    let jobsQuery = supabase.from("jobs").select(`
      id,
      status,
      total_price,
      profit,
      created_at,
      salesman_id,
      client_id,
      clients(
        name
      ),
      salesmen(
        name,
        commission_percent
      )
    `);

    if (role === "salesman") {
      jobsQuery = jobsQuery.eq("salesman_id", user.id);
    }

    if (role === "worker") {
      const { data: assignedJobs, error: workerError } = await supabase
        .from("job_workers")
        .select("job_id")
        .eq("worker_id", user.id);

      if (workerError) {
        console.log(workerError);
        return;
      }

      const jobIds = (assignedJobs || []).map((x: any) => x.job_id);

      if (jobIds.length === 0) {
        setData({
          cards: {
            jobs: 0,
          },
          chart: [],
          salesmanReport: [],
          recentJobs: [],
          recentPayments: [],
        });
        return;
      }

      jobsQuery = jobsQuery.in("id", jobIds);
    }

    const { data: jobs, error: jobsError } = await jobsQuery.order(
      "created_at",
      {
        ascending: false,
      }
    );

    if (jobsError) {
      console.log("JOBS ERROR:", jobsError);
      alert(jobsError.message);
      return;
    }

    const canSeeFinances = role === "admin";
    const canSeeSalesmanPerformance = role === "admin";

    let expenses: any[] = [];
    let payments: any[] = [];

    if (canSeeFinances) {
      const { data: expenseData } = await supabase
        .from("job_expenses")
        .select("amount");

      const { data: paymentData } = await supabase
        .from("payments")
        .select("id, amount, status");

      expenses = expenseData || [];
      payments = paymentData || [];
    }

    let revenue = 0;
    let paid = 0;
    let expense = 0;

    let scheduled = 0;
    let progress = 0;
    let done = 0;

    const salesmanData: any = {};

    (jobs || []).forEach((j: any) => {
      if (canSeeFinances) {
        revenue += Number(j.total_price || 0);
      }

      const salesman = Array.isArray(j.salesmen)
        ? j.salesmen[0]
        : j.salesmen;

      const salesmanName = salesman?.name || "No Salesman";

      if (canSeeSalesmanPerformance) {
        if (!salesmanData[salesmanName]) {
          salesmanData[salesmanName] = {
            name: salesmanName,
            sales: 0,
            profit: 0,
            commission: 0,
          };
        }

        salesmanData[salesmanName].sales += Number(
          j.total_price || 0
        );

        salesmanData[salesmanName].profit += Number(
          j.profit || 0
        );

        salesmanData[salesmanName].commission +=
          Number(j.profit || 0) *
          (Number(salesman?.commission_percent || 15) / 100);
      }

      if (j.status === "scheduled") scheduled++;
      if (j.status === "in_progress") progress++;
      if (j.status === "done") done++;
    });

    if (canSeeFinances) {
      expenses.forEach((e: any) => {
        expense += Number(e.amount || 0);
      });

      payments.forEach((p: any) => {
        if (p.status === "paid") {
          paid += Number(p.amount || 0);
        }
      });
    }

    const totalProfit = canSeeFinances
      ? (jobs || []).reduce(
          (sum: number, j: any) =>
            sum + Number(j.profit || 0),
          0
        )
      : 0;

    setData({
      cards: {
        revenue,
        paid,
        balance: revenue - paid,
        expense,
        profit: totalProfit,
        jobs: (jobs || []).length,
      },

      salesmanReport: canSeeSalesmanPerformance
        ? Object.values(salesmanData)
        : [],

      recentJobs: (jobs || []).slice(0, 5),

      recentPayments: canSeeFinances
        ? payments.slice(0, 5)
        : [],

      chart: [
        {
          name: "Scheduled",
          value: scheduled,
        },
        {
          name: "Progress",
          value: progress,
        },
        {
          name: "Done",
          value: done,
        },
      ],
    });
  }

  const role = profile?.role;

  const canSeeFinances = role === "admin";
  const canSeeSalesmanPerformance = role === "admin";

  const cards = [
    ...(canSeeFinances
      ? [
          {
            title: "Revenue",
            value: data.cards.revenue,
            icon: DollarSign,
            color: "#D4AF37",
          },
          {
            title: "Paid",
            value: data.cards.paid,
            icon: Wallet,
            color: "#16A34A",
          },
          {
            title: "Balance",
            value: data.cards.balance,
            icon: CircleDollarSign,
            color: "#2563EB",
          },
          {
            title: "Expenses",
            value: data.cards.expense,
            icon: Receipt,
            color: "#DC2626",
          },
          {
            title: "Profit",
            value: data.cards.profit,
            icon: TrendingUp,
            color: "#7C3AED",
          },
        ]
      : []),

    {
      title: "Jobs",
      value: data.cards.jobs,
      icon: BriefcaseBusiness,
      color: "#374151",
    },
  ];

  return (
    <div
  style={{
  padding: "25px",
  width: "100%",
  boxSizing: "border-box",
  overflowX: "hidden",
  background: "#F9FAFB",
  minHeight: "100vh",
  fontFamily: "Inter, sans-serif",
}}
    >
      {/* PAGE HEADER */}
      <div style={{ marginBottom: 30 }}>
        <h1
          style={{
            fontSize: "38px",
            fontWeight: 700,
            color: "#0F172A",
            letterSpacing: "-1px",
            margin: 0,
          }}
        >
          Dashboard Overview
        </h1>

        <p
          style={{
            color: "#6B7280",
            marginTop: 7,
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          Monitor your roofing projects, clients and company
          activity.
        </p>
      </div>

      {/* WELCOME */}
      <div
        style={{
          background: "#111827",
          color: "white",
          padding: "25px 30px",
          borderRadius: 20,
          marginBottom: 35,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 900,
              marginBottom: 8,
            }}
          >
            Welcome back 👋
          </h2>

          <p
            style={{
              color: "#CBD5E1",
              fontSize: 16,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Manage your roofing projects, clients and company
            activity from one place.
          </p>
        </div>

        <div
          style={{
            fontSize: 55,
          }}
        >
          🏠
        </div>
      </div>

      {/* CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        {cards.map((card: any) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              style={{
                borderRadius: 16,
                border: "1px solid #E5E7EB",
                boxShadow:
                  "0 8px 25px rgba(0,0,0,0.05)",
                background: "#FFFFFF",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: 5,
                  background: card.color,
                }}
              />

              <CardHeader>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <CardTitle
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {card.title}
                  </CardTitle>

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: card.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <Icon size={20} />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <h2
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {card.title === "Jobs"
                    ? Number(card.value || 0)
                    : "$" +
                      Number(
                        card.value || 0
                      ).toLocaleString()}
                </h2>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* JOBS OVERVIEW */}
      <h2
        style={{
          marginTop: 40,
          fontSize: 24,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        Jobs Overview
      </h2>

      <div
        style={{
          width: "100%",
          height: 320,
          marginTop: 20,
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 20,
          boxSizing: "border-box",
          boxShadow:
            "0 8px 25px rgba(0,0,0,0.05)",
          border: "1px solid #E5E7EB",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chart}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #E5E7EB",
              }}
            />

            <Bar
              dataKey="value"
              fill="#D4AF37"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <hr
        style={{
          marginTop: 40,
          border: 0,
          borderTop: "1px solid #E5E7EB",
        }}
      />

      {/* RECENT JOBS */}
      <h2
        style={{
          marginTop: 40,
          fontSize: 24,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        Recent Jobs
      </h2>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 20,
          boxShadow:
            "0 8px 25px rgba(0,0,0,0.05)",
          border: "1px solid #E5E7EB",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 650,
          }}
        >
          <thead>
            <tr
              style={{
                background: "#111827",
                color: "#D4AF37",
              }}
            >
              <th
                style={{
                  padding: 14,
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                Client
              </th>

              <th
                style={{
                  padding: 14,
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                Status
              </th>

              {canSeeFinances && (
                <th
                  style={{
                    padding: 14,
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  Price
                </th>
              )}

              <th
                style={{
                  padding: 14,
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {data.recentJobs.map((job: any) => (
              <tr
                key={job.id}
                style={{
                  borderBottom:
                    "1px solid #E5E7EB",
                }}
              >
                <td
                  style={{
                    padding: 14,
                    fontWeight: 800,
                    color: "#111827",
                    fontSize: 15,
                  }}
                >
                  {job.clients?.name || "-"}
                </td>

                <td
                  style={{
                    padding: 14,
                  }}
                >
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      background:
                        job.status === "done"
                          ? "#DCFCE7"
                          : job.status ===
                            "in_progress"
                          ? "#DBEAFE"
                          : "#FEF3C7",
                      color:
                        job.status === "done"
                          ? "#166534"
                          : job.status ===
                            "in_progress"
                          ? "#1D4ED8"
                          : "#92400E",
                    }}
                  >
                    {job.status}
                  </span>
                </td>

                {canSeeFinances && (
                  <td
                    style={{
                      padding: 14,
                      fontWeight: 800,
                      color: "#111827",
                      fontSize: 15,
                    }}
                  >
                    $
                    {Number(
                      job.total_price || 0
                    ).toLocaleString()}
                  </td>
                )}

                <td
                  style={{
                    padding: 14,
                    color: "#6B7280",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {job.created_at
                    ? new Date(
                        job.created_at
                      ).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}

            {data.recentJobs.length === 0 && (
              <tr>
                <td
                  colSpan={canSeeFinances ? 4 : 3}
                  style={{
                    padding: 25,
                    textAlign: "center",
                    color: "#6B7280",
                    fontSize: 15,
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

      {/* SALESMAN PERFORMANCE */}
      {canSeeSalesmanPerformance && (
        <>
          <hr
            style={{
              marginTop: 40,
              border: 0,
              borderTop: "1px solid #E5E7EB",
            }}
          />

          <h2
            style={{
              marginTop: 40,
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Salesman Performance
          </h2>

          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.05)",
              border: "1px solid #E5E7EB",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 650,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#111827",
                    color: "#D4AF37",
                  }}
                >
                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Salesman
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Sales
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Profit
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Commission
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.salesmanReport.map(
                  (s: any) => (
                    <tr
                      key={s.name}
                      style={{
                        borderBottom:
                          "1px solid #E5E7EB",
                      }}
                    >
                      <td
                        style={{
                          padding: 14,
                          fontWeight: 700,
                          color: "#111827",
                          fontSize: 15,
                        }}
                      >
                        {s.name}
                      </td>

                      <td
                        style={{
                          padding: 14,
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        $
                        {Number(
                          s.sales
                        ).toLocaleString()}
                      </td>

                      <td
                        style={{
                          padding: 14,
                          color: "#16A34A",
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        $
                        {Number(
                          s.profit
                        ).toLocaleString()}
                      </td>

                      <td
                        style={{
                          padding: 14,
                          color: "#7C3AED",
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        $
                        {Number(
                          s.commission
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )
                )}

                {data.salesmanReport.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: 25,
                        textAlign: "center",
                        color: "#6B7280",
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      No salesman data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* RECENT PAYMENTS */}
      {canSeeFinances && (
        <>
          <hr
            style={{
              marginTop: 40,
              border: 0,
              borderTop: "1px solid #E5E7EB",
            }}
          />

          <h2
            style={{
              marginTop: 40,
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Recent Payments
          </h2>

          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.05)",
              border: "1px solid #E5E7EB",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 500,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#111827",
                    color: "#D4AF37",
                  }}
                >
                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Amount
                  </th>

                  <th
                    style={{
                      padding: 14,
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.recentPayments.map(
                  (p: any) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom:
                          "1px solid #E5E7EB",
                      }}
                    >
                      <td
                        style={{
                          padding: 14,
                          fontWeight: 800,
                          fontSize: 15,
                        }}
                      >
                        $
                        {Number(
                          p.amount || 0
                        ).toLocaleString()}
                      </td>

                      <td
                        style={{
                          padding: 14,
                        }}
                      >
                        <span
                          style={{
                            padding:
                              "6px 12px",
                            borderRadius: 20,
                            background:
                              p.status ===
                              "paid"
                                ? "#DCFCE7"
                                : "#FEF3C7",
                            color:
                              p.status ===
                              "paid"
                                ? "#166534"
                                : "#92400E",
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}

                {data.recentPayments.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={2}
                      style={{
                        padding: 25,
                        textAlign: "center",
                        color: "#6B7280",
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}