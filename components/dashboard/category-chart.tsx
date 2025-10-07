"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface CategoryChartProps {
  data: Record<string, { income: number; spend: number; count: number }>
}

const COLORS = {
  "Food & Dining": "#f97316",
  "Transport & Mobility": "#3b82f6",
  "Bills & Utilities": "#8b5cf6",
  "Shopping & Entertainment": "#ec4899",
  Income: "#10b981",
}

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = Object.entries(data)
    .filter(([category, values]) => category !== "Income" && values.spend > 0)
    .map(([category, values]) => ({
      name: category,
      value: values.spend,
      count: values.count,
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">No spending data available</div>
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#6b7280"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props) => [
              formatCurrency(value),
              `${name} (${props.payload.count} transactions)`,
            ]}
          />
          <Legend formatter={(value) => <span className="text-sm">{value}</span>} wrapperStyle={{ fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
