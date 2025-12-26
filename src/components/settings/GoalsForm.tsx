"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, ChevronDown } from "lucide-react"

interface GoalsFormProps {
    tenantId: number
    initialYear: number
    initialMetaAnual: number
    initialSuperMeta: number
}

export function GoalsForm({ tenantId, initialYear, initialMetaAnual, initialSuperMeta }: GoalsFormProps) {
    const [year, setYear] = useState(initialYear)
    const [metaAnual, setMetaAnual] = useState(initialMetaAnual)
    const [superMeta, setSuperMeta] = useState(initialSuperMeta)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)

    const currentYear = new Date().getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1]

    const handleYearChange = async (newYear: number) => {
        setYear(newYear)
        setLoading(true)
        try {
            const res = await fetch(`/api/settings/goals?tenantId=${tenantId}&year=${newYear}`)
            const data = await res.json()
            setMetaAnual(data.metaAnual || 0)
            setSuperMeta(data.superMeta || 0)
        } catch (error) {
            console.error('Erro ao carregar metas:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/settings/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, year, metaAnual, superMeta })
            })
        } catch (error) {
            console.error('Erro ao salvar metas:', error)
        } finally {
            setSaving(false)
        }
    }

    const formatCurrencyDisplay = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    const formatInputValue = (value: number) => {
        if (value === 0) return ''
        return value.toLocaleString('pt-BR')
    }

    const handleCurrencyChange = (value: string, setter: (v: number) => void) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '')
        // Convert to number
        const numValue = parseInt(digits, 10) || 0
        setter(numValue)
    }

    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-white mb-1">Metas da Empresa</h2>
                    <p className="text-zinc-400 text-sm">Defina as metas anuais da empresa</p>
                </div>
                <div className="relative">
                    <select
                        value={year}
                        onChange={(e) => handleYearChange(parseInt(e.target.value))}
                        className="appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-4 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Meta Anual (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                        <Input
                            value={formatInputValue(metaAnual)}
                            onChange={(e) => handleCurrencyChange(e.target.value, setMetaAnual)}
                            className="bg-[#0a0e27] border-zinc-700 text-white pl-10 text-right"
                            placeholder="0"
                            disabled={loading}
                        />
                    </div>
                    {metaAnual > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">{formatCurrencyDisplay(metaAnual)}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm text-zinc-400 mb-2">Super Meta (R$)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                        <Input
                            value={formatInputValue(superMeta)}
                            onChange={(e) => handleCurrencyChange(e.target.value, setSuperMeta)}
                            className="bg-[#0a0e27] border-zinc-700 text-white pl-10 text-right"
                            placeholder="0"
                            disabled={loading}
                        />
                    </div>
                    {superMeta > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">{formatCurrencyDisplay(superMeta)}</p>
                    )}
                </div>
            </div>

            <Button
                onClick={handleSave}
                disabled={saving || loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Metas'}
            </Button>
        </div>
    )
}
