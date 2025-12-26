"use client"

import { useEffect, useState } from "react"
import { Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface BrokerRanking {
    position: number
    id: number
    name: string
    email: string
    metaAnual: number
    vendido: number
    percentMeta: number
}

interface RankingTableProps {
    tenantId: number
    period: "anual" | "semestral" | "trimestral" | "mensal"
    year: number
    periodValue?: number
    searchTerm: string
    sortBy: string
}

export function RankingTable({ tenantId, period, year, periodValue, searchTerm, sortBy }: RankingTableProps) {
    const [rankings, setRankings] = useState<BrokerRanking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRankings = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams({
                    tenantId: tenantId.toString(),
                    period,
                    year: year.toString(),
                    search: searchTerm,
                    sort: sortBy
                })

                if (periodValue) {
                    params.append('periodValue', periodValue.toString())
                }

                const response = await fetch(`/api/rankings?${params}`)
                const data = await response.json()
                setRankings(data)
            } catch (error) {
                console.error("Error fetching rankings:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchRankings()
    }, [tenantId, period, year, periodValue, searchTerm, sortBy])

    const getStatusBadge = (percentMeta: number) => {
        if (percentMeta >= 100) {
            return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">🔥 Acima de 100%</Badge>
        } else if (percentMeta >= 50) {
            return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">50-79%</Badge>
        } else {
            return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/50">50-79%</Badge>
        }
    }

    const getPositionIcon = (position: number) => {
        if (position === 1) {
            return <Crown className="h-5 w-5 text-emerald-500" />
        } else if (position === 2) {
            return <div className="w-5 h-5 rounded-full bg-zinc-400 flex items-center justify-center text-xs font-bold text-zinc-900">2</div>
        } else if (position === 3) {
            return <div className="w-5 h-5 rounded-full bg-amber-700 flex items-center justify-center text-xs font-bold text-white">3</div>
        }
        return null
    }

    if (loading) {
        return (
            <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-12 text-center">
                <p className="text-zinc-400">Carregando rankings...</p>
            </div>
        )
    }

    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-zinc-800">
                        <tr className="text-zinc-400 text-sm">
                            <th className="text-left p-4 font-medium">#</th>
                            <th className="text-left p-4 font-medium">Corretor</th>
                            <th className="text-left p-4 font-medium">Meta Anual</th>
                            <th className="text-left p-4 font-medium">Vendido</th>
                            <th className="text-left p-4 font-medium">Progresso</th>
                            <th className="text-left p-4 font-medium">% Meta</th>
                            <th className="text-left p-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((broker) => (
                            <tr
                                key={broker.id}
                                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                            >
                                {/* Position */}
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {getPositionIcon(broker.position)}
                                        <span className="text-zinc-400 text-sm">{broker.position}º</span>
                                    </div>
                                </td>

                                {/* Broker */}
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-semibold">
                                            {broker.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{broker.name}</p>
                                            <p className="text-zinc-500 text-xs">{broker.email}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* Meta Anual */}
                                <td className="p-4">
                                    <p className="text-zinc-300">
                                        R$ {broker.metaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </td>

                                {/* Vendido */}
                                <td className="p-4">
                                    <p className="text-emerald-500 font-semibold">
                                        R$ {broker.vendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </td>

                                {/* Progress Bar */}
                                <td className="p-4">
                                    <div className="w-32">
                                        <Progress
                                            value={Math.min(broker.percentMeta, 100)}
                                            className="h-2 bg-zinc-700"
                                        />
                                    </div>
                                </td>

                                {/* % Meta */}
                                <td className="p-4">
                                    <p className={`font-semibold ${broker.percentMeta >= 100 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                        {broker.percentMeta.toFixed(2)}%
                                    </p>
                                </td>

                                {/* Status */}
                                <td className="p-4">
                                    {getStatusBadge(broker.percentMeta)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rankings.length === 0 && (
                <div className="p-12 text-center">
                    <p className="text-zinc-400">Nenhum corretor encontrado para este período.</p>
                </div>
            )}
        </div>
    )
}
