"use client"

import { useState, useEffect } from "react"
import { InfluencerForm } from "@/components/influencer-form"
import { InfluencerTable } from "@/components/influencer-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Influencer {
  id: string
  name: string
  referralCode: string
  commissionPercentage: number
  createdAt: string
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadInfluencers = async () => {
      try {
        const response = await fetch("/api/influencers")
        if (!response.ok) throw new Error("Failed to fetch influencers")
        const data = await response.json()
        setInfluencers(data)
        setError("")
      } catch (err) {
        console.error("[v0] Failed to load influencers:", err)
        setError("Failed to load influencers")
        setInfluencers([])
      } finally {
        setLoading(false)
      }
    }
    loadInfluencers()
  }, [])

  const handleAddInfluencer = async (data: {
    name: string
    referralCode: string
    commissionPercentage: number
  }) => {
    try {
      setError("")
      const response = await fetch("/api/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to add influencer")
      }
      
      const newInfluencer = result
      setInfluencers([...influencers, newInfluencer])
      setError("")
      
      // Reload influencers to ensure sync
      const refreshResponse = await fetch("/api/influencers")
      if (refreshResponse.ok) {
        const refreshed = await refreshResponse.json()
        setInfluencers(refreshed)
      }
    } catch (err: any) {
      console.error("Failed to add influencer:", err)
      setError(err.message || "Failed to add influencer. Please check your configuration.")
    }
  }

  const handleDeleteInfluencer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this influencer?")) {
      return
    }

    try {
      setError("")
      const response = await fetch(`/api/influencers/${id}`, {
        method: "DELETE",
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete influencer")
      }
      
      // Optimistically update UI
      setInfluencers(influencers.filter((inf) => inf.id !== id))
      setError("")
      
      // Reload influencers to ensure sync
      const refreshResponse = await fetch("/api/influencers")
      if (refreshResponse.ok) {
        const refreshed = await refreshResponse.json()
        setInfluencers(refreshed)
      }
    } catch (err: any) {
      console.error("Failed to delete influencer:", err)
      setError(err.message || "Failed to delete influencer. Please check your configuration.")
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading influencers...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Influencers</h1>
        <p className="text-muted-foreground mt-2">Manage your influencer network and commissions</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
          <p className="font-semibold mb-2">Error:</p>
          <p className="mb-3">{error}</p>
          {(error.includes("Configuration Error") || error.includes("setupRequired") || error.includes("NEXT_PUBLIC_APPS_SCRIPT_URL")) && (
            <div className="bg-white p-4 rounded border border-red-300 mt-3">
              <p className="font-semibold text-sm mb-2">⚠️ Setup Required for Production</p>
              <p className="text-xs mb-3">
                Your website is deployed on Vercel, which requires Google Sheets for data storage. 
                File system storage doesn't work on Vercel.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-xs mb-3">
                <li>Set up Google Apps Script (see <code className="bg-gray-100 px-1 rounded">VERCEL_SETUP.md</code>)</li>
                <li>Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_APPS_SCRIPT_URL</code> to Vercel environment variables</li>
                <li>Redeploy your application</li>
              </ol>
              <p className="text-xs text-muted-foreground">
                <strong>Quick Setup:</strong> Go to Vercel → Settings → Environment Variables → Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_APPS_SCRIPT_URL</code>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Add Influencer</CardTitle>
            </CardHeader>
            <CardContent>
              <InfluencerForm onSubmit={handleAddInfluencer} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Influencer List</CardTitle>
            </CardHeader>
            <CardContent>
              <InfluencerTable influencers={influencers} onDelete={handleDeleteInfluencer} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
