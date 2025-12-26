import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { tenants, deals } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Plus, Home, Calendar, DollarSign, Users, Eye } from "lucide-react"

export default async function VendasPage({ params }: { params: Promise<{ slug: string }> }) {
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

    // Fetch deals
    const dealsList = await db
        .select()
        .from(deals)
        .where(eq(deals.tenantId, tenant.id))
        .orderBy(desc(deals.saleDate))

    const formatCurrency = (value: string | null) => {
        if (!value) return "R$ 0,00"
        return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }

    const formatDate = (date: Date | null) => {
        if (!date) return "-"
        return new Date(date).toLocaleDateString('pt-BR')
    }

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'completed':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">Concluída</span>
            case 'pending':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">Pendente</span>
            case 'cancelled':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Cancelada</span>
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-zinc-500/20 text-zinc-400">-</span>
        }
    }

    // Calculate totals
    const totalSales = dealsList.reduce((sum, d) => sum + parseFloat(d.saleValue || '0'), 0)
    const totalCommission = dealsList.reduce((sum, d) => sum + parseFloat(d.netCommission || '0'), 0)

    return (
        <div className="flex min-h-screen bg-[#0a0e27]">
            <Sidebar tenantSlug={slug} tenantName={tenant.name} />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Vendas</h1>
                        <p className="text-zinc-400">Gerencie as vendas da imobiliária</p>
                    </div>
                    <Link href={`/${slug}/vendas/nova`}>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Venda
                        </Button>
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                            </div>
                            <span className="text-zinc-400 text-sm">Total Vendas</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(totalSales.toString())}</p>
                    </div>
                    <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <span className="text-zinc-400 text-sm">Total Comissões</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatCurrency(totalCommission.toString())}</p>
                    </div>
                    <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <Home className="h-5 w-5 text-purple-500" />
                            </div>
                            <span className="text-zinc-400 text-sm">Vendas Realizadas</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{dealsList.length}</p>
                    </div>
                </div>

                {/* Deals Table */}
                <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-zinc-800">
                            <tr className="text-zinc-400 text-sm">
                                <th className="text-left p-4 font-medium">Imóvel</th>
                                <th className="text-left p-4 font-medium">Data</th>
                                <th className="text-left p-4 font-medium">Valor Venda</th>
                                <th className="text-left p-4 font-medium">Comissão</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-right p-4 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dealsList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-zinc-400">
                                        <Home className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
                                        <p>Nenhuma venda cadastrada</p>
                                        <Link href={`/${slug}/vendas/nova`}>
                                            <Button variant="link" className="text-emerald-500 mt-2">
                                                Registrar primeira venda
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ) : dealsList.map((deal) => (
                                <tr key={deal.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="p-4">
                                        <div>
                                            <p className="text-white font-medium">{deal.propertyTitle}</p>
                                            {deal.propertyAddress && (
                                                <p className="text-zinc-500 text-sm truncate max-w-xs">{deal.propertyAddress}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-zinc-300">{formatDate(deal.saleDate)}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-white font-semibold">{formatCurrency(deal.saleValue)}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-emerald-500 font-semibold">{formatCurrency(deal.netCommission)}</span>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(deal.status)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}
