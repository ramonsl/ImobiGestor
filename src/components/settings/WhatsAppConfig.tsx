"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Smartphone, Loader2, CheckCircle, XCircle,
    RefreshCw, Power, MessageSquare, Terminal
} from "lucide-react"

interface WhatsAppConfigProps {
    tenantId: number
}

interface LogEntry {
    timestamp: Date
    type: 'info' | 'success' | 'error' | 'warning'
    message: string
}

export function WhatsAppConfig({ tenantId }: WhatsAppConfigProps) {
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'qr' | 'connected'>('disconnected')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [polling, setPolling] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const logsEndRef = useRef<HTMLDivElement>(null)

    const addLog = (type: LogEntry['type'], message: string) => {
        setLogs(prev => [...prev, { timestamp: new Date(), type, message }])
    }

    const checkStatus = useCallback(async () => {
        try {
            const response = await fetch(`/api/whatsapp/status?tenantId=${tenantId}`)
            const data = await response.json()

            const newStatus = data.status || 'disconnected'
            const newQr = data.qr || null

            // Log status changes only if different
            if (newStatus !== status) {
                switch (newStatus) {
                    case 'connecting':
                        addLog('info', 'Iniciando conexão com WhatsApp...')
                        break
                    case 'qr':
                        addLog('info', 'QR Code gerado! Escaneie com seu celular.')
                        break
                    case 'connected':
                        addLog('success', '✅ WhatsApp conectado com sucesso!')
                        break
                    case 'disconnected':
                        // Only log disconnection if we were previously connected or connecting
                        if (status !== 'disconnected') {
                            addLog('warning', 'WhatsApp desconectado.')
                        }
                        break
                }
            }

            if (newStatus === 'qr' && !newQr) {
                addLog('warning', 'Status é QR, mas imagem ainda não chegou. Aguardando...')
            }

            setStatus(newStatus)
            setQrCode(newQr)
            return newStatus
        } catch (error) {
            console.error('Erro ao verificar status:', error)
            addLog('error', 'Erro ao verificar status da conexão.')
            return 'disconnected'
        }
    }, [tenantId, status])

    // Check status on mount
    useEffect(() => {
        addLog('info', 'Verificando status da conexão...')
        checkStatus()
    }, [])

    // Poll for status changes when connecting OR when in QR mode (to detect connection)
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (polling || status === 'connecting' || status === 'qr') {
            interval = setInterval(async () => {
                const currentStatus = await checkStatus()
                // Stop polling only if connected or explicitly disconnected by error (not just initial state)
                if (currentStatus === 'connected') {
                    setPolling(false)
                }
            }, 3000) // Poll every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [polling, status, checkStatus])

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const handleConnect = async () => {
        setLoading(true)
        addLog('info', 'Solicitando conexão...')
        try {
            const response = await fetch('/api/whatsapp/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            })

            if (response.ok) {
                addLog('info', 'Processo iniciado. Aguarde o QR Code...')
                setStatus('connecting') // Force optimistic update
                setPolling(true)
            } else {
                addLog('error', 'Falha ao iniciar conexão.')
            }
        } catch (error) {
            console.error('Erro ao conectar:', error)
            addLog('error', 'Erro de rede ao conectar.')
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        setLoading(true)
        addLog('info', 'Desconectando WhatsApp...')
        try {
            const response = await fetch('/api/whatsapp/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            })

            if (response.ok) {
                setStatus('disconnected')
                setQrCode(null)
                setPolling(false)
                addLog('success', 'WhatsApp desconectado com sucesso.')
            } else {
                addLog('error', 'Falha ao desconectar.')
            }
        } catch (error) {
            console.error('Erro ao desconectar:', error)
            addLog('error', 'Erro de rede ao desconectar.')
        } finally {
            setLoading(false)
        }
    }

    const getStatusInfo = () => {
        switch (status) {
            case 'connected':
                return {
                    icon: <CheckCircle className="h-6 w-6 text-emerald-500" />,
                    text: 'Conectado',
                    color: 'text-emerald-500',
                    bgColor: 'bg-emerald-500/20'
                }
            case 'connecting':
                return {
                    icon: <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />,
                    text: 'Conectando...',
                    color: 'text-amber-500',
                    bgColor: 'bg-amber-500/20'
                }
            case 'qr':
                return {
                    icon: <Smartphone className="h-6 w-6 text-blue-500" />,
                    text: 'Aguardando Leitura',
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/20'
                }
            default:
                return {
                    icon: <XCircle className="h-6 w-6 text-zinc-400" />,
                    text: 'Desconectado',
                    color: 'text-zinc-400',
                    bgColor: 'bg-zinc-500/20'
                }
        }
    }

    const statusInfo = getStatusInfo()

    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'success': return 'text-emerald-400'
            case 'error': return 'text-red-400'
            case 'warning': return 'text-amber-400'
            default: return 'text-zinc-400'
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Connection Controls */}
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-emerald-500" />
                            Integração WhatsApp
                        </h3>
                        <p className="text-zinc-400 text-sm">
                            Conecte o WhatsApp para enviar notificações automáticas
                        </p>
                    </div>
                </div>

                {/* Status Card */}
                <div className={`rounded-lg p-6 ${statusInfo.bgColor} border border-zinc-700 transition-all duration-300`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-800 rounded-lg">
                            {statusInfo.icon}
                        </div>
                        <div>
                            <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.text}</p>
                            <p className="text-zinc-400 text-sm">
                                {status === 'connected'
                                    ? 'Pronto para enviar notificações'
                                    : status === 'qr'
                                        ? 'Escaneie o QR Code abaixo'
                                        : status === 'connecting'
                                            ? 'Iniciando cliente WhatsApp...'
                                            : 'Clique em conectar para começar'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* QR Code Display */}
                {status === 'qr' ? (
                    <div className="flex flex-col items-center p-6 bg-white rounded-lg animate-in fade-in zoom-in duration-300">
                        {qrCode ? (
                            <img
                                src={qrCode}
                                alt="QR Code WhatsApp"
                                className="w-64 h-64"
                            />
                        ) : (
                            <div className="w-64 h-64 flex items-center justify-center bg-zinc-100 rounded">
                                <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
                            </div>
                        )}
                        <p className="mt-4 text-zinc-600 text-center text-sm">
                            1. Abra o WhatsApp no seu celular<br />
                            2. Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong><br />
                            3. Selecione <strong>Aparelhos conectados</strong><br />
                            4. Toque em <strong>Conectar um aparelho</strong><br />
                            5. Aponte o celular para esta tela
                        </p>
                    </div>
                ) : null}

                {/* Info when connected */}
                {status === 'connected' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                        <p className="text-emerald-400 text-sm">
                            ✅ Tudo pronto! Quando uma venda for registrada, os colaboradores envolvidos receberão
                            automaticamente uma notificação.
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                    {status === 'disconnected' && (
                        <Button
                            onClick={handleConnect}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white w-full py-6 text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Iniciando...
                                </>
                            ) : (
                                <>
                                    <Smartphone className="h-5 w-5 mr-2" />
                                    Conectar WhatsApp
                                </>
                            )}
                        </Button>
                    )}

                    {(status === 'connected' || status === 'qr' || status === 'connecting') && (
                        <Button
                            onClick={handleDisconnect}
                            disabled={loading}
                            variant="destructive"
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Power className="h-4 w-4 mr-2" />
                                    {status === 'connected' ? 'Desconectar' : 'Cancelar Conexão'}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Right Column - Logs Panel */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-zinc-400" />
                        <h3 className="text-lg font-semibold text-white">Logs do Sistema</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogs([])}
                        className="text-zinc-500 hover:text-zinc-300 text-xs h-6"
                    >
                        Limpar
                    </Button>
                </div>

                <div className="bg-[#0a0e27] border border-zinc-800 rounded-lg h-[400px] overflow-y-auto font-mono text-xs lg:text-sm p-4">
                    <div className="space-y-2">
                        {logs.length === 0 ? (
                            <p className="text-zinc-600 italic">Dispositivo pronto para conexão...</p>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="flex gap-3 border-b border-zinc-900/50 pb-1 last:border-0 last:pb-0">
                                    <span className="text-zinc-600 shrink-0 select-none">
                                        {log.timestamp.toLocaleTimeString('pt-BR')}
                                    </span>
                                    <span className={`${getLogColor(log.type)} break-all`}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    )
}
