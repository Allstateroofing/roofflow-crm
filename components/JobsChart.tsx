"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type JobsChartProps = {
  newJobs: number;
  inProgress: number;
  done: number;
};

export default function JobsChart({
  newJobs,
  inProgress,
  done,
}: JobsChartProps) {
  const data = [
    {
      name: "New",
      value: newJobs,
    },
    {
      name: "In Progress",
      value: inProgress,
    },
    {
      name: "Done",
      value: done,
    },
  ];

  const COLORS = [
    "#facc15",
    "#3b82f6",
    "#22c55e",
  ];

  const total = newJobs + inProgress + done;

  return (
    <div
      style={{
        width: "100%",
        height: 350,
        position: "relative",
      }}
    >
      {total === 0 ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6B7280",
            fontWeight: 600,
          }}
        >
          No jobs yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={105}
              innerRadius={55}
              paddingAngle={3}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}