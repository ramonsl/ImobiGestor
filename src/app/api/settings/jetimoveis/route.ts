import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tenants } from "@/db/schema"
import { eq } from "drizzle-orm"

// PUT - Save JetImóveis token
export async function PUT(request: NextRequest) {
    try {
        const { tenantId, token } = await request.json()

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        await db
            .update(tenants)
            .set({ jetimoveisToken: token || null })
            .where(eq(tenants.id, tenantId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erro ao salvar token JetImóveis:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
