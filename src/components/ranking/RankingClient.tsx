"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RankingFilters } from "@/components/ranking/RankingFilters"
import { RankingTable } from "@/components/ranking/RankingTable"

interface RankingClientProps {
    tenantId: number
}

export function RankingClient({ tenantId }: RankingClientProps) {
    const [selectedYear, setSelectedYear] = useState("2025")
    const [selectedPeriod, setSelectedPeriod] = useState("1")
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("value")
    const [activeTab, setActiveTab] = useState("anual")

    const getTabTitle = () => {
        switch (activeTab) {
            case "anual": return "Ranking Anual"
            case "semestral": return "Ranking Semestral"
            case "trimestral": return "Ranking Trimestral"
            case "mensal": return "Ranking Mensal"
            default: return "Ranking"
        }
    }

    const getTabDescription = () => {
        switch (activeTab) {
            case "anual": return `Performance dos corretores no ano de ${selectedYear}`
            case "semestral": return `Performance dos corretores no ${selectedPeriod}º semestre de ${selectedYear}`
            case "trimestral": return `Performance dos corretores no Q${selectedPeriod} de ${selectedYear}`
            case "mensal": {
                const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
                return `Performance dos corretores em ${months[parseInt(selectedPeriod) - 1]} de ${selectedYear}`
            }
            default: return ""
        }
    }

    // Reset period when changing tabs
    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setSelectedPeriod("1")
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{getTabTitle()}</h1>
                <p className="text-zinc-400">{getTabDescription()}</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-[#1a1f3a] border border-zinc-800 p-1 mb-6">
                    <TabsTrigger
                        value="anual"
                        className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-zinc-400"
                    >
                        Anual
                    </TabsTrigger>
                    <TabsTrigger
                        value="semestral"
                        className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-zinc-400"
                    >
                        Semestral
                    </TabsTrigger>
                    <TabsTrigger
                        value="trimestral"
                        className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-zinc-400"
                    >
                        Trimestral
                    </TabsTrigger>
                    <TabsTrigger
                        value="mensal"
                        className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-zinc-400"
                    >
                        Mensal
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="anual">
                    <RankingFilters
                        period="anual"
                        selectedYear={selectedYear}
                        onYearChange={setSelectedYear}
                        onSearchChange={setSearchTerm}
                        onSortChange={setSortBy}
                    />
                    <RankingTable
                        tenantId={tenantId}
                        period="anual"
                        year={parseInt(selectedYear)}
                        searchTerm={searchTerm}
                        sortBy={sortBy}
                    />
                </TabsContent>

                <TabsContent value="semestral">
                    <RankingFilters
                        period="semestral"
                        selectedYear={selectedYear}
                        selectedPeriod={selectedPeriod}
                        onYearChange={setSelectedYear}
                        onPeriodChange={setSelectedPeriod}
                        onSearchChange={setSearchTerm}
                        onSortChange={setSortBy}
                    />
                    <RankingTable
                        tenantId={tenantId}
                        period="semestral"
                        year={parseInt(selectedYear)}
                        periodValue={parseInt(selectedPeriod)}
                        searchTerm={searchTerm}
                        sortBy={sortBy}
                    />
                </TabsContent>

                <TabsContent value="trimestral">
                    <RankingFilters
                        period="trimestral"
                        selectedYear={selectedYear}
                        selectedPeriod={selectedPeriod}
                        onYearChange={setSelectedYear}
                        onPeriodChange={setSelectedPeriod}
                        onSearchChange={setSearchTerm}
                        onSortChange={setSortBy}
                    />
                    <RankingTable
                        tenantId={tenantId}
                        period="trimestral"
                        year={parseInt(selectedYear)}
                        periodValue={parseInt(selectedPeriod)}
                        searchTerm={searchTerm}
                        sortBy={sortBy}
                    />
                </TabsContent>

                <TabsContent value="mensal">
                    <RankingFilters
                        period="mensal"
                        selectedYear={selectedYear}
                        selectedPeriod={selectedPeriod}
                        onYearChange={setSelectedYear}
                        onPeriodChange={setSelectedPeriod}
                        onSearchChange={setSearchTerm}
                        onSortChange={setSortBy}
                    />
                    <RankingTable
                        tenantId={tenantId}
                        period="mensal"
                        year={parseInt(selectedYear)}
                        periodValue={parseInt(selectedPeriod)}
                        searchTerm={searchTerm}
                        sortBy={sortBy}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
