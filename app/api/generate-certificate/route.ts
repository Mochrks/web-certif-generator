import { NextRequest, NextResponse } from 'next/server'
import { generateCertificate } from '@/utils/certificateGenerator'

export async function POST(req: NextRequest) {
  const { templateUrl, name } = await req.json()

  try {
    const certificateUrl = await generateCertificate(templateUrl, name)
    return NextResponse.json({ certificateUrl })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}

