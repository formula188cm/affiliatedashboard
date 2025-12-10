/**
 * Google Sheets utility functions for influencers and orders
 * Works with both public JSON feed and Apps Script
 */

export interface Influencer {
  id: string
  name: string
  referralCode: string
  commissionPercentage: number
  createdAt: string
}

/**
 * Fetch influencers from Google Sheets
 */
export async function fetchInfluencersFromSheet(): Promise<Influencer[]> {
  const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
  
  if (appsScriptUrl) {
    // Use Apps Script to fetch influencers (preferred method)
    try {
      const response = await fetch(`${appsScriptUrl}?action=getInfluencers`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store", // Always fetch fresh data
      })
      
      if (response.ok) {
        const text = await response.text()
        const result = JSON.parse(text)
        if (result.influencers && Array.isArray(result.influencers)) {
          return result.influencers
        }
      } else {
        throw new Error(`Apps Script returned ${response.status}`)
      }
    } catch (error) {
      console.error("Failed to fetch influencers from Apps Script:", error)
      throw new Error("Failed to fetch influencers from Google Sheets. Please check your Apps Script configuration.")
    }
  }

  // Fallback: Try to read from public JSON feed (if sheet is public)
  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID
  if (!sheetId) {
    throw new Error("Sheet ID or Apps Script URL not configured")
  }

  // Fallback: Try to read from public JSON feed (if sheet is public)
  try {
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq=SELECT * WHERE A IS NOT NULL`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status}`)
    }

    const text = await response.text()
    let jsonString = text.trim()
    
    // Parse Google Visualization API response
    while (jsonString.startsWith("(") && jsonString.endsWith(")")) {
      jsonString = jsonString.slice(1, -1).trim()
    }
    
    if (jsonString.includes("google.visualization.Query.setResponse(")) {
      const startIdx = jsonString.indexOf("(") + 1
      const endIdx = jsonString.lastIndexOf(")")
      if (startIdx > 0 && endIdx > startIdx) {
        jsonString = jsonString.substring(startIdx, endIdx).trim()
      }
    }
    
    jsonString = jsonString.trim().replace(/;?\s*$/, "")
    const data = JSON.parse(jsonString)

    if (!data.table || !data.table.rows) {
      return []
    }

    // Parse influencers from sheet (assuming format: id, name, referralCode, commissionPercentage, createdAt)
    const influencers: Influencer[] = data.table.rows
      .slice(1) // Skip header
      .map((row: any) => {
        const cells = row.c || []
        if (!cells[0] || !cells[0].v) return null
        
        return {
          id: String(cells[0]?.v || ""),
          name: String(cells[1]?.v || ""),
          referralCode: String(cells[2]?.v || ""),
          commissionPercentage: Number.parseFloat(cells[3]?.v || 0),
          createdAt: String(cells[4]?.v || new Date().toISOString()),
        }
      })
      .filter((inf: Influencer | null) => inf !== null && inf.id !== "") as Influencer[]

    return influencers
  } catch (error) {
    console.error("Failed to fetch influencers from sheet:", error)
    throw error
  }
}

/**
 * Save influencer to Google Sheets via Apps Script
 */
export async function saveInfluencerToSheet(influencer: Influencer): Promise<boolean> {
  const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
  if (!appsScriptUrl) {
    throw new Error("Apps Script URL not configured")
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addInfluencer",
        ...influencer,
      }),
    })

    const result = await response.json()
    
    if (!response.ok || result.error) {
      throw new Error(result.error || "Failed to save influencer")
    }

    return true
  } catch (error) {
    console.error("Failed to save influencer:", error)
    throw error
  }
}

/**
 * Delete influencer from Google Sheets via Apps Script
 */
export async function deleteInfluencerFromSheet(id: string): Promise<boolean> {
  const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
  if (!appsScriptUrl) {
    throw new Error("Apps Script URL not configured")
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteInfluencer",
        id,
      }),
    })

    const result = await response.json()
    
    if (!response.ok || result.error) {
      throw new Error(result.error || "Failed to delete influencer")
    }

    return true
  } catch (error) {
    console.error("Failed to delete influencer:", error)
    throw error
  }
}

