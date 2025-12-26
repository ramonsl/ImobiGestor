import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deals, dealExpenses, dealParticipants, brokers, sales, brokerGoals } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { sendSaleNotification, isConnected } from "@/lib/whatsapp"

// GET - List all deals for a tenant
export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")
        const year = parseInt(request.nextUrl.searchParams.get("year") || new Date().getFullYear().toString())

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        const dealsList = await db
            .select()
            .from(deals)
            .where(eq(deals.tenantId, tenantId))
            .orderBy(desc(deals.saleDate))

        // Filter by year if provided
        const filtered = year
            ? dealsList.filter(d => d.saleDate && new Date(d.saleDate).getFullYear() === year)
            : dealsList

        return NextResponse.json(filtered)
    } catch (error) {
        console.error("Erro ao listar vendas:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

// POST - Create a new deal with expenses and participants
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            tenantId,
            propertyId,
            propertyTitle,
            propertyAddress,
            saleDate,
            saleValue,
            commissionType,
            commissionPercent,
            commissionValue,
            grossCommission,
            totalExpenses,
            netCommission,
            status,
            notes,
            expenses = [],
            participants = []
        } = body

        if (!tenantId || !propertyTitle || !saleValue) {
            return NextResponse.json({
                error: "Tenant ID, título do imóvel e valor da venda são obrigatórios"
            }, { status: 400 })
        }

        // Create the deal
        const [newDeal] = await db
            .insert(deals)
            .values({
                tenantId,
                propertyId: propertyId || null,
                propertyTitle,
                propertyAddress: propertyAddress || null,
                saleDate: saleDate ? new Date(saleDate) : new Date(),
                saleValue: saleValue.toString(),
                commissionType: commissionType || 'percent',
                commissionPercent: commissionPercent?.toString() || null,
                commissionValue: commissionValue?.toString() || null,
                grossCommission: grossCommission?.toString() || null,
                totalExpenses: totalExpenses?.toString() || '0',
                netCommission: netCommission?.toString() || null,
                status: status || 'completed',
                notes: notes || null
            })
            .returning({ id: deals.id })

        // Create expenses
        if (expenses.length > 0) {
            await db.insert(dealExpenses).values(
                expenses.map((exp: { category: string; description?: string; value: number }) => ({
                    dealId: newDeal.id,
                    category: exp.category,
                    description: exp.description || null,
                    value: exp.value.toString()
                }))
            )
        }

        // Create participants and update sales/meta
        const responsibleParticipants = participants.filter((p: { isResponsible: boolean }) => p.isResponsible)
        const metaShareValue = responsibleParticipants.length > 0
            ? parseFloat(saleValue) / responsibleParticipants.length
            : 0

        const saleDateObj = saleDate ? new Date(saleDate) : new Date()
        const currentYear = saleDateObj.getFullYear()

        for (const participant of participants) {
            const computedMetaShare = participant.isResponsible && participant.contributesToMeta !== false
                ? metaShareValue
                : 0

            // Insert participant
            await db.insert(dealParticipants).values({
                dealId: newDeal.id,
                brokerId: participant.brokerId || null,
                participantName: participant.participantName || null,
                participantType: participant.participantType,
                role: participant.role || null,
                commissionPercent: participant.commissionPercent?.toString() || null,
                commissionValue: participant.commissionValue?.toString() || null,
                isResponsible: participant.isResponsible || false,
                contributesToMeta: participant.contributesToMeta !== false,
                metaShareValue: computedMetaShare.toString()
            })

            // If responsible and has brokerId, create a sales entry for ranking/meta
            if (participant.isResponsible && participant.brokerId && participant.contributesToMeta !== false) {
                await db.insert(sales).values({
                    tenantId,
                    brokerId: participant.brokerId,
                    propertyType: null,
                    month: saleDateObj.getMonth() + 1,
                    year: saleDateObj.getFullYear(),
                    value: computedMetaShare.toString()
                })
            }
        }

        // Send WhatsApp notifications (in background, don't wait)
        if (isConnected(tenantId)) {
            sendWhatsAppNotifications(
                tenantId,
                participants,
                propertyTitle,
                propertyAddress,
                parseFloat(saleValue),
                saleDateObj,
                currentYear
            ).catch(err => console.error('[WhatsApp] Notification error:', err))
        }

        return NextResponse.json({
            id: newDeal.id,
            success: true,
            message: "Venda registrada com sucesso!"
        })
    } catch (error) {
        console.error("Erro ao criar venda:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

// Helper function to send WhatsApp notifications
async function sendWhatsAppNotifications(
    tenantId: number,
    participants: Array<{
        brokerId: number | null
        commissionValue: number
        isResponsible: boolean
    }>,
    propertyTitle: string,
    propertyAddress: string | null,
    saleValue: number,
    saleDate: Date,
    currentYear: number
) {
    for (const participant of participants) {
        if (!participant.brokerId) continue

        try {
            // Get broker info
            const [broker] = await db
                .select({ name: brokers.name, phone: brokers.phone })
                .from(brokers)
                .where(eq(brokers.id, participant.brokerId))
                .limit(1)

            if (!broker?.phone) continue

            // Get broker's current meta progress
            const salesData = await db
                .select({ value: sales.value })
                .from(sales)
                .where(and(
                    eq(sales.brokerId, participant.brokerId),
                    eq(sales.year, currentYear)
                ))

            const currentMetaValue = salesData.reduce((sum, s) => sum + parseFloat(s.value || '0'), 0)

            // Get broker's goal
            const [goal] = await db
                .select({ metaAnual: brokerGoals.metaAnual })
                .from(brokerGoals)
                .where(and(
                    eq(brokerGoals.brokerId, participant.brokerId),
                    eq(brokerGoals.year, currentYear)
                ))
                .limit(1)

            const metaGoal = parseFloat(goal?.metaAnual || '0')

            // Send notification
            await sendSaleNotification({
                tenantId,
                phone: broker.phone,
                brokerName: broker.name,
                propertyTitle,
                propertyAddress: propertyAddress || undefined,
                saleValue,
                saleDate,
                commissionValue: participant.commissionValue,
                currentMetaValue,
                metaGoal
            })

            console.log(`[WhatsApp] Notification sent to ${broker.name}`)
        } catch (error) {
            console.error(`[WhatsApp] Failed to notify broker ${participant.brokerId}:`, error)
        }
    }
}

