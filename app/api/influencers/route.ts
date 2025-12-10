import { fetchInfluencersFromSheet, saveInfluencerToSheet } from "@/lib/google-sheets"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"

const INFLUENCERS_FILE = join(process.cwd(), "data", "influencers.json")

// Helper to check if we're in production (Vercel)
const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

// GET - Fetch all influencers
export async function GET() {
  try {
    // In production, use Google Sheets
    if (isProduction || process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
      try {
        const influencers = await fetchInfluencersFromSheet()
        return Response.json(influencers)
      } catch (error) {
        console.error("Failed to fetch from Google Sheets, trying file fallback:", error)
        // Fallback to file if Google Sheets fails
      }
    }

    // Fallback to file system (local development)
    try {
      const data = await readFile(INFLUENCERS_FILE, "utf-8")
      const influencers = JSON.parse(data)
      return Response.json(influencers)
    } catch (fileError: any) {
      // If file doesn't exist, return empty array
      if (fileError.code === "ENOENT") {
        return Response.json([])
      }
      throw fileError
    }
  } catch (error) {
    console.error("Failed to read influencers:", error)
    return Response.json({ error: "Failed to read influencers" }, { status: 500 })
  }
}

// POST - Add new influencer
export async function POST(request: Request) {
  try {
    const { name, referralCode, commissionPercentage } = await request.json()

    // Validation
    if (!name || !referralCode || commissionPercentage === undefined || commissionPercentage === null) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate referral code format (alphanumeric, 3-20 chars)
    const cleanReferralCode = referralCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{3,20}$/.test(cleanReferralCode)) {
      return Response.json({ error: "Referral code must be 3-20 alphanumeric characters" }, { status: 400 })
    }

    // Validate commission percentage
    const commission = Number.parseFloat(commissionPercentage)
    if (isNaN(commission) || commission < 0 || commission > 100) {
      return Response.json({ error: "Commission percentage must be between 0 and 100" }, { status: 400 })
    }

    const newInfluencer = {
      id: Date.now().toString(),
      name: name.trim(),
      referralCode: cleanReferralCode,
      commissionPercentage: commission,
      createdAt: new Date().toISOString(),
    }

    // In production, use Google Sheets
    if (isProduction || process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
      try {
        // Check for duplicates first
        const existingInfluencers = await fetchInfluencersFromSheet()
        const existingCode = existingInfluencers.find(
          (inf) => inf.referralCode.toUpperCase() === cleanReferralCode
        )
        if (existingCode) {
          return Response.json({ error: "Referral code already exists" }, { status: 400 })
        }

        // Save to Google Sheets
        await saveInfluencerToSheet(newInfluencer)
        return Response.json(newInfluencer, { status: 201 })
      } catch (error: any) {
        console.error("Failed to save to Google Sheets:", error)
        // Fallback to file if Google Sheets fails
      }
    }

    // Fallback to file system (local development)
    try {
      let influencers = []
      try {
        const data = await readFile(INFLUENCERS_FILE, "utf-8")
        influencers = JSON.parse(data)
      } catch (fileError: any) {
        // If file doesn't exist, start with empty array
        if (fileError.code !== "ENOENT") throw fileError
      }

      // Check for duplicate referral code
      const existingCode = influencers.find(
        (inf: any) => inf.referralCode.toUpperCase() === cleanReferralCode
      )
      if (existingCode) {
        return Response.json({ error: "Referral code already exists" }, { status: 400 })
      }

      influencers.push(newInfluencer)
      await writeFile(INFLUENCERS_FILE, JSON.stringify(influencers, null, 2))

      return Response.json(newInfluencer, { status: 201 })
    } catch (error) {
      console.error("Failed to add influencer:", error)
      return Response.json(
        { error: "Failed to add influencer. Please check your configuration." },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Failed to add influencer:", error)
    return Response.json({ error: "Failed to add influencer" }, { status: 500 })
  }
}
