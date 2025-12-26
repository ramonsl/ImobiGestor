"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface BrokerPerformanceData {
    name: string
    meta: number
    executado: number
}

interface BrokerPerformanceChartProps {
    data: BrokerPerformanceData[]
}

export function BrokerPerformanceChart({ data }: BrokerPerformanceChartProps) {
    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Meta x Executado por Corretor</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={90} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1f3a',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                    />
                    <Bar dataKey="executado" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="meta" fill="#3b4a6b" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
