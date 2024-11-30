import { NextResponse } from 'next/server'

let generateCertificate: (templateUrl: string, name: string) => Promise<string>

if (typeof window === 'undefined') {
  generateCertificate = async (templateUrl: string, name: string): Promise<string> => {
    const { createCanvas, loadImage, registerFont } = await import('canvas')
    registerFont('fonts/Roboto-Bold.ttf', { family: 'Roboto', weight: 'bold' })

    const image = await loadImage(templateUrl)
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(image, 0, 0, image.width, image.height)

    ctx.font = 'bold 60px Roboto'
    ctx.fillStyle = '#333333'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, canvas.width / 2, canvas.height / 2)

    return canvas.toDataURL('image/jpeg', 0.9)
  }
} else {
  generateCertificate = async () => {
    throw new Error('generateCertificate can only be used on the server side')
  }
}

export { generateCertificate }

