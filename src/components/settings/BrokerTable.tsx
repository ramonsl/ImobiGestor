"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Users, ChevronDown } from "lucide-react"
import { BrokerModal } from "./BrokerModal"

type CollaboratorType = 'gestor' | 'corretor' | 'agenciador' | 'outros'

interface Broker {
    id: number
    name: string
    type: CollaboratorType
    metaAnual: number
    avatarUrl: string | null
    active: boolean
}

const typeLabels: Record<CollaboratorType, { label: string; color: string }> = {
    gestor: { label: 'Gestor', color: 'bg-purple-500/20 text-purple-400' },
    corretor: { label: 'Corretor', color: 'bg-emerald-500/20 text-emerald-400' },
    agenciador: { label: 'Agenciador', color: 'bg-blue-500/20 text-blue-400' },
    outros: { label: 'Outros', color: 'bg-zinc-500/20 text-zinc-400' }
}

interface BrokerTableProps {
    tenantId: number
    initialYear: number
    initialBrokers: Broker[]
    companyMeta: number
}

export function BrokerTable({ tenantId, initialYear, initialBrokers, companyMeta }: BrokerTableProps) {
    const [year, setYear] = useState(initialYear)
    const [brokers, setBrokers] = useState<Broker[]>(initialBrokers)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBroker, setEditingBroker] = useState<Broker | null>(null)
    const [loading, setLoading] = useState(false)

    const currentYear = new Date().getFullYear()
    const years = [currentYear - 1, currentYear, currentYear + 1]

    const handleYearChange = async (newYear: number) => {
        setYear(newYear)
        setLoading(true)
        try {
            const res = await fetch(`/api/brokers?tenantId=${tenantId}&year=${newYear}`)
            const data = await res.json()
            setBrokers(data.map((b: { id: number; name: string; type?: string; metaAnual: string | null; avatarUrl: string | null; active: boolean }) => ({
                id: b.id,
                name: b.name,
                type: (b.type as CollaboratorType) || 'corretor',
                metaAnual: parseFloat(b.metaAnual || '0'),
                avatarUrl: b.avatarUrl,
                active: b.active ?? true
            })))
        } catch (error) {
            console.error('Erro ao carregar corretores:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddBroker = () => {
        setEditingBroker(null)
        setIsModalOpen(true)
    }

    const handleEditBroker = (broker: Broker) => {
        setEditingBroker(broker)
        setIsModalOpen(true)
    }

    const handleDeleteBroker = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este corretor?')) return

        try {
            await fetch(`/api/brokers/${id}`, { method: 'DELETE' })
            setBrokers(brokers.filter(b => b.id !== id))
        } catch (error) {
            console.error('Erro ao excluir corretor:', error)
        }
    }

    const handleToggleActive = async (id: number, active: boolean) => {
        try {
            await fetch(`/api/brokers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active })
            })
            setBrokers(brokers.map(b => b.id === id ? { ...b, active } : b))
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
        }
    }

    const handleDistributeMeta = async () => {
        const activeBrokers = brokers.filter(b => b.active)
        if (activeBrokers.length === 0) {
            alert('Nenhum corretor ativo para distribuir a meta')
            return
        }

        const metaPerBroker = companyMeta / activeBrokers.length

        try {
            await fetch('/api/brokers/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, year, metaPerBroker })
            })

            setBrokers(brokers.map(b => b.active ? { ...b, metaAnual: metaPerBroker } : b))
        } catch (error) {
            console.error('Erro ao distribuir metas:', error)
        }
    }

    const handleSaveBroker = (broker: Broker) => {
        if (editingBroker) {
            setBrokers(brokers.map(b => b.id === broker.id ? broker : b))
        } else {
            setBrokers([...brokers, broker])
        }
        setIsModalOpen(false)
    }

    const formatCurrency = (value: number) => {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }

    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-white">Colaboradores</h2>
                    <p className="text-zinc-400 text-sm">Gerencie os colaboradores da imobiliária</p>
                </div>
                <div className="flex gap-3 items-center">
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
                    <Button
                        variant="outline"
                        onClick={handleDistributeMeta}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Diluir Meta
                    </Button>
                    <Button
                        onClick={handleAddBroker}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Colaborador
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-zinc-800">
                        <tr className="text-zinc-400 text-sm">
                            <th className="text-left p-4 font-medium">Foto</th>
                            <th className="text-left p-4 font-medium">Nome</th>
                            <th className="text-left p-4 font-medium">Tipo</th>
                            <th className="text-left p-4 font-medium">Meta {year}</th>
                            <th className="text-left p-4 font-medium">Ativo</th>
                            <th className="text-right p-4 font-medium">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-zinc-400">Carregando...</td>
                            </tr>
                        ) : brokers.map((broker) => (
                            <tr key={broker.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                <td className="p-4">
                                    {broker.avatarUrl ? (
                                        <img
                                            src={broker.avatarUrl}
                                            alt={broker.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-sm">
                                            {getInitials(broker.name)}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className="text-white font-medium">{broker.name}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeLabels[broker.type].color}`}>
                                        {typeLabels[broker.type].label}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-emerald-500 font-semibold">
                                        {formatCurrency(broker.metaAnual)}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <Switch
                                        checked={broker.active}
                                        onCheckedChange={(checked) => handleToggleActive(broker.id, checked)}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditBroker(broker)}
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteBroker(broker.id)}
                                            className="text-zinc-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!loading && brokers.length === 0 && (
                <div className="text-center py-12 text-zinc-400">
                    Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para adicionar.
                </div>
            )}

            <BrokerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveBroker}
                broker={editingBroker}
                tenantId={tenantId}
                year={year}
            />
        </div>
    )
}
