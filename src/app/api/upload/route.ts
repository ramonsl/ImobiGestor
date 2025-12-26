import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Cloudinary credentials from environment
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dxjpjfpnn"
const API_KEY = process.env.CLOUDINARY_API_KEY || "479565417367456"
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "PflTodrpYJVtilHJQ03OfaPN-lw"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64Data = buffer.toString('base64')
        const dataUri = `data:${file.type};base64,${base64Data}`

        // Generate signature for signed upload
        const timestamp = Math.floor(Date.now() / 1000)
        const folder = "imobigestor/avatars"

        // Create signature string
        const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`
        const signature = crypto.createHash('sha1').update(signatureString).digest('hex')

        // Create form data for Cloudinary
        const uploadFormData = new FormData()
        uploadFormData.append('file', dataUri)
        uploadFormData.append('api_key', API_KEY)
        uploadFormData.append('timestamp', timestamp.toString())
        uploadFormData.append('signature', signature)
        uploadFormData.append('folder', folder)

        // Upload to Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: uploadFormData
            }
        )

        const data = await response.json()

        if (data.secure_url) {
            return NextResponse.json({
                url: data.secure_url,
                publicId: data.public_id
            })
        } else {
            console.error("Cloudinary error:", data)
            return NextResponse.json({ error: data.error?.message || "Erro no upload" }, { status: 400 })
        }
    } catch (error) {
        console.error("Erro no upload:", error)
        return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 })
    }
}
