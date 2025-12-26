import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { MetricCard } from "@/components/dashboard/MetricCard"
import { PodiumRanking } from "@/components/dashboard/PodiumRanking"
import { BrokerPerformanceChart } from "@/components/dashboard/BrokerPerformanceChart"
import { MonthlyEvolutionChart } from "@/components/dashboard/MonthlyEvolutionChart"
import { QuarterlyChart } from "@/components/dashboard/QuarterlyChart"
import { SemesterChart } from "@/components/dashboard/SemesterChart"
import { YearSelector } from "@/components/dashboard/YearSelector"
import { db } from "@/lib/db"
import { brokers, sales, tenants, tenantGoals, brokerGoals } from "@/db/schema"
import { eq, sql, and } from "drizzle-orm"
import {
    TrendingUp,
    Target,
    Rocket,
    Percent,
    Calendar,
    DollarSign
} from "lucide-react"

export default async function TenantDashboard({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ year?: string }>
}) {
    const { slug } = await params
    const { year: yearParam } = await searchParams
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Verify user belongs to this tenant
    if (session.user.tenantSlug !== slug) {
        redirect("/login")
    }

    // Get tenant
    const tenant = await db.select().from(tenants).where(eq(tenants.slug, slug)).then(res => res[0])
    if (!tenant) {
        redirect("/login")
    }

    // Calculate metrics from real data
    const currentYear = yearParam ? parseInt(yearParam) : new Date().getFullYear()


    // Total executed this year
    const totalExecuted = await db
        .select({ total: sql<string>`COALESCE(SUM(${sales.value}), 0)` })
        .from(sales)
        .where(and(
            eq(sales.tenantId, tenant.id),
            eq(sales.year, currentYear)
        ))
        .then(res => parseFloat(res[0]?.total || "0"))

    // Get goals from tenantGoals table
    const goalsData = await db
        .select()
        .from(tenantGoals)
        .where(and(
            eq(tenantGoals.tenantId, tenant.id),
            eq(tenantGoals.year, currentYear)
        ))
        .then(res => res[0])

    const metaAnual = parseFloat(goalsData?.metaAnual || '0')
    const superMeta = parseFloat(goalsData?.superMeta || '0')
    const percentMeta = metaAnual > 0 ? (totalExecuted / metaAnual) * 100 : 0
    const restanteMeta = metaAnual - totalExecuted
    const restanteSuperMeta = superMeta - totalExecuted

    const metrics = [
        {
            title: "Total Executado no Ano",
            value: `R$ ${totalExecuted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            trend: "+12%"
        },
        { title: "Meta Anual da Empresa", value: `R$ ${metaAnual.toLocaleString('pt-BR')}`, icon: Target },
        { title: "Super Meta da Empresa", value: `R$ ${superMeta.toLocaleString('pt-BR')}`, icon: Rocket },
        {
            title: "% da Meta Anual Atingida",
            value: `${percentMeta.toFixed(2)}%`,
            icon: Percent,
            trend: "+5%"
        },
        {
            title: "Restante para Meta",
            value: `R$ ${restanteMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: Calendar
        },
        {
            title: "Restante para Super Meta",
            value: `R$ ${restanteSuperMeta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign
        },
    ]

    // Get top 3 of the year
    const topYearData = await db
        .select({
            brokerId: sales.brokerId,
            brokerName: brokers.name,
            total: sql<string>`SUM(${sales.value})`,
        })
        .from(sales)
        .innerJoin(brokers, eq(sales.brokerId, brokers.id))
        .where(and(
            eq(sales.tenantId, tenant.id),
            eq(sales.year, currentYear)
        ))
        .groupBy(sales.brokerId, brokers.name)
        .orderBy(sql`SUM(${sales.value}) DESC`)
        .limit(3)

    const topYear = topYearData.map((item, index) => {
        const total = parseFloat(item.total)
        const percentage = ((total / totalExecuted) * 100).toFixed(2)
        return {
            name: item.brokerName,
            value: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            percentage: `+${percentage}%`,
            position: (index + 1) as 1 | 2 | 3
        }
    })

    // Get top 3 of the month (December)
    const currentMonth = 12
    const topMonthData = await db
        .select({
            brokerId: sales.brokerId,
            brokerName: brokers.name,
            total: sql<string>`SUM(${sales.value})`,
        })
        .from(sales)
        .innerJoin(brokers, eq(sales.brokerId, brokers.id))
        .where(and(
            eq(sales.tenantId, tenant.id),
            eq(sales.year, currentYear),
            eq(sales.month, currentMonth)
        ))
        .groupBy(sales.brokerId, brokers.name)
        .orderBy(sql`SUM(${sales.value}) DESC`)
        .limit(3)

    const monthTotal = topMonthData.reduce((sum, item) => sum + parseFloat(item.total), 0)
    const topMonth = topMonthData.map((item, index) => {
        const total = parseFloat(item.total)
        const percentage = ((total / monthTotal) * 100).toFixed(2)
        return {
            name: item.brokerName,
            value: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            percentage: `+${percentage}%`,
            position: (index + 1) as 1 | 2 | 3
        }
    })

    // Broker Performance Data (Meta vs Executado) - fetch broker goals
    const allBrokerGoalsData = await db
        .select()
        .from(brokerGoals)
        .where(eq(brokerGoals.year, currentYear))

    const brokerPerformanceData = topYearData.slice(0, 8).map(item => {
        const brokerGoal = allBrokerGoalsData.find(g => g.brokerId === item.brokerId)
        return {
            name: item.brokerName,
            meta: parseFloat(brokerGoal?.metaAnual || '0'),
            executado: parseFloat(item.total)
        }
    })

    // Monthly Evolution Data
    const monthlyEvolutionData = await db
        .select({
            month: sales.month,
            total: sql<string>`SUM(${sales.value})`
        })
        .from(sales)
        .where(and(
            eq(sales.tenantId, tenant.id),
            eq(sales.year, currentYear)
        ))
        .groupBy(sales.month)
        .orderBy(sales.month)

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const monthlyData = monthlyEvolutionData.map(item => ({
        month: monthNames[item.month - 1],
        value: parseFloat(item.total)
    }))

    // Quarterly Data
    const quarterlyData = [
        {
            quarter: 'Q1',
            value: monthlyData.slice(0, 3).reduce((sum: number, m: { value: number }) => sum + m.value, 0)
        },
        {
            quarter: 'Q2',
            value: monthlyData.slice(3, 6).reduce((sum: number, m: { value: number }) => sum + m.value, 0)
        },
        {
            quarter: 'Q3',
            value: monthlyData.slice(6, 9).reduce((sum: number, m: { value: number }) => sum + m.value, 0)
        },
        {
            quarter: 'Q4',
            value: monthlyData.slice(9, 12).reduce((sum: number, m: { value: number }) => sum + m.value, 0)
        }
    ]

    // Semester Data
    const semesterData = [
        {
            semester: '1º Sem',
            value: monthlyData.slice(0, 6).reduce((sum: number, m: { value: number }) => sum + m.value, 0)
        },
        {
            semester: '2º Sem',
            value: monthlyData.slice(6, 12).reduce((sum: number, m: { value: number }) => sum + m.value, 0)
        }
    ]

    return (
        <div className="flex min-h-screen bg-[#0a0e27]">
            <Sidebar tenantSlug={slug} tenantName={tenant.name} />

            <main className="flex-1 ml-64 p-8">
                {/* Header with Year Selector */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard {currentYear}</h1>
                        <p className="text-zinc-400">Visão geral de performance comercial</p>
                    </div>
                    <YearSelector currentYear={currentYear} slug={slug} />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-6 gap-4 mb-8">
                    {metrics.map((metric, index) => (
                        <MetricCard
                            key={index}
                            title={metric.title}
                            value={metric.value}
                            icon={metric.icon}
                            trend={metric.trend}
                        />
                    ))}
                </div>

                {/* Rankings */}
                {topYear.length === 3 && topMonth.length === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <PodiumRanking title={`Top 3 do Ano ${currentYear}`} rankings={topYear as any} />
                        <PodiumRanking title="Top 3 do Mês" rankings={topMonth as any} />
                    </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Broker Performance */}
                    <BrokerPerformanceChart data={brokerPerformanceData} />

                    {/* Monthly Evolution */}
                    <MonthlyEvolutionChart data={monthlyData} />

                    {/* Quarterly Evolution */}
                    <QuarterlyChart data={quarterlyData} />

                    {/* Semester Evolution */}
                    <SemesterChart data={semesterData} />
                </div>
            </main>
        </div>
    )
}
