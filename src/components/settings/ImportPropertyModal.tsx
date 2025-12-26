"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react"

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

interface ImportPropertyModalProps {
    isOpen: boolean
    onClose: () => void
    onImportComplete: (properties: Property[]) => void
    tenantId: number
}

export function ImportPropertyModal({ isOpen, onClose, onImportComplete, tenantId }: ImportPropertyModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [preview, setPreview] = useState<string[][]>([])
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setError(null)

        // Parse CSV for preview
        const text = await selectedFile.text()
        const lines = text.split('\n').filter(line => line.trim())
        const parsed = lines.slice(0, 6).map(line =>
            line.split(/[,;]/).map(cell => cell.trim().replace(/^"|"$/g, ''))
        )
        setPreview(parsed)
    }

    const handleImport = async () => {
        if (!file) return

        setImporting(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('tenantId', tenantId.toString())

            const response = await fetch('/api/properties/import', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao importar')
            }

            onImportComplete(data.properties)
            handleClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao importar arquivo')
        } finally {
            setImporting(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setPreview([])
        setError(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#1a1f3a] border-zinc-800 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                        Importar Imóveis
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {!file ? (
                        <div
                            className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                            <p className="text-white font-medium mb-2">Arraste um arquivo ou clique para selecionar</p>
                            <p className="text-zinc-400 text-sm">Aceita arquivos CSV ou Excel (.csv, .xlsx)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div>
                            {/* File info */}
                            <div className="flex items-center justify-between bg-[#0a0e27] p-4 rounded-lg mb-4">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                                    <div>
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-zinc-400 text-sm">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setFile(null)
                                        setPreview([])
                                    }}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Preview */}
                            {preview.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm text-zinc-400 mb-2">Prévia do arquivo:</p>
                                    <div className="overflow-x-auto bg-[#0a0e27] rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="border-b border-zinc-800">
                                                <tr>
                                                    {preview[0]?.map((cell, i) => (
                                                        <th key={i} className="p-2 text-left text-zinc-400 font-medium">
                                                            {cell}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.slice(1).map((row, i) => (
                                                    <tr key={i} className="border-b border-zinc-800/50">
                                                        {row.map((cell, j) => (
                                                            <td key={j} className="p-2 text-zinc-300">{cell}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Expected format */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                                <p className="text-blue-400 text-sm font-medium mb-2">Formato esperado:</p>
                                <p className="text-zinc-400 text-xs">
                                    Colunas: <code className="text-blue-300">titulo, endereco, cidade, estado, tipo, preco, imagem_url</code>
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                                    <AlertCircle className="h-5 w-5 text-red-400" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || importing}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        {importing ? 'Importando...' : 'Importar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
