import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { properties } from "@/db/schema"
import { eq, ilike, or, and } from "drizzle-orm"

// GET - Search properties for autocomplete
export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")
        const query = request.nextUrl.searchParams.get("q") || ""

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        if (!query || query.length < 2) {
            return NextResponse.json([])
        }

        const searchPattern = `%${query}%`

        const results = await db
            .select({
                id: properties.id,
                title: properties.title,
                address: properties.address,
                city: properties.city,
                state: properties.state,
                type: properties.type,
                price: properties.price,
                imageUrl: properties.imageUrl,
                status: properties.status
            })
            .from(properties)
            .where(and(
                eq(properties.tenantId, tenantId),
                eq(properties.status, 'active'),
                or(
                    ilike(properties.title, searchPattern),
                    ilike(properties.address, searchPattern),
                    ilike(properties.city, searchPattern)
                )
            ))
            .limit(10)

        return NextResponse.json(results)
    } catch (error) {
        console.error("Erro ao buscar imóveis:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
