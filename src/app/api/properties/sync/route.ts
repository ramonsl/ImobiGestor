import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tenants, properties, syncJobs } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

// Helper function to run sync in background
async function runSyncInBackground(tenantId: number, jobId: number, token: string) {
    try {
        // Update job to running
        await db.update(syncJobs).set({ status: 'running' }).where(eq(syncJobs.id, jobId))

        const apiUrl = `https://api.jetimob.com/webservice/${token}/imoveis/todos`
        console.log(`[JetImóveis] Job ${jobId}: Calling API...`)

        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })

        if (!apiResponse.ok) {
            throw new Error(`API returned ${apiResponse.status}`)
        }

        const jetData = await apiResponse.json()
        const jetProperties = Array.isArray(jetData) ? jetData : (jetData.data || jetData.imoveis || [])
        const total = jetProperties.length

        console.log(`[JetImóveis] Job ${jobId}: Found ${total} properties`)

        // Update job with total
        await db.update(syncJobs).set({ total, message: `Encontrados ${total} imóveis` }).where(eq(syncJobs.id, jobId))

        // Delete existing JetImóveis properties
        await db.delete(properties).where(
            and(eq(properties.tenantId, tenantId), eq(properties.source, 'jetimoveis'))
        )

        const now = new Date()
        let progress = 0

        for (const jet of jetProperties) {
            const externalId = jet.codigo?.toString()
            if (!externalId) continue

            const tituloAnuncio = jet.titulo_anuncio?.trim()
            let title: string
            if (tituloAnuncio) {
                title = `${externalId} - ${tituloAnuncio}`
            } else {
                const parts = [externalId]
                if (jet.subtipo) parts.push(jet.subtipo)
                else if (jet.tipo) parts.push(jet.tipo)
                if (jet.endereco_bairro) parts.push(jet.endereco_bairro)
                if (jet.endereco_cidade) parts.push(jet.endereco_cidade)
                title = parts.join(' - ')
            }

            const addressParts = []
            if (jet.endereco_logradouro) addressParts.push(jet.endereco_logradouro)
            if (jet.endereco_numero) addressParts.push(jet.endereco_numero)
            const address = addressParts.join(', ') || null
            const imageUrl = jet.imagens?.[0]?.link_thumb || jet.imagens?.[0]?.link || null
            const type = [jet.tipo, jet.subtipo].filter(Boolean).join(' / ') || null

            await db.insert(properties).values({
                tenantId,
                externalId,
                title,
                address,
                city: jet.endereco_cidade || null,
                state: jet.endereco_estado || null,
                type,
                price: (jet.valor_venda || jet.valor_locacao || 0).toString(),
                imageUrl,
                source: 'jetimoveis',
                status: jet.situacao === 'vendido' ? 'sold' : 'active',
                syncedAt: now
            })

            progress++
            // Update progress every 10 items
            if (progress % 10 === 0 || progress === total) {
                await db.update(syncJobs).set({
                    progress,
                    message: `Importando ${progress} de ${total}...`
                }).where(eq(syncJobs.id, jobId))
            }
        }

        // Mark as completed
        await db.update(syncJobs).set({
            status: 'completed',
            progress: total,
            message: `${total} imóveis sincronizados!`,
            completedAt: new Date()
        }).where(eq(syncJobs.id, jobId))

        console.log(`[JetImóveis] Job ${jobId}: Completed!`)
    } catch (error) {
        console.error(`[JetImóveis] Job ${jobId} error:`, error)
        await db.update(syncJobs).set({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            completedAt: new Date()
        }).where(eq(syncJobs.id, jobId))
    }
}

// POST - Start async sync
export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await request.json()

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        // Get tenant's JetImóveis token
        const tenant = await db
            .select({ jetimoveisToken: tenants.jetimoveisToken })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .then(res => res[0])

        if (!tenant?.jetimoveisToken) {
            return NextResponse.json({ error: "Token do JetImóveis não configurado" }, { status: 400 })
        }

        // Check if there's already a running sync
        const existingJob = await db
            .select()
            .from(syncJobs)
            .where(and(
                eq(syncJobs.tenantId, tenantId),
                eq(syncJobs.type, 'jetimoveis'),
                eq(syncJobs.status, 'running')
            ))
            .then(res => res[0])

        if (existingJob) {
            return NextResponse.json({
                jobId: existingJob.id,
                message: "Sincronização já em andamento",
                status: existingJob.status
            })
        }

        // Create new sync job
        const [job] = await db
            .insert(syncJobs)
            .values({
                tenantId,
                type: 'jetimoveis',
                status: 'pending',
                message: 'Iniciando sincronização...'
            })
            .returning({ id: syncJobs.id })

        // Start sync in background (non-blocking)
        runSyncInBackground(tenantId, job.id, tenant.jetimoveisToken)

        return NextResponse.json({
            jobId: job.id,
            message: "Sincronização iniciada!",
            status: 'pending'
        })
    } catch (error) {
        console.error("[JetImóveis] Error starting sync:", error)
        return NextResponse.json({ error: "Erro ao iniciar sincronização" }, { status: 500 })
    }
}

// GET - Check sync status
export async function GET(request: NextRequest) {
    try {
        const tenantId = parseInt(request.nextUrl.searchParams.get("tenantId") || "0")

        if (!tenantId) {
            return NextResponse.json({ error: "Tenant ID obrigatório" }, { status: 400 })
        }

        // Get latest sync job for this tenant
        const job = await db
            .select()
            .from(syncJobs)
            .where(and(
                eq(syncJobs.tenantId, tenantId),
                eq(syncJobs.type, 'jetimoveis')
            ))
            .orderBy(desc(syncJobs.startedAt))
            .limit(1)
            .then(res => res[0])

        if (!job) {
            return NextResponse.json({ status: 'none' })
        }

        return NextResponse.json({
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            total: job.total,
            message: job.message,
            error: job.error,
            startedAt: job.startedAt,
            completedAt: job.completedAt
        })
    } catch (error) {
        console.error("[JetImóveis] Error checking status:", error)
        return NextResponse.json({ error: "Erro ao verificar status" }, { status: 500 })
    }
}
