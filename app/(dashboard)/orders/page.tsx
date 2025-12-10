"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { OrdersTable } from "@/components/orders-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Order {
  id: string
  name: string
  phone: string
  address: string
  price: number
  referralCode: string
  status: "pending" | "completed" | "rejected"
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchCode, setSearchCode] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const loadOrders = async () => {
    try {
      setError("")
      const sheetId = process.env.NEXT_PUBLIC_SHEET_ID
      if (!sheetId) {
        throw new Error("Sheet ID not configured. Check your .env.local file.")
      }

      console.log("Fetching orders from sheet:", sheetId)
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq=SELECT *`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`)
      }

      const text = await response.text()
      console.log("Raw response preview:", text.substring(0, 150))
      console.log("Raw response length:", text.length)

      // Parse Google Visualization API response - handle JSONP format
      let jsonString = text.trim()
      
      // The response format is: ({"version":"0.6",...})
      // Remove outer parentheses if present
      while (jsonString.startsWith("(") && jsonString.endsWith(")")) {
        jsonString = jsonString.slice(1, -1).trim()
      }
      
      // Handle google.visualization.Query.setResponse format
      if (jsonString.includes("google.visualization.Query.setResponse(")) {
        const startIdx = jsonString.indexOf("(") + 1
        const endIdx = jsonString.lastIndexOf(")")
        if (startIdx > 0 && endIdx > startIdx) {
          jsonString = jsonString.substring(startIdx, endIdx).trim()
        }
      }
      
      // Clean up any trailing semicolons or whitespace
      jsonString = jsonString.trim().replace(/;?\s*$/, "")

      console.log("Extracted JSON preview:", jsonString.substring(0, 200))
      console.log("JSON starts with:", jsonString.substring(0, 10))
      console.log("JSON ends with:", jsonString.substring(Math.max(0, jsonString.length - 10)))
      
      let data
      try {
        data = JSON.parse(jsonString)
      } catch (parseError: any) {
        console.error("JSON parse error:", parseError)
        console.error("Failed JSON string (first 500 chars):", jsonString.substring(0, 500))
        console.error("Failed JSON string (last 100 chars):", jsonString.substring(Math.max(0, jsonString.length - 100)))
        throw new Error(`Failed to parse sheet data: ${parseError.message}. Make sure the sheet is publicly viewable.`)
      }
      
      console.log("Parsed data:", data)

      if (!data.table || !data.table.rows) {
        console.warn("No table or rows found in response")
        setOrders([])
        setError("No orders found in sheet. Make sure the sheet has data and is publicly viewable.")
        return
      }

      // Skip header row (first row) and convert to Order objects
      const parsedOrders: Order[] = data.table.rows
        .slice(1) // Skip header row
        .map((row: any, index: number) => {
          // Handle both formats: row.c (with values) or row array
          const cells = row.c || []
          
          // Skip rows where first cell (id) is empty
          if (!cells[0] || !cells[0].v) {
            return null
          }

          return {
            id: String(cells[0]?.v || ""),
            name: String(cells[1]?.v || ""),
            phone: String(cells[2]?.v || ""),
            address: String(cells[3]?.v || ""),
            price: Number.parseFloat(cells[4]?.v || 0),
            referralCode: String(cells[5]?.v || ""),
            status: (cells[6]?.v || "pending") as "pending" | "completed" | "rejected",
          }
        })
        .filter((order: Order | null) => order !== null && order.id !== "") as Order[]

      console.log("Parsed orders:", parsedOrders)
      setOrders(parsedOrders)
      setError("")
    } catch (err: any) {
      console.error("Failed to load orders:", err)
      const errorMessage = err.message || "Failed to load orders from Google Sheets"
      setError(`${errorMessage}. Make sure: 1) Sheet is publicly viewable, 2) Sheet ID is correct, 3) Sheet has headers in row 1.`)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setLoading(true)
    loadOrders()
  }

  const filteredOrders = useMemo(() => {
    if (!searchCode) return orders
    const lowerSearch = searchCode.toLowerCase()
    return orders.filter((order) => order.referralCode.toLowerCase().includes(lowerSearch))
  }, [orders, searchCode])

  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    try {
      const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
      if (!appsScriptUrl) throw new Error("Apps Script URL not configured")

      const response = await fetch(`${appsScriptUrl}?action=updateStatus&orderId=${orderId}&status=${newStatus}`)
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to update order")
      }

      // Update local state
      setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)))
      setError("")
      
      // Refresh orders from sheet to ensure sync
      setTimeout(() => {
        loadOrders()
      }, 500)
    } catch (err) {
      console.error("[v0] Failed to update order:", err)
      setError("Failed to update order status")
    }
  }, [])

  const handleApprove = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const newStatus = order.status === "completed" ? "pending" : "completed"
    await handleStatusChange(orderId, newStatus)
  }, [orders, handleStatusChange])

  const handleReject = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const newStatus = order.status === "rejected" ? "pending" : "rejected"
    await handleStatusChange(orderId, newStatus)
  }, [orders, handleStatusChange])

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-2">Manage and track all Grow Essence Hair Serum orders</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing || loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
          <p className="font-semibold mb-1">Error loading orders:</p>
          <p>{error}</p>
          <p className="mt-2 text-xs">
            Sheet ID: {process.env.NEXT_PUBLIC_SHEET_ID ? "✅ Configured" : "❌ Missing"}
          </p>
          <p className="text-xs">
            Check browser console (F12) for detailed error messages.
          </p>
        </div>
      )}

      {!error && orders.length === 0 && !loading && (
        <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg text-sm border border-yellow-200">
          <p className="font-semibold mb-1">No orders found</p>
          <p>Make sure:</p>
          <ul className="list-disc list-inside mt-1 text-xs space-y-1">
            <li>Your Google Sheet has data (at least one order row)</li>
            <li>The sheet is publicly viewable (Share → Anyone with the link can view)</li>
            <li>Headers are in row 1: id, name, phone, address, price, referralCode, status, timestamp</li>
            <li>Sheet ID in .env.local matches your sheet</li>
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by referral code (e.g., ALEX001)..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
            {searchCode && ` (filtered by "${searchCode}")`}
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <OrdersTable orders={filteredOrders} onApprove={handleApprove} onReject={handleReject} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
