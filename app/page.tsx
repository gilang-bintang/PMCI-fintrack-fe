"use client"

import type React from "react"
import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react"
import { api } from "@/lib/api"
import { formatCurrency, formatDate, getDateRangePresets, cn } from "@/lib/utils"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { format, startOfMonth, subMonths } from "date-fns"

type DateRange = {
  start: Date
  end: Date
  label: string
}

type ViewType = "daily" | "weekly" | "monthly"

interface UploadedFile {
  file: File
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

const MOCK_TRANSACTIONS = [
  {
    id: "1",
    date: "2024-01-15",
    description: "Salary Payment",
    amount: 5000000,
    category: "Income",
    is_recurring: true,
    import_id: "mock-1",
  },
  {
    id: "2",
    date: "2024-01-16",
    description: "Grocery Shopping - Supermarket",
    amount: -450000,
    category: "Food & Dining",
    is_recurring: false,
    import_id: "mock-1",
  },
  {
    id: "3",
    date: "2024-01-17",
    description: "Electric Bill Payment",
    amount: -280000,
    category: "Utilities",
    is_recurring: true,
    import_id: "mock-1",
  },
  {
    id: "4",
    date: "2024-01-18",
    description: "Coffee Shop - Daily Brew",
    amount: -45000,
    category: "Food & Dining",
    is_recurring: false,
    import_id: "mock-1",
  },
  {
    id: "5",
    date: "2024-01-19",
    description: "Gas Station Fill Up",
    amount: -320000,
    category: "Transportation",
    is_recurring: false,
    import_id: "mock-1",
  },
  {
    id: "6",
    date: "2024-01-20",
    description: "Netflix Subscription",
    amount: -199000,
    category: "Entertainment",
    is_recurring: true,
    import_id: "mock-1",
  },
  {
    id: "7",
    date: "2024-01-21",
    description: "Restaurant Dinner",
    amount: -650000,
    category: "Food & Dining",
    is_recurring: false,
    import_id: "mock-1",
  },
  {
    id: "8",
    date: "2024-01-22",
    description: "Online Shopping - Electronics",
    amount: -1200000,
    category: "Shopping",
    is_recurring: false,
    import_id: "mock-1",
  },
  {
    id: "9",
    date: "2024-01-23",
    description: "Gym Membership",
    amount: -350000,
    category: "Health & Fitness",
    is_recurring: true,
    import_id: "mock-1",
  },
  {
    id: "10",
    date: "2024-01-24",
    description: "Freelance Project Payment",
    amount: 1500000,
    category: "Income",
    is_recurring: false,
    import_id: "mock-1",
  },
]

const MOCK_CATEGORY_SUMMARY = {
  "Food & Dining": 1145000,
  Transportation: 320000,
  Utilities: 280000,
  Entertainment: 199000,
  Shopping: 1200000,
  "Health & Fitness": 350000,
}

const MOCK_DAILY_SUMMARY = {
  "2024-01-15": { income: 5000000, spending: 0 },
  "2024-01-16": { income: 0, spending: 450000 },
  "2024-01-17": { income: 0, spending: 280000 },
  "2024-01-18": { income: 0, spending: 45000 },
  "2024-01-19": { income: 0, spending: 320000 },
  "2024-01-20": { income: 0, spending: 199000 },
  "2024-01-21": { income: 0, spending: 650000 },
  "2024-01-22": { income: 0, spending: 1200000 },
  "2024-01-23": { income: 0, spending: 350000 },
  "2024-01-24": { income: 1500000, spending: 0 },
}

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>(() => {
    const presets = getDateRangePresets()
    return presets.thisMonth
  })
  const [viewType, setViewType] = useState<ViewType>("daily")

  // Upload states
  const [showUpload, setShowUpload] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ import_id: string; parsed_count: number } | null>(null)

  // Format dates for API calls
  const startDate = format(selectedRange.start, "yyyy-MM-dd")
  const endDate = format(selectedRange.end, "yyyy-MM-dd")

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", startDate, endDate],
    queryFn: () => Promise.resolve({ transactions: MOCK_TRANSACTIONS }),
  })

  const { data: dailySummary } = useQuery({
    queryKey: ["summary", "daily"],
    queryFn: () => Promise.resolve({ summary: MOCK_DAILY_SUMMARY }),
    enabled: viewType === "daily",
  })

  const { data: weeklySummary } = useQuery({
    queryKey: ["summary", "weekly"],
    queryFn: () => Promise.resolve({ summary: {} }),
    enabled: viewType === "weekly",
  })

  const { data: monthlySummary } = useQuery({
    queryKey: ["summary", "monthly"],
    queryFn: () => Promise.resolve({ summary: {} }),
    enabled: viewType === "monthly",
  })

  const { data: categorySummary, refetch: refetchCategory } = useQuery({
    queryKey: ["summary", "category"],
    queryFn: () => Promise.resolve({ summary: MOCK_CATEGORY_SUMMARY }),
  })

  const transactions = transactionsData?.transactions || []

  // Calculate KPIs from current transactions
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalSpend = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netAmount = totalIncome - totalSpend

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: api.uploadPDFs,
    onMutate: () => {
      setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading" as const })))
    },
    onSuccess: (data) => {
      setFiles((prev) => prev.map((f) => ({ ...f, status: "success" as const })))
      setUploadResult(data)
      // Refetch data after successful upload
      refetchTransactions()
      refetchCategory()
    },
    onError: (error) => {
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error" as const, error: error.message })))
    },
  })

  const handleRangeChange = (value: string) => {
    const presets = getDateRangePresets()
    if (value === "thisMonth") {
      setSelectedRange(presets.thisMonth)
    } else if (value === "lastMonth") {
      setSelectedRange(presets.lastMonth)
    } else if (value === "last3Months") {
      const now = new Date()
      const start = startOfMonth(subMonths(now, 2))
      setSelectedRange({ start, end: now, label: "Last 3 Months" })
    }
  }

  const getSummaryData = () => {
    switch (viewType) {
      case "daily":
        return dailySummary?.summary || {}
      case "weekly":
        return weeklySummary?.summary || {}
      case "monthly":
        return monthlySummary?.summary || {}
      default:
        return {}
    }
  }

  // Upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const pdfFiles = newFiles.filter((file) => file.type === "application/pdf")
    const uploadedFiles: UploadedFile[] = pdfFiles.map((file) => ({
      file,
      status: "pending",
    }))
    setFiles((prev) => [...prev, ...uploadedFiles])
    setUploadResult(null)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (files.length === 0) return
    const fileList = files.map((f) => f.file)
    uploadMutation.mutate(fileList)
  }

  const resetUpload = () => {
    setFiles([])
    setUploadResult(null)
    uploadMutation.reset()
    setShowUpload(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Spending Dashboard</h1>
              <p className="text-muted-foreground">Your spending insights and analytics</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Upload Button */}
              <Button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload PDFs
              </Button>

              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select onValueChange={handleRangeChange} defaultValue="thisMonth">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="last3Months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Upload Bank Statements</CardTitle>
                <CardDescription>Upload PDF bank statements to extract and analyze your transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Upload Success */}
                {uploadResult && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Successfully processed {files.length} file{files.length !== 1 ? "s" : ""} and extracted{" "}
                      <strong>{uploadResult.parsed_count} transactions</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Upload Area */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-4",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop PDF files here</h3>
                  <p className="text-muted-foreground mb-4">or click to browse your files</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer bg-transparent">
                      Select Files
                    </Button>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {files.map((uploadedFile, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{uploadedFile.file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {uploadedFile.status === "pending" && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                              Pending
                            </Badge>
                          )}
                          {uploadedFile.status === "uploading" && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Processing...
                            </Badge>
                          )}
                          {uploadedFile.status === "success" && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          )}
                          {uploadedFile.status === "error" && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          {uploadedFile.status === "pending" && (
                            <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {uploadMutation.isPending && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Processing files...</span>
                      <span className="text-sm text-muted-foreground">Please wait</span>
                    </div>
                    <Progress value={undefined} className="w-full" />
                  </div>
                )}

                {/* Error Message */}
                {uploadMutation.isError && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {uploadMutation.error?.message || "Failed to process files. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {files.length > 0 && !uploadResult && (
                    <Button onClick={handleUpload} disabled={uploadMutation.isPending || files.length === 0}>
                      {uploadMutation.isPending
                        ? "Processing..."
                        : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
                    </Button>
                  )}

                  {uploadResult && <Button onClick={resetUpload}>Upload More Files</Button>}

                  {files.length > 0 && !uploadMutation.isPending && !uploadResult && (
                    <Button variant="outline" onClick={resetUpload}>
                      Clear All
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => setShowUpload(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Content */}
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedRange.label} • {transactions.filter((t) => t.amount > 0).length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpend)}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedRange.label} • {transactions.filter((t) => t.amount < 0).length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
                  <DollarSign className={`h-4 w-4 ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(Math.abs(netAmount))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {netAmount >= 0 ? "Surplus" : "Deficit"} • {transactions.length} total transactions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Spending Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trends</CardTitle>
                  <CardDescription>Income vs spending over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                    <TabsContent value={viewType} className="mt-4">
                      <SpendingChart data={getSummaryData()} viewType={viewType} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>Where your money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryChart data={categorySummary?.summary || {}} />
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  {transactions.length} transactions from {formatDate(startDate)} to {formatDate(endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionsTable transactions={transactions} isLoading={transactionsLoading} />
              </CardContent>
            </Card>
          </>
        </div>
      </div>
    </div>
  )
}
