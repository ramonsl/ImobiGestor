import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { db } from "@/lib/db"
import { tenants, brokers, tenantGoals, brokerGoals, properties } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { CompanyForm } from "@/components/settings/CompanyForm"
import { GoalsForm } from "@/components/settings/GoalsForm"
import { BrokerTable } from "@/components/settings/BrokerTable"
import { JetImoveisConfig } from "@/components/settings/JetImoveisConfig"
import { PropertyTable } from "@/components/settings/PropertyTable"
import { WhatsAppConfig } from "@/components/settings/WhatsAppConfig"
import { SettingsTabs } from "@/components/settings/SettingsTabs"

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const session = await auth()
    const currentYear = new Date().getFullYear()

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.tenantSlug !== slug) {
        redirect("/login")
    }

    // Fetch tenant data
    const tenant = await db.select().from(tenants).where(eq(tenants.slug, slug)).then(res => res[0])

    if (!tenant) {
        redirect("/login")
    }

    // Fetch tenant goals for current year
    const currentYearGoals = await db
        .select()
        .from(tenantGoals)
        .where(and(
            eq(tenantGoals.tenantId, tenant.id),
            eq(tenantGoals.year, currentYear)
        ))
        .then(res => res[0])

    // Fetch brokers with their goals for current year
    const brokersList = await db
        .select({
            id: brokers.id,
            name: brokers.name,
            email: brokers.email,
            phone: brokers.phone,
            type: brokers.type,
            avatarUrl: brokers.avatarUrl,
            active: brokers.active
        })
        .from(brokers)
        .where(eq(brokers.tenantId, tenant.id))
        .orderBy(brokers.name)

    // Fetch broker goals for current year
    const allBrokerGoals = await db
        .select()
        .from(brokerGoals)
        .where(eq(brokerGoals.year, currentYear))

    // Merge brokers with their goals
    const brokersWithGoals = brokersList.map(b => {
        const goal = allBrokerGoals.find(g => g.brokerId === b.id)
        return {
            id: b.id,
            name: b.name,
            email: b.email,
            phone: b.phone,
            type: (b.type as 'gestor' | 'corretor' | 'agenciador' | 'outros') || 'corretor',
            metaAnual: parseFloat(goal?.metaAnual || '0'),
            avatarUrl: b.avatarUrl,
            active: b.active ?? true
        }
    })

    // Fetch properties
    const propertiesList = await db
        .select()
        .from(properties)
        .where(eq(properties.tenantId, tenant.id))
        .orderBy(properties.createdAt)

    const propertiesData = propertiesList.map(p => ({
        id: p.id,
        title: p.title,
        address: p.address,
        city: p.city,
        state: p.state,
        type: p.type,
        price: parseFloat(p.price || '0'),
        imageUrl: p.imageUrl,
        source: p.source || 'manual',
        status: p.status || 'active'
    }))

    return (
        <div className="flex min-h-screen bg-[#0a0e27]">
            <Sidebar tenantSlug={slug} tenantName={tenant.name} />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
                    <p className="text-zinc-400">Gerencie sua imobiliária, corretores, metas e imóveis</p>
                </div>

                {/* Tabs Content */}
                <SettingsTabs>
                    {{
                        company: (
                            <CompanyForm
                                tenantId={tenant.id}
                                initialName={tenant.name}
                                initialCnpj={tenant.cnpj || ''}
                                initialLogoUrl={tenant.logoUrl || ''}
                            />
                        ),
                        goals: (
                            <GoalsForm
                                tenantId={tenant.id}
                                initialYear={currentYear}
                                initialMetaAnual={parseFloat(currentYearGoals?.metaAnual || '0')}
                                initialSuperMeta={parseFloat(currentYearGoals?.superMeta || '0')}
                            />
                        ),
                        brokers: (
                            <BrokerTable
                                tenantId={tenant.id}
                                initialYear={currentYear}
                                initialBrokers={brokersWithGoals}
                                companyMeta={parseFloat(currentYearGoals?.metaAnual || '0')}
                            />
                        ),
                        properties: (
                            <PropertyTable
                                tenantId={tenant.id}
                                initialProperties={propertiesData}
                                jetimoveisToken={tenant.jetimoveisToken}
                            />
                        ),
                        integrations: (
                            <JetImoveisConfig
                                tenantId={tenant.id}
                                initialToken={tenant.jetimoveisToken || ''}
                            />
                        ),
                        whatsapp: (
                            <WhatsAppConfig
                                tenantId={tenant.id}
                            />
                        )
                    }}
                </SettingsTabs>
            </main>
        </div>
    )
}
