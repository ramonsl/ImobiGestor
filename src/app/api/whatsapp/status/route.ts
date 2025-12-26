import { NextRequest, NextResponse } from "next/server"
import { getWhatsAppStatus } from "@/lib/whatsapp"

export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        const status = getWhatsAppStatus(tenantId)

        return NextResponse.json(status)
    } catch (error) {
        console.error("Erro ao verificar status WhatsApp:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
