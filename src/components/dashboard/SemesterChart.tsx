"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface SemesterData {
    semester: string
    value: number
}

interface SemesterChartProps {
    data: SemesterData[]
}

export function SemesterChart({ data }: SemesterChartProps) {
    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Evolução Semestral</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis dataKey="semester" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1f3a',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                    />
                    <Bar dataKey="value" fill="#4ade80" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
