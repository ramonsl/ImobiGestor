"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/ImageUpload"
import { ChevronDown } from "lucide-react"

type CollaboratorType = 'gestor' | 'corretor' | 'agenciador' | 'outros'

const typeOptions: { value: CollaboratorType; label: string }[] = [
    { value: 'gestor', label: 'Gestor' },
    { value: 'corretor', label: 'Corretor' },
    { value: 'agenciador', label: 'Agenciador' },
    { value: 'outros', label: 'Outros' }
]

interface Broker {
    id: number
    name: string
    email?: string
    phone?: string
    type: CollaboratorType
    metaAnual: number
    avatarUrl: string | null
    active: boolean
}

interface BrokerModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (broker: Broker) => void
    broker: Broker | null
    tenantId: number
    year: number
}

export function BrokerModal({ isOpen, onClose, onSave, broker, tenantId, year }: BrokerModalProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [type, setType] = useState<CollaboratorType>('corretor')
    const [metaAnual, setMetaAnual] = useState(0)
    const [avatarUrl, setAvatarUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})

    // Reset form when modal opens or broker changes
    useEffect(() => {
        if (isOpen) {
            setName(broker?.name || '')
            setEmail(broker?.email || '')
            setPhone(broker?.phone || '')
            setType(broker?.type || 'corretor')
            setMetaAnual(broker?.metaAnual || 0)
            setAvatarUrl(broker?.avatarUrl || '')
            setErrors({})
        }
    }, [isOpen, broker])

    const validateForm = () => {
        const newErrors: { name?: string; email?: string; phone?: string } = {}

        if (!name.trim()) {
            newErrors.name = 'Nome é obrigatório'
        }
        if (!email.trim()) {
            newErrors.email = 'Email é obrigatório'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email inválido'
        }
        if (!phone.trim()) {
            newErrors.phone = 'Telefone é obrigatório'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setSaving(true)
        try {
            const method = broker ? 'PUT' : 'POST'
            const url = broker ? `/api/brokers/${broker.id}` : '/api/brokers'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    name,
                    email,
                    phone,
                    type,
                    metaAnual,
                    avatarUrl: avatarUrl || null,
                    year
                })
            })

            const data = await response.json()

            onSave({
                id: broker?.id || data.id,
                name,
                email,
                phone,
                type,
                metaAnual,
                avatarUrl: avatarUrl || null,
                active: broker?.active ?? true
            })

            // Reset form
            setName('')
            setEmail('')
            setPhone('')
            setType('corretor')
            setMetaAnual(0)
            setAvatarUrl('')
        } catch (error) {
            console.error('Erro ao salvar colaborador:', error)
        } finally {
            setSaving(false)
        }
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }

    const parseCurrency = (value: string) => {
        return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
    }

    const formatPhone = (value: string) => {
        // Remove non-digits
        const digits = value.replace(/\D/g, '')
        // Format as (XX) XXXXX-XXXX
        if (digits.length <= 2) return digits
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f3a] border-zinc-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {broker ? 'Editar Colaborador' : 'Novo Colaborador'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Avatar */}
                    <div className="flex justify-center">
                        <ImageUpload
                            value={avatarUrl}
                            onChange={(url) => setAvatarUrl(url)}
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Nome *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`bg-[#0a0e27] ${errors.name ? 'border-red-500' : 'border-zinc-700'} text-white`}
                            placeholder="Nome do colaborador"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Tipo *</label>
                        <div className="relative">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as CollaboratorType)}
                                className="w-full appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none"
                            >
                                {typeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Email *</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`bg-[#0a0e27] ${errors.email ? 'border-red-500' : 'border-zinc-700'} text-white`}
                            placeholder="corretor@email.com"
                        />
                        {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Telefone *</label>
                        <Input
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            className={`bg-[#0a0e27] ${errors.phone ? 'border-red-500' : 'border-zinc-700'} text-white`}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                        {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
                    </div>

                    {/* Meta Anual */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Meta {year} (R$)</label>
                        <Input
                            value={formatCurrency(metaAnual)}
                            onChange={(e) => setMetaAnual(parseCurrency(e.target.value))}
                            className="bg-[#0a0e27] border-zinc-700 text-white"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        {saving ? 'Salvando...' : broker ? 'Salvar' : 'Adicionar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
