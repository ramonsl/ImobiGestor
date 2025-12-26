import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { brokers, brokerGoals } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// POST - Distribute company meta proportionally among active brokers for a specific year
export async function POST(request: NextRequest) {
    try {
        const { tenantId, year, metaPerBroker } = await request.json()

        if (!tenantId || !year || metaPerBroker === undefined) {
            return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
        }

        // Get all active brokers for this tenant
        const activeBrokers = await db
            .select({ id: brokers.id })
            .from(brokers)
            .where(and(
                eq(brokers.tenantId, tenantId),
                eq(brokers.active, true)
            ))

        // For each active broker, upsert their goal for the year
        for (const broker of activeBrokers) {
            const existingGoal = await db
                .select()
                .from(brokerGoals)
                .where(and(
                    eq(brokerGoals.brokerId, broker.id),
                    eq(brokerGoals.year, year)
                ))
                .then(res => res[0])

            if (existingGoal) {
                await db
                    .update(brokerGoals)
                    .set({ metaAnual: metaPerBroker.toString() })
                    .where(eq(brokerGoals.id, existingGoal.id))
            } else {
                await db
                    .insert(brokerGoals)
                    .values({
                        brokerId: broker.id,
                        year,
                        metaAnual: metaPerBroker.toString()
                    })
            }
        }

        return NextResponse.json({ success: true, updatedCount: activeBrokers.length })
    } catch (error) {
        console.error("Erro ao distribuir metas:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
