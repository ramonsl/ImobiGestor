"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Loader2 } from "lucide-react"

interface Broker {
    id: number
    name: string
}

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    tenantId: number
    month: number
    year: number
}

export function PaymentModal({ isOpen, onClose, onSave, tenantId, month, year }: PaymentModalProps) {
    const [brokers, setBrokers] = useState<Broker[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const [brokerId, setBrokerId] = useState<number | null>(null)
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState(0)
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setBrokerId(null)
            setDescription('')
            setAmount(0)
            setNotes('')

            // Load brokers
            setLoading(true)
            fetch(`/api/brokers?tenantId=${tenantId}&year=${year}`)
                .then(res => res.json())
                .then(data => setBrokers(data))
                .catch(console.error)
                .finally(() => setLoading(false))
        }
    }, [isOpen, tenantId, year])

    const formatInputValue = (value: number) => {
        if (value === 0) return ''
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }

    const handleCurrencyInput = (value: string) => {
        const digits = value.replace(/\D/g, '')
        return parseInt(digits, 10) || 0
    }

    const formatCurrencyDisplay = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const handleSubmit = async () => {
        if (!brokerId || amount <= 0) {
            alert('Selecione um colaborador e informe o valor')
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    brokerId,
                    type: 'reimbursement',
                    description,
                    amount,
                    referenceMonth: month,
                    referenceYear: year,
                    notes
                })
            })

            if (response.ok) {
                onSave()
            } else {
                const data = await response.json()
                alert(data.error || 'Erro ao criar reembolso')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao criar reembolso')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f3a] border-zinc-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Novo Reembolso</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Broker Select */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Colaborador *</label>
                        <div className="relative">
                            <select
                                value={brokerId || ''}
                                onChange={(e) => setBrokerId(parseInt(e.target.value) || null)}
                                className="w-full appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-4 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none"
                                disabled={loading}
                            >
                                <option value="">Selecione...</option>
                                {brokers.map(broker => (
                                    <option key={broker.id} value={broker.id}>{broker.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Descrição *</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Combustível, Almoço com cliente..."
                            className="bg-[#0a0e27] border-zinc-700 text-white"
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Valor *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                            <Input
                                value={formatInputValue(amount)}
                                onChange={(e) => setAmount(handleCurrencyInput(e.target.value))}
                                placeholder="0"
                                className="bg-[#0a0e27] border-zinc-700 text-white pl-10 text-right"
                            />
                        </div>
                        {amount > 0 && (
                            <p className="text-xs text-zinc-500 mt-1">{formatCurrencyDisplay(amount)}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Observações</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Informações adicionais..."
                            className="w-full bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 rounded-lg focus:border-emerald-500 focus:outline-none resize-none h-20"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Registrar Reembolso'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
