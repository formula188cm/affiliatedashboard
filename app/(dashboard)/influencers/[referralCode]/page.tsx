"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Copy, Check } from "lucide-react"

interface Influencer {
  id: string
  name: string
  referralCode: string
  commissionPercentage: number
}

interface Order {
  id: string
  name: string
  phone: string
  address: string
  price: number
  referralCode: string
  status: "pending" | "completed" | "rejected"
}

export default function InfluencerDetailPage() {
  const params = useParams()
  const referralCode = params.referralCode as string

  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch influencers
        const infRes = await fetch("/api/influencers")
        if (!infRes.ok) throw new Error("Failed to fetch influencers")
        const infData = await infRes.json()
        const foundInfluencer = infData.find((inf: Influencer) => inf.referralCode === referralCode)
        setInfluencer(foundInfluencer || null)

        // Fetch orders from Google Sheets public JSON feed
        const sheetId = process.env.NEXT_PUBLIC_SHEET_ID
        if (!sheetId) throw new Error("Sheet ID not configured")

        const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq=SELECT *`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sheet: ${response.status}`)
        }

        const text = await response.text()

        // Parse Google Visualization API response - handle JSONP format
        let jsonString = text.trim()
        
        // The response format is: ({"version":"0.6",...})
        // Remove outer parentheses if present (handle nested parentheses)
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

        let data
        try {
          data = JSON.parse(jsonString)
        } catch (parseError: any) {
          console.error("JSON parse error:", parseError)
          console.error("Failed JSON string:", jsonString.substring(0, 500))
          throw new Error(`Failed to parse sheet data: ${parseError.message}`)
        }

        if (!data.table || !data.table.rows) {
          setAllOrders([])
          return
        }

        // Skip header row and convert to Order objects
        const parsedOrders: Order[] = data.table.rows
          .slice(1) // Skip header row
          .map((row: any) => {
            const cells = row.c || []
            if (!cells[0] || !cells[0].v) return null
            
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

        setAllOrders(parsedOrders)
        setError("")
      } catch (err) {
        console.error("Failed to load data:", err)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [referralCode])

  const influencerOrders = useMemo(() => {
    return allOrders.filter((order) => order.referralCode === referralCode && order.status === "completed")
  }, [allOrders, referralCode])

  const totalRevenue = useMemo(() => {
    return influencerOrders.reduce((sum, order) => sum + order.price, 0)
  }, [influencerOrders])

  const totalCommission = useMemo(() => {
    if (!influencer) return 0
    return (totalRevenue * influencer.commissionPercentage) / 100
  }, [totalRevenue, influencer])

  const referralLink = useMemo(() => {
    // Production ordering site URL
    const PRODUCTION_ORDER_URL = "https://growessence.vercel.app"
    
    const envUrl = process.env.NEXT_PUBLIC_ORDER_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
    let baseUrl = ""
    
    if (envUrl) {
      const cleanUrl = envUrl.replace(/\/$/, "")
      // Ensure URL has protocol
      if (cleanUrl && !cleanUrl.match(/^https?:\/\//)) {
        baseUrl = `https://${cleanUrl}`
      } else {
        baseUrl = cleanUrl
      }
    } else {
      // Fallback to production URL (not localhost)
      baseUrl = PRODUCTION_ORDER_URL
    }
    
    if (!baseUrl || !referralCode) return ""
    return `${baseUrl}/?ref=${encodeURIComponent(referralCode)}`
  }, [referralCode])

  const handleCopyLink = useCallback(async () => {
    if (!referralLink) return
    
    try {
      // Use modern clipboard API with fallback
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referralLink)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea")
        textArea.value = referralLink
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy referral link", err)
      // Silent fail - don't break UX
    }
  }, [referralLink])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!influencer) {
    return (
      <div className="p-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/influencers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Influencers
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Influencer not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <Button asChild variant="ghost">
        <Link href="/influencers">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Influencers
        </Link>
      </Button>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div>
        <h1 className="text-3xl font-bold">{influencer.name}</h1>
        <p className="text-muted-foreground mt-2">ID: {influencer.referralCode}</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Referral Link</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground break-all">{referralLink}</div>
          <Button variant="outline" size="sm" className="w-full md:w-auto" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{influencer.commissionPercentage}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{influencerOrders.length} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">₹{totalCommission.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {influencerOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No approved orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Address</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {influencerOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{order.name}</td>
                      <td className="py-3 px-4 text-sm">{order.phone}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{order.address}</td>
                      <td className="py-3 px-4 text-sm font-semibold">₹{order.price.toFixed(0)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-primary">
                        ₹{((order.price * influencer.commissionPercentage) / 100).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
