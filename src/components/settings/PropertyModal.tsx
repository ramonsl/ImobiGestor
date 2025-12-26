"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Camera, Home } from "lucide-react"

interface Property {
    id: number
    title: string
    address: string | null
    city: string | null
    state: string | null
    type: string | null
    price: number
    imageUrl: string | null
    source: string
    status: string
}

interface PropertyModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (property: Property) => void
    property: Property | null
    tenantId: number
}

export function PropertyModal({ isOpen, onClose, onSave, property, tenantId }: PropertyModalProps) {
    const [title, setTitle] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [type, setType] = useState('')
    const [price, setPrice] = useState(0)
    const [imageUrl, setImageUrl] = useState('')
    const [status, setStatus] = useState('active')
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<{ title?: string }>({})

    useEffect(() => {
        if (isOpen) {
            setTitle(property?.title || '')
            setAddress(property?.address || '')
            setCity(property?.city || '')
            setState(property?.state || '')
            setType(property?.type || '')
            setPrice(property?.price || 0)
            setImageUrl(property?.imageUrl || '')
            setStatus(property?.status || 'active')
            setErrors({})
        }
    }, [isOpen, property])

    const handleSubmit = async () => {
        if (!title.trim()) {
            setErrors({ title: 'Título é obrigatório' })
            return
        }

        setSaving(true)
        try {
            const method = property ? 'PUT' : 'POST'
            const url = property ? `/api/properties/${property.id}` : '/api/properties'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    title,
                    address: address || null,
                    city: city || null,
                    state: state || null,
                    type: type || null,
                    price,
                    imageUrl: imageUrl || null,
                    status
                })
            })

            const data = await response.json()

            onSave({
                id: property?.id || data.id,
                title,
                address,
                city,
                state,
                type,
                price,
                imageUrl,
                source: property?.source || 'manual',
                status
            })
        } catch (error) {
            console.error('Erro ao salvar imóvel:', error)
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

    const propertyTypes = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Rural', 'Outro']
    const statusOptions = [
        { value: 'active', label: 'Ativo' },
        { value: 'sold', label: 'Vendido' },
        { value: 'inactive', label: 'Inativo' }
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1f3a] border-zinc-800 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {property ? 'Editar Imóvel' : 'Novo Imóvel'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    {/* Image */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-32 h-24 rounded-lg bg-[#0a0e27] border border-zinc-700 flex items-center justify-center overflow-hidden">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Imóvel" className="w-full h-full object-cover" />
                                ) : (
                                    <Home className="h-10 w-10 text-zinc-600" />
                                )}
                            </div>
                            <button
                                type="button"
                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
                                onClick={() => {
                                    const url = prompt('URL da imagem:')
                                    if (url) setImageUrl(url)
                                }}
                            >
                                <Camera className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Título *</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`bg-[#0a0e27] ${errors.title ? 'border-red-500' : 'border-zinc-700'} text-white`}
                            placeholder="Ex: Casa 3 quartos no Centro"
                        />
                        {errors.title && <span className="text-red-500 text-xs">{errors.title}</span>}
                    </div>

                    {/* Type and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 rounded-md focus:outline-none focus:border-emerald-500"
                            >
                                <option value="">Selecione...</option>
                                {propertyTypes.map(t => (
                                    <option key={t} value={t.toLowerCase()}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-[#0a0e27] border border-zinc-700 text-white px-3 py-2 rounded-md focus:outline-none focus:border-emerald-500"
                            >
                                {statusOptions.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Preço (R$)</label>
                        <Input
                            value={formatCurrency(price)}
                            onChange={(e) => setPrice(parseCurrency(e.target.value))}
                            className="bg-[#0a0e27] border-zinc-700 text-white"
                            placeholder="0"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Endereço</label>
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="bg-[#0a0e27] border-zinc-700 text-white"
                            placeholder="Rua, número, bairro"
                        />
                    </div>

                    {/* City and State */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Cidade</label>
                            <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="bg-[#0a0e27] border-zinc-700 text-white"
                                placeholder="Cidade"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Estado</label>
                            <Input
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="bg-[#0a0e27] border-zinc-700 text-white"
                                placeholder="UF"
                                maxLength={2}
                            />
                        </div>
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
                        {saving ? 'Salvando...' : property ? 'Salvar' : 'Adicionar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
