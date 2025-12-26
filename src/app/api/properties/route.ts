import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { properties } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET - List all properties for a tenant
export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        const propertiesList = await db
            .select()
            .from(properties)
            .where(eq(properties.tenantId, tenantId))
            .orderBy(properties.createdAt)

        return NextResponse.json(propertiesList.map(p => ({
            id: p.id,
            title: p.title,
            address: p.address,
            city: p.city,
            state: p.state,
            type: p.type,
            price: parseFloat(p.price || '0'),
            imageUrl: p.imageUrl,
            source: p.source,
            status: p.status,
            externalId: p.externalId
        })))
    } catch (error) {
        console.error("Erro ao listar imóveis:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

// POST - Create a new property
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { tenantId, title, address, city, state, type, price, imageUrl, status } = body

        if (!tenantId || !title) {
            return NextResponse.json({ error: "Tenant ID e título são obrigatórios" }, { status: 400 })
        }

        const [newProperty] = await db
            .insert(properties)
            .values({
                tenantId,
                title,
                address: address || null,
                city: city || null,
                state: state || null,
                type: type || null,
                price: price?.toString() || null,
                imageUrl: imageUrl || null,
                status: status || 'active',
                source: 'manual'
            })
            .returning({ id: properties.id })

        return NextResponse.json({ id: newProperty.id, success: true })
    } catch (error) {
        console.error("Erro ao criar imóvel:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
