"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Upload, RefreshCw, Home, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { PropertyModal } from "./PropertyModal"
import { ImportPropertyModal } from "./ImportPropertyModal"
import { SyncStatusBanner } from "./SyncStatusBanner"

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

interface PropertyTableProps {
    tenantId: number
    initialProperties: Property[]
    jetimoveisToken: string | null
}

const ITEMS_PER_PAGE = 10

export function PropertyTable({ tenantId, initialProperties, jetimoveisToken }: PropertyTableProps) {
    const [properties, setProperties] = useState<Property[]>(initialProperties)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [editingProperty, setEditingProperty] = useState<Property | null>(null)
    const [syncing, setSyncing] = useState(false)
    const [showSyncBanner, setShowSyncBanner] = useState(false)

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'sold'>('all')
    const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'jetimoveis' | 'spreadsheet'>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)

    // Get unique types for filter dropdown
    const propertyTypes = useMemo(() => {
        const types = new Set(properties.map(p => p.type).filter(Boolean))
        return Array.from(types) as string[]
    }, [properties])

    // Filtered and paginated properties
    const filteredProperties = useMemo(() => {
        return properties.filter(p => {
            if (statusFilter !== 'all' && p.status !== statusFilter) return false
            if (sourceFilter !== 'all' && p.source !== sourceFilter) return false
            if (typeFilter !== 'all' && p.type !== typeFilter) return false
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchTitle = p.title?.toLowerCase().includes(query)
                const matchAddress = p.address?.toLowerCase().includes(query)
                const matchCity = p.city?.toLowerCase().includes(query)
                if (!matchTitle && !matchAddress && !matchCity) return false
            }
            return true
        })
    }, [properties, statusFilter, sourceFilter, typeFilter, searchQuery])

    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE)

    const paginatedProperties = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredProperties.slice(start, start + ITEMS_PER_PAGE)
    }, [filteredProperties, currentPage])

    // Reset page when filters change
    const handleFilterChange = () => {
        setCurrentPage(1)
    }

    const handleAddProperty = () => {
        setEditingProperty(null)
        setIsModalOpen(true)
    }

    const handleEditProperty = (property: Property) => {
        setEditingProperty(property)
        setIsModalOpen(true)
    }

    const handleDeleteProperty = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este imóvel?')) return

        try {
            await fetch(`/api/properties/${id}`, { method: 'DELETE' })
            setProperties(properties.filter(p => p.id !== id))
        } catch (error) {
            console.error('Erro ao excluir imóvel:', error)
        }
    }

    const handleSaveProperty = (property: Property) => {
        if (editingProperty) {
            setProperties(properties.map(p => p.id === property.id ? property : p))
        } else {
            setProperties([...properties, property])
        }
        setIsModalOpen(false)
    }

    const handleImportComplete = (importedProperties: Property[]) => {
        setProperties([...properties, ...importedProperties])
        setIsImportModalOpen(false)
    }

    const handleSyncJetimoveis = async () => {
        if (!jetimoveisToken) {
            alert('Configure o token do JetImóveis na aba Integrações primeiro')
            return
        }

        setSyncing(true)
        try {
            const response = await fetch('/api/properties/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            })
            const data = await response.json()

            if (!response.ok) {
                alert(`Erro ao iniciar sincronização: ${data.error || 'Erro desconhecido'}`)
                return
            }

            setShowSyncBanner(true)
        } catch (error) {
            console.error('Erro ao sincronizar:', error)
            alert('Erro de conexão ao sincronizar.')
        } finally {
            setSyncing(false)
        }
    }

    const handleSyncComplete = () => {
        setShowSyncBanner(false)
        window.location.reload()
    }

    const formatCurrency = (value: number) => {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
            sold: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
            inactive: { bg: 'bg-zinc-500/20', text: 'text-zinc-400' }
        }
        const badge = badges[status] || badges.inactive
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {status === 'active' ? 'Ativo' : status === 'sold' ? 'Vendido' : 'Inativo'}
            </span>
        )
    }

    const getSourceBadge = (source: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            manual: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
            jetimoveis: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
            spreadsheet: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' }
        }
        const badge = badges[source] || badges.manual
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {source === 'manual' ? 'Manual' : source === 'jetimoveis' ? 'JetImóveis' : 'Planilha'}
            </span>
        )
    }

    return (
        <>
            {showSyncBanner && (
                <SyncStatusBanner
                    tenantId={tenantId}
                    onComplete={handleSyncComplete}
                />
            )}
            <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-emerald-500" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">Imóveis</h2>
                            <p className="text-zinc-400 text-sm">{filteredProperties.length} imóveis encontrados</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleSyncJetimoveis}
                            disabled={syncing || !jetimoveisToken}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                            Sync JetImóveis
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsImportModalOpen(true)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                        </Button>
                        <Button
                            onClick={handleAddProperty}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Imóvel
                        </Button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Buscar por título, endereço ou cidade..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange() }}
                            className="pl-10 bg-[#0a0e27] border-zinc-700 text-white"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); handleFilterChange() }}
                            className="appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-4 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                        >
                            <option value="all">Todos Status</option>
                            <option value="active">Ativos</option>
                            <option value="sold">Vendidos</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>

                    {/* Source Filter */}
                    <div className="relative">
                        <select
                            value={sourceFilter}
                            onChange={(e) => { setSourceFilter(e.target.value as typeof sourceFilter); handleFilterChange() }}
                            className="appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-4 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                        >
                            <option value="all">Todas Origens</option>
                            <option value="manual">Manual</option>
                            <option value="jetimoveis">JetImóveis</option>
                            <option value="spreadsheet">Planilha</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>

                    {/* Type Filter */}
                    {propertyTypes.length > 0 && (
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange() }}
                                className="appearance-none bg-[#0a0e27] border border-zinc-700 text-white px-4 py-2 pr-10 rounded-lg focus:border-emerald-500 focus:outline-none text-sm"
                            >
                                <option value="all">Todos Tipos</option>
                                {propertyTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-800">
                            <tr className="text-zinc-400 text-sm">
                                <th className="text-left p-4 font-medium">Foto</th>
                                <th className="text-left p-4 font-medium">Título</th>
                                <th className="text-left p-4 font-medium">Localização</th>
                                <th className="text-left p-4 font-medium">Tipo</th>
                                <th className="text-left p-4 font-medium">Preço</th>
                                <th className="text-left p-4 font-medium">Origem</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-right p-4 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProperties.map((property) => (
                                <tr key={property.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                    <td className="p-4">
                                        {property.imageUrl ? (
                                            <img
                                                src={property.imageUrl}
                                                alt={property.title}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center">
                                                <Home className="h-6 w-6 text-zinc-500" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-white font-medium line-clamp-1">{property.title}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-zinc-400 text-sm">
                                            {property.city && property.state
                                                ? `${property.city}, ${property.state}`
                                                : property.address || '-'
                                            }
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-zinc-400 capitalize text-sm">{property.type || '-'}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-emerald-500 font-semibold">
                                            {property.price ? formatCurrency(property.price) : '-'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {getSourceBadge(property.source)}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(property.status)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditProperty(property)}
                                                className="text-zinc-400 hover:text-white"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteProperty(property.id)}
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

                {/* Empty State */}
                {filteredProperties.length === 0 && (
                    <div className="text-center py-12 text-zinc-400">
                        {properties.length === 0
                            ? 'Nenhum imóvel cadastrado. Clique em "Novo Imóvel" para adicionar.'
                            : 'Nenhum imóvel encontrado com os filtros selecionados.'
                        }
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
                        <p className="text-sm text-zinc-400">
                            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredProperties.length)} de {filteredProperties.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="icon"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={currentPage === pageNum
                                            ? "bg-emerald-500 text-white"
                                            : "border-zinc-700 text-zinc-400 hover:text-white"
                                        }
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            })}

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                <PropertyModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveProperty}
                    property={editingProperty}
                    tenantId={tenantId}
                />

                <ImportPropertyModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImportComplete={handleImportComplete}
                    tenantId={tenantId}
                />
            </div>
        </>
    )
}
