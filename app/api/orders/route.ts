// No more complex Google Sheets API integration - using Apps Script instead

export async function POST(request: Request) {
  try {
    const order = await request.json()

    const appsScriptUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
    if (!appsScriptUrl) {
      return Response.json({ error: "Apps Script URL not configured" }, { status: 500 })
    }

    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })

    const result = await response.json()
    
    if (!response.ok || result.error) {
      throw new Error(result.error || "Failed to save order to Google Sheets")
    }

    return Response.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Failed to create order:", error)
    return Response.json({ error: "Failed to create order" }, { status: 500 })
  }
}
