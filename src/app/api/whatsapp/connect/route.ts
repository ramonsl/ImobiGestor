import { NextRequest, NextResponse } from "next/server"
import { initWhatsApp, getWhatsAppStatus } from "@/lib/whatsapp"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tenantId } = body

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        // Start initialization in background
        initWhatsApp(tenantId).catch(err => {
            console.error(`[WhatsApp:${tenantId}] Init error:`, err)
        })

        // Return current status (will be 'connecting')
        const status = getWhatsAppStatus(tenantId)

        return NextResponse.json({
            success: true,
            message: "Conexão iniciada. Aguarde o QR Code.",
            ...status
        })
    } catch (error) {
        console.error("Erro ao conectar WhatsApp:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
