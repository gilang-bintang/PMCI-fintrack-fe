import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Jakarta timezone formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return format(date, "dd/MM/yyyy")
}

export function formatDateRange(start: Date, end: Date): string {
  return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`
}

export function getCategoryColor(category: string): string {
  const colors = {
    Income: "bg-green-100 text-green-800 border-green-200",
    "Food & Dining": "bg-orange-100 text-orange-800 border-orange-200",
    "Transport & Mobility": "bg-blue-100 text-blue-800 border-blue-200",
    "Bills & Utilities": "bg-purple-100 text-purple-800 border-purple-200",
    "Shopping & Entertainment": "bg-pink-100 text-pink-800 border-pink-200",
  }
  return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
}

export function getDateRangePresets() {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  return {
    thisMonth: { start: thisMonthStart, end: now, label: "This Month" },
    lastMonth: { start: lastMonthStart, end: lastMonthEnd, label: "Last Month" },
  }
}
