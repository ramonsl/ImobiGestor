import { Client, LocalAuth } from 'whatsapp-web.js'
import * as qrcode from 'qrcode'

// Per-tenant client storage
interface TenantWhatsApp {
    client: Client | null
    status: 'disconnected' | 'connecting' | 'qr' | 'connected'
    qr: string | null
}

const tenantClients: Map<number, TenantWhatsApp> = new Map()
const statusListeners: Map<number, ((status: string, qr?: string) => void)[]> = new Map()

// Get or create tenant state
function getTenantState(tenantId: number): TenantWhatsApp {
    if (!tenantClients.has(tenantId)) {
        tenantClients.set(tenantId, {
            client: null,
            status: 'disconnected',
            qr: null
        })
    }
    return tenantClients.get(tenantId)!
}

// Get current status for tenant
export function getWhatsAppStatus(tenantId: number) {
    const state = getTenantState(tenantId)
    return {
        status: state.status,
        qr: state.qr
    }
}

// Subscribe to status changes for tenant
export function subscribeToStatus(tenantId: number, listener: (status: string, qr?: string) => void) {
    if (!statusListeners.has(tenantId)) {
        statusListeners.set(tenantId, [])
    }
    statusListeners.get(tenantId)!.push(listener)
    return () => {
        const listeners = statusListeners.get(tenantId) || []
        statusListeners.set(tenantId, listeners.filter(l => l !== listener))
    }
}

// Notify all listeners for a tenant
function notifyListeners(tenantId: number, status: string, qr?: string) {
    const listeners = statusListeners.get(tenantId) || []
    listeners.forEach(listener => listener(status, qr))
}

// Initialize WhatsApp client for tenant
export async function initWhatsApp(tenantId: number): Promise<void> {
    const state = getTenantState(tenantId)

    if (state.client) {
        // If it's stuck in connecting for too long or we want to force re-init
        if (state.status === 'connecting') {
            console.log(`[WhatsApp:${tenantId}] Client stuck in connecting, destroying...`)
            try { await state.client.destroy() } catch (e) { console.error(e) }
            state.client = null
        } else {
            console.log(`[WhatsApp:${tenantId}] Client already exists (Status: ${state.status})`)
            return
        }
    }

    console.log(`[WhatsApp:${tenantId}] Initializing client...`)
    state.status = 'connecting'
    notifyListeners(tenantId, 'connecting')

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: `tenant_${tenantId}`,
            dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-software-rasterizer',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--safebrowsing-disable-auto-update',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--mute-audio'
            ],
            timeout: 60000 // Aumentar timeout para 60s
        }
    })

    client.on('qr', async (qr) => {
        console.log(`[WhatsApp:${tenantId}] QR Code RAW received (length: ${qr.length})`)
        state.status = 'qr'
        try {
            state.qr = await qrcode.toDataURL(qr)
            console.log(`[WhatsApp:${tenantId}] QR Code converted to Data URL`)
            notifyListeners(tenantId, 'qr', state.qr)
        } catch (err) {
            console.error(`[WhatsApp:${tenantId}] QR Code generation error:`, err)
        }
    })

    client.on('ready', () => {
        console.log(`[WhatsApp:${tenantId}] Client is ready!`)
        state.status = 'connected'
        state.qr = null
        notifyListeners(tenantId, 'connected')
    })

    client.on('authenticated', () => {
        console.log(`[WhatsApp:${tenantId}] Authenticated successfully`)
    })

    client.on('auth_failure', (msg) => {
        console.error(`[WhatsApp:${tenantId}] Authentication failed:`, msg)
        state.status = 'disconnected'
        state.qr = null
        state.client = null
        notifyListeners(tenantId, 'disconnected')
    })

    client.on('disconnected', (reason) => {
        console.log(`[WhatsApp:${tenantId}] Disconnected:`, reason)
        state.status = 'disconnected'
        state.qr = null
        state.client = null
        notifyListeners(tenantId, 'disconnected')
    })

    state.client = client

    try {
        await client.initialize()
    } catch (error) {
        console.error(`[WhatsApp:${tenantId}] Failed to initialize:`, error)
        state.status = 'disconnected'
        state.client = null
        try { await client.destroy() } catch (e) { console.error('Error destroying failed client:', e) }
        notifyListeners(tenantId, 'disconnected')
        throw error
    }
}

// Disconnect WhatsApp client for tenant
export async function disconnectWhatsApp(tenantId: number): Promise<void> {
    const state = getTenantState(tenantId)

    if (!state.client) {
        console.log(`[WhatsApp:${tenantId}] No client to disconnect`)
        return
    }

    console.log(`[WhatsApp:${tenantId}] Disconnecting...`)
    try {
        await state.client.logout()
    } catch (error) {
        console.error(`[WhatsApp:${tenantId}] Logout error:`, error)
    }

    try {
        await state.client.destroy()
    } catch (error) {
        console.error(`[WhatsApp:${tenantId}] Destroy error:`, error)
    }

    state.client = null
    state.status = 'disconnected'
    state.qr = null
    notifyListeners(tenantId, 'disconnected')
}

// Send message for tenant
export async function sendWhatsAppMessage(tenantId: number, phone: string, message: string): Promise<boolean> {
    const state = getTenantState(tenantId)

    if (!state.client || state.status !== 'connected') {
        console.error(`[WhatsApp:${tenantId}] Client not connected`)
        return false
    }

    // Format phone number (remove non-digits)
    let formattedPhone = phone.replace(/\D/g, '')

    // Add Brazil country code if not present (assuming local numbers without +)
    if (formattedPhone.length <= 11) {
        formattedPhone = '55' + formattedPhone
    }

    // Handle cases where user might have input +55 manually (already stripped of +)
    if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone
    }

    // Remove leading zeros from area code if present (e.g., 55048...)
    if (formattedPhone.length === 14 && formattedPhone.startsWith('550')) {
        formattedPhone = '55' + formattedPhone.slice(3)
    }

    // New logic: Check if it's a 9-digit mobile number with area code but without country code
    // Standard format: 55 + 2 digit area code + 9 digit number = 13 digits
    // Or 55 + 2 digit area code + 8 digit number = 12 digits (old landlines/Nextel)

    // Remove the 9th digit for WhatsApp compatibility if needed is usually handled by whatsapp-web.js internally 
    // but sometimes explicit 9 is required or rejected depending on account status.
    // For now, let's trust the input length and just ensure 55 prefix.

    // Always append c.us for getNumberId to work correctly
    const checkId = `${formattedPhone}@c.us`
    let finalId = checkId

    try {
        console.log(`[WhatsApp:${tenantId}] Verificando número ${checkId}`)
        // Try to verify if number is registered to get the correct ID format (Serialized ID)
        const numberDetails = await state.client.getNumberId(checkId);

        if (!numberDetails) {
            console.error(`[WhatsApp:${tenantId}] Número não registrado no WhatsApp: ${formattedPhone}`)
            // Mesmo não registrado, podemos tentar enviar se for erro de privacidade, mas geralmente falha.
            // Vamos logar e retornar false para evitar spam de erro.
            return false
        }
        finalId = numberDetails._serialized;
    } catch (error: any) {
        console.warn(`[WhatsApp:${tenantId}] Falha na verificação do número (ignorando e tentando envio direto):`, error.message)
        // Se falhar a verificação (ex: erro interno do WA Web), assumimos o ID construído manual
        finalId = checkId
    }

    try {
        console.log(`[WhatsApp:${tenantId}] Enviando mensagem para ${finalId}`)
        await state.client.sendMessage(finalId, message)
        console.log(`[WhatsApp:${tenantId}] Mensagem enviada com sucesso`)
        return true
    } catch (error) {
        console.error(`[WhatsApp:${tenantId}] Falha ao enviar mensagem:`, error)
        return false
    }
}


// Format currency for message
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

// Create progress bar
function createProgressBar(percent: number): string {
    const filled = Math.min(Math.floor(percent / 10), 10)
    const empty = 10 - filled
    return '▓'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percent)}%`
}

// Send sale notification to participant
export async function sendSaleNotification(params: {
    tenantId: number
    phone: string
    brokerName: string
    propertyTitle: string
    propertyAddress?: string
    saleValue: number
    saleDate: Date
    commissionValue: number
    currentMetaValue: number
    metaGoal: number
}): Promise<boolean> {
    const {
        tenantId,
        phone,
        brokerName,
        propertyTitle,
        propertyAddress,
        saleValue,
        saleDate,
        commissionValue,
        currentMetaValue,
        metaGoal
    } = params

    const metaPercent = metaGoal > 0 ? (currentMetaValue / metaGoal) * 100 : 0
    const formattedDate = saleDate.toLocaleDateString('pt-BR')

    const message = `🏠 *Nova Venda Registrada!*

Olá, ${brokerName.split(' ')[0]}! 🎉

📍 *Imóvel:* ${propertyTitle}${propertyAddress ? `\n📌 ${propertyAddress}` : ''}
💰 *Valor da Venda:* ${formatCurrency(saleValue)}
📅 *Data:* ${formattedDate}

💵 *Sua Comissão:* ${formatCurrency(commissionValue)}

📊 *Sua Meta:*
${createProgressBar(metaPercent)}
${formatCurrency(currentMetaValue)} / ${formatCurrency(metaGoal)}

Parabéns pela conquista! Continue assim! 🚀`

    return sendWhatsAppMessage(tenantId, phone, message)
}

// Check if tenant is connected
export function isConnected(tenantId: number): boolean {
    const state = getTenantState(tenantId)
    return state.status === 'connected'
}
