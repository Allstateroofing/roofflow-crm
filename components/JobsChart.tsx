"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function JobsChart({
  newJobs,
  inProgress,
  done,
}: {
  newJobs: number;
  inProgress: number;
  done: number;
}) {
  const data = [
    { name: "New", value: newJobs },
    { name: "In Progress", value: inProgress },
    { name: "Done", value: done },
  ];

  const COLORS = ["#facc15", "#3b82f6", "#22c55e"];

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={110} label>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}