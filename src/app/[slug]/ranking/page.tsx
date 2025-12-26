import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { RankingClient } from "@/components/ranking/RankingClient"
import { db } from "@/lib/db"
import { tenants } from "@/db/schema"
import { eq } from "drizzle-orm"

export default async function RankingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.tenantSlug !== slug) {
        redirect("/login")
    }

    const tenant = await db.select().from(tenants).where(eq(tenants.slug, slug)).then(res => res[0])
    if (!tenant) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen bg-[#0a0e27]">
            <Sidebar tenantSlug={slug} tenantName={tenant.name} />

            <main className="flex-1 ml-64 p-8">
                <RankingClient tenantId={tenant.id} />
            </main>
        </div>
    )
}
