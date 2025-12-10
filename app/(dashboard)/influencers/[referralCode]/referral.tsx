"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle } from "lucide-react"

export default function ReferralPage() {
  const searchParams = useSearchParams()
  const referralCodeParam = (searchParams.get("ref") || "").toUpperCase()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    referralCode: referralCodeParam,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (referralCodeParam) {
      setFormData((prev) => ({ ...prev, referralCode: referralCodeParam }))
    }
  }, [referralCodeParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Send to main Google Sheet
      const mainResponse = await fetch("https://script.google.com/macros/s/YOUR_MAIN_SHEET_SCRIPT_URL/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          price: 0, // Will be set in checkout
          referralCode: formData.referralCode.toUpperCase(),
          status: "pending",
          timestamp: new Date().toISOString(),
        }),
      })

      if (!mainResponse.ok) {
        throw new Error("Failed to submit")
      }

      setSubmitted(true)
    } catch (error) {
      console.error("Submission error:", error)
      alert("Failed to submit. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for joining through our referral program. Your referral code has been saved.
              </p>
              <Button onClick={() => window.location.href = "/"} className="w-full">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Join Our Referral Program</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="referralCode">Referral Code</Label>
              {referralCodeParam ? (
                <div className="p-3 rounded-md border bg-muted/30 text-sm">
                  Applied automatically: <span className="font-semibold">{referralCodeParam}</span>
                </div>
              ) : (
                <Input
                  id="referralCode"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  placeholder="Enter referral code"
                  required
                />
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Join Now"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
