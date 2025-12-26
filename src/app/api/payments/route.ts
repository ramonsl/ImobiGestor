import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, brokers, deals, dealParticipants } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")
        const month = parseInt(request.nextUrl.searchParams.get("month") || new Date().getMonth() + 1 + "")
        const year = parseInt(request.nextUrl.searchParams.get("year") || new Date().getFullYear().toString())

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        // Get payments for the month
        const paymentsList = await db
            .select({
                id: payments.id,
                brokerId: payments.brokerId,
                brokerName: brokers.name,
                brokerAvatarUrl: brokers.avatarUrl,
                dealId: payments.dealId,
                dealParticipantId: payments.dealParticipantId,
                type: payments.type,
                description: payments.description,
                amount: payments.amount,
                referenceMonth: payments.referenceMonth,
                referenceYear: payments.referenceYear,
                status: payments.status,
                paidAt: payments.paidAt,
                receiptUrl: payments.receiptUrl,
                notes: payments.notes,
                createdAt: payments.createdAt
            })
            .from(payments)
            .leftJoin(brokers, eq(payments.brokerId, brokers.id))
            .where(and(
                eq(payments.tenantId, tenantId),
                eq(payments.referenceMonth, month),
                eq(payments.referenceYear, year)
            ))
            .orderBy(brokers.name)

        // Get pending commissions from deals that don't have payments yet
        const pendingCommissions = await db
            .select({
                dealId: deals.id,
                dealParticipantId: dealParticipants.id,
                brokerId: dealParticipants.brokerId,
                brokerName: brokers.name,
                brokerAvatarUrl: brokers.avatarUrl,
                propertyTitle: deals.propertyTitle,
                saleDate: deals.saleDate,
                commissionValue: dealParticipants.commissionValue
            })
            .from(dealParticipants)
            .innerJoin(deals, eq(dealParticipants.dealId, deals.id))
            .leftJoin(brokers, eq(dealParticipants.brokerId, brokers.id))
            .where(and(
                eq(deals.tenantId, tenantId),
                eq(deals.status, 'completed'),
                sql`EXTRACT(MONTH FROM ${deals.saleDate}) = ${month}`,
                sql`EXTRACT(YEAR FROM ${deals.saleDate}) = ${year}`,
                sql`${dealParticipants.brokerId} IS NOT NULL`
            ))

        // Filter out commissions that already have a payment
        const existingPaymentDealParticipantIds = paymentsList
            .filter(p => p.type === 'commission' && p.dealParticipantId)
            .map(p => p.dealParticipantId)

        const pendingCommissionsFiltered = pendingCommissions.filter(
            c => !existingPaymentDealParticipantIds.includes(c.dealParticipantId)
        )

        // Calculate summaries
        const totalPending = paymentsList
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)

        const totalPaid = paymentsList
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)

        const totalUnregistered = pendingCommissionsFiltered
            .reduce((sum, c) => sum + parseFloat(c.commissionValue || '0'), 0)

        return NextResponse.json({
            payments: paymentsList,
            pendingCommissions: pendingCommissionsFiltered,
            summary: {
                totalPending,
                totalPaid,
                totalUnregistered,
                total: totalPending + totalPaid + totalUnregistered
            }
        })
    } catch (error) {
        console.error("Erro ao listar pagamentos:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            tenantId,
            brokerId,
            dealId,
            dealParticipantId,
            type,
            description,
            amount,
            referenceMonth,
            referenceYear,
            notes
        } = body

        if (!tenantId || !brokerId || !type || !amount || !referenceMonth || !referenceYear) {
            return NextResponse.json({
                error: "Campos obrigatórios: tenantId, brokerId, type, amount, referenceMonth, referenceYear"
            }, { status: 400 })
        }

        const [newPayment] = await db
            .insert(payments)
            .values({
                tenantId,
                brokerId,
                dealId: dealId || null,
                dealParticipantId: dealParticipantId || null,
                type,
                description: description || null,
                amount: amount.toString(),
                referenceMonth,
                referenceYear,
                status: 'pending',
                notes: notes || null
            })
            .returning({ id: payments.id })

        return NextResponse.json({
            id: newPayment.id,
            success: true,
            message: "Pagamento registrado com sucesso!"
        })
    } catch (error) {
        console.error("Erro ao criar pagamento:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
