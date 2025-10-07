"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Repeat, Filter, Calendar } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { TransactionsTable } from "@/components/dashboard/transactions-table"

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const queryClient = useQueryClient()

  // Fetch all transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.getTransactions(),
  })

  // Fetch recurring transactions
  const { data: recurringData, isLoading: recurringLoading } = useQuery({
    queryKey: ["recurring"],
    queryFn: api.getRecurringTransactions,
  })

  const transactions = transactionsData?.transactions || []
  const recurringTransactions = recurringData?.transactions || []

  // Export transactions to CSV
  const exportTransactions = () => {
    const csvContent = [
      ["Date", "Description", "Amount", "Category", "Merchant", "Recurring"].join(","),
      ...transactions.map((t) =>
        [
          t.date,
          `"${t.description}"`,
          t.amount,
          t.category,
          `"${t.merchant_canonical}"`,
          t.recurring ? "Yes" : "No",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate statistics
  const totalTransactions = transactions.length
  const recurringCount = recurringTransactions.length
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalSpend = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const categoryStats = transactions.reduce(
    (acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { count: 0, amount: 0 }
      }
      acc[t.category].count++
      acc[t.category].amount += Math.abs(t.amount)
      return acc
    },
    {} as Record<string, { count: number; amount: number }>,
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Transaction Management</h1>
                <p className="text-muted-foreground">Manage and analyze your transaction data</p>
              </div>
            </div>

            <Button onClick={exportTransactions} variant="outline" className="bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recurring</CardTitle>
                <Repeat className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{recurringCount}</div>
                <p className="text-xs text-muted-foreground">
                  {totalTransactions > 0 ? Math.round((recurringCount / totalTransactions) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <Calendar className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                <p className="text-xs text-muted-foreground">All time earnings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <Calendar className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpend)}</div>
                <p className="text-xs text-muted-foreground">All time expenses</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Transaction count and spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(categoryStats)
                  .sort(([, a], [, b]) => b.amount - a.amount)
                  .map(([category, stats]) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Badge variant="outline" className="mb-1">
                          {category}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{stats.count} transactions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(stats.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {totalSpend > 0 ? Math.round((stats.amount / totalSpend) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Transactions Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View and manage your transaction data</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All Transactions ({totalTransactions})</TabsTrigger>
                  <TabsTrigger value="recurring">Recurring ({recurringCount})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <TransactionsTable transactions={transactions} isLoading={transactionsLoading} />
                </TabsContent>

                <TabsContent value="recurring" className="mt-6">
                  {recurringLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : recurringTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Recurring Transactions</h3>
                      <p className="text-muted-foreground">
                        Upload more bank statements to detect recurring payment patterns
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        Showing {recurringTransactions.length} recurring transactions detected from your data
                      </div>
                      <TransactionsTable transactions={recurringTransactions} isLoading={false} />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
