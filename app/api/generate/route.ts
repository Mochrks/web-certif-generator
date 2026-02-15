import { type NextRequest, NextResponse } from "next/server"
import { generateCertificate } from "@/lib/certificate-generator"

export async function POST(req: NextRequest) {
  try {
    const { templateUrl, name, ...options } = await req.json()

    // Validate inputs
    if (!templateUrl) {
      return NextResponse.json({ error: "Template URL is required" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Generate the certificate
    const certificateUrl = await generateCertificate(templateUrl, name, options)

    return NextResponse.json({ certificateUrl })
  } catch (error) {
    console.error("Certificate generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate certificate" },
      { status: 500 },
    )
  }
}

