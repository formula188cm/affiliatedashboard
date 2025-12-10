import { fetchInfluencersFromSheet, saveInfluencerToSheet } from "@/lib/google-sheets"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"

const INFLUENCERS_FILE = join(process.cwd(), "data", "influencers.json")

// Helper to check if we're in production (Vercel)
const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

// GET - Fetch all influencers
export async function GET() {
  try {
    // In production, MUST use Google Sheets (file system doesn't work on Vercel)
    if (isProduction) {
      if (!process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
        // Return empty array with warning instead of error (so page still loads)
        console.warn("NEXT_PUBLIC_APPS_SCRIPT_URL not configured in production")
        return Response.json([])
      }

      try {
        const influencers = await fetchInfluencersFromSheet()
        return Response.json(influencers)
      } catch (error: any) {
        console.error("Failed to fetch from Google Sheets:", error)
        // Return empty array so page doesn't break
        return Response.json([])
      }
    }

    // Local development: Try Google Sheets first if configured
    if (process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
      try {
        const influencers = await fetchInfluencersFromSheet()
        return Response.json(influencers)
      } catch (error) {
        console.error("Failed to fetch from Google Sheets, trying file fallback:", error)
        // Fallback to file if Google Sheets fails
      }
    }

    // Fallback to file system (local development only)
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
    // Return empty array instead of error so page doesn't break
    return Response.json([])
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

    // In production, MUST use Google Sheets (file system doesn't work on Vercel)
    if (isProduction) {
      if (!process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
        return Response.json(
          {
            error: "Configuration Error: NEXT_PUBLIC_APPS_SCRIPT_URL is required in production. Please set it in Vercel environment variables. See VERCEL_SETUP.md for instructions.",
            setupRequired: true,
          },
          { status: 500 }
        )
      }

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
        return Response.json(
          {
            error: `Failed to save influencer: ${error.message || "Please check your Apps Script configuration"}`,
            setupRequired: true,
          },
          { status: 500 }
        )
      }
    }

    // Local development: Use Google Sheets if configured, otherwise file system
    if (process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
      try {
        const existingInfluencers = await fetchInfluencersFromSheet()
        const existingCode = existingInfluencers.find(
          (inf) => inf.referralCode.toUpperCase() === cleanReferralCode
        )
        if (existingCode) {
          return Response.json({ error: "Referral code already exists" }, { status: 400 })
        }
        await saveInfluencerToSheet(newInfluencer)
        return Response.json(newInfluencer, { status: 201 })
      } catch (error: any) {
        console.error("Failed to save to Google Sheets, using file fallback:", error)
      }
    }

    // Fallback to file system (local development only)
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
