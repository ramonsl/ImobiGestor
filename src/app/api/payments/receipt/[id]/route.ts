import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { payments, brokers, tenants, deals } from "@/db/schema"
import { eq } from "drizzle-orm"

function numberToWords(num: number): string {
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

    if (num === 0) return 'zero'
    if (num === 100) return 'cem'
    if (num < 0) return 'menos ' + numberToWords(-num)
    if (num >= 1000000) {
        const millions = Math.floor(num / 1000000)
        const rest = num % 1000000
        return (millions === 1 ? 'um milhão' : numberToWords(millions) + ' milhões') +
            (rest > 0 ? ' e ' + numberToWords(rest) : '')
    }
    if (num >= 1000) {
        const thousands = Math.floor(num / 1000)
        const rest = num % 1000
        return (thousands === 1 ? 'mil' : numberToWords(thousands) + ' mil') +
            (rest > 0 ? (rest < 100 ? ' e ' : ' ') + numberToWords(rest) : '')
    }
    if (num >= 100) {
        const h = Math.floor(num / 100)
        const rest = num % 100
        return hundreds[h] + (rest > 0 ? ' e ' + numberToWords(rest) : '')
    }
    if (num >= 20) {
        const t = Math.floor(num / 10)
        const u = num % 10
        return tens[t] + (u > 0 ? ' e ' + units[u] : '')
    }
    if (num >= 10) {
        return teens[num - 10]
    }
    return units[num]
}

function formatCurrencyWords(value: number): string {
    const intPart = Math.floor(value)
    const decPart = Math.round((value - intPart) * 100)

    let result = numberToWords(intPart)
    result += intPart === 1 ? ' real' : ' reais'

    if (decPart > 0) {
        result += ' e ' + numberToWords(decPart)
        result += decPart === 1 ? ' centavo' : ' centavos'
    }

    return result
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params
        const id = parseInt(idStr)

        // Get payment with related data
        const [payment] = await db
            .select({
                id: payments.id,
                type: payments.type,
                description: payments.description,
                amount: payments.amount,
                referenceMonth: payments.referenceMonth,
                referenceYear: payments.referenceYear,
                status: payments.status,
                paidAt: payments.paidAt,
                notes: payments.notes,
                brokerName: brokers.name,
                brokerEmail: brokers.email,
                brokerPhone: brokers.phone,
                tenantId: payments.tenantId,
                dealId: payments.dealId
            })
            .from(payments)
            .leftJoin(brokers, eq(payments.brokerId, brokers.id))
            .where(eq(payments.id, id))
            .limit(1)

        if (!payment) {
            return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
        }

        // Get tenant info
        const [tenant] = await db
            .select({ name: tenants.name, slug: tenants.slug })
            .from(tenants)
            .where(eq(tenants.id, payment.tenantId))
            .limit(1)

        // Get deal info if commission
        let dealInfo = null
        if (payment.dealId) {
            const [deal] = await db
                .select({ propertyTitle: deals.propertyTitle, saleDate: deals.saleDate })
                .from(deals)
                .where(eq(deals.id, payment.dealId))
                .limit(1)
            dealInfo = deal
        }

        const amount = parseFloat(payment.amount || '0')
        const formattedAmount = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount)

        const amountInWords = formatCurrencyWords(amount)
        const today = new Date()
        const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

        // Generate HTML receipt
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Recibo de Pagamento</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Times New Roman', serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .header h2 { font-size: 18px; font-weight: normal; color: #666; }
        .receipt-number {
            position: absolute;
            top: 40px;
            right: 40px;
            font-size: 14px;
            color: #666;
        }
        .amount-box {
            background: #f5f5f5;
            border: 2px solid #333;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .amount-box .value { font-size: 32px; font-weight: bold; }
        .amount-box .words { font-size: 14px; font-style: italic; margin-top: 5px; }
        .content { line-height: 1.8; font-size: 16px; margin: 30px 0; }
        .content p { margin-bottom: 15px; text-align: justify; }
        .field { display: flex; margin: 15px 0; }
        .field .label { width: 150px; font-weight: bold; }
        .field .value { flex: 1; }
        .signature {
            margin-top: 60px;
            text-align: center;
        }
        .signature-line {
            width: 300px;
            border-top: 1px solid #333;
            margin: 0 auto;
            padding-top: 5px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="receipt-number">Nº ${payment.id.toString().padStart(6, '0')}</div>
    
    <div class="header">
        <h1>${tenant?.name || 'Imobiliária'}</h1>
        <h2>Recibo de Pagamento</h2>
    </div>

    <div class="amount-box">
        <div class="value">${formattedAmount}</div>
        <div class="words">(${amountInWords})</div>
    </div>

    <div class="content">
        <p>
            Recebi de <strong>${tenant?.name || 'Imobiliária'}</strong> a quantia de 
            <strong>${formattedAmount}</strong> (${amountInWords}), 
            referente a ${payment.type === 'commission' ? 'comissão' : 'reembolso de despesas'}
            ${payment.description ? ` - ${payment.description}` : ''}
            ${dealInfo ? `, relativo ao imóvel "${dealInfo.propertyTitle}"` : ''},
            competência ${months[payment.referenceMonth - 1]}/${payment.referenceYear}.
        </p>
    </div>

    <div class="field">
        <div class="label">Beneficiário:</div>
        <div class="value">${payment.brokerName}</div>
    </div>
    ${payment.brokerEmail ? `
    <div class="field">
        <div class="label">E-mail:</div>
        <div class="value">${payment.brokerEmail}</div>
    </div>
    ` : ''}
    ${payment.brokerPhone ? `
    <div class="field">
        <div class="label">Telefone:</div>
        <div class="value">${payment.brokerPhone}</div>
    </div>
    ` : ''}
    <div class="field">
        <div class="label">Data do Pagamento:</div>
        <div class="value">${payment.paidAt
                ? new Date(payment.paidAt).toLocaleDateString('pt-BR')
                : today.toLocaleDateString('pt-BR')}</div>
    </div>
    ${payment.notes ? `
    <div class="field">
        <div class="label">Observações:</div>
        <div class="value">${payment.notes}</div>
    </div>
    ` : ''}

    <div class="signature">
        <div class="signature-line">
            ${payment.brokerName}<br>
            <small>Assinatura do Beneficiário</small>
        </div>
    </div>

    <div class="footer">
        <p>Documento gerado em ${today.toLocaleDateString('pt-BR')} às ${today.toLocaleTimeString('pt-BR')}</p>
        <p>Este recibo é válido como comprovante de pagamento.</p>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
            Imprimir / Salvar como PDF
        </button>
    </div>
</body>
</html>
`

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            }
        })
    } catch (error) {
        console.error("Erro ao gerar recibo:", error)
        return NextResponse.json({ error: "Erro ao gerar recibo" }, { status: 500 })
    }
}
