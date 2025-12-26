import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { brokers, sales, brokerGoals } from "@/db/schema"
import { eq, and, sql, gte, lte } from "drizzle-orm"
import { getMonthRange } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const tenantId = parseInt(searchParams.get("tenantId") || "0")
        const period = searchParams.get("period") || "anual"
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
        const periodValue = parseInt(searchParams.get("periodValue") || "1")
        const search = searchParams.get("search") || ""
        const sort = searchParams.get("sort") || "value"

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID required" }, { status: 400 })
        }

        // Determine month range based on period
        const { monthStart, monthEnd } = getMonthRange(period, periodValue)

        // Fetch broker rankings with sales data
        const rankingsData = await db
            .select({
                brokerId: sales.brokerId,
                brokerName: brokers.name,
                brokerEmail: brokers.email,
                total: sql<string>`SUM(${sales.value})`,
            })
            .from(sales)
            .innerJoin(brokers, eq(sales.brokerId, brokers.id))
            .where(and(
                eq(sales.tenantId, tenantId),
                eq(sales.year, year),
                gte(sales.month, monthStart),
                lte(sales.month, monthEnd),
                search ? sql`LOWER(${brokers.name}) LIKE LOWER(${'%' + search + '%'})` : undefined
            ))
            .groupBy(sales.brokerId, brokers.name, brokers.email)
            .orderBy(sql`SUM(${sales.value}) DESC`)

        // Fetch broker goals for the year
        const goals = await db
            .select()
            .from(brokerGoals)
            .where(eq(brokerGoals.year, year))

        // Format rankings with actual goals
        const rankings = rankingsData.map((item, index) => {
            const vendido = parseFloat(item.total)
            const brokerGoal = goals.find(g => g.brokerId === item.brokerId)
            const metaAnual = parseFloat(brokerGoal?.metaAnual || '0')
            const percentMeta = metaAnual > 0 ? (vendido / metaAnual) * 100 : 0

            return {
                position: index + 1,
                id: item.brokerId,
                name: item.brokerName,
                email: item.brokerEmail || `${item.brokerName.toLowerCase().replace(/\\s+/g, '.')}@email.com`,
                metaAnual,
                vendido,
                percentMeta
            }
        })

        // Apply sorting
        if (sort === "percent") {
            rankings.sort((a, b) => b.percentMeta - a.percentMeta)
        } else if (sort === "name") {
            rankings.sort((a, b) => a.name.localeCompare(b.name))
        }

        // Update positions after sorting
        rankings.forEach((r, i) => r.position = i + 1)

        return NextResponse.json(rankings)
    } catch (error) {
        console.error("Error fetching rankings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

