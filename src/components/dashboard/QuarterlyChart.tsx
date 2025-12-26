"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface QuarterData {
    quarter: string
    value: number
    label?: string
}

interface QuarterlyChartProps {
    data: QuarterData[]
}

const CustomTooltip = ({ active, payload }: { active?: boolean, payload?: Array<{ payload: { value: number; quarter: string } }> }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1f3a] border border-zinc-700 rounded-lg p-3">
                <p className="text-white font-semibold">{payload[0].payload.quarter}</p>
                <p className="text-emerald-500 text-sm">
                    Faturamento: R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
        )
    }
    return null
}

export function QuarterlyChart({ data }: QuarterlyChartProps) {
    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Evolução Trimestral</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="quarter" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(244, 183, 64, 0.1)' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
