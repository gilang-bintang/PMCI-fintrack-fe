const API_BASE_URL = "http://localhost:8000"

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  merchant_canonical: string
  category: "Income" | "Food & Dining" | "Transport & Mobility" | "Bills & Utilities" | "Shopping & Entertainment"
  confidence: number
  recurring: boolean
  import_id: string
}

export interface Summary {
  income: number
  spend: number
  net: number
}

export interface CategorySummary extends Summary {
  count: number
}

export interface UploadResponse {
  import_id: string
  parsed_count: number
}

// API functions
export const api = {
  uploadPDFs: async (files: File[]): Promise<UploadResponse> => {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload PDFs")
    }

    return response.json()
  },

  getTransactions: async (start?: string, end?: string): Promise<{ transactions: Transaction[] }> => {
    const params = new URLSearchParams()
    if (start) params.append("start", start)
    if (end) params.append("end", end)

    const response = await fetch(`${API_BASE_URL}/transactions?${params}`)
    if (!response.ok) {
      throw new Error("Failed to fetch transactions")
    }

    return response.json()
  },

  getDailySummary: async (): Promise<{ summary: Record<string, Summary> }> => {
    const response = await fetch(`${API_BASE_URL}/summary/daily`)
    if (!response.ok) {
      throw new Error("Failed to fetch daily summary")
    }
    return response.json()
  },

  getWeeklySummary: async (): Promise<{ summary: Record<string, Summary> }> => {
    const response = await fetch(`${API_BASE_URL}/summary/weekly`)
    if (!response.ok) {
      throw new Error("Failed to fetch weekly summary")
    }
    return response.json()
  },

  getMonthlySummary: async (): Promise<{ summary: Record<string, Summary> }> => {
    const response = await fetch(`${API_BASE_URL}/summary/monthly`)
    if (!response.ok) {
      throw new Error("Failed to fetch monthly summary")
    }
    return response.json()
  },

  getCategorySummary: async (): Promise<{ summary: Record<string, CategorySummary> }> => {
    const response = await fetch(`${API_BASE_URL}/summary/category`)
    if (!response.ok) {
      throw new Error("Failed to fetch category summary")
    }
    return response.json()
  },

  getRecurringTransactions: async (): Promise<{ transactions: Transaction[] }> => {
    const response = await fetch(`${API_BASE_URL}/recurring`)
    if (!response.ok) {
      throw new Error("Failed to fetch recurring transactions")
    }
    return response.json()
  },
}
