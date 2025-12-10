"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

interface InfluencerFormProps {
  onSubmit: (data: { name: string; referralCode: string; commissionPercentage: number }) => void
  isSubmitting?: boolean
}

export function InfluencerForm({ onSubmit, isSubmitting = false }: InfluencerFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    referralCode: "",
    commissionPercentage: 10,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = formData.referralCode.trim().toUpperCase()
    
    // Client-side validation
    if (!formData.name || !cleanCode) {
      return
    }
    
    // Validate referral code format (alphanumeric, 3-20 chars)
    if (!/^[A-Z0-9]{3,20}$/.test(cleanCode)) {
      alert("Referral code must be 3-20 alphanumeric characters")
      return
    }
    
    // Validate commission
    if (formData.commissionPercentage < 0 || formData.commissionPercentage > 100) {
      alert("Commission percentage must be between 0 and 100")
      return
    }
    
    onSubmit({
      ...formData,
      referralCode: cleanCode,
      name: formData.name.trim(),
    })
    setFormData({ name: "", referralCode: "", commissionPercentage: 10 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          placeholder="e.g., John Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Referral Code</label>
        <Input
          placeholder="e.g., JOHN001"
          value={formData.referralCode}
          onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Commission %</label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={formData.commissionPercentage}
          onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
        />
      </div>
      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        <Plus className="w-4 h-4" />
        {isSubmitting ? "Adding..." : "Add Influencer"}
      </Button>
    </form>
  )
}
