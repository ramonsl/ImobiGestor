import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function main() {
    const { db } = await import("../src/lib/db")
    const { tenants, users } = await import("../src/db/schema")

    console.log("Seeding database...")

    // 1. Create Tenant
    const [tenant] = await db.insert(tenants).values({
        name: "Imobiliária Confiança",
        slug: "confianca",
        stripeCustomerId: "cus_test_123",
    }).returning()

    console.log("Created tenant:", tenant.name)

    // 2. Create User
    const [user] = await db.insert(users).values({
        name: "Ramon Corretor",
        email: "ramonsl@gmail.com", // Must match Resend account email for testing
        tenantId: tenant.id,
        role: "admin"
    }).returning()

    console.log("Created user:", user.email)

    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
