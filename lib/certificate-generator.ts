import sharp from "sharp"

interface TextPosition {
  x: number // percentage 0-1
  y: number // percentage 0-1
  fontSize: number
  fontColor: string
  fontWeight: string
  fontFamily: string
  textAlign: "left" | "center" | "right"
}

export async function generateCertificate(
  templateUrl: string, 
  name: string, 
  options?: Partial<TextPosition> & { isPreview?: boolean }
): Promise<string> {
  try {
    // Extract base64 data from data URL
    const base64Data = templateUrl.split(",")[1]
    if (!base64Data) {
      throw new Error("Invalid template URL format")
    }

    const {
      x = 0.5,
      y = 0.6,
      fontSize = 60,
      fontColor = "#000000",
      fontWeight = "bold",
      fontFamily = "Arial",
      textAlign = "center",
      isPreview = false
    } = options || {}

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, "base64")

    // Load and process image with sharp
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error("Failed to get image dimensions")
    }

    // Calculate text position and size
    const width = metadata.width
    const height = metadata.height
    const textX = Math.round(width * x)
    const textY = Math.round(height * y)

    // Calculate dynamic font size factor if needed, but we'll use the provided fontSize as base
    // We could add auto-scaling logic here too if name is too long
    const textAnchor = textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start"

    // Create SVG text overlay
    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .certificate-text { 
            font-size: ${fontSize}px; 
            font-family: ${fontFamily}; 
            font-weight: ${fontWeight};
            fill: ${fontColor};
          }
        </style>
        <text 
          x="${textX}" 
          y="${textY}" 
          text-anchor="${textAnchor}" 
          class="certificate-text"
        >${name}</text>
      </svg>
    `

    // Composite the text on the image
    const outputImage = await image
      .composite([
        {
          input: Buffer.from(svgText),
          gravity: "northwest", // Match SVG coordinate system
        },
      ])
      .png({
        quality: isPreview ? 80 : 100,
        compressionLevel: isPreview ? 9 : 6,
      })
      .toBuffer()

    // Convert to base64 data URL
    return `data:image/png;base64,${outputImage.toString("base64")}`
  } catch (error) {
    console.error("Error generating certificate:", error)
    throw new Error(`Failed to generate certificate: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

