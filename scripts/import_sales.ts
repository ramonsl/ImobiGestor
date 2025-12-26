import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "../src/lib/db"
import { brokers, sales, tenants } from "../src/db/schema"
import { eq } from "drizzle-orm"
import * as fs from "fs"
import * as path from "path"

// Month name to number mapping
const monthMap: Record<string, number> = {
    "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4,
    "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
    "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
}

async function main() {
    console.log("🚀 Starting CSV import...")

    // Get tenant
    const tenant = await db.select().from(tenants).where(eq(tenants.slug, "confianca")).then(res => res[0])
    if (!tenant) {
        throw new Error("Tenant 'confianca' not found")
    }
    console.log(`✅ Found tenant: ${tenant.name}`)

    // Read CSV file
    const csvPath = path.join(__dirname, "lancamentos_2025 (1).csv")
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const lines = csvContent.split("\n").slice(1) // Skip header

    // Track unique brokers
    const brokerMap = new Map<string, number>()

    console.log(`📄 Processing ${lines.length} sales records...`)

    for (const line of lines) {
        if (!line.trim()) continue

        const [corretor, tipoImovel, mes, ano, valorStr] = line.split(";")

        if (!corretor || !mes || !ano || !valorStr) continue

        // Get or create broker
        let brokerId = brokerMap.get(corretor)

        if (!brokerId) {
            // Check if broker exists
            const existingBroker = await db.select()
                .from(brokers)
                .where(eq(brokers.name, corretor))
                .then(res => res[0])

            if (existingBroker) {
                brokerId = existingBroker.id
            } else {
                // Create broker with generated email and phone
                const email = `${corretor.toLowerCase().replace(/\s+/g, ".")}@confianca.com.br`
                const phone = `(47) 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`

                const [newBroker] = await db.insert(brokers).values({
                    tenantId: tenant.id,
                    name: corretor,
                    email,
                    phone,
                    active: true
                }).returning()

                brokerId = newBroker.id
                console.log(`  ➕ Created broker: ${corretor}`)
            }

            brokerMap.set(corretor, brokerId)
        }

        // Parse value (replace comma with dot)
        const value = valorStr.replace(",", ".")
        const month = monthMap[mes]
        const year = parseInt(ano)

        // Create sale record
        await db.insert(sales).values({
            tenantId: tenant.id,
            brokerId,
            propertyType: tipoImovel === "-" ? null : tipoImovel,
            month,
            year,
            value
        })
    }

    console.log(`\n✅ Import completed!`)
    console.log(`   📊 Created/Updated ${brokerMap.size} brokers`)
    console.log(`   💰 Imported ${lines.filter(l => l.trim()).length} sales`)

    process.exit(0)
}

main().catch((err) => {
    console.error("❌ Import failed:", err)
    process.exit(1)
})
