"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface SpendingChartProps {
  data: Record<string, { income: number; spend: number; net: number }>
  viewType: "daily" | "weekly" | "monthly"
}

export function SpendingChart({ data, viewType }: SpendingChartProps) {
  const chartData = Object.entries(data)
    .map(([key, values]) => ({
      period: key,
      income: values.income,
      spend: values.spend,
      net: values.net,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-10) // Show last 10 periods

  const formatXAxis = (value: string) => {
    if (viewType === "daily") {
      return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
    } else if (viewType === "weekly") {
      return value.replace("W", "Week ")
    } else {
      return new Date(value + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available for the selected period
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="period" tickFormatter={formatXAxis} fontSize={12} />
          <YAxis tickFormatter={(value) => formatCurrency(value).replace("Rp", "")} fontSize={12} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === "income" ? "Income" : name === "spend" ? "Spending" : "Net",
            ]}
            labelFormatter={(label) => `Period: ${formatXAxis(label)}`}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" radius={[2, 2, 0, 0]} />
          <Bar dataKey="spend" fill="#ef4444" name="Spending" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
