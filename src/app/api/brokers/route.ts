import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { brokers, brokerGoals } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// GET - List all brokers for a tenant with goals for a specific year
export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")
        const year = parseInt(request.nextUrl.searchParams.get("year") || new Date().getFullYear().toString())

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        // Fetch brokers
        const brokersList = await db
            .select({
                id: brokers.id,
                name: brokers.name,
                email: brokers.email,
                phone: brokers.phone,
                type: brokers.type,
                avatarUrl: brokers.avatarUrl,
                active: brokers.active
            })
            .from(brokers)
            .where(eq(brokers.tenantId, tenantId))
            .orderBy(brokers.name)

        // Fetch goals for the year
        const goals = await db
            .select()
            .from(brokerGoals)
            .where(eq(brokerGoals.year, year))

        // Merge brokers with their goals
        const result = brokersList.map(b => {
            const goal = goals.find(g => g.brokerId === b.id)
            return {
                ...b,
                metaAnual: goal?.metaAnual || '0'
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error("Erro ao listar colaboradores:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

// POST - Create a new broker
export async function POST(request: NextRequest) {
    try {
        const { tenantId, name, type, metaAnual, avatarUrl, year } = await request.json()

        if (!tenantId || !name) {
            return NextResponse.json({ error: "Tenant ID e nome são obrigatórios" }, { status: 400 })
        }

        // Create broker
        const [newBroker] = await db
            .insert(brokers)
            .values({
                tenantId,
                name,
                type: type || 'corretor',
                avatarUrl: avatarUrl || null,
                active: true
            })
            .returning({ id: brokers.id })

        // Create goal for the year if provided
        if (year && metaAnual !== undefined) {
            await db
                .insert(brokerGoals)
                .values({
                    brokerId: newBroker.id,
                    year,
                    metaAnual: metaAnual.toString()
                })
        }

        return NextResponse.json({ id: newBroker.id, success: true })
    } catch (error) {
        console.error("Erro ao criar colaborador:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
