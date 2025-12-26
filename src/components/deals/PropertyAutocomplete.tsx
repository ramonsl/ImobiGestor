"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, Home } from "lucide-react"

interface Property {
    id: number
    title: string
    address: string | null
    city: string | null
    state: string | null
    type: string | null
    price: string | null
    imageUrl: string | null
}

interface PropertyAutocompleteProps {
    tenantId: number
    onSelect: (property: Property) => void
    value?: string
}

export function PropertyAutocomplete({ tenantId, onSelect, value }: PropertyAutocompleteProps) {
    const [query, setQuery] = useState(value || "")
    const [results, setResults] = useState<Property[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (value !== undefined) {
            setQuery(value)
        }
    }, [value])

    const searchProperties = async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([])
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`/api/properties/search?tenantId=${tenantId}&q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()
            setResults(data)
            setIsOpen(true)
        } catch (error) {
            console.error("Erro ao buscar imóveis:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)
        searchProperties(value)
    }

    const handleSelect = (property: Property) => {
        setQuery(property.title)
        setIsOpen(false)
        onSelect(property)
    }

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    className="bg-[#0a0e27] border-zinc-700 text-white pl-10"
                    placeholder="Digite para buscar imóvel..."
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1f3a] border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {results.map((property) => (
                        <button
                            key={property.id}
                            type="button"
                            onClick={() => handleSelect(property)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800 transition-colors text-left"
                        >
                            {property.imageUrl ? (
                                <img
                                    src={property.imageUrl}
                                    alt={property.title}
                                    className="w-10 h-10 rounded object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                    <Home className="h-5 w-5 text-zinc-500" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{property.title}</p>
                                <p className="text-zinc-400 text-sm truncate">
                                    {property.city && property.state
                                        ? `${property.city}, ${property.state}`
                                        : property.address || "Sem endereço"}
                                </p>
                            </div>
                            {property.price && (
                                <span className="text-emerald-500 font-semibold text-sm">
                                    R$ {parseFloat(property.price).toLocaleString('pt-BR')}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-[#1a1f3a] border border-zinc-700 rounded-lg p-4 text-center text-zinc-400">
                    Nenhum imóvel encontrado
                </div>
            )}
        </div>
    )
}
