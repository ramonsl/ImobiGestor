import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { brokers, brokerGoals } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// PUT - Update a broker
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const brokerId = parseInt(id)
        const body = await request.json()

        // Update broker basic info
        const brokerUpdateData: Record<string, unknown> = {}
        if (body.name !== undefined) brokerUpdateData.name = body.name
        if (body.email !== undefined) brokerUpdateData.email = body.email
        if (body.phone !== undefined) brokerUpdateData.phone = body.phone
        if (body.type !== undefined) brokerUpdateData.type = body.type
        if (body.avatarUrl !== undefined) brokerUpdateData.avatarUrl = body.avatarUrl
        if (body.active !== undefined) brokerUpdateData.active = body.active

        if (Object.keys(brokerUpdateData).length > 0) {
            await db
                .update(brokers)
                .set(brokerUpdateData)
                .where(eq(brokers.id, brokerId))
        }

        // Update broker goal for the year if provided
        if (body.year && body.metaAnual !== undefined) {
            const existingGoal = await db
                .select()
                .from(brokerGoals)
                .where(and(
                    eq(brokerGoals.brokerId, brokerId),
                    eq(brokerGoals.year, body.year)
                ))
                .then(res => res[0])

            if (existingGoal) {
                await db
                    .update(brokerGoals)
                    .set({ metaAnual: body.metaAnual.toString() })
                    .where(eq(brokerGoals.id, existingGoal.id))
            } else {
                await db
                    .insert(brokerGoals)
                    .values({
                        brokerId,
                        year: body.year,
                        metaAnual: body.metaAnual.toString()
                    })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erro ao atualizar corretor:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

// DELETE - Soft delete (disable) a broker
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const brokerId = parseInt(id)

        // Soft delete: just set active = false
        await db
            .update(brokers)
            .set({ active: false })
            .where(eq(brokers.id, brokerId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erro ao desabilitar corretor:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
