"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Key, Eye, EyeOff } from "lucide-react"

interface JetImoveisConfigProps {
    tenantId: number
    initialToken: string
}

export function JetImoveisConfig({ tenantId, initialToken }: JetImoveisConfigProps) {
    const [token, setToken] = useState(initialToken)
    const [showToken, setShowToken] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        try {
            await fetch('/api/settings/jetimoveis', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, token })
            })
        } catch (error) {
            console.error('Erro ao salvar token:', error)
        } finally {
            setSaving(false)
        }
    }

    const maskToken = (value: string) => {
        if (value.length <= 8) return value
        return value.slice(0, 4) + '•'.repeat(value.length - 8) + value.slice(-4)
    }

    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
                <Key className="h-5 w-5 text-purple-500" />
                <div>
                    <h2 className="text-lg font-semibold text-white">Integração JetImóveis</h2>
                    <p className="text-zinc-400 text-sm">Configure o token para sincronizar imóveis</p>
                </div>
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm text-zinc-400 mb-2">Token de API</label>
                    <div className="relative">
                        <Input
                            type={showToken ? "text" : "password"}
                            value={showToken ? token : maskToken(token)}
                            onChange={(e) => setToken(e.target.value)}
                            className="bg-[#0a0e27] border-zinc-700 text-white pr-10"
                            placeholder="Cole seu token do JetImóveis"
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Token'}
                </Button>
            </div>

            <p className="text-zinc-500 text-xs mt-3">
                Após configurar o token, clique em "Sync JetImóveis" na tabela de imóveis para importar.
            </p>
        </div>
    )
}
