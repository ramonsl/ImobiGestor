"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { Loader2, Check, Receipt, Upload } from "lucide-react"

interface Payment {
    id: number
    brokerId: number
    brokerName: string
    type: string
    description: string | null
    amount: string
}

interface ConfirmPaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    payment: Payment | null
}

export function ConfirmPaymentModal({ isOpen, onClose, onConfirm, payment }: ConfirmPaymentModalProps) {
    const [saving, setSaving] = useState(false)
    const [receiptUrl, setReceiptUrl] = useState('')
    const [notes, setNotes] = useState('')

    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num)
    }

    const handleConfirm = async () => {
        if (!payment) return

        setSaving(true)
        try {
            const response = await fetch(`/api/payments/${payment.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'paid',
                    paidAt: new Date().toISOString(),
                    receiptUrl: receiptUrl || null,
                    notes: notes || null
                })
            })

            if (response.ok) {
                setReceiptUrl('')
                setNotes('')
                onConfirm()
            } else {
                const data = await response.json()
                alert(data.error || 'Erro ao confirmar pagamento')
            }
        } catch (error) {
            console.error('Erro:', error)
            alert('Erro ao confirmar pagamento')
        } finally {
            setSaving(false)
        }
    }

    if (!payment) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f3a] border-zinc-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Check className="h-5 w-5 text-emerald-500" />
                        Confirmar Pagamento
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Payment Info */}
                    <div className="bg-[#0a0e27] rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Colaborador:</span>
                            <span className="text-white font-medium">{payment.brokerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Tipo:</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${payment.type === 'commission'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                {payment.type === 'commission' ? 'Comissão' : 'Reembolso'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-400">Descrição:</span>
                            <span className="text-white">{payment.description || '-'}</span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-700 pt-2 mt-2">
                            <span className="text-zinc-400 font-medium">Valor:</span>
                            <span className="text-emerald-500 font-bold text-lg">{formatCurrency(payment.amount)}</span>
                        </div>
                    </div>

                    {/* Receipt Upload */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Comprovante de Pagamento (opcional)
                        </label>
                        <div className="flex items-center gap-4">
                            {receiptUrl ? (
                                <div className="flex-1 bg-[#0a0e27] rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-emerald-500" />
                                        <span className="text-sm text-zinc-300">Comprovante anexado</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setReceiptUrl('')}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        Remover
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1">
                                    <ImageUpload
                                        value={receiptUrl}
                                        onChange={setReceiptUrl}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Clique para fazer upload</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Observações</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Pago via PIX, transferência bancária..."
                            className="w-full bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 rounded-lg focus:border-emerald-500 focus:outline-none resize-none h-20"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={saving}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Confirmando...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Confirmar Pagamento
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
