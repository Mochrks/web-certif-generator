import sharp from "sharp"

interface TextPosition {
  x: number
  y: number
  fontSize: number
  fontColor: string
  fontWeight: string
  fontFamily: string
  textAlign: "left" | "center" | "right"
}

const DEFAULT_TEXT_POSITION: TextPosition = {
  x: 0.5, // Center horizontally
  y: 0.6, // Slightly below center vertically
  fontSize: 60,
  fontColor: "#000000",
  fontWeight: "bold",
  fontFamily: "Arial",
  textAlign: "center",
}

export async function generateCertificate(templateUrl: string, name: string, isPreview = false): Promise<string> {
  try {
    // Extract base64 data from data URL
    const base64Data = templateUrl.split(",")[1]
    if (!base64Data) {
      throw new Error("Invalid template URL format")
    }

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
    const textX = Math.round(width * DEFAULT_TEXT_POSITION.x)
    const textY = Math.round(height * DEFAULT_TEXT_POSITION.y)

    // Calculate dynamic font size based on image width and name length
    const dynamicFontSize = Math.min(DEFAULT_TEXT_POSITION.fontSize, Math.floor(width / (name.length * 0.7)))

    // Create SVG text overlay
    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .certificate-text { 
            font-size: ${dynamicFontSize}px; 
            font-family: ${DEFAULT_TEXT_POSITION.fontFamily}; 
            font-weight: ${DEFAULT_TEXT_POSITION.fontWeight};
            fill: ${DEFAULT_TEXT_POSITION.fontColor};
          }
        </style>
        <text 
          x="${textX}" 
          y="${textY}" 
          text-anchor="middle" 
          class="certificate-text"
        >${name}</text>
      </svg>
    `

    // Composite the text on the image
    const outputImage = await image
      .composite([
        {
          input: Buffer.from(svgText),
          gravity: "center",
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

