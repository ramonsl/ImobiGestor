import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "../src/lib/db"
import { users, tenants } from "../src/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

async function main() {
    console.log("Seeding users with passwords...")

    // 1. Create or Update Tenant
    let tenant = await db.select().from(tenants).where(eq(tenants.slug, "confianca")).then(res => res[0])

    if (!tenant) {
        [tenant] = await db.insert(tenants).values({
            name: "Imobiliária Confiança",
            slug: "confianca",
            stripeCustomerId: "cus_test_123",
        }).returning()
        console.log("Tenant created:", tenant.name)
    } else {
        console.log("Tenant already exists:", tenant.name)
    }

    const hashedPassword = await bcrypt.hash("senha123", 10)

    // 2. Create Super Admin (Platform Owner)
    const superAdminEmail = "ramonsl@gmail.com"
    const existingSuperAdmin = await db.select().from(users).where(eq(users.email, superAdminEmail)).then(res => res[0])

    if (existingSuperAdmin) {
        await db.update(users).set({
            password: hashedPassword,
            role: "admin",
            tenantId: null // Super Admin doesn't belong to a tenant necessarily
        }).where(eq(users.email, superAdminEmail))
        console.log("Super Admin updated:", superAdminEmail)
    } else {
        await db.insert(users).values({
            name: "Ramon Super Admin",
            email: superAdminEmail,
            role: "admin",
            password: hashedPassword,
            tenantId: null
        })
        console.log("Super Admin created:", superAdminEmail)
    }

    // 3. Create Tenant Admin (Agency Owner)
    const tenantAdminEmail = "dono@confianca.com.br"
    const existingTenantAdmin = await db.select().from(users).where(eq(users.email, tenantAdminEmail)).then(res => res[0])

    if (existingTenantAdmin) {
        await db.update(users).set({
            password: hashedPassword,
            role: "admin",
            tenantId: tenant.id
        }).where(eq(users.email, tenantAdminEmail))
        console.log("Tenant Admin updated:", tenantAdminEmail)
    } else {
        await db.insert(users).values({
            name: "João Corretor (Dono)",
            email: tenantAdminEmail,
            role: "admin",
            password: hashedPassword,
            tenantId: tenant.id
        })
        console.log("Tenant Admin created:", tenantAdminEmail)
    }

    console.log("\nSuccess! Accounts created/updated with password: 'senha123'")
    process.exit(0)
}

main().catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
})
