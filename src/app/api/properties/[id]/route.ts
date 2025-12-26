import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { properties } from "@/db/schema"
import { eq } from "drizzle-orm"

// PUT - Update a property
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const propertyId = parseInt(id)
        const body = await request.json()

        const updateData: Record<string, unknown> = {}
        if (body.title !== undefined) updateData.title = body.title
        if (body.address !== undefined) updateData.address = body.address
        if (body.city !== undefined) updateData.city = body.city
        if (body.state !== undefined) updateData.state = body.state
        if (body.type !== undefined) updateData.type = body.type
        if (body.price !== undefined) updateData.price = body.price?.toString()
        if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
        if (body.status !== undefined) updateData.status = body.status

        await db
            .update(properties)
            .set(updateData)
            .where(eq(properties.id, propertyId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erro ao atualizar imóvel:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

// DELETE - Remove a property
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const propertyId = parseInt(id)

        await db
            .delete(properties)
            .where(eq(properties.id, propertyId))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erro ao excluir imóvel:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
