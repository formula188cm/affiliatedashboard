import { readFile, writeFile } from "fs/promises"
import { join } from "path"

const INFLUENCERS_FILE = join(process.cwd(), "data", "influencers.json")

// DELETE - Remove influencer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 13+)
    const resolvedParams = params instanceof Promise ? await params : params
    const id = resolvedParams.id

    const data = await readFile(INFLUENCERS_FILE, "utf-8")
    const influencers = JSON.parse(data)

    const filtered = influencers.filter((inf: any) => inf.id !== id)
    
    // Write back to file
    await writeFile(INFLUENCERS_FILE, JSON.stringify(filtered, null, 2))

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return Response.json({ error: "Failed to delete influencer" }, { status: 500 })
  }
}
