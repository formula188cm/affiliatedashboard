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
      const response = await fetch("/api/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to add influencer")
      const newInfluencer = await response.json()
      setInfluencers([...influencers, newInfluencer])
      setError("")
    } catch (err) {
      console.error("[v0] Failed to add influencer:", err)
      setError("Failed to add influencer")
    }
  }

  const handleDeleteInfluencer = async (id: string) => {
    try {
      const response = await fetch(`/api/influencers/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete influencer")
      setInfluencers(influencers.filter((inf) => inf.id !== id))
      setError("")
    } catch (err) {
      console.error("[v0] Failed to delete influencer:", err)
      setError("Failed to delete influencer")
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
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">{error}</div>
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
