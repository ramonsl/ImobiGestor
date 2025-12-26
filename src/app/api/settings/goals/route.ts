import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tenantGoals } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// GET - Fetch goals for a specific year
export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")
        const year = parseInt(request.nextUrl.searchParams.get("year") || new Date().getFullYear().toString())

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        const goals = await db
            .select()
            .from(tenantGoals)
            .where(and(
                eq(tenantGoals.tenantId, tenantId),
                eq(tenantGoals.year, year)
            ))
            .then(res => res[0])

        return NextResponse.json({
            metaAnual: parseFloat(goals?.metaAnual || '0'),
            superMeta: parseFloat(goals?.superMeta || '0'),
            year
        })
    } catch (error) {
        console.error("Erro ao buscar metas:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

// PUT - Create or update goals for a specific year
export async function PUT(request: NextRequest) {
    try {
        const { tenantId, year, metaAnual, superMeta } = await request.json()

        if (!tenantId || !year) {
            return NextResponse.json({ error: "Tenant ID e ano são obrigatórios" }, { status: 400 })
        }

        // Check if goals exist for this year
        const existing = await db
            .select()
            .from(tenantGoals)
            .where(and(
                eq(tenantGoals.tenantId, tenantId),
                eq(tenantGoals.year, year)
            ))
            .then(res => res[0])

        if (existing) {
            // Update
            await db
                .update(tenantGoals)
                .set({
                    metaAnual: metaAnual.toString(),
                    superMeta: superMeta.toString()
                })
                .where(eq(tenantGoals.id, existing.id))
        } else {
            // Insert
            await db
                .insert(tenantGoals)
                .values({
                    tenantId,
                    year,
                    metaAnual: metaAnual.toString(),
                    superMeta: superMeta.toString()
                })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erro ao atualizar metas:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
