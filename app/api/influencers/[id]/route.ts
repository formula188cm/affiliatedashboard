import { deleteInfluencerFromSheet, fetchInfluencersFromSheet } from "@/lib/google-sheets"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"

const INFLUENCERS_FILE = join(process.cwd(), "data", "influencers.json")

// Helper to check if we're in production (Vercel)
const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production"

// DELETE - Remove influencer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 13+)
    const resolvedParams = params instanceof Promise ? await params : params
    const id = resolvedParams.id

    if (!id) {
      return Response.json({ error: "Influencer ID is required" }, { status: 400 })
    }

    // In production, MUST use Google Sheets (file system doesn't work on Vercel)
    if (isProduction) {
      if (!process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
        return Response.json(
          {
            error: "Configuration Error: NEXT_PUBLIC_APPS_SCRIPT_URL is required in production. Please set it in Vercel environment variables.",
            setupRequired: true,
          },
          { status: 500 }
        )
      }

      try {
        await deleteInfluencerFromSheet(id)
        return Response.json({ success: true })
      } catch (error: any) {
        console.error("Failed to delete from Google Sheets:", error)
        return Response.json(
          {
            error: `Failed to delete influencer: ${error.message || "Please check your Apps Script configuration"}`,
            setupRequired: true,
          },
          { status: 500 }
        )
      }
    }

    // Local development: Use Google Sheets if configured
    if (process.env.NEXT_PUBLIC_APPS_SCRIPT_URL) {
      try {
        await deleteInfluencerFromSheet(id)
        return Response.json({ success: true })
      } catch (error: any) {
        console.error("Failed to delete from Google Sheets, using file fallback:", error)
      }
    }

    // Fallback to file system (local development)
    try {
      const data = await readFile(INFLUENCERS_FILE, "utf-8")
      const influencers = JSON.parse(data)

      const filtered = influencers.filter((inf: any) => inf.id !== id)
      
      // Write back to file
      await writeFile(INFLUENCERS_FILE, JSON.stringify(filtered, null, 2))

      return Response.json({ success: true })
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return Response.json({ error: "Influencer not found" }, { status: 404 })
      }
      throw error
    }
  } catch (error) {
    console.error("Delete error:", error)
    return Response.json({ error: "Failed to delete influencer" }, { status: 500 })
  }
}
