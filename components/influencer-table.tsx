"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Trash2, Copy, Check } from "lucide-react"

interface Influencer {
  id: string
  name: string
  referralCode: string
  commissionPercentage: number
}

interface InfluencerTableProps {
  influencers: Influencer[]
  onDelete?: (id: string) => void
}

export function InfluencerTable({ influencers, onDelete }: InfluencerTableProps) {
  const router = useRouter()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const orderSiteUrl = useMemo(() => {
    // Production ordering site URL
    const PRODUCTION_ORDER_URL = "https://growessence.vercel.app"
    
    // Prefer explicit ordering site domain so links go to growessence.vercel.app
    const envUrl = process.env.NEXT_PUBLIC_ORDER_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
    
    if (envUrl) {
      const cleanUrl = envUrl.replace(/\/$/, "")
      // Ensure URL has protocol
      if (cleanUrl && !cleanUrl.match(/^https?:\/\//)) {
        return `https://${cleanUrl}`
      }
      return cleanUrl
    }
    
    // Fallback to production URL (not localhost)
    return PRODUCTION_ORDER_URL
  }, [])

  const handleCopy = useCallback(
    async (id: string, referralCode: string) => {
      if (!referralCode || !orderSiteUrl) return
      
      const link = `${orderSiteUrl}/?ref=${encodeURIComponent(referralCode)}`
      try {
        // Use modern clipboard API with fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(link)
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea")
          textArea.value = link
          textArea.style.position = "fixed"
          textArea.style.opacity = "0"
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand("copy")
          document.body.removeChild(textArea)
        }
        setCopiedId(id)
        setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000)
      } catch (err) {
        console.error("Failed to copy referral link", err)
        // Silent fail - don't break UX
      }
    },
    [orderSiteUrl]
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-semibold">Name</th>
            <th className="text-left py-3 px-4 font-semibold">Referral Code</th>
            <th className="text-left py-3 px-4 font-semibold">Referral Link</th>
            <th className="text-left py-3 px-4 font-semibold">Commission %</th>
            <th className="text-center py-3 px-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {influencers.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                No influencers yet
              </td>
            </tr>
          ) : (
            influencers.map((influencer) => (
              <tr 
                key={influencer.id} 
                className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/influencers/${influencer.referralCode}`)}
              >
                <td className="py-3 px-4 font-medium">{influencer.name}</td>
                <td className="py-3 px-4 font-mono text-primary text-sm">{influencer.referralCode}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={`${orderSiteUrl}/?ref=${encodeURIComponent(influencer.referralCode)}`}>
                      {orderSiteUrl ? `${orderSiteUrl}/?ref=${encodeURIComponent(influencer.referralCode)}` : "Loading..."}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8"
                      title="Copy referral link"
                      onClick={() => handleCopy(influencer.id, influencer.referralCode)}
                    >
                      {copiedId === influencer.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </td>
                <td className="py-3 px-4">{influencer.commissionPercentage}%</td>
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 justify-center">
                    <Link href={`/influencers/${influencer.referralCode}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(influencer.id)
                      }}
                      className="hover:bg-red-100 hover:text-red-700"
                      title="Delete influencer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
