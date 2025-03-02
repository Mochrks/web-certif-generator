import { type NextRequest, NextResponse } from "next/server"
import { generateCertificate } from "@/utils/certificate-generator"

export async function POST(req: NextRequest) {
  try {
    const { templateUrl, name } = await req.json()

    if (!templateUrl || !name) {
      return NextResponse.json({ error: "Template URL and name are required" }, { status: 400 })
    }

    const certificateUrl = await generateCertificate(templateUrl, name)

    return NextResponse.json({ certificateUrl })
  } catch (error) {
    console.error("Certificate generation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate certificate" },
      { status: 500 },
    )
  }
}

