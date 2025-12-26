import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { tenants } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { PaymentsClient } from "@/components/payments/PaymentsClient"

export default async function PagamentosPage({ params }: { params: Promise<{ slug: string }> }) {
    const session = await auth()
    if (!session?.user) {
        redirect("/login")
    }

    const { slug } = await params

    // Get tenant info
    const tenant = await db
        .select({ id: tenants.id, name: tenants.name })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1)

    if (!tenant[0]) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen bg-[#0a0e27]">
            <Sidebar tenantSlug={slug} tenantName={tenant[0].name} />
            <main className="flex-1 ml-64 p-8">
                <PaymentsClient
                    tenantId={tenant[0].id}
                    slug={slug}
                />
            </main>
        </div>
    )
}
