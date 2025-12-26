import { NextRequest, NextResponse } from "next/server"
import { disconnectWhatsApp } from "@/lib/whatsapp"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tenantId } = body

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        await disconnectWhatsApp(tenantId)

        return NextResponse.json({
            success: true,
            message: "WhatsApp desconectado com sucesso."
        })
    } catch (error) {
        console.error("Erro ao desconectar WhatsApp:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
