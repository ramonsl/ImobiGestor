"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FeedbackModal } from "@/components/ui/FeedbackModal"
import { PropertyAutocomplete } from "./PropertyAutocomplete"
import confetti from "canvas-confetti"
import {
    Building2, Calendar, DollarSign, Receipt, Users,
    Plus, Trash2, ChevronDown, Save, ArrowLeft
} from "lucide-react"

// Categorias de despesas
const expenseCategories = [
    { value: 'marketing', label: 'Marketing/Divulgação' },
    { value: 'photography', label: 'Fotografia/Vídeo' },
    { value: 'documentation', label: 'Documentação/Cartório' },
    { value: 'cleaning', label: 'Limpeza/Faxina' },
    { value: 'repairs', label: 'Reparos/Manutenção' },
    { value: 'fuel', label: 'Combustível/Transporte' },
    { value: 'office', label: 'Material de Escritório' },
    { value: 'legal', label: 'Assessoria Jurídica' },
    { value: 'staging', label: 'Home Staging' },
    { value: 'certification', label: 'Certidões/Laudos' },
    { value: 'iptu_condo', label: 'IPTU/Condomínio Pendente' },
    { value: 'other', label: 'Outros' }
]

interface Broker {
    id: number
    name: string
    type: string
}

interface Expense {
    id: string
    category: string
    description: string
    value: number
}

interface Participant {
    id: string
    brokerId: number | null
    participantName: string
    participantType: string
    commissionPercent: number
    commissionValue: number
    isResponsible: boolean
}

interface DealFormProps {
    tenantId: number
    slug: string
    brokers: Broker[]
}

export function DealForm({ tenantId, slug, brokers }: DealFormProps) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    // Modal de feedback
    const [feedback, setFeedback] = useState<{
        isOpen: boolean
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        onConfirm?: () => void
    }>({ isOpen: false, type: 'info', title: '', message: '' })

    const showFeedback = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, onConfirm?: () => void) => {
        setFeedback({ isOpen: true, type, title, message, onConfirm })
    }

    const closeFeedback = () => {
        setFeedback(prev => ({ ...prev, isOpen: false }))
    }

    // Dados do imóvel
    const [propertyId, setPropertyId] = useState<number | null>(null)
    const [propertyTitle, setPropertyTitle] = useState("")
    const [propertyAddress, setPropertyAddress] = useState("")
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])

    // Valores e comissão
    const [saleValue, setSaleValue] = useState(0)
    const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent')
    const [commissionPercent, setCommissionPercent] = useState(6)
    const [commissionFixed, setCommissionFixed] = useState(0)

    // Despesas
    const [expenses, setExpenses] = useState<Expense[]>([])

    // Participantes
    const [participants, setParticipants] = useState<Participant[]>([])

    // Cálculos
    const grossCommission = commissionType === 'percent'
        ? saleValue * (commissionPercent / 100)
        : commissionFixed

    const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0)
    const netCommission = grossCommission - totalExpenses

    const totalDistributed = participants.reduce((sum, p) => sum + p.commissionValue, 0)
    const companyBalance = netCommission - totalDistributed

    // Atualiza valores dos participantes quando comissão líquida muda
    useEffect(() => {
        setParticipants(prev => prev.map(p => ({
            ...p,
            commissionValue: netCommission * (p.commissionPercent / 100)
        })))
    }, [netCommission])

    const handlePropertySelect = (property: { id: number; title: string; address: string | null; price: string | null }) => {
        setPropertyId(property.id)
        setPropertyTitle(property.title)
        setPropertyAddress(property.address || "")
        if (property.price) {
            setSaleValue(parseFloat(property.price))
        }
    }

    const addExpense = () => {
        setExpenses([...expenses, {
            id: Date.now().toString(),
            category: 'other',
            description: '',
            value: 0
        }])
    }

    const removeExpense = (id: string) => {
        setExpenses(expenses.filter(e => e.id !== id))
    }

    const updateExpense = (id: string, field: keyof Expense, value: string | number) => {
        setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e))
    }

    const addParticipant = () => {
        setParticipants([...participants, {
            id: Date.now().toString(),
            brokerId: null,
            participantName: '',
            participantType: 'broker',
            commissionPercent: 0,
            commissionValue: 0,
            isResponsible: false
        }])
    }

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter(p => p.id !== id))
    }

    const updateParticipant = (id: string, field: keyof Participant, value: string | number | boolean | null) => {
        setParticipants(participants.map(p => {
            if (p.id !== id) return p
            const updated = { ...p, [field]: value }
            if (field === 'commissionPercent') {
                updated.commissionValue = netCommission * (Number(value) / 100)
            }
            if (field === 'brokerId' && value) {
                const broker = brokers.find(b => b.id === Number(value))
                if (broker) {
                    updated.participantName = broker.name
                    updated.participantType = broker.type
                }
            }
            return updated
        }))
    }

    const triggerChampagneAnimation = () => {
        const duration = 3000
        const end = Date.now() + duration

        // Som de estouro (opcional, requer arquivo de audio)
        // const audio = new Audio('/sounds/cork-pop.mp3')
        // audio.play().catch(() => {})

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#22c55e', '#fbbf24'] // Verde e Dourado
            })
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#22c55e', '#fbbf24']
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            }
        }
        frame()
    }

    const handleSubmit = async () => {
        if (!propertyTitle || saleValue <= 0) {
            showFeedback('warning', 'Dados Incompletos', 'Preencha o imóvel e o valor da venda para continuar.')
            return
        }

        const hasResponsible = participants.some(p => p.isResponsible && p.brokerId)
        if (!hasResponsible) {
            showFeedback('warning', 'Responsável Obrigatório', 'Selecione ao menos um colaborador responsável pela venda.')
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/deals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    propertyId,
                    propertyTitle,
                    propertyAddress,
                    saleDate,
                    saleValue,
                    commissionType,
                    commissionPercent: commissionType === 'percent' ? commissionPercent : null,
                    commissionValue: commissionType === 'fixed' ? commissionFixed : null,
                    grossCommission,
                    totalExpenses,
                    netCommission,
                    status: 'completed',
                    expenses: expenses.map(e => ({
                        category: e.category,
                        description: e.description,
                        value: e.value
                    })),
                    participants: participants.map(p => ({
                        brokerId: p.brokerId,
                        participantName: p.participantName,
                        participantType: p.participantType,
                        commissionPercent: p.commissionPercent,
                        commissionValue: p.commissionValue,
                        isResponsible: p.isResponsible,
                        contributesToMeta: true
                    }))
                })
            })

            const data = await response.json()
            if (response.ok) {
                triggerChampagneAnimation()
                showFeedback('success', 'Venda Registrada! 🍾', 'Parabéns! Venda salva com sucesso e meta atualizada.', () => {
                    router.push(`/${slug}/vendas`)
                    router.refresh()
                })
            } else {
                showFeedback('error', 'Erro ao Salvar', `Não foi possível registrar a venda: ${data.error}`)
            }
        } catch (error) {
            console.error("Erro ao salvar venda:", error)
            showFeedback('error', 'Erro Inesperado', 'Ocorreu um erro ao tentar salvar a venda.')
        } finally {
            setSaving(false)
        }
    }

    // Formata valor para exibição (R$ 1.000.000)
    const formatCurrencyDisplay = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value)
    }

    // Formata valor para input (1.000.000)
    const formatInputValue = (value: number) => {
        if (value === 0) return ''
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }

    // Converte input para número (remove tudo que não é dígito)
    const handleCurrencyInput = (value: string) => {
        const digits = value.replace(/\D/g, '')
        return parseInt(digits, 10) || 0
    }

    return (
        <>
            <FeedbackModal
                isOpen={feedback.isOpen}
                onClose={closeFeedback}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onConfirm={feedback.onConfirm}
            />

            <div className="space-y-6">
                {/* Seção 1: Dados do Imóvel */}
                <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Building2 className="h-5 w-5 text-emerald-500" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">Dados do Imóvel</h2>
                            <p className="text-zinc-400 text-sm">Informações básicas do imóvel vendido</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Nome / Identificação</label>
                            <PropertyAutocomplete
                                tenantId={tenantId}
                                onSelect={handlePropertySelect}
                                value={propertyTitle}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Data da Venda</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                <Input
                                    type="date"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    className="bg-[#0a0e27] border-zinc-700 text-white pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm text-zinc-400 mb-1">Endereço</label>
                        <Input
                            value={propertyAddress}
                            onChange={(e) => setPropertyAddress(e.target.value)}
                            className="bg-[#0a0e27] border-zinc-700 text-white"
                            placeholder="Ex: Rua das Flores, 123 - Centro"
                        />
                    </div>
                </div>

                {/* Seção 2: Valores e Comissão */}
                <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">Valores e Comissão</h2>
                            <p className="text-zinc-400 text-sm">Defina o valor da venda e a comissão</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Valor da Venda</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                                <Input
                                    value={formatInputValue(saleValue)}
                                    onChange={(e) => setSaleValue(handleCurrencyInput(e.target.value))}
                                    className="bg-[#0a0e27] border-zinc-700 text-white pl-10 text-right"
                                    placeholder="0"
                                />
                            </div>
                            {saleValue > 0 && (
                                <p className="text-xs text-zinc-500 mt-1">{formatCurrencyDisplay(saleValue)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Tipo de Comissão</label>
                            <div className="relative">
                                <select
                                    value={commissionType}
                                    onChange={(e) => setCommissionType(e.target.value as 'percent' | 'fixed')}
                                    className="w-full appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="percent">Percentual (%)</option>
                                    <option value="fixed">Valor Fixo (R$)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">
                                {commissionType === 'percent' ? 'Percentual (%)' : 'Valor Fixo (R$)'}
                            </label>
                            {commissionType === 'percent' ? (
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={commissionPercent}
                                        onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
                                        className="bg-[#0a0e27] border-zinc-700 text-white pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                                        <Input
                                            value={formatInputValue(commissionFixed)}
                                            onChange={(e) => setCommissionFixed(handleCurrencyInput(e.target.value))}
                                            className="bg-[#0a0e27] border-zinc-700 text-white pl-10 text-right"
                                            placeholder="0"
                                        />
                                    </div>
                                    {commissionFixed > 0 && (
                                        <p className="text-xs text-zinc-500 mt-1">{formatCurrencyDisplay(commissionFixed)}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-[#0a0e27] rounded-lg flex justify-between items-center">
                        <span className="text-zinc-400">Comissão Total:</span>
                        <span className="text-2xl font-bold text-emerald-500">{formatCurrencyDisplay(grossCommission)}</span>
                    </div>

                    {commissionType === 'percent' && saleValue > 0 && (
                        <p className="text-xs text-zinc-500 mt-2">
                            {commissionPercent}% de {formatCurrencyDisplay(saleValue)}
                        </p>
                    )}
                    {commissionType === 'fixed' && saleValue > 0 && (
                        <p className="text-xs text-zinc-500 mt-2">
                            Equivalente a {((commissionFixed / saleValue) * 100).toFixed(2)}% do valor
                        </p>
                    )}
                </div>

                {/* Seção 3: Despesas */}
                <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Receipt className="h-5 w-5 text-emerald-500" />
                            <div>
                                <h2 className="text-lg font-semibold text-white">Despesas de Negociação</h2>
                                <p className="text-zinc-400 text-sm">Adicione as despesas relacionadas à venda</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={addExpense}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>

                    {expenses.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {expenses.map((expense) => (
                                <div key={expense.id} className="flex gap-3 items-center">
                                    <div className="relative flex-1">
                                        <select
                                            value={expense.category}
                                            onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                                            className="w-full appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                                        >
                                            {expenseCategories.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                    <Input
                                        value={expense.description}
                                        onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                                        placeholder="Descrição (opcional)"
                                        className="bg-[#0a0e27] border-zinc-700 text-white flex-1"
                                    />
                                    <div className="relative w-32">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">R$</span>
                                        <Input
                                            value={expense.value > 0 ? formatInputValue(expense.value) : ''}
                                            onChange={(e) => updateExpense(expense.id, 'value', handleCurrencyInput(e.target.value))}
                                            className="bg-[#0a0e27] border-zinc-700 text-white pl-8 text-right text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeExpense(expense.id)}
                                        className="text-zinc-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-4 bg-[#0a0e27] rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Total Despesas:</span>
                            <span className="text-red-500 font-semibold">- {formatCurrencyDisplay(totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Comissão Líquida:</span>
                            <span className="text-xl font-bold text-emerald-500">{formatCurrencyDisplay(netCommission)}</span>
                        </div>
                    </div>
                </div>

                {/* Seção 4: Distribuição */}
                <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-emerald-500" />
                            <div>
                                <h2 className="text-lg font-semibold text-white">Distribuição da Comissão</h2>
                                <p className="text-zinc-400 text-sm">Defina como a comissão líquida será dividida</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={addParticipant}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>

                    {participants.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {participants.map((participant) => (
                                <div key={participant.id} className="flex gap-3 items-center">
                                    <div className="relative flex-1">
                                        <select
                                            value={participant.brokerId || ''}
                                            onChange={(e) => updateParticipant(participant.id, 'brokerId', e.target.value ? parseInt(e.target.value) : null)}
                                            className="w-full appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                                        >
                                            <option value="">Selecione um colaborador</option>
                                            {brokers.map(broker => (
                                                <option key={broker.id} value={broker.id}>{broker.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                                    </div>
                                    <div className="relative w-24">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={participant.commissionPercent || ''}
                                            onChange={(e) => updateParticipant(participant.id, 'commissionPercent', parseFloat(e.target.value) || 0)}
                                            className="bg-[#0a0e27] border-zinc-700 text-white pr-6 text-sm"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">%</span>
                                    </div>
                                    <div className="w-32 text-right">
                                        <span className="text-emerald-500 font-semibold">
                                            {formatCurrencyDisplay(participant.commissionValue)}
                                        </span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={participant.isResponsible}
                                            onChange={(e) => updateParticipant(participant.id, 'isResponsible', e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <span className="text-zinc-400 text-sm">Resp.</span>
                                    </label>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeParticipant(participant.id)}
                                        className="text-zinc-400 hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-4 bg-[#0a0e27] rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Total Distribuído:</span>
                            <span className={participants.reduce((s, p) => s + p.commissionPercent, 0) > 100 ? 'text-red-500' : 'text-amber-500'}>
                                {participants.reduce((s, p) => s + p.commissionPercent, 0).toFixed(2)}% - {formatCurrencyDisplay(totalDistributed)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Saldo Imobiliária:</span>
                            <span className={`text-xl font-bold ${companyBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrencyDisplay(companyBalance)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ações */}
                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !propertyTitle || saleValue <= 0}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        {saving ? (
                            <>Salvando...</>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Registrar Venda
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </>
    )
}
