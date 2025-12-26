import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { DealForm } from "@/components/deals/DealForm"
import { db } from "@/lib/db"
import { tenants, brokers } from "@/db/schema"
import { eq } from "drizzle-orm"

export default async function NovaVendaPage({ params }: { params: Promise<{ slug: string }> }) {
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

    // Fetch active brokers for the distribution dropdown
    const brokersList = await db
        .select({
            id: brokers.id,
            name: brokers.name,
            type: brokers.type
        })
        .from(brokers)
        .where(eq(brokers.tenantId, tenant.id))
        .orderBy(brokers.name)

    return (
        <div className="flex min-h-screen bg-[#0a0e27]">
            <Sidebar tenantSlug={slug} tenantName={tenant.name} />

            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Nova Venda</h1>
                        <p className="text-zinc-400">Cadastre uma nova venda de imóvel</p>
                    </div>

                    <DealForm
                        tenantId={tenant.id}
                        slug={slug}
                        brokers={brokersList.map(b => ({
                            id: b.id,
                            name: b.name,
                            type: b.type || 'corretor'
                        }))}
                    />
                </div>
            </main>
        </div>
    )
}
