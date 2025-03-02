/**
 * Utility function to generate a certificate by adding text to an image
 */
export async function generateCertificate(templateUrl: string, name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Failed to get canvas context"))
        return
      }

      // Create an image object to load the template
      const img = new Image()
      img.crossOrigin = "anonymous" // Important to avoid CORS issues

      // Handle image loading
      img.onload = () => {
        // Set canvas dimensions to match the image
        canvas.width = img.width
        canvas.height = img.height

        // Draw the template image on the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Configure text style
        ctx.fillStyle = "#000000" // Black text
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Calculate font size based on canvas width (responsive)
        const fontSize = Math.max(Math.floor(canvas.width / 20), 24)
        ctx.font = `bold ${fontSize}px Arial, sans-serif`

        // Position the text in the center of the lower third of the image
        const textX = canvas.width / 2
        const textY = canvas.height * 0.6 // Position at 60% from the top

        // Add the name to the certificate
        ctx.fillText(name, textX, textY)

        // Convert the canvas to a data URL (PNG format)
        const certificateUrl = canvas.toDataURL("image/png")
        resolve(certificateUrl)
      }

      // Handle image loading errors
      img.onerror = () => {
        reject(new Error("Failed to load template image"))
      }

      // Start loading the image
      // Remove the data URL prefix if it exists to avoid double encoding
      const imageSource = templateUrl.startsWith("data:") ? templateUrl : templateUrl

      img.src = imageSource
    } catch (error) {
      reject(error)
    }
  })
}

