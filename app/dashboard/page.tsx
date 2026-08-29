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
    <div className="dashboard-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <h1>Dashboard Overview</h1>

        <p>
          Monitor your roofing projects, clients and company activity.
        </p>
      </div>

      {/* WELCOME */}
      <div className="welcome-box">
        <div>
          <h2>Welcome back 👋</h2>

          <p>
            Manage your roofing projects, clients and company activity
            from one place.
          </p>
        </div>

        <div className="welcome-icon">
          🏠
        </div>
      </div>

      {/* CARDS */}
      <div className="cards-grid">
        {cards.map((card: any) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              className="dashboard-card"
            >
              <div
                style={{
                  height: 5,
                  background: card.color,
                }}
              />

              <CardHeader>
                <div className="card-header-row">
                  <CardTitle className="card-title">
                    {card.title}
                  </CardTitle>

                  <div
                    className="card-icon"
                    style={{
                      background: card.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <h2 className="card-value">
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
      <h2 className="section-title">
        Jobs Overview
      </h2>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chart}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              fontSize={12}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={12}
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

      {/* RECENT JOBS */}
      <h2 className="section-title">
        Recent Jobs
      </h2>

      <div className="table-box">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Status</th>

              {canSeeFinances && (
                <th>Price</th>
              )}

              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {data.recentJobs.map((job: any) => (
              <tr key={job.id}>
                <td className="strong-cell">
                  {job.clients?.name || "-"}
                </td>

                <td>
                  <span
                    className="status-badge"
                    style={{
                      background:
                        job.status === "done"
                          ? "#DCFCE7"
                          : job.status === "in_progress"
                          ? "#DBEAFE"
                          : "#FEF3C7",
                      color:
                        job.status === "done"
                          ? "#166534"
                          : job.status === "in_progress"
                          ? "#1D4ED8"
                          : "#92400E",
                    }}
                  >
                    {job.status}
                  </span>
                </td>

                {canSeeFinances && (
                  <td className="strong-cell">
                    $
                    {Number(
                      job.total_price || 0
                    ).toLocaleString()}
                  </td>
                )}

                <td className="date-cell">
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
                  className="empty-cell"
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
          <h2 className="section-title">
            Salesman Performance
          </h2>

          <div className="table-box">
            <table className="dashboard-table salesman-table">
              <thead>
                <tr>
                  <th>Salesman</th>
                  <th>Sales</th>
                  <th>Profit</th>
                  <th>Commission</th>
                </tr>
              </thead>

              <tbody>
                {data.salesmanReport.map(
                  (s: any) => (
                    <tr key={s.name}>
                      <td className="strong-cell">
                        {s.name}
                      </td>

                      <td className="strong-cell">
                        $
                        {Number(
                          s.sales
                        ).toLocaleString()}
                      </td>

                      <td className="profit-cell">
                        $
                        {Number(
                          s.profit
                        ).toLocaleString()}
                      </td>

                      <td className="commission-cell">
                        $
                        {Number(
                          s.commission
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )
                )}

                {data.salesmanReport.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="empty-cell"
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
          <h2 className="section-title">
            Recent Payments
          </h2>

          <div className="table-box">
            <table className="dashboard-table payments-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {data.recentPayments.map(
                  (p: any) => (
                    <tr key={p.id}>
                      <td className="strong-cell">
                        $
                        {Number(
                          p.amount || 0
                        ).toLocaleString()}
                      </td>

                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background:
                              p.status === "paid"
                                ? "#DCFCE7"
                                : "#FEF3C7",
                            color:
                              p.status === "paid"
                                ? "#166534"
                                : "#92400E",
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}

                {data.recentPayments.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="empty-cell"
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

      <style>{`

        * {
          box-sizing: border-box;
        }

        .dashboard-page {
          width: 100%;
          min-height: 100vh;
          padding: 25px;
          background: #F9FAFB;
          overflow-x: hidden;
          font-family: Inter, Arial, sans-serif;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .page-header h1 {
          font-size: 38px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -1px;
          margin: 0;
        }

        .page-header p {
          color: #6B7280;
          margin-top: 7px;
          font-size: 16px;
          font-weight: 500;
        }

        .welcome-box {
          background: #111827;
          color: white;
          padding: 25px 30px;
          border-radius: 20px;
          margin-bottom: 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        }

        .welcome-box h2 {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 8px 0;
        }

        .welcome-box p {
          color: #CBD5E1;
          font-size: 16px;
          font-weight: 500;
          margin: 0;
        }

        .welcome-icon {
          font-size: 55px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(220px, 1fr)
          );
          gap: 20px;
        }

        .dashboard-card {
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 8px 25px rgba(0,0,0,0.05);
          background: white;
          overflow: hidden;
        }

        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .card-value {
          font-size: 30px;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }

        .section-title {
          margin-top: 40px;
          margin-bottom: 20px;
          font-size: 24px;
          font-weight: 800;
          color: #111827;
        }

        .chart-box {
          width: 100%;
          height: 320px;
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.05);
          border: 1px solid #E5E7EB;
        }

        .table-box {
          width: 100%;
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.05);
          border: 1px solid #E5E7EB;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .dashboard-table th {
          padding: 14px;
          text-align: left;
          font-size: 14px;
          font-weight: 800;
          background: #111827;
          color: #D4AF37;
          white-space: nowrap;
        }

        .dashboard-table td {
          padding: 14px;
          border-bottom: 1px solid #E5E7EB;
          white-space: nowrap;
        }

        .strong-cell {
          font-weight: 800;
          color: #111827;
          font-size: 15px;
        }

        .date-cell {
          color: #6B7280;
          font-size: 14px;
          font-weight: 600;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .profit-cell {
          padding: 14px;
          color: #16A34A;
          font-weight: 800;
          font-size: 15px;
        }

        .commission-cell {
          padding: 14px;
          color: #7C3AED;
          font-weight: 800;
          font-size: 15px;
        }

        .empty-cell {
          padding: 25px !important;
          text-align: center !important;
          color: #6B7280;
          font-size: 15px;
          font-weight: 600;
        }

        @media (max-width: 768px) {

          .dashboard-page {
            padding: 80px 12px 25px 12px;
            width: 100%;
          }

          .page-header {
            margin-bottom: 20px;
          }

          .page-header h1 {
            font-size: 28px;
            letter-spacing: -0.5px;
          }

          .page-header p {
            font-size: 14px;
            line-height: 1.5;
          }

          .welcome-box {
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 22px;
          }

          .welcome-box h2 {
            font-size: 21px;
          }

          .welcome-box p {
            font-size: 14px;
            line-height: 1.45;
            max-width: 250px;
          }

          .welcome-icon {
            font-size: 40px;
            margin-left: 10px;
          }

          .cards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .dashboard-card {
            min-width: 0;
            border-radius: 13px;
          }

          .dashboard-card .card-header {
            padding: 12px;
          }

          .dashboard-card .card-content {
            padding: 0 12px 15px 12px;
          }

          .card-title {
            font-size: 14px;
          }

          .card-icon {
            width: 34px;
            height: 34px;
            border-radius: 9px;
          }

          .card-icon svg {
            width: 17px;
            height: 17px;
          }

          .card-value {
            font-size: 22px;
            overflow-wrap: anywhere;
          }

          .section-title {
            margin-top: 28px;
            margin-bottom: 14px;
            font-size: 20px;
          }

          .chart-box {
            height: 260px;
            padding: 10px;
            border-radius: 14px;
          }

          .table-box {
            padding: 8px;
            border-radius: 14px;
            width: 100%;
          }

          .dashboard-table {
            min-width: 560px;
          }

          .dashboard-table th,
          .dashboard-table td {
            padding: 11px 10px;
            font-size: 13px;
          }

          .salesman-table {
            min-width: 620px;
          }

          .payments-table {
            min-width: 400px;
          }
        }

        @media (max-width: 380px) {

          .dashboard-page {
            padding-left: 8px;
            padding-right: 8px;
          }

          .cards-grid {
            gap: 7px;
          }

          .card-title {
            font-size: 13px;
          }

          .card-value {
            font-size: 19px;
          }

          .welcome-box {
            padding: 16px;
          }

          .welcome-icon {
            font-size: 32px;
          }
        }

      `}</style>
    </div>
  );
}