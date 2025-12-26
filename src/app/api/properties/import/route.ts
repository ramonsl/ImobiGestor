import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { properties } from "@/db/schema"

// POST - Import properties from CSV
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const tenantId = parseInt(formData.get('tenantId') as string)

        if (!file || !tenantId) {
            return NextResponse.json({ error: "Arquivo e tenant ID são obrigatórios" }, { status: 400 })
        }

        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
            return NextResponse.json({ error: "Arquivo vazio ou sem dados" }, { status: 400 })
        }

        // Parse header to find column indices
        const header = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''))

        const columnMap: Record<string, number> = {}
        const columnNames = ['titulo', 'title', 'endereco', 'address', 'cidade', 'city', 'estado', 'state', 'tipo', 'type', 'preco', 'price', 'imagem_url', 'image_url', 'imageurl']

        header.forEach((h, i) => {
            const normalized = h.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
            columnNames.forEach(name => {
                if (normalized.includes(name.replace('_', ''))) {
                    columnMap[name.split('_')[0]] = i
                }
            })
        })

        // Parse data rows
        const importedProperties = []
        const errors = []

        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ''))

            const title = cells[columnMap['titulo'] ?? columnMap['title']] || cells[0]
            if (!title) {
                errors.push(`Linha ${i + 1}: Título obrigatório`)
                continue
            }

            const priceStr = cells[columnMap['preco'] ?? columnMap['price']] || '0'
            const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0

            const propertyData = {
                tenantId,
                title,
                address: cells[columnMap['endereco'] ?? columnMap['address']] || null,
                city: cells[columnMap['cidade'] ?? columnMap['city']] || null,
                state: cells[columnMap['estado'] ?? columnMap['state']] || null,
                type: cells[columnMap['tipo'] ?? columnMap['type']] || null,
                price: price.toString(),
                imageUrl: cells[columnMap['imagem'] ?? columnMap['image']] || null,
                source: 'spreadsheet' as const,
                status: 'active' as const
            }

            try {
                const [inserted] = await db
                    .insert(properties)
                    .values(propertyData)
                    .returning({ id: properties.id })

                importedProperties.push({
                    id: inserted.id,
                    ...propertyData,
                    price
                })
            } catch (err) {
                errors.push(`Linha ${i + 1}: Erro ao inserir`)
            }
        }

        return NextResponse.json({
            success: true,
            imported: importedProperties.length,
            errors: errors.length,
            properties: importedProperties
        })
    } catch (error) {
        console.error("Erro ao importar imóveis:", error)
        return NextResponse.json({ error: "Erro ao processar arquivo" }, { status: 500 })
    }
}
