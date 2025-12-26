import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tenants } from "@/db/schema"
import { eq } from "drizzle-orm"

// PUT - Update company profile
export async function PUT(request: NextRequest) {
    try {
        const { tenantId, name, cnpj, logoUrl } = await request.json()

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        if (!name?.trim()) {
            return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
        }

        await db
            .update(tenants)
            .set({
                name: name.trim(),
                cnpj: cnpj || null,
                logoUrl: logoUrl || null
            })
            .where(eq(tenants.id, tenantId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erro ao atualizar dados da empresa:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
