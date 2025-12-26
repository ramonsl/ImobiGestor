"use client"

import { useState } from "react"
import { Building2, Users, Home, Plug, MessageSquare } from "lucide-react"

interface SettingsTabsProps {
    children: {
        company: React.ReactNode
        goals: React.ReactNode
        brokers: React.ReactNode
        properties: React.ReactNode
        integrations: React.ReactNode
        whatsapp: React.ReactNode
    }
}

type TabKey = 'imobiliaria' | 'corretores' | 'imoveis' | 'integracoes' | 'whatsapp'

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'imobiliaria', label: 'Imobiliária & Metas', icon: <Building2 className="h-4 w-4" /> },
    { key: 'corretores', label: 'Colaboradores', icon: <Users className="h-4 w-4" /> },
    { key: 'imoveis', label: 'Imóveis', icon: <Home className="h-4 w-4" /> },
    { key: 'integracoes', label: 'Integrações', icon: <Plug className="h-4 w-4" /> },
    { key: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
]

export function SettingsTabs({ children }: SettingsTabsProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('imobiliaria')

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === tab.key
                            ? 'text-emerald-400'
                            : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'imobiliaria' && (
                    <>
                        {children.company}
                        {children.goals}
                    </>
                )}

                {activeTab === 'corretores' && children.brokers}

                {activeTab === 'imoveis' && children.properties}

                {activeTab === 'integracoes' && children.integrations}

                {activeTab === 'whatsapp' && children.whatsapp}
            </div>
        </div>
    )
}
