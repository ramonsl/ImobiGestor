import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params
        const id = parseInt(idStr)
        const body = await request.json()
        const { status, paidAt, receiptUrl, notes } = body

        const updateData: Record<string, unknown> = {}

        if (status !== undefined) updateData.status = status
        if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null
        if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl
        if (notes !== undefined) updateData.notes = notes

        // If marking as paid and no paidAt provided, set current date
        if (status === 'paid' && !paidAt && !updateData.paidAt) {
            updateData.paidAt = new Date()
        }

        const [updated] = await db
            .update(payments)
            .set(updateData)
            .where(eq(payments.id, id))
            .returning({ id: payments.id })

        if (!updated) {
            return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: status === 'paid' ? "Pagamento confirmado!" : "Pagamento atualizado!"
        })
    } catch (error) {
        console.error("Erro ao atualizar pagamento:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params
        const id = parseInt(idStr)

        const [deleted] = await db
            .delete(payments)
            .where(eq(payments.id, id))
            .returning({ id: payments.id })

        if (!deleted) {
            return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: "Pagamento removido!"
        })
    } catch (error) {
        console.error("Erro ao remover pagamento:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
